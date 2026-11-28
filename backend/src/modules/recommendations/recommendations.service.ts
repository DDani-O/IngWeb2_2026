import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { isUUID } from "class-validator";
import { AssignmentsService } from "../../common/assignments/assignments.service";
import { internalError, notFoundError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { UsuarioRef } from "../users/usuario.types";
import { CreateRecommendationDto } from "./dto/create-recommendation.dto";
import { QuerySentRecommendationsDto } from "./dto/query-sent.dto";

/** Objeto `recomendacion` del contrato (§3.0, backend/README.md). */
export interface Recomendacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: "sugerencia" | "alerta" | "observacion";
  prioridad: "baja" | "media" | "alta";
  origen: "sistema" | "asesor";
  leida: boolean;
  leida_en: string | null;
  creado_en: string;
  asesor: UsuarioRef | null;
  cliente: UsuarioRef | null;
}

const RECOMENDACION_SELECT =
  "id, titulo, mensaje, tipo, prioridad, origen, leida, leida_en, creado_en, asesor:asesor_id (id, nombre_completo), cliente:cliente_id (id, nombre_completo)";

type Ref = UsuarioRef | UsuarioRef[] | null;
type RecomendacionRow = Omit<Recomendacion, "asesor" | "cliente"> & {
  asesor: Ref;
  cliente: Ref;
};

const firstRef = (value: Ref): UsuarioRef | null => {
  const ref = Array.isArray(value) ? (value[0] ?? null) : value;
  return ref ? { id: ref.id, nombre_completo: ref.nombre_completo } : null;
};

const toRecomendacion = (row: RecomendacionRow): Recomendacion => ({
  id: row.id,
  titulo: row.titulo,
  mensaje: row.mensaje,
  tipo: row.tipo,
  prioridad: row.prioridad,
  origen: row.origen,
  leida: Boolean(row.leida),
  leida_en: row.leida_en,
  creado_en: row.creado_en,
  asesor: firstRef(row.asesor),
  cliente: firstRef(row.cliente),
});

/**
 * Recomendaciones financieras: el cliente ve las suyas y las marca como leídas;
 * el asesor crea recomendaciones para sus clientes y consulta las enviadas.
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly assignments: AssignmentsService,
  ) {}

  /** Recomendaciones recibidas por el cliente, más recientes primero. */
  async listForClient(clientId: string): Promise<Recomendacion[]> {
    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .select(RECOMENDACION_SELECT)
      .eq("cliente_id", clientId)
      .order("creado_en", { ascending: false });

    if (error) {
      this.logger.error(`recomendaciones list: ${error.message}`);
      throw internalError("No se pudieron obtener las recomendaciones.");
    }
    return ((data ?? []) as unknown as RecomendacionRow[]).map(toRecomendacion);
  }

  /** Marca como leída una recomendación propia (idempotente: conserva el primer `leida_en`). */
  async markAsRead(clientId: string, id: string): Promise<Recomendacion> {
    const current = await this.findForClient(clientId, id);
    if (current.leida) {
      return current;
    }

    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .update({ leida: true, leida_en: new Date().toISOString() })
      .eq("id", id)
      .eq("cliente_id", clientId)
      .select(RECOMENDACION_SELECT)
      .single();

    if (error || !data) {
      this.logger.error(`recomendaciones read: ${error?.message}`);
      throw internalError("No se pudo marcar la recomendacion como leida.");
    }
    return toRecomendacion(data as unknown as RecomendacionRow);
  }

  /** Recomendaciones enviadas por el asesor, opcionalmente de un solo cliente. */
  async listSent(
    advisorId: string,
    query: QuerySentRecommendationsDto,
  ): Promise<Recomendacion[]> {
    let request = this.supabase
      .from("recomendaciones_financieras")
      .select(RECOMENDACION_SELECT)
      .eq("asesor_id", advisorId)
      .order("creado_en", { ascending: false });

    if (query.cliente_id) request = request.eq("cliente_id", query.cliente_id);
    if (query.limite) request = request.limit(query.limite);

    const { data, error } = await request;
    if (error) {
      this.logger.error(`recomendaciones sent: ${error.message}`);
      throw internalError(
        "No se pudieron obtener las recomendaciones enviadas.",
      );
    }
    return ((data ?? []) as unknown as RecomendacionRow[]).map(toRecomendacion);
  }

  /** Crea una recomendación de origen `asesor`; 403 si el cliente no está asignado. */
  async create(
    advisorId: string,
    dto: CreateRecommendationDto,
  ): Promise<Recomendacion> {
    await this.assignments.assertAssigned(advisorId, dto.cliente_id);

    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .insert({
        cliente_id: dto.cliente_id,
        asesor_id: advisorId,
        origen: "asesor",
        tipo: dto.tipo,
        prioridad: dto.prioridad,
        titulo: dto.titulo,
        mensaje: dto.mensaje,
      })
      .select(RECOMENDACION_SELECT)
      .single();

    if (error || !data) {
      this.logger.error(`recomendaciones insert: ${error?.message}`);
      throw internalError("No se pudo crear la recomendacion.");
    }
    return toRecomendacion(data as unknown as RecomendacionRow);
  }

  private async findForClient(
    clientId: string,
    id: string,
  ): Promise<Recomendacion> {
    if (!isUUID(id)) {
      throw notFoundError("Recomendacion no encontrada.");
    }
    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .select(RECOMENDACION_SELECT)
      .eq("id", id)
      .eq("cliente_id", clientId)
      .maybeSingle();

    if (error) {
      this.logger.error(`recomendaciones get: ${error.message}`);
      throw internalError("No se pudo obtener la recomendacion.");
    }
    if (!data) {
      throw notFoundError("Recomendacion no encontrada.");
    }
    return toRecomendacion(data as unknown as RecomendacionRow);
  }
}
