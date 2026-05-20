import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { JwtPayload } from "../../common/auth";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateClientRecommendationDto } from "./dto/update-client-recommendation.dto";

interface UserRow {
  id: string;
  nombre_completo: string;
  rol: "cliente" | "asesor";
  email: string | null;
  foto_perfil_url: string | null;
  creado_en: string;
  ultimo_acceso: string | null;
}

interface ClientProfileRow {
  ocupacion: string | null;
  ingreso_estimado: number | string | null;
  objetivo_financiero: string | null;
  moneda_preferida: string | null;
  telefono: string | null;
  pais: string | null;
  ahorro_objetivo: number | string | null;
  umbral_alerta: number | string | null;
  tema: string | null;
  notificar_email: boolean | null;
  notificar_push: boolean | null;
}

interface AdvisorProfileRow {
  matricula: string | null;
  especialidad: string | null;
  descripcion: string | null;
  telefono: string | null;
  pais: string | null;
  capacidad_maxima: number | null;
}

interface RecommendationRow {
  id: string;
  asesor_id: string | null;
  origen: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  prioridad: string;
  leida: boolean;
  creado_en: string;
  icono: string | null;
  problema: string | null;
  solucion: string | null;
  ahorro_potencial: number | string | null;
  pasos_implementacion: string[] | null;
  estado: string | null;
  asesor?: { nombre_completo?: string | null } | Array<{ nombre_completo?: string | null }> | null;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getMe(user: JwtPayload) {
    const payload = this.ensureUser(user);
    const userRow = await this.fetchUserRow(payload.sub);

    const base = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.nombre_completo,
      role: this.mapRole(userRow.rol),
      avatarUrl: userRow.foto_perfil_url,
      createdAt: userRow.creado_en,
      lastLogin: userRow.ultimo_acceso,
      profile: null as string | null,
      spendingProfile: null as string | null,
      spendingProfileSource: null as "asesor" | "sistema" | null,
      advisorName: null as string | null,
    };

    if (userRow.rol === "cliente") {
      const [profile, advisorName, activeProfile] = await Promise.all([
        this.fetchClientProfile(userRow.id),
        this.fetchAdvisorName(userRow.id),
        this.fetchActiveProfileDetail(userRow.id),
      ]);

      const activeProfileName = activeProfile?.name ?? null;

      return {
        ...base,
        profile: activeProfileName,
        spendingProfile: activeProfileName,
        spendingProfileSource: activeProfile?.source ?? null,
        advisorName,
        phone: profile?.telefono ?? null,
        country: profile?.pais ?? null,
        occupation: profile?.ocupacion ?? null,
        monthlyIncome: this.toNumber(profile?.ingreso_estimado, 0),
        savingsGoal: this.toNumber(profile?.ahorro_objetivo, 0),
        alertThreshold: this.toNumber(profile?.umbral_alerta, 0),
        currency: (profile?.moneda_preferida || "ARS").toUpperCase(),
        theme: profile?.tema || "dark",
        notifyEmail: profile?.notificar_email ?? true,
        notifyPush: profile?.notificar_push ?? false,
        financialGoal: profile?.objetivo_financiero ?? null,
      };
    }

    const advisorProfile = await this.fetchAdvisorProfile(userRow.id);

