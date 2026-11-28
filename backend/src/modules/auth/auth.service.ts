import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SupabaseClient } from "@supabase/supabase-js";
import { JwtPayload } from "../../common/auth";
import {
  ApiException,
  internalError,
  validationError,
} from "../../common/errors";
import {
  SUPABASE_CLIENT,
  SUPABASE_PUBLIC_CLIENT,
} from "../../common/supabase/supabase.provider";
import { UsersService } from "../users/users.service";
import { Usuario } from "../users/usuario.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

/** Respuesta de login y registro (contrato §3.1, backend/README.md). */
export interface Sesion {
  token: string;
  usuario: Usuario;
}

/** Código de PostgreSQL para una violación de UNIQUE (acá, la matrícula del asesor). */
const UNIQUE_VIOLATION = "23505";

/**
 * Registro e inicio de sesión. Las cuentas viven en Supabase Auth (`auth.users`) y
 * en `usuarios`; la API firma su propio JWT con `{ sub, email, role }`.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(SUPABASE_PUBLIC_CLIENT)
    private readonly supabasePublic: SupabaseClient,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Crea la cuenta (Supabase Auth + `usuarios` + perfil del rol). Un cliente nuevo queda
   * asignado automáticamente a un asesor (ver `assignToAvailableAdvisor`).
   */
  async register(dto: RegisterDto): Promise<Sesion> {
    if (dto.rol === "cliente") {
      const foreign = (["matricula", "especialidad"] as const).filter(
        (field) => dto[field] !== undefined,
      );
      if (foreign.length) {
        throw validationError(
          "La matricula y la especialidad solo corresponden a asesores.",
          [...foreign],
        );
      }
    }

    const { data: created, error: createError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (createError || !created?.user) {
      if (this.isDuplicateEmail(createError)) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          "EMAIL_DUPLICADO",
          "El email ya se encuentra registrado.",
        );
      }
      if ((createError as { code?: string } | null)?.code === "weak_password") {
        throw validationError("La contrasena es demasiado debil.", [
          "password",
        ]);
      }
      this.logger.error(`auth.admin.createUser: ${createError?.message}`);
      throw internalError("No se pudo crear la cuenta.");
    }

    const userId = created.user.id;
    try {
      await this.insertAccount(userId, dto);
    } catch (error) {
      await this.cleanupUser(userId);
      throw error;
    }

    if (dto.rol === "cliente") {
      await this.assignToAvailableAdvisor(userId);
    }

    return this.issueSession({ sub: userId, email: dto.email, role: dto.rol });
  }

  /** Valida las credenciales contra Supabase Auth y emite el token de la API. */
  async login(dto: LoginDto): Promise<Sesion> {
    const { data, error } = await this.supabasePublic.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data?.user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        "CREDENCIALES_INVALIDAS",
        "Email o contrasena invalida.",
      );
    }

    const { data: row } = await this.supabase
      .from("usuarios")
      .select("id, rol")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!row) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        "CREDENCIALES_INVALIDAS",
        "Email o contrasena invalida.",
      );
    }

    // Registro de último acceso: si falla no debe impedir el login.
    const { error: accessError } = await this.supabase
      .from("usuarios")
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq("id", row.id);
    if (accessError) {
      this.logger.warn(`ultimo_acceso: ${accessError.message}`);
    }

    return this.issueSession({
      sub: row.id,
      email: data.user.email ?? dto.email,
      role: row.rol,
    });
  }

  /** GET /auth/me: usuario del token. 401 si la cuenta ya no existe. */
  async me(user: JwtPayload): Promise<Usuario> {
    const usuario = await this.usersService.getUsuario(user.sub);
    if (!usuario) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        "NO_AUTENTICADO",
        "La sesion no es valida o expiro.",
      );
    }
    return usuario;
  }

  private async issueSession(payload: JwtPayload): Promise<Sesion> {
    const usuario = await this.usersService.getUsuario(payload.sub);
    if (!usuario) {
      throw internalError("No se pudo obtener el usuario.");
    }
    return { token: this.jwtService.sign(payload), usuario };
  }

  private async insertAccount(userId: string, dto: RegisterDto) {
    const { error: accountError } = await this.supabase
      .from("usuarios")
      .insert({
        id: userId,
        rol: dto.rol,
        nombre_completo: dto.nombre_completo,
        email: dto.email,
      });
    if (accountError) {
      this.logger.error(`usuarios insert: ${accountError.message}`);
      throw internalError("No se pudo crear la cuenta.");
    }

    const { error: profileError } =
      dto.rol === "asesor"
        ? await this.supabase.from("perfiles_asesores").insert({
            usuario_id: userId,
            matricula: dto.matricula,
            especialidad: dto.especialidad,
          })
        : await this.supabase
            .from("perfiles_usuarios")
            .insert({ usuario_id: userId });

    if (profileError) {
      if (profileError.code === UNIQUE_VIOLATION && dto.rol === "asesor") {
        throw new ApiException(
          HttpStatus.CONFLICT,
          "MATRICULA_DUPLICADA",
          "La matricula ya esta registrada.",
        );
      }
      this.logger.error(`perfil insert: ${profileError.message}`);
      throw internalError("No se pudo crear el perfil.");
    }
  }

  /**
   * Asignación automática a un asesor con `obtener_asesor_disponible()`: elige, entre los
   * asesores activos con lugar libre (menos clientes activos que `capacidad_maxima`), el
   * que tiene **menos clientes activos**; no el de más lugar libre. Así la cartera se
   * reparte pareja aunque las capacidades sean distintas. Es de mejor esfuerzo: si no
   * hay asesores con lugar, el cliente queda sin asesor y el registro igual se completa.
   */
  private async assignToAvailableAdvisor(clientId: string) {
    const { data: advisorId, error } = await this.supabase.rpc(
      "obtener_asesor_disponible",
    );
    if (error || !advisorId) {
      this.logger.warn(
        `Sin asesor disponible para ${clientId}${error ? `: ${error.message}` : ""}`,
      );
      return;
    }

    const { error: assignError } = await this.supabase
      .from("asignaciones_de_clientes")
      .insert({ asesor_id: advisorId, cliente_id: clientId, activo: true });
    if (assignError) {
      this.logger.warn(
        `asignaciones_de_clientes insert: ${assignError.message}`,
      );
    }
  }

  private isDuplicateEmail(
    error: { status?: number; code?: string; message?: string } | null,
  ): boolean {
    if (!error) {
      return false;
    }
    const message = (error.message || "").toLowerCase();
    // Supabase usa 422 también para contraseñas débiles: se distingue por código o mensaje.
    return (
      error.code === "email_exists" ||
      error.status === 409 ||
      message.includes("already") ||
      message.includes("registered")
    );
  }

  /** Deshace un registro a medio crear. Los fallos de limpieza no tapan el error original. */
  private async cleanupUser(userId: string) {
    const steps = [
      () =>
        this.supabase
          .from("perfiles_usuarios")
          .delete()
          .eq("usuario_id", userId),
      () =>
        this.supabase
          .from("perfiles_asesores")
          .delete()
          .eq("usuario_id", userId),
      () => this.supabase.from("usuarios").delete().eq("id", userId),
      () => this.supabase.auth.admin.deleteUser(userId),
    ];
    for (const step of steps) {
      try {
        await step();
      } catch (error) {
        this.logger.warn(`cleanup ${userId}: ${(error as Error).message}`);
      }
    }
  }
}
