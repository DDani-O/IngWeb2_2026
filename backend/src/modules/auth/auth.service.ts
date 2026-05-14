import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase/supabase.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthResponse {
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
        throw new ConflictException('El email ya esta registrado');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }

    const { data: profile, error: profileError } = await this.supabase
      .from('usuarios')
      .insert({
        id: created.user.id,
        rol: role,
        nombre_completo: fullName,
      })
      .select('id, nombre_completo, rol, foto_perfil_url, creado_en')
      .single();

    if (profileError || !profile) {
      await this.tryDeleteAuthUser(created.user.id);
      throw new InternalServerErrorException('No se pudo crear el perfil');
    }

    const token = this.jwtService.sign({
      sub: created.user.id,
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

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const { data: profile, error: profileError } = await this.supabase
      .from('usuarios')
      .select('id, nombre_completo, rol, foto_perfil_url, creado_en')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Credenciales invalidas');
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

    const message = (error.message || '').toLowerCase();
    return (
      message.includes('already') ||
      message.includes('duplicate') ||
      message.includes('registered')
    );
  }

  private async tryDeleteAuthUser(userId: string) {
    try {
      await this.supabase.auth.admin.deleteUser(userId);
    } catch {
      // Ignore cleanup failures to avoid masking the root cause.
    }
  }
}