    return {
      ...base,
      licenseNumber: advisorProfile?.matricula ?? null,
      specialty: advisorProfile?.especialidad ?? null,
      description: advisorProfile?.descripcion ?? null,
      phone: advisorProfile?.telefono ?? null,
      country: advisorProfile?.pais ?? null,
      maxCapacity: advisorProfile?.capacidad_maxima ?? 5,
    };
  }

  async updateMe(user: JwtPayload, dto: UpdateUserDto) {
    const payload = this.ensureUser(user);

    if (payload.role === "cliente") {
      if (
        dto.licenseNumber !== undefined ||
        dto.specialty !== undefined ||
        dto.description !== undefined
      ) {
        throw new BadRequestException("Campos no permitidos para el rol cliente");
      }
    } else {
      if (
        dto.phone !== undefined ||
        dto.country !== undefined ||
        dto.occupation !== undefined ||
        dto.monthlyIncome !== undefined ||
        dto.savingsGoal !== undefined ||
        dto.alertThreshold !== undefined ||
        dto.currency !== undefined ||
        dto.theme !== undefined ||
        dto.notifyEmail !== undefined ||
        dto.notifyPush !== undefined ||
        dto.financialGoal !== undefined
      ) {
        throw new BadRequestException("Campos no permitidos para el rol asesor");
      }
    }

    const userUpdates: Record<string, unknown> = {};
    if (dto.fullName !== undefined) {
      userUpdates.nombre_completo = dto.fullName;
    }
    if (dto.avatarUrl !== undefined) {
      userUpdates.foto_perfil_url = dto.avatarUrl;
    }

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await this.supabase
        .from("usuarios")
        .update(userUpdates)
        .eq("id", payload.sub);

      if (error) {
        throw new InternalServerErrorException("No se pudo actualizar el perfil");
      }
    }

    if (payload.role === "cliente") {
      const profileUpdates: Record<string, unknown> = {};

      if (dto.phone !== undefined) {
        profileUpdates.telefono = dto.phone;
      }
      if (dto.country !== undefined) {
        profileUpdates.pais = dto.country;
      }
      if (dto.occupation !== undefined) {
        profileUpdates.ocupacion = dto.occupation;
      }
      if (dto.monthlyIncome !== undefined) {
        profileUpdates.ingreso_estimado = dto.monthlyIncome;
      }
      if (dto.savingsGoal !== undefined) {
        profileUpdates.ahorro_objetivo = dto.savingsGoal;
      }
      if (dto.alertThreshold !== undefined) {
        profileUpdates.umbral_alerta = dto.alertThreshold;
      }
      if (dto.currency !== undefined) {
        profileUpdates.moneda_preferida = dto.currency.toUpperCase();
      }
      if (dto.theme !== undefined) {
        profileUpdates.tema = dto.theme;
      }
      if (dto.notifyEmail !== undefined) {
        profileUpdates.notificar_email = dto.notifyEmail;
      }
      if (dto.notifyPush !== undefined) {
        profileUpdates.notificar_push = dto.notifyPush;
      }
      if (dto.financialGoal !== undefined) {
        profileUpdates.objetivo_financiero = dto.financialGoal;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await this.supabase
          .from("perfiles_usuarios")
          .update(profileUpdates)
          .eq("usuario_id", payload.sub);

        if (error) {
          throw new InternalServerErrorException("No se pudo actualizar el perfil");
        }
      }
    } else {
      const advisorUpdates: Record<string, unknown> = {};

      if (dto.licenseNumber !== undefined) {
        advisorUpdates.matricula = dto.licenseNumber;
      }
      if (dto.specialty !== undefined) {
        advisorUpdates.especialidad = dto.specialty;
      }
      if (dto.description !== undefined) {
        advisorUpdates.descripcion = dto.description;
      }

      if (Object.keys(advisorUpdates).length > 0) {
        const { error } = await this.supabase
          .from("perfiles_asesores")
          .update(advisorUpdates)
          .eq("usuario_id", payload.sub);

        if (error) {
          if (this.isUniqueViolation(error)) {
            throw new ConflictException("La matricula ya esta registrada");
          }
          throw new InternalServerErrorException("No se pudo actualizar el perfil");
        }
      }
    }

    return this.getMe(payload);
  }

  async getMyRecommendations(user: JwtPayload) {
    const payload = this.ensureUser(user);

    if (payload.role !== "cliente") {
      throw new ForbiddenException("Solo clientes pueden ver recomendaciones");
    }

    const { data: rows, error } = await this.supabase
      .from("recomendaciones_financieras")
      .select(
        "id, asesor_id, origen, tipo, titulo, mensaje, prioridad, leida, creado_en, icono, problema, solucion, ahorro_potencial, pasos_implementacion, estado, asesor:asesor_id (nombre_completo)",
      )
      .eq("cliente_id", payload.sub)
      .order("creado_en", { ascending: false });

    if (error) {
      throw new InternalServerErrorException("No se pudieron obtener recomendaciones");
    }

    const advisorEmails = await this.fetchAdvisorEmails(rows || []);

    const recommendations = (rows || []).map((row) => {
      const asesor = Array.isArray(row.asesor) ? row.asesor[0] : row.asesor;
      const advisorName =
        row.origen === "sistema"
          ? "Sistema"
          : asesor?.nombre_completo || null;
      const advisorEmail =
        row.origen === "sistema"
          ? null
          : row.asesor_id
            ? advisorEmails.get(row.asesor_id) || null
            : null;

      return {
        id: row.id,
        title: row.titulo,
        priority: this.mapPriority(row.prioridad),
        status: this.mapStatus(row.estado),
        isRead: row.leida ?? false,
        problem: row.problema ?? null,
        solution: row.solucion ?? row.mensaje ?? null,
        savingsPotential: this.toNumber(row.ahorro_potencial, 0),
        implementationSteps: Array.isArray(row.pasos_implementacion)
          ? row.pasos_implementacion
          : [],
        dateSent: row.creado_en,
        advisorName,
        advisorEmail,
        icon: row.icono ?? null,
        type: this.mapType(row.tipo),
      };
    });

    const monthlyIncome = await this.fetchMonthlyIncome(payload.sub);
    const stats = this.buildRecommendationStats(recommendations, monthlyIncome);

    return {
      stats,
      recommendations,
    };
  }

  async getClientDashboard(user: JwtPayload) {
    const payload = this.ensureUser(user);

    if (payload.role !== "cliente") {
      throw new ForbiddenException("Solo clientes pueden ver el dashboard");
    }

    const [profile, recommendations, monthlyIncome] = await Promise.all([
      this.fetchClientProfile(payload.sub),
      this.getMyRecommendations(payload),
      this.fetchMonthlyIncome(payload.sub),
    ]);

    const activeProfile = await this.fetchActiveProfileDetail(payload.sub);

    return {
      profile: {
        phone: profile?.telefono ?? null,
        country: profile?.pais ?? null,
        occupation: profile?.ocupacion ?? null,
        monthlyIncome: this.toNumber(profile?.ingreso_estimado, 0),
        currency: (profile?.moneda_preferida || "ARS").toUpperCase(),
        financialGoal: profile?.objetivo_financiero ?? null,
        activeSpendingProfile: activeProfile?.name ?? null,
        activeProfileSource: activeProfile?.source ?? null,
        activeProfileFunLine: activeProfile?.funLine ?? null,
        suggestedProfiles: [],
      },
      recommendations: recommendations.stats,
      createdAt: new Date().toISOString(),
    };
  }

  async getSpendingProfiles() {
    const { data, error } = await this.supabase
      .from("perfiles_de_gasto")
      .select("id, nombre, descripcion, criterio_regla, activo")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los perfiles de gasto");
    }

    const profiles = (data || []).map((row: any) => ({
      id: row.id,
      name: row.nombre,
      description: row.descripcion ?? null,
      rule: row.criterio_regla ?? null,
      active: row.activo ?? true,
    }));

    return { profiles };
  }

  private ensureUser(user: JwtPayload) {
    if (!user?.sub) {
      throw new UnauthorizedException("Token invalido");
    }
    return user;
  }

  private normalizePage(page?: number) {
    if (!page || Number.isNaN(page) || page < 1) {
      return DEFAULT_PAGE;
    }
    return Math.floor(page);
  }

  private normalizeLimit(limit?: number) {
    if (!limit || Number.isNaN(limit) || limit < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(Math.floor(limit), MAX_LIMIT);
  }

  private buildPagination(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private buildMessageSubject(content: string, fallback: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      return fallback;
    }
    if (trimmed.length <= 80) {
      return trimmed;
    }
    return `${trimmed.slice(0, 77)}...`;
  }

  private async fetchActiveAdvisorAssignment(clientId: string): Promise<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null> {
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("asesor_id, asesor:asesor_id (nombre_completo, foto_perfil_url)")
      .eq("cliente_id", clientId)
      .eq("activo", true)
      .order("asignado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el asesor asignado");
    }

    if (!data?.asesor_id) {
      return null;
    }

    const asesor = Array.isArray(data.asesor) ? data.asesor[0] : data.asesor;
    return {
      id: data.asesor_id,
      name: asesor?.nombre_completo ?? null,
      avatarUrl: asesor?.foto_perfil_url ?? null,
    };
  }

  private async fetchUserRow(userId: string): Promise<UserRow> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, rol, email, foto_perfil_url, creado_en, ultimo_acceso")
      .eq("id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return data as UserRow;
  }

  private async fetchClientProfile(userId: string): Promise<ClientProfileRow | null> {
    const { data, error } = await this.supabase
      .from("perfiles_usuarios")
      .select(
        "ocupacion, ingreso_estimado, objetivo_financiero, moneda_preferida, telefono, pais, ahorro_objetivo, umbral_alerta, tema, notificar_email, notificar_push",
      )
      .eq("usuario_id", userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el perfil");
    }

    return (data as ClientProfileRow) || null;
  }

  private async fetchAdvisorProfile(userId: string): Promise<AdvisorProfileRow | null> {
    const { data, error } = await this.supabase
      .from("perfiles_asesores")
      .select("matricula, especialidad, descripcion, telefono, pais, capacidad_maxima")
      .eq("usuario_id", userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el perfil");
    }

    return (data as AdvisorProfileRow) || null;
  }

  private async fetchAdvisorName(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("asesor_id, asesor:asesor_id (nombre_completo)")
      .eq("cliente_id", userId)
      .eq("activo", true)
      .order("asignado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el asesor");
    }

    const asesor = Array.isArray(data?.asesor) ? data.asesor[0] : data?.asesor;
    return (asesor?.nombre_completo as string | null) || null;
  }

  private async fetchActiveProfileDetail(userId: string): Promise<{
    name: string | null;
    source: "asesor" | "sistema" | null;
    funLine?: string | null;
  } | null> {
    const { data, error } = await this.supabase
      .from("clasificacion_de_perfil")
      .select("perfil:perfil_id (nombre, criterio_regla), asesor_id")
      .eq("cliente_id", userId)
      .is("vigente_hasta", null)
      .order("vigente_desde", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el perfil activo");
    }

    const perfil = Array.isArray(data?.perfil) ? data.perfil[0] : data?.perfil;
    const name = (perfil?.nombre as string | null) || null;
    if (!name) {
      return null;
    }

    const funLine = (perfil?.criterio_regla as { funLine?: string } | null)?.funLine || null;

    return {
      name,
      source: data?.asesor_id ? "asesor" : "sistema",
      funLine,
    };
  }

  private async fetchAdvisorEmails(rows: RecommendationRow[]) {
    const uniqueIds = Array.from(
      new Set(rows.map((row) => row.asesor_id).filter(Boolean)),
    ) as string[];

    const entries = await Promise.all(
      uniqueIds.map(async (advisorId) => {
        try {
          const { data, error } = await this.supabase.auth.admin.getUserById(advisorId);
          if (error || !data?.user?.email) {
            return [advisorId, null] as const;
          }
          return [advisorId, data.user.email] as const;
        } catch {
          return [advisorId, null] as const;
        }
      }),
    );

    return new Map(entries);
  }

  private async fetchMonthlyIncome(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from("perfiles_usuarios")
      .select("ingreso_estimado")
      .eq("usuario_id", userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el ingreso estimado");
    }

    return this.toNumber(data?.ingreso_estimado, 0);
  }

  private buildRecommendationStats(
    recommendations: Array<{ status: string; savingsPotential: number; dateSent: string }>,
    monthlyIncome: number,
  ) {
    const active = recommendations.filter((item) => item.status === "Pendiente");
    const completedThisMonth = recommendations.filter((item) => {
      if (item.status !== "Completada") {
        return false;
      }
      const date = new Date(item.dateSent);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const totalSavingsPotential = active.reduce(
      (sum, item) => sum + (item.savingsPotential || 0),
      0,
    );

    const estimatedImpact =
      monthlyIncome > 0
        ? `${Math.round((totalSavingsPotential / monthlyIncome) * 100)}%`
        : "0%";

    return {
      totalSavingsPotential,
      activeRecommendations: active.length,
      completedThisMonth: completedThisMonth.length,
      estimatedImpact,
    };
  }

  async updateMyRecommendation(
    user: JwtPayload,
    recommendationId: string,
    dto: UpdateClientRecommendationDto,
  ) {
    const payload = this.ensureUser(user);

    if (payload.role !== "cliente") {
      throw new ForbiddenException("Solo clientes pueden actualizar sus recomendaciones");
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.status !== undefined) {
      updatePayload.estado = dto.status;
    }

    if (dto.isRead !== undefined) {
      updatePayload.leida = dto.isRead;
      if (dto.isRead) {
        updatePayload.leida_en = new Date().toISOString();
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException("No se proporcionaron campos para actualizar");
    }

    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .update(updatePayload)
      .eq("id", recommendationId)
      .eq("cliente_id", payload.sub)
      .select("id, estado, leida, leida_en")
      .single();

    if (error) {
      console.error('[updateMyRecommendation] Supabase error:', error, 'payload:', updatePayload);
      if (error.code === "PGRST116") {
        throw new NotFoundException("Recomendacion no encontrada");
      }
      throw new InternalServerErrorException(error.message || "No se pudo actualizar la recomendacion");
    }

    return {
      id: data.id,
      status: this.mapStatus(data.estado),
      isRead: data.leida ?? false,
      readAt: data.leida_en ?? null,
    };
  }

  private mapRole(role: "cliente" | "asesor") {
    return role === "cliente" ? "cliente" : "asesor";
  }

  private mapPriority(value: string | null) {
    const normalized = (value || "media").toLowerCase();
    if (normalized === "alta") {
      return "Alta";
    }
    if (normalized === "baja") {
      return "Baja";
    }
    return "Media";
  }

  private mapStatus(value: string | null) {
    const normalized = (value || "pendiente").toLowerCase();
    if (normalized === "completada") {
      return "Completada";
    }
    if (normalized === "descartada") {
      return "Descartada";
    }
    return "Pendiente";
  }

  private mapType(value: string | null) {
    const normalized = (value || "consejo").toLowerCase();
    if (normalized === "alerta") {
      return "alerta";
    }
    if (normalized === "felicitacion") {
      return "felicitacion";
    }
    return "consejo";
  }

  private toNumber(value: unknown, fallback: number) {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }

  private isUniqueViolation(error: { code?: string; message?: string } | null) {
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
