import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_CLIENT,
  SUPABASE_PUBLIC_CLIENT,
} from "../../common/supabase/supabase.provider";
import { RegisterDto, UserRoleEnum } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUserResponse;
}

interface UserProfileRow {
  id: string;
  nombre_completo: string;
  rol: string;
  foto_perfil_url: string | null;
  creado_en: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(SUPABASE_PUBLIC_CLIENT)
    private readonly supabasePublic: SupabaseClient,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { email, password, fullName, role } = dto;

    const { data: created, error: createError } =
      await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !created?.user) {
      if (this.isDuplicateEmail(createError)) {
        throw new ConflictException("El email ya esta registrado");
      }
      throw new InternalServerErrorException("No se pudo crear el usuario");
    }

    const userId = created.user.id;
    const { data: profile, error: profileError } = await this.supabase
      .from("usuarios")
      .insert({
        id: userId,
        rol: role,
        nombre_completo: fullName,
      })
      .select("id, nombre_completo, rol, foto_perfil_url, creado_en")
      .single();

    if (profileError || !profile) {
      await this.cleanupUser(userId);
      throw new InternalServerErrorException("No se pudo crear el perfil");
    }

    const { error: roleProfileError } = await this.createRoleProfile(
      role,
      userId,
      dto,
    );

    if (roleProfileError) {
      await this.cleanupUser(userId);

      if (this.isUniqueViolation(roleProfileError)) {
        if ((roleProfileError.message || "").toLowerCase().includes("matricula")) {
          throw new ConflictException("La matricula ya esta registrada");
        }
        throw new ConflictException("Datos duplicados");
      }

      if (role === UserRoleEnum.Asesor) {
        throw new InternalServerErrorException(
          "No se pudo crear el perfil del asesor",
        );
      }

      throw new InternalServerErrorException(
        "No se pudo crear el perfil del cliente",
      );
    }

    const token = this.jwtService.sign({
      sub: userId,
      email,
      role: profile.rol,
    });

    return {
      access_token: token,
      user: this.toAuthUser(email, profile),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { email, password } = dto;

    const { data, error } = await this.supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const { data: profile, error: profileError } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, rol, foto_perfil_url, creado_en")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    try {
      await this.supabase
        .from("usuarios")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", profile.id);
    } catch {
      // Best-effort update to avoid blocking login.
    }

    const token = this.jwtService.sign({
      sub: profile.id,
      email: data.user.email || email,
      role: profile.rol,
    });

    return {
      access_token: token,
      user: this.toAuthUser(data.user.email || email, profile),
    };
  }

  private toAuthUser(email: string, profile: UserProfileRow): AuthUserResponse {
    return {
      id: profile.id,
      email,
      fullName: profile.nombre_completo,
      role: profile.rol,
      avatarUrl: profile.foto_perfil_url,
      createdAt: profile.creado_en,
    };
  }

  private isDuplicateEmail(
    error: { status?: number; message?: string } | null,
  ): boolean {
    if (!error) {
      return false;
    }

    if (error.status === 409) {
      return true;
    }

    const message = (error.message || "").toLowerCase();
    return (
      message.includes("already") ||
      message.includes("duplicate") ||
      message.includes("registered")
    );
  }

  private async tryDeleteAuthUser(userId: string) {
    try {
      await this.supabase.auth.admin.deleteUser(userId);
    } catch {
      // Ignore cleanup failures to avoid masking the root cause.
    }
  }

  private async cleanupUser(userId: string) {
    await Promise.all([
      this.tryDeleteRoleProfiles(userId),
      this.tryDeleteUserProfile(userId),
      this.tryDeleteAuthUser(userId),
    ]);
  }

  private async tryDeleteUserProfile(userId: string) {
    try {
      await this.supabase.from("usuarios").delete().eq("id", userId);
    } catch {
      // Best-effort cleanup.
    }
  }

  private async tryDeleteRoleProfiles(userId: string) {
    try {
      await Promise.all([
        this.supabase.from("perfiles_usuarios").delete().eq("usuario_id", userId),
        this.supabase.from("perfiles_asesores").delete().eq("usuario_id", userId),
      ]);
    } catch {
      // Best-effort cleanup.
    }
  }

  private createRoleProfile(
    role: UserRoleEnum,
    userId: string,
    dto: RegisterDto,
  ) {
    if (role === UserRoleEnum.Asesor) {
      return this.supabase.from("perfiles_asesores").insert({
        usuario_id: userId,
        matricula: dto.licenseNumber,
        especialidad: dto.specialty,
        descripcion: dto.description || null,
      });
    }

    return this.supabase.from("perfiles_usuarios").insert({
      usuario_id: userId,
      ocupacion: dto.occupation || null,
      ingreso_estimado: dto.estimatedIncome ?? null,
      objetivo_financiero: dto.financialGoal || null,
      moneda_preferida: dto.preferredCurrency || null,
    });
  }

  private isUniqueViolation(
    error: { code?: string; message?: string } | null,
  ): boolean {
    if (!error) {
      return false;
    }

    if (error.code === "23505") {
      return true;
    }

    const message = (error.message || "").toLowerCase();
    return message.includes("duplicate") || message.includes("unique");
  }
}
