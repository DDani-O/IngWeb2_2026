/** Servicio de la cartera del asesor: arma `resumen_cliente` y delega el perfil en `AnalysisService`. */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { AssignmentsService } from "../../common/assignments/assignments.service";
import { internalError, notFoundError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { Analisis, ResumenCliente } from "../analysis/analysis.types";
import { AnalysisService } from "../analysis/analysis.service";
import { UsersService } from "../users/users.service";
import { PerfilVigente, Usuario } from "../users/usuario.types";
import { AssignProfileDto } from "./dto/assign-profile.dto";

interface ClientRow {
  id: string;
  nombre_completo: string;
  email: string | null;
  estado: "activo" | "inactivo";
}

const toResumen = (row: ClientRow, analisis: Analisis): ResumenCliente => ({
  id: row.id,
  nombre_completo: row.nombre_completo,
  email: row.email,
  estado: row.estado,
  perfil_de_gasto: analisis.perfil_de_gasto,
  gasto_promedio_mensual: analisis.gasto_promedio_mensual,
  gasto_mes_actual: analisis.gasto_mes_actual,
  variacion_mes_anterior: analisis.variacion_mes_anterior,
  ultimo_gasto_fecha: analisis.ultimo_gasto_fecha,
  gastos_inusuales: analisis.gastos_inusuales.length,
  nivel_riesgo: analisis.nivel_riesgo,
});

/**
 * Cartera del asesor (contrato §3.7, backend/README.md): resumen de cada cliente asignado y su detalle.
 */
@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly assignments: AssignmentsService,
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
  ) {}

  /** `resumen_cliente` de cada cliente con asignación activa, por nombre. */
  async list(advisorId: string): Promise<ResumenCliente[]> {
    const clientIds = await this.assignments.listClientIds(advisorId);
    if (!clientIds.length) {
      return [];
    }

    const [rows, analyses] = await Promise.all([
      this.fetchClients(clientIds),
      this.analysisService.analyzeClients(clientIds),
    ]);
    return rows
      .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, "es"))
      .map((row) => toResumen(row, analyses.get(row.id)!));
  }

  /** `resumen_cliente` + `usuario` de un cliente asignado (403 si no lo está). */
  async get(
    advisorId: string,
    clientId: string,
  ): Promise<ResumenCliente & { usuario: Usuario }> {
    await this.assignments.assertAssigned(advisorId, clientId);
    const [[row], analisis] = await Promise.all([
      this.fetchClients([clientId]),
      this.analysisService.getClientAnalysis(clientId),
    ]);
    const usuario = await this.usersService.getUsuario(
      clientId,
      analisis.perfil_de_gasto,
    );
    if (!row || !usuario) {
      throw notFoundError("Cliente no encontrado.");
    }
    return { ...toResumen(row, analisis), usuario };
  }

  /** Perfil elegido por el asesor (403 si el cliente no está asignado). */
  async assignProfile(
    advisorId: string,
    clientId: string,
    dto: AssignProfileDto,
  ): Promise<{ perfil_de_gasto: PerfilVigente | null }> {
    await this.assignments.assertAssigned(advisorId, clientId);
    const perfil = await this.analysisService.assignManualProfile(
      clientId,
      advisorId,
      dto.perfil_id,
      dto.motivo ?? null,
    );
    return { perfil_de_gasto: perfil };
  }

  /** Vuelve al perfil automático (403 si el cliente no está asignado). */
  async resetProfile(
    advisorId: string,
    clientId: string,
  ): Promise<{ perfil_de_gasto: PerfilVigente | null }> {
    await this.assignments.assertAssigned(advisorId, clientId);
    const perfil = await this.analysisService.resetToAutomaticProfile(clientId);
    return { perfil_de_gasto: perfil };
  }

  private async fetchClients(clientIds: string[]): Promise<ClientRow[]> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select("id, nombre_completo, email, estado")
      .in("id", clientIds)
      .eq("rol", "cliente");

    if (error) {
      this.logger.error(`usuarios clientes: ${error.message}`);
      throw internalError("No se pudieron obtener los clientes.");
    }
    return (data ?? []) as ClientRow[];
  }
}
