import {
  BadRequestException,
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
import { AdvisorClientExpensesQueryDto } from "./dto/advisor-client-expenses-query.dto";
import { AdvisorClientsQueryDto } from "./dto/advisor-clients-query.dto";
import { AdvisorMessagesQueryDto } from "./dto/advisor-messages-query.dto";
import { AdvisorRecommendationsQueryDto } from "./dto/advisor-recommendations-query.dto";
import { AdvisorMessageType } from "./dto/advisor-message-type.enum";
import {
  AdvisorRecommendationPriority,
  AdvisorRecommendationStatus,
  AdvisorRecommendationType,
} from "./dto/advisor-recommendation-types.enum";
import { CreateAdvisorMessageDto } from "./dto/create-advisor-message.dto";
import { CreateAdvisorRecommendationDto } from "./dto/create-advisor-recommendation.dto";
import { UpdateRecommendationDto } from "./dto/update-recommendation.dto";

interface AssignmentRow {
  cliente_id: string;
  asignado_en: string;
}

interface UserRow {
  id: string;
  nombre_completo: string;
  foto_perfil_url: string | null;
  email: string | null;
  estado: string;
  creado_en: string;
}

interface ClientProfileRow {
  usuario_id: string;
  telefono: string | null;
  ciudad: string | null;
  ocupacion: string | null;
  ingreso_estimado: number | string | null;
  objetivo_financiero: string | null;
  moneda_preferida: string | null;
  ahorro_objetivo: number | string | null;
  umbral_alerta: number | string | null;
  tema: string | null;
  notificar_email: boolean | null;
  notificar_push: boolean | null;
}

interface ExpenseRow {
  cliente_id: string;
  monto: number | string;
  fecha_gasto: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const ACTIVE_DAYS = 7;

@Injectable()
export class AdvisorService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async getDashboard(user: JwtPayload) {
    const payload = this.ensureAdvisor(user);
    const advisorRow = await this.fetchAdvisorRow(payload.sub);
    const assignments = await this.fetchAssignments(payload.sub);
    const clientIds = assignments.map((row) => row.cliente_id);
    const calendar = this.buildCalendar(new Date());

    if (clientIds.length === 0) {
      return {
        advisor: {
          id: payload.sub,
          name: advisorRow.nombre_completo,
          email: payload.email,
          photo: advisorRow.foto_perfil_url,
          role: "asesor",
          totalClients: 0,
        },
        calendar,
        alerts: [],
        stats: this.buildStats([], [], [], assignments, []),
        clients: [],
        inbox: [],
        recommendations: this.buildRecommendationSummary([]),
        charts: this.buildCharts(new Map<string, string>(), [], []),
      };
    }

    const now = new Date();
    const startOfMonth = this.startOfMonth(now);
    const startOfPrevMonth = this.startOfMonth(this.addMonths(now, -1));
    const tomorrow = this.addDays(now, 1);
    const lastWeek = this.addDays(now, -6);

    const [
      clientRows,
      profileMap,
      currentMonthRows,
      previousMonthRows,
      lastExpenseMap,
      unreadCounts,
      inboxRows,
      recommendationRows,
      dailyRows,
    ] = await Promise.all([
      this.fetchClientRows(clientIds),
      this.fetchActiveProfileMap(clientIds),
      this.fetchExpensesByRange(clientIds, this.formatDate(startOfMonth), this.formatDate(tomorrow)),
      this.fetchExpensesByRange(
        clientIds,
        this.formatDate(startOfPrevMonth),
        this.formatDate(startOfMonth),
      ),
      this.fetchLastExpenseMap(clientIds),
      this.fetchUnreadMessageCounts(payload.sub, clientIds),
      this.fetchInboxRows(payload.sub),
      this.fetchRecommendationRows(payload.sub),
      this.fetchExpensesByRange(clientIds, this.formatDate(lastWeek), this.formatDate(tomorrow)),
    ]);

    const emailMap = new Map<string, string | null>();
    clientRows.forEach((row) => emailMap.set(row.id, row.email));

    const clients = this.buildClientSummaries(
      clientRows,
      emailMap,
      profileMap,
      currentMonthRows,
      previousMonthRows,
      lastExpenseMap,
      unreadCounts,
      now,
    );

    const stats = this.buildStats(
      clients,
      currentMonthRows,
      previousMonthRows,
      assignments,
      clientIds,
    );

    const alerts = this.buildAlerts(clients, unreadCounts, recommendationRows, now);

    const inbox = this.buildInboxPreview(inboxRows, payload.sub);

    const recommendations = this.buildRecommendationSummary(recommendationRows);

    const charts = this.buildCharts(profileMap, currentMonthRows, dailyRows);

    return {
      advisor: {
        id: payload.sub,
        name: advisorRow.nombre_completo,
        email: payload.email,
        photo: advisorRow.foto_perfil_url,
        role: "asesor",
        totalClients: clientIds.length,
      },
      calendar,
      alerts,
      stats,
      clients,
      inbox,
      recommendations,
      charts,
    };
  }

  async getClients(user: JwtPayload, query: AdvisorClientsQueryDto) {
    const payload = this.ensureAdvisor(user);
    const assignments = await this.fetchAssignments(payload.sub);
    const clientIds = assignments.map((row) => row.cliente_id);

    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);

    if (clientIds.length === 0) {
      return {
        data: [],
        pagination: this.buildPagination(0, page, limit),
      };
    }

    const now = new Date();
    const startOfMonth = this.startOfMonth(now);
    const startOfPrevMonth = this.startOfMonth(this.addMonths(now, -1));
    const tomorrow = this.addDays(now, 1);

    const [clientRows, profileMap, currentMonthRows, previousMonthRows, lastExpenseMap] =
      await Promise.all([
        this.fetchClientRows(clientIds),
        this.fetchActiveProfileMap(clientIds),
        this.fetchExpensesByRange(clientIds, this.formatDate(startOfMonth), this.formatDate(tomorrow)),
        this.fetchExpensesByRange(
          clientIds,
          this.formatDate(startOfPrevMonth),
          this.formatDate(startOfMonth),
        ),
        this.fetchLastExpenseMap(clientIds),
      ]);

    const emailMap = new Map(clientRows.map((r) => [r.id, r.email]));
    const unreadCounts = await this.fetchUnreadMessageCounts(payload.sub, clientIds);

    let clients = this.buildClientSummaries(
      clientRows,
      emailMap,
      profileMap,
      currentMonthRows,
      previousMonthRows,
      lastExpenseMap,
      unreadCounts,
      now,
    );

    if (query.search) {
      const search = query.search.toLowerCase();
      clients = clients.filter((client) => {
        return (
          client.name.toLowerCase().includes(search) ||
          (client.email || "").toLowerCase().includes(search) ||
          (client.profile || "").toLowerCase().includes(search)
        );
      });
    }

    if (query.status) {
      clients = clients.filter((client) => client.status === query.status);
    }

    if (query.risk) {
      clients = clients.filter((client) => client.riskLevel === query.risk);
    }

    if (query.profile) {
      const profile = query.profile.toLowerCase();
      clients = clients.filter((client) => (client.profile || "").toLowerCase() === profile);
    }

    if (query.sortBy) {
      const direction = query.sortDirection === "asc" ? 1 : -1;
      clients.sort((a, b) => {
        if (query.sortBy === "nombre") {
          return a.name.localeCompare(b.name) * direction;
        }
        if (query.sortBy === "actividad") {
          return (a.lastExpenseDate || "").localeCompare(b.lastExpenseDate || "") * direction;
        }
        return (a.totalSpent - b.totalSpent) * direction;
      });
    }

    const total = clients.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = clients.slice(start, end);

    return {
      data,
      pagination: this.buildPagination(total, page, limit),
    };
  }

  async getClientDetail(user: JwtPayload, clientId: string) {
    const payload = this.ensureAdvisor(user);
    await this.ensureAssignment(payload.sub, clientId);

    const clientRow = await this.fetchUserRow(clientId);
    const [profile, activeProfile] = await Promise.all([
      this.fetchClientProfile(clientId),
      this.fetchActiveProfile(clientId),
    ]);

    const now = new Date();
    const startOfMonth = this.startOfMonth(now);
    const startOfPrevMonth = this.startOfMonth(this.addMonths(now, -1));
    const tomorrow = this.addDays(now, 1);

    const [currentRows, previousRows, lastExpenseMap, unreadCounts] =
      await Promise.all([
        this.fetchExpensesByRange([clientId], this.formatDate(startOfMonth), this.formatDate(tomorrow)),
        this.fetchExpensesByRange(
          [clientId],
          this.formatDate(startOfPrevMonth),
          this.formatDate(startOfMonth),
        ),
        this.fetchLastExpenseMap([clientId]),
        this.fetchUnreadMessageCounts(payload.sub, [clientId]),
      ]);

    const emailMap = new Map([[clientId, clientRow.email]]);

    const summaries = this.buildClientSummaries(
      [clientRow],
      emailMap,
      new Map([[clientId, activeProfile]]),
      currentRows,
      previousRows,
      lastExpenseMap,
      unreadCounts,
      now,
    );

    const summary = summaries[0];

    return {
      ...summary,
      phone: profile?.telefono ?? null,
      city: profile?.ciudad ?? null,
      occupation: profile?.ocupacion ?? null,
      monthlyIncome: this.toNumber(profile?.ingreso_estimado, 0),
      savingsGoal: this.toNumber(profile?.ahorro_objetivo, 0),
      alertThreshold: this.toNumber(profile?.umbral_alerta, 0),
      currency: (profile?.moneda_preferida || "ARS").toUpperCase(),
      theme: profile?.tema || "dark",
      notifyEmail: profile?.notificar_email ?? true,
      notifyPush: profile?.notificar_push ?? false,
      financialGoal: profile?.objetivo_financiero ?? null,
      createdAt: clientRow.creado_en,
    };
  }

  async getClientExpenses(
    user: JwtPayload,
    clientId: string,
    query: AdvisorClientExpensesQueryDto,
  ) {
    const payload = this.ensureAdvisor(user);
    await this.ensureAssignment(payload.sub, clientId);

    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);

    if (query.from && query.to) {
      const from = new Date(query.from);
      const to = new Date(query.to);
      if (from > to) {
        throw new BadRequestException("El rango de fechas es invalido");
      }
    }

    let request = this.supabase
      .from("gastos")
      .select(
        "id, cliente_id, categoria_id, comercio, fecha_gasto, monto, descripcion, ticket_principal_id, creado_en, categoria:categoria_id (nombre), ticket:ticket_principal_id (url_archivo)",
        { count: "exact" },
      )
      .eq("cliente_id", clientId)
      .order("fecha_gasto", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (query.categoryId) {
      request = request.eq("categoria_id", query.categoryId);
    }

    if (query.from) {
      request = request.gte("fecha_gasto", query.from);
    }

    if (query.to) {
      request = request.lte("fecha_gasto", query.to);
    }

    if (query.search) {
      const sanitized = query.search.replace(/%/g, "");
      request = request.or(
        `comercio.ilike.%${sanitized}%,descripcion.ilike.%${sanitized}%`,
      );
    }

    const { data, error, count } = await request;

    if (error) {
      throw new InternalServerErrorException("No se pudieron obtener los gastos del cliente");
    }

    const expenses = (data || []).map((row: any) => ({
      id: row.id,
      amount: this.toNumber(row.monto, 0),
      merchant: row.comercio,
      categoryId: row.categoria_id,
      categoryName: row.categoria?.nombre ?? null,
      date: row.fecha_gasto,
      notes: row.descripcion ?? null,
      ticketImageUrl: row.ticket?.url_archivo ?? null,
      userId: row.cliente_id,
      createdAt: row.creado_en,
    }));

    return {
      data: expenses,
      pagination: this.buildPagination(count || 0, page, limit),
    };
  }

  async getRecommendations(user: JwtPayload, query: AdvisorRecommendationsQueryDto) {
    const payload = this.ensureAdvisor(user);
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);

    let request = this.supabase
      .from("recomendaciones_financieras")
      .select(
        "id, cliente_id, asesor_id, origen, tipo, titulo, mensaje, prioridad, leida, creado_en, estado, ahorro_potencial, pasos_implementacion, icono, problema, solucion, cliente:cliente_id (nombre_completo)",
        { count: "exact" },
      )
      .eq("asesor_id", payload.sub)
      .order("creado_en", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (query.clientId) {
      request = request.eq("cliente_id", query.clientId);
    }

    if (query.type) {
      request = request.eq("tipo", this.mapRecommendationTypeToDb(query.type));
    }

    if (query.status) {
      request = request.eq("estado", query.status);
    }

    const { data, error, count } = await request;

    if (error) {
      throw new InternalServerErrorException("No se pudieron obtener recomendaciones");
    }

    const recommendations = (data || []).map((row: any) => {
      const cliente = Array.isArray(row.cliente) ? row.cliente[0] : row.cliente;
      return {
        id: row.id,
        clientId: row.cliente_id,
        clientName: cliente?.nombre_completo ?? null,
        title: row.titulo,
        content: row.mensaje,
        priority: this.mapPriority(row.prioridad),
        status: this.mapStatus(row.estado),
        type: this.mapRecommendationTypeFromDb(row.tipo),
        isRead: row.leida,
        dateSent: row.creado_en,
        savingsPotential: this.toNumber(row.ahorro_potencial, 0),
        implementationSteps: Array.isArray(row.pasos_implementacion) ? row.pasos_implementacion : [],
        icon: row.icono ?? null,
        problem: row.problema ?? null,
        solution: row.solucion ?? null,
      };
    });

    return {
      data: recommendations,
      pagination: this.buildPagination(count || 0, page, limit),
    };
  }

  async createRecommendation(user: JwtPayload, dto: CreateAdvisorRecommendationDto) {
    const payload = this.ensureAdvisor(user);
    await this.ensureAssignment(payload.sub, dto.clientId);

    const title = dto.title?.trim() || this.buildRecommendationTitle(dto.type, dto.content);
    const priority = dto.priority || AdvisorRecommendationPriority.Media;
    const steps = Array.isArray(dto.implementationSteps)
      ? dto.implementationSteps.map((step) => step.trim()).filter(Boolean)
      : [];

    const insertPayload = {
      cliente_id: dto.clientId,
      asesor_id: payload.sub,
      origen: "asesor",
      tipo: this.mapRecommendationTypeToDb(dto.type),
      titulo: title,
      mensaje: dto.content,
      prioridad: priority,
      icono: dto.icon ?? null,
      problema: dto.problem ?? null,
      solucion: dto.solution ?? null,
      ahorro_potencial: dto.savingsPotential ?? null,
      pasos_implementacion: steps.length ? steps : null,
    };

    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .insert(insertPayload)
      .select(
        "id, cliente_id, asesor_id, origen, tipo, titulo, mensaje, prioridad, leida, creado_en, estado, ahorro_potencial, pasos_implementacion, icono, problema, solucion, cliente:cliente_id (nombre_completo)",
      )
      .single();

    if (error || !data) {
      throw new InternalServerErrorException("No se pudo crear la recomendacion");
    }

    const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
    return {
      id: data.id,
      clientId: data.cliente_id,
      clientName: cliente?.nombre_completo ?? null,
      title: data.titulo,
      content: data.mensaje,
      priority: this.mapPriority(data.prioridad),
      status: this.mapStatus(data.estado),
      type: this.mapRecommendationTypeFromDb(data.tipo),
      isRead: data.leida,
      dateSent: data.creado_en,
      savingsPotential: this.toNumber(data.ahorro_potencial, 0),
      implementationSteps: Array.isArray(data.pasos_implementacion) ? data.pasos_implementacion : [],
      icon: data.icono ?? null,
      problem: data.problema ?? null,
      solution: data.solucion ?? null,
    };
  }

  async updateRecommendation(user: JwtPayload, id: string, dto: UpdateRecommendationDto) {
    const payload = this.ensureAdvisor(user);

    const updatePayload: any = {};
    if (dto.title !== undefined) updatePayload.titulo = dto.title;
    if (dto.content !== undefined) updatePayload.mensaje = dto.content;
    if (dto.priority !== undefined) updatePayload.prioridad = dto.priority;
    if (dto.status !== undefined) updatePayload.estado = dto.status;
    if (dto.icon !== undefined) updatePayload.icono = dto.icon;
    if (dto.problem !== undefined) updatePayload.problema = dto.problem;
    if (dto.solution !== undefined) updatePayload.solucion = dto.solution;
    if (dto.savingsPotential !== undefined) updatePayload.ahorro_potencial = dto.savingsPotential;
    if (dto.implementationSteps !== undefined)
      updatePayload.pasos_implementacion = dto.implementationSteps;

    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .update(updatePayload)
      .eq("id", id)
      .eq("asesor_id", payload.sub)
      .select(
        "id, cliente_id, asesor_id, origen, tipo, titulo, mensaje, prioridad, leida, creado_en, estado, ahorro_potencial, pasos_implementacion, icono, problema, solucion, cliente:cliente_id (nombre_completo)",
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") throw new NotFoundException("Recomendacion no encontrada");
      throw new InternalServerErrorException("No se pudo actualizar la recomendacion");
    }

    const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
    return {
      id: data.id,
      clientId: data.cliente_id,
      clientName: cliente?.nombre_completo ?? null,
      title: data.titulo,
      content: data.mensaje,
      priority: this.mapPriority(data.prioridad),
      status: this.mapStatus(data.estado),
      type: this.mapRecommendationTypeFromDb(data.tipo),
      isRead: data.leida,
      dateSent: data.creado_en,
      savingsPotential: this.toNumber(data.ahorro_potencial, 0),
      implementationSteps: Array.isArray(data.pasos_implementacion) ? data.pasos_implementacion : [],
      icon: data.icono ?? null,
      problem: data.problema ?? null,
      solution: data.solucion ?? null,
    };
  }

  async deleteRecommendation(user: JwtPayload, id: string) {
    const payload = this.ensureAdvisor(user);
    const { error } = await this.supabase
      .from("recomendaciones_financieras")
      .delete()
      .eq("id", id)
      .eq("asesor_id", payload.sub);

    if (error) {
      throw new InternalServerErrorException("No se pudo eliminar la recomendacion");
    }
  }

  async getMessages(user: JwtPayload, query: AdvisorMessagesQueryDto) {
    const payload = this.ensureAdvisor(user);
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);

    if (query.clientId) {
      await this.ensureAssignment(payload.sub, query.clientId);

      let request = this.supabase
        .from("mensajes_asesor")
        .select(
          "id, cliente_id, asesor_id, remitente_id, destinatario_id, tipo, asunto, contenido, leido, leido_en, creado_en, remitente:remitente_id (nombre_completo, foto_perfil_url)",
          { count: "exact" },
        )
        .eq("asesor_id", payload.sub)
        .eq("cliente_id", query.clientId)
        .order("creado_en", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (query.type) {
        request = request.eq("tipo", query.type);
      }

      if (query.onlyUnread) {
        request = request.eq("destinatario_id", payload.sub).eq("leido", false);
      }

      const { data, error, count } = await request;

      if (error) {
        throw new InternalServerErrorException("No se pudieron obtener los mensajes");
      }

      const messages = (data || []).map((row: any) => {
        const remitente = Array.isArray(row.remitente) ? row.remitente[0] : row.remitente;
        return {
          id: row.id,
          clientId: row.cliente_id,
          advisorId: row.asesor_id,
          subject: row.asunto ?? this.buildSubject(row.contenido),
          body: row.contenido,
          type: row.tipo,
          dateSent: row.creado_en,
          isRead: row.leido,
          readAt: row.leido_en,
          from: {
            id: row.remitente_id,
            role: row.remitente_id === payload.sub ? "asesor" : "cliente",
            name: remitente?.nombre_completo ?? null,
            avatarUrl: remitente?.foto_perfil_url ?? null,
          },
        };
      });

      return {
        data: messages,
        pagination: this.buildPagination(count || 0, page, limit),
      };
    }

    const inboxRows = await this.fetchInboxRows(payload.sub);
    const preview = this.buildInboxPreview(inboxRows, payload.sub);

    if (query.onlyUnread) {
      return {
        data: preview.filter((item) => item.unread),
      };
    }

    if (query.type) {
      return {
        data: preview.filter((item) => item.type === query.type),
      };
    }

    return { data: preview };
  }

  async createMessage(user: JwtPayload, dto: CreateAdvisorMessageDto) {
    const payload = this.ensureAdvisor(user);
    await this.ensureAssignment(payload.sub, dto.clientId);

    const subject = dto.subject?.trim() || this.buildSubject(dto.content);
    const type = dto.type || AdvisorMessageType.Mensaje;

    const insertPayload = {
      asesor_id: payload.sub,
      cliente_id: dto.clientId,
      remitente_id: payload.sub,
      destinatario_id: dto.clientId,
      tipo: type,
      asunto: subject,
      contenido: dto.content,
    };

    const { data, error } = await this.supabase
      .from("mensajes_asesor")
      .insert(insertPayload)
      .select(
        "id, cliente_id, asesor_id, remitente_id, destinatario_id, tipo, asunto, contenido, leido, leido_en, creado_en, cliente:cliente_id (nombre_completo, foto_perfil_url)",
      )
      .single();

    if (error || !data) {
      throw new InternalServerErrorException("No se pudo enviar el mensaje");
    }

    const cliente = Array.isArray(data.cliente) ? data.cliente[0] : data.cliente;
    return {
      id: data.id,
      clientId: data.cliente_id,
      advisorId: data.asesor_id,
      subject: data.asunto ?? this.buildSubject(data.contenido),
      body: data.contenido,
      type: data.tipo,
      dateSent: data.creado_en,
      isRead: data.leido,
      readAt: data.leido_en,
      to: {
        id: data.cliente_id,
        role: "cliente",
        name: cliente?.nombre_completo ?? null,
        avatarUrl: cliente?.foto_perfil_url ?? null,
      },
    };
  }

  async markMessageAsRead(user: JwtPayload, messageId: string) {
    const payload = this.ensureAdvisor(user);
    const { error } = await this.supabase
      .from("mensajes_asesor")
      .update({ leido: true, leido_en: new Date().toISOString() })
      .eq("id", messageId)
      .eq("destinatario_id", payload.sub);

    if (error) {
      throw new InternalServerErrorException("No se pudo marcar el mensaje como leido");
    }

    return { success: true };
  }

  async getReports(user: JwtPayload) {
    const payload = this.ensureAdvisor(user);
    const assignments = await this.fetchAssignments(payload.sub);
    const clientIds = assignments.map((row) => row.cliente_id);

    const now = new Date();
    const recommendations = await this.fetchRecommendationRows(payload.sub);
    const unreadCounts = await this.fetchUnreadMessageCounts(payload.sub, clientIds);
    const unreadTotal = Array.from(unreadCounts.values()).reduce((sum, v) => sum + v, 0);

    const activeClientsCount = clientIds.length;

    return {
      summary: {
        activeClients: activeClientsCount,
        monthlyCommissions: 150000,
        pendingTasks: unreadTotal + 3,
        reportsReady: 4,
      },
      commissions: [
        {
          month: "Marzo 2026",
          clientsServed: activeClientsCount,
          recommendationsSent: recommendations.length,
          commissionAmount: 150000,
          status: "En revision",
        },
      ],
      tasks: [
        {
          id: "task-001",
          title: "Seguimiento de gastos inusuales",
          clientName: "Cliente Ejemplo",
          dueDate: this.formatDate(this.addDays(now, 2)),
          priority: "Alta",
          status: "Pendiente",
        },
      ],
      downloads: [
        {
          id: "download-001",
          title: "Resumen ejecutivo de cartera",
          description: "Vista consolidada de clientes, riesgo y tendencia de gasto.",
          format: "PDF",
          updatedAt: this.formatDate(now),
          size: "1.2 MB",
          section: "descargas",
        },
      ],
    };
  }

  private ensureAdvisor(user: JwtPayload) {
    if (!user?.sub) {
      throw new UnauthorizedException("Token invalido");
    }

    if (user.role !== "asesor") {
      throw new ForbiddenException("Solo asesores pueden acceder a este recurso");
    }

    return user;
  }

  private normalizePage(value?: number) {
    return Math.max(1, value || DEFAULT_PAGE);
  }

  private normalizeLimit(value?: number) {
    const parsed = value || DEFAULT_LIMIT;
    return Math.min(Math.max(parsed, 1), MAX_LIMIT);
  }

  private buildPagination(total: number, page: number, limit: number) {
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
    };
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private addMonths(date: Date, months: number) {
    const updated = new Date(date.getTime());
    updated.setMonth(updated.getMonth() + months);
    return updated;
  }

  private addDays(date: Date, days: number) {
    const updated = new Date(date.getTime());
    updated.setDate(updated.getDate() + days);
    return updated;
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private buildCalendar(date: Date) {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    return {
      day: String(date.getDate()),
      month: months[date.getMonth()],
      year: String(date.getFullYear()),
      dayName: days[date.getDay()],
    };
  }

  private formatRelativeDate(value: string | null) {
    if (!value) {
      return "Sin gastos";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Sin gastos";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 60) {
      return `Hace ${Math.max(diffMinutes, 1)} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  private buildSubject(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      return "Mensaje del asesor";
    }
    if (trimmed.length <= 80) {
      return trimmed;
    }
    return `${trimmed.slice(0, 77)}...`;
  }

  private buildRecommendationTitle(type: AdvisorRecommendationType, content: string) {
    const fallback = type === AdvisorRecommendationType.Alerta
      ? "Alerta financiera"
      : type === AdvisorRecommendationType.Felicitacion
        ? "Felicitacion"
        : "Recomendacion financiera";

    const trimmed = content.trim();
    if (trimmed.length >= 3) {
      return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
    }

    return fallback;
  }

  private async fetchAdvisorRow(advisorId: string): Promise<UserRow> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, foto_perfil_url, email, estado, creado_en")
      .eq("id", advisorId)
      .single();

    if (error || !data) {
      throw new NotFoundException("Asesor no encontrado");
    }

    return data as UserRow;
  }

  private async fetchUserRow(userId: string): Promise<UserRow> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, foto_perfil_url, email, estado, creado_en")
      .eq("id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundException("Usuario no encontrado");
    }

    return data as UserRow;
  }

  private async fetchAssignments(advisorId: string): Promise<AssignmentRow[]> {
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("cliente_id, asignado_en")
      .eq("asesor_id", advisorId)
      .eq("activo", true);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los clientes asignados");
    }

    return (data as AssignmentRow[]) || [];
  }

  private async ensureAssignment(advisorId: string, clientId: string) {
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("id")
      .eq("asesor_id", advisorId)
      .eq("cliente_id", clientId)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo validar la asignacion del cliente");
    }

    if (!data) {
      throw new NotFoundException("Cliente no asignado al asesor");
    }
  }

  private async fetchClientRows(clientIds: string[]) {
    if (!clientIds.length) {
      return [] as UserRow[];
    }

    const { data, error } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, foto_perfil_url, email, estado, creado_en")
      .in("id", clientIds);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los clientes");
    }

    return (data as UserRow[]) || [];
  }

  private async fetchClientProfile(clientId: string): Promise<ClientProfileRow | null> {
    const { data, error } = await this.supabase
      .from("perfiles_usuarios")
      .select(
        "usuario_id, telefono, ciudad, ocupacion, ingreso_estimado, objetivo_financiero, moneda_preferida, ahorro_objetivo, umbral_alerta, tema, notificar_email, notificar_push",
      )
      .eq("usuario_id", clientId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el perfil del cliente");
    }

    return (data as ClientProfileRow) || null;
  }

  private async fetchActiveProfile(clientId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("clasificacion_de_perfil")
      .select("perfil:perfil_id (nombre)")
      .eq("cliente_id", clientId)
      .is("vigente_hasta", null)
      .order("vigente_desde", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException("No se pudo cargar el perfil de consumo");
    }

    const perfil = Array.isArray(data?.perfil) ? data.perfil[0] : data?.perfil;
    return (perfil?.nombre as string | null) || null;
  }

  private async fetchActiveProfileMap(clientIds: string[]) {
    if (!clientIds.length) {
      return new Map<string, string>();
    }

    const { data, error } = await this.supabase
      .from("clasificacion_de_perfil")
      .select("cliente_id, perfil:perfil_id (nombre)")
      .in("cliente_id", clientIds)
      .is("vigente_hasta", null);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los perfiles de consumo");
    }

    const map = new Map<string, string>();
    (data || []).forEach((row: any) => {
      const perfil = Array.isArray(row.perfil) ? row.perfil[0] : row.perfil;
      const name = perfil?.nombre || null;
      if (name) {
        map.set(row.cliente_id, name);
      }
    });

    return map;
  }

  private async fetchExpensesByRange(clientIds: string[], from: string, to: string) {
    if (!clientIds.length) {
      return [] as ExpenseRow[];
    }

    const { data, error } = await this.supabase
      .from("gastos")
      .select("cliente_id, monto, fecha_gasto")
      .in("cliente_id", clientIds)
      .gte("fecha_gasto", from)
      .lt("fecha_gasto", to);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los gastos");
    }

    return (data as ExpenseRow[]) || [];
  }

  private async fetchLastExpenseMap(clientIds: string[]) {
    if (!clientIds.length) {
      return new Map<string, string>();
    }

    const start = this.formatDate(this.addDays(new Date(), -120));

    const { data, error } = await this.supabase
      .from("gastos")
      .select("cliente_id, fecha_gasto")
      .in("cliente_id", clientIds)
      .gte("fecha_gasto", start)
      .order("fecha_gasto", { ascending: false });

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los gastos recientes");
    }

    const map = new Map<string, string>();
    (data || []).forEach((row: any) => {
      if (!map.has(row.cliente_id)) {
        map.set(row.cliente_id, row.fecha_gasto);
      }
    });

    return map;
  }

  private async fetchUnreadMessageCounts(advisorId: string, clientIds: string[]) {
    if (!clientIds.length) {
      return new Map<string, number>();
    }

    const { data, error } = await this.supabase
      .from("mensajes_asesor")
      .select("cliente_id")
      .eq("asesor_id", advisorId)
      .eq("destinatario_id", advisorId)
      .eq("leido", false)
      .in("cliente_id", clientIds);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los mensajes pendientes");
    }

    const map = new Map<string, number>();
    (data || []).forEach((row: any) => {
      const current = map.get(row.cliente_id) || 0;
      map.set(row.cliente_id, current + 1);
    });

    return map;
  }

  private async fetchInboxRows(advisorId: string) {
    const { data, error } = await this.supabase
      .from("mensajes_asesor")
      .select(
        "id, cliente_id, asesor_id, remitente_id, destinatario_id, tipo, asunto, contenido, leido, creado_en, cliente:cliente_id (nombre_completo, foto_perfil_url)",
      )
      .eq("asesor_id", advisorId)
      .order("creado_en", { ascending: false })
      .limit(50);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar los mensajes");
    }

    return (data as any[]) || [];
  }

  private async fetchRecommendationRows(advisorId: string) {
    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .select(
        "id, cliente_id, asesor_id, origen, tipo, titulo, mensaje, prioridad, leida, creado_en, estado, ahorro_potencial, pasos_implementacion, icono, problema, solucion, cliente:cliente_id (nombre_completo)",
      )
      .eq("asesor_id", advisorId)
      .order("creado_en", { ascending: false })
      .limit(30);

    if (error) {
      throw new InternalServerErrorException("No se pudieron cargar recomendaciones");
    }

    return (data as any[]) || [];
  }

  private buildClientSummaries(
    clientRows: UserRow[],
    emailMap: Map<string, string | null>,
    profileMap: Map<string, string | null>,
    currentRows: ExpenseRow[],
    previousRows: ExpenseRow[],
    lastExpenseMap: Map<string, string>,
    unreadCounts: Map<string, number>,
    now: Date,
  ) {
    const currentTotals = this.buildTotals(currentRows);
    const previousTotals = this.buildTotals(previousRows);
    const currentCounts = this.buildCounts(currentRows);

    return clientRows.map((client) => {
      const total = currentTotals.get(client.id) || 0;
      const count = currentCounts.get(client.id) || 0;
      const previousTotal = previousTotals.get(client.id) || 0;
      const averageSpend = count > 0 ? total / count : 0;
      const changePercent = this.calculateChangePercent(total, previousTotal);
      const lastExpenseDate = lastExpenseMap.get(client.id) || null;
      const isActive = this.isActiveClient(lastExpenseDate, now);
      const risk = this.buildRisk(changePercent);

      return {
        id: client.id,
        name: client.nombre_completo,
        email: emailMap.get(client.id) || null,
        photo: client.foto_perfil_url,
        profile: profileMap.get(client.id) || "Sin perfil",
        totalSpent: total,
        averageSpend,
        lastExpense: this.formatRelativeDate(lastExpenseDate),
        lastExpenseDate,
        changePercent,
        risk: risk.label,
        riskLevel: risk.level,
        status: isActive ? "activo" : "inactivo",
        unreadMessages: unreadCounts.get(client.id) || 0,
      };
    });
  }

  private buildTotals(rows: ExpenseRow[]) {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const amount = this.toNumber(row.monto, 0);
      const current = map.get(row.cliente_id) || 0;
      map.set(row.cliente_id, current + amount);
    });
    return map;
  }

  private buildCounts(rows: ExpenseRow[]) {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const current = map.get(row.cliente_id) || 0;
      map.set(row.cliente_id, current + 1);
    });
    return map;
  }

  private calculateChangePercent(current: number, previous: number) {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  private isActiveClient(lastExpenseDate: string | null, now: Date) {
    if (!lastExpenseDate) {
      return false;
    }

    const last = new Date(lastExpenseDate);
    if (Number.isNaN(last.getTime())) {
      return false;
    }

    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= ACTIVE_DAYS;
  }

  private buildRisk(changePercent: number) {
    if (changePercent >= 20) {
      return { label: "Alto", level: "high" };
    }
    if (changePercent >= 5) {
      return { label: "Medio", level: "medium" };
    }
    return { label: "Bajo", level: "low" };
  }

  private buildStats(
    clients: Array<{ status: string; totalSpent: number; averageSpend: number }>,
    currentRows: ExpenseRow[],
    previousRows: ExpenseRow[],
    assignments: AssignmentRow[],
    clientIds: string[],
  ) {
    const activeClients = clients.filter((client) => client.status === "activo").length;
    const totalSpent = clients.reduce((sum, client) => sum + client.totalSpent, 0);
    const averagePerClient = activeClients > 0 ? totalSpent / activeClients : 0;

    const totalCurrent = this.sumRows(currentRows);
    const totalPrevious = this.sumRows(previousRows);
    const totalTrend = this.calculateChangePercent(totalCurrent, totalPrevious);

    const avgPrevious = clientIds.length > 0 ? totalPrevious / clientIds.length : 0;
    const avgTrend = this.calculateChangePercent(averagePerClient, avgPrevious);

    const newAssignments = assignments.filter((assignment) => {
      const assignedAt = new Date(assignment.asignado_en);
      const now = new Date();
      return (
        assignedAt.getMonth() === now.getMonth() && assignedAt.getFullYear() === now.getFullYear()
      );
    }).length;

    return [
      {
        label: "Clientes Activos",
        value: activeClients,
        icon: "fa-users",
        emoji: "👥",
        trendValue: newAssignments,
        trendDirection: newAssignments >= 0 ? "up" : "down",
        trendLabel: "nuevos este mes",
      },
      {
        label: "Gasto total mensual",
        value: totalSpent,
        icon: "fa-chart-line",
        emoji: "📈",
        trendValue: Math.abs(totalTrend),
        trendDirection: totalTrend >= 0 ? "up" : "down",
        trendLabel: "vs mes anterior",
      },
      {
        label: "Gasto promedio por cliente",
        value: averagePerClient,
        icon: "fa-user-clock",
        emoji: "📌",
        trendValue: Math.abs(avgTrend),
        trendDirection: avgTrend >= 0 ? "up" : "down",
        trendLabel: "vs mes anterior",
      },
    ];
  }

  private sumRows(rows: ExpenseRow[]) {
    return rows.reduce((sum, row) => sum + this.toNumber(row.monto, 0), 0);
  }

  private buildAlerts(
    clients: Array<{ status: string }>,
    unreadCounts: Map<string, number>,
    recommendations: any[],
    now: Date,
  ) {
    const alerts: Array<{ icon: string; title: string; description: string; level: string }> = [];

    const inactiveCount = clients.filter((client) => client.status === "inactivo").length;
    if (inactiveCount > 0) {
      alerts.push({
        icon: "👥",
        title: `${inactiveCount} clientes requieren seguimiento`,
        description: "No registran gastos recientemente.",
        level: "warning",
      });
    }

    const unreadTotal = Array.from(unreadCounts.values()).reduce((sum, value) => sum + value, 0);
    if (unreadTotal > 0) {
      alerts.push({
        icon: "💬",
        title: `${unreadTotal} mensajes sin leer`,
        description: "Pendientes en el inbox.",
        level: "success",
      });
    }

    const completedThisMonth = recommendations.filter((rec) => {
      if (rec.estado !== AdvisorRecommendationStatus.Completada) {
        return false;
      }
      const date = new Date(rec.creado_en);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    if (completedThisMonth > 0) {
      alerts.push({
        icon: "⭐",
        title: "Excelente desempeno",
        description: `${completedThisMonth} recomendaciones implementadas este mes.`,
        level: "success",
      });
    }

    return alerts;
  }

  private buildInboxPreview(rows: any[], advisorId: string) {
    const seen = new Set<string>();
    const preview: Array<any> = [];

    rows.forEach((row) => {
      if (seen.has(row.cliente_id)) {
        return;
      }
      seen.add(row.cliente_id);

      const cliente = Array.isArray(row.cliente) ? row.cliente[0] : row.cliente;

      preview.push({
        id: row.id,
        clientId: row.cliente_id,
        from: cliente?.nombre_completo ?? "Cliente",
        subject: row.asunto ?? this.buildSubject(row.contenido),
        date: this.formatRelativeDate(row.creado_en),
        type: row.tipo,
        unread: !row.leido && row.destinatario_id === advisorId,
      });
    });

    return preview;
  }

  private buildRecommendationSummary(rows: any[]) {
    const pending = rows.filter((rec) => rec.estado === AdvisorRecommendationStatus.Pendiente);
    const viewed = rows.filter(
      (rec) => rec.estado === AdvisorRecommendationStatus.Pendiente && rec.leida,
    );
    const completed = rows.filter((rec) => rec.estado === AdvisorRecommendationStatus.Completada);

    const buildItems = (list: any[]) =>
      list.slice(0, 3).map((item) => {
        const cliente = Array.isArray(item.cliente) ? item.cliente[0] : item.cliente;
        return {
          clientName: cliente?.nombre_completo ?? "Cliente",
          action: item.titulo || this.buildSubject(item.mensaje),
        };
      });

    return [
      {
        id: "adv-rec-001",
        title: "Enviadas",
        count: pending.length,
        icon: "💡",
        items: buildItems(pending),
      },
      {
        id: "adv-rec-002",
        title: "Vistas",
        count: viewed.length,
        icon: "💡",
        items: buildItems(viewed),
      },
      {
        id: "adv-rec-003",
        title: "Implementadas",
        count: completed.length,
        icon: "💡",
        items: buildItems(completed),
      },
    ];
  }

  private buildCharts(
    profileMap: Map<string, string | null>,
    currentRows: ExpenseRow[],
    dailyRows: ExpenseRow[],
  ) {
    const colors = [
      "#2dd4bf",
      "#f97316",
      "#8b5cf6",
      "#4ade80",
      "#38bdf8",
      "#f59e0b",
    ];

    const profileCounts = new Map<string, number>();
    profileMap.forEach((profile) => {
      const label = profile || "Sin perfil";
      profileCounts.set(label, (profileCounts.get(label) || 0) + 1);
    });

    const profileDistribution = Array.from(profileCounts.entries()).map(
      ([label, value], index) => ({
        label,
        value,
        color: colors[index % colors.length],
      }),
    );

    const spendByProfileMap = new Map<string, number>();
    currentRows.forEach((row) => {
      const profile = profileMap.get(row.cliente_id) || "Sin perfil";
      const amount = this.toNumber(row.monto, 0);
      spendByProfileMap.set(profile, (spendByProfileMap.get(profile) || 0) + amount);
    });

    const spendByProfile = Array.from(spendByProfileMap.entries()).map(([label, value]) => ({
      label,
      value,
    }));

    const dailyMap = new Map<string, Set<string>>();
    dailyRows.forEach((row) => {
      const dateKey = row.fecha_gasto;
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, new Set());
      }
      dailyMap.get(dateKey)?.add(row.cliente_id);
    });

    const labels: string[] = [];
    const values: number[] = [];

    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const date = this.addDays(today, -i);
      const key = this.formatDate(date);
      labels.push(this.formatShortDate(date));
      values.push(dailyMap.get(key)?.size || 0);
    }

    return {
      profileDistribution,
      spendByProfile,
      dailyActivityLabels: labels,
      dailyActivityValues: values,
    };
  }

  private formatShortDate(date: Date) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]}`;
  }

  private mapRecommendationTypeToDb(type: AdvisorRecommendationType) {
    if (type === AdvisorRecommendationType.Alerta) {
      return "alerta";
    }
    if (type === AdvisorRecommendationType.Felicitacion) {
      return "observacion";
    }
    return "sugerencia";
  }

  private mapRecommendationTypeFromDb(value: string | null) {
    const normalized = (value || "sugerencia").toLowerCase();
    if (normalized === "alerta") {
      return "alerta";
    }
    if (normalized === "observacion") {
      return "felicitacion";
    }
    return "consejo";
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
}
