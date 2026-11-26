import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { JwtPayload } from "../../common/auth";
import {
  ApiException,
  internalError,
  validationError,
} from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { AnalysisService } from "../analysis/analysis.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { PerfilDeGasto, Usuario, UsuarioRef } from "./usuario.types";

const CLIENT_FIELDS = [
  "ocupacion",
  "ingreso_estimado",
  "objetivo_financiero",
] as const;
const ADVISOR_FIELDS = ["matricula", "especialidad", "descripcion"] as const;

type Embedded<T> = T | T[] | null | undefined;
const first = <T>(value: Embedded<T>): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

/** Texto opcional: vacío → null al guardar. */
const emptyToNull = (value: string | undefined) =>
  value === undefined ? undefined : value || null;

/**
 * Cuentas de usuario: arma el objeto `usuario` del contrato y edita el perfil propio.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly analysisService: AnalysisService,
  ) {}

  /**
   * Objeto `usuario` completo (cuenta + perfil del rol). `null` si la cuenta no existe.
   * El perfil de gasto de un cliente se calcula en el momento (spec §10.6); quien ya lo
   * tiene calculado puede pasarlo en `perfilDeGasto` para no repetir el análisis.
   */
  async getUsuario(
    userId: string,
    perfilDeGasto?: PerfilDeGasto | null,
  ): Promise<Usuario | null> {
    const { data: row, error } = await this.supabase
      .from("usuarios")
      .select(
        "id, email, rol, nombre_completo, biografia, foto_perfil_url, estado, creado_en",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`usuarios: ${error.message}`);
      throw internalError("No se pudo obtener el usuario.");
    }
    if (!row) {
      return null;
    }

    const usuario: Usuario = {
      id: row.id,
      email: row.email,
      rol: row.rol,
      nombre_completo: row.nombre_completo,
      biografia: row.biografia ?? "",
      foto_perfil_url: row.foto_perfil_url,
      estado: row.estado,
      creado_en: row.creado_en,
    };

    if (row.rol === "cliente") {
      const [profile, perfil, asesor] = await Promise.all([
        this.fetchClientProfile(userId),
        perfilDeGasto !== undefined
          ? perfilDeGasto
          : this.analysisService.getSpendingProfile(userId),
        this.fetchAssignedAdvisor(userId),
      ]);
      usuario.perfil_cliente = {
        ocupacion: profile?.ocupacion ?? "",
        ingreso_estimado:
          profile?.ingreso_estimado == null
            ? null
            : Number(profile.ingreso_estimado),
        objetivo_financiero: profile?.objetivo_financiero ?? "",
        perfil_de_gasto: perfil,
        asesor,
      };
    } else {
      const [profile, clientes] = await Promise.all([
        this.fetchAdvisorProfile(userId),
        this.countAssignedClients(userId),
      ]);
      usuario.perfil_asesor = {
        matricula: profile?.matricula ?? "",
        especialidad: profile?.especialidad ?? "",
        descripcion: profile?.descripcion ?? "",
        clientes_asignados: clientes,
      };
    }

    return usuario;
  }

  /**
   * PUT /auth/profile: edita la cuenta y el perfil del rol del usuario autenticado.
   */
  async updateProfile(
    user: JwtPayload,
    dto: UpdateProfileDto,
  ): Promise<Usuario> {
    const foreign = (
      user.role === "cliente" ? ADVISOR_FIELDS : CLIENT_FIELDS
    ).filter((field) => dto[field] !== undefined);
    if (foreign.length) {
      throw validationError(
        `Campos que no corresponden al rol ${user.role}: ${foreign.join(", ")}.`,
        [...foreign],
      );
    }
    if (user.role === "asesor") {
      const missing = (["matricula", "especialidad"] as const).filter(
        (field) => !dto[field],
      );
      if (missing.length) {
        throw validationError("Faltan datos obligatorios.", [...missing]);
      }
    }

    const accountUpdates: Record<string, unknown> = {
      nombre_completo: dto.nombre_completo,
    };
    if (dto.biografia !== undefined) {
      accountUpdates.biografia = emptyToNull(dto.biografia);
    }
    const { error: accountError } = await this.supabase
      .from("usuarios")
      .update(accountUpdates)
      .eq("id", user.sub);
    if (accountError) {
      this.logger.error(`usuarios update: ${accountError.message}`);
      throw internalError("No se pudo actualizar el perfil.");
    }

    const { error: profileError } =
      user.role === "cliente"
        ? await this.supabase.from("perfiles_usuarios").upsert(
            this.definedOnly({
              usuario_id: user.sub,
              ocupacion: emptyToNull(dto.ocupacion),
              ingreso_estimado: dto.ingreso_estimado,
              objetivo_financiero: emptyToNull(dto.objetivo_financiero),
            }),
            { onConflict: "usuario_id" },
          )
        : await this.supabase.from("perfiles_asesores").upsert(
            this.definedOnly({
              usuario_id: user.sub,
              matricula: dto.matricula,
              especialidad: dto.especialidad,
              descripcion: emptyToNull(dto.descripcion),
            }),
            { onConflict: "usuario_id" },
          );

    if (profileError) {
      if (profileError.code === "23505") {
        throw new ApiException(
          HttpStatus.CONFLICT,
          "MATRICULA_DUPLICADA",
          "La matricula ya esta registrada.",
        );
      }
      this.logger.error(`perfil update: ${profileError.message}`);
      throw internalError("No se pudo actualizar el perfil.");
    }

    const usuario = await this.getUsuario(user.sub);
    if (!usuario) {
      throw internalError("No se pudo obtener el usuario.");
    }
    return usuario;
  }

  private async fetchClientProfile(userId: string) {
    const { data } = await this.supabase
      .from("perfiles_usuarios")
      .select("ocupacion, ingreso_estimado, objetivo_financiero")
      .eq("usuario_id", userId)
      .maybeSingle();
    return data;
  }

  private async fetchAdvisorProfile(userId: string) {
    const { data } = await this.supabase
      .from("perfiles_asesores")
      .select("matricula, especialidad, descripcion")
      .eq("usuario_id", userId)
      .maybeSingle();
    return data;
  }

  private async fetchAssignedAdvisor(
    clientId: string,
  ): Promise<UsuarioRef | null> {
    const { data } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("asesor:asesor_id (id, nombre_completo)")
      .eq("cliente_id", clientId)
      .eq("activo", true)
      .order("asignado_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    return first(data?.asesor as Embedded<UsuarioRef>);
  }

  private async countAssignedClients(advisorId: string): Promise<number> {
    const { count } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("id", { count: "exact", head: true })
      .eq("asesor_id", advisorId)
      .eq("activo", true);
    return count ?? 0;
  }

  private definedOnly(values: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined),
    );
  }
}
