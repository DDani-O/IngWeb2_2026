/** Servicio del análisis: lee los gastos de Supabase, aplica las reglas y guarda la clasificación de perfil. */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SupabaseClient } from "@supabase/supabase-js";
import { AssignmentsService } from "../../common/assignments/assignments.service";
import { internalError, validationError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { PerfilVigente } from "../users/usuario.types";
import { DEFAULT_TIMEZONE, todayIn } from "./calendar";
import {
  computeAdvisorSummary,
  computeClientAnalysis,
  systemProfileReason,
} from "./analysis.rules";
import {
  Analisis,
  AsignacionDePerfil,
  CategoriaAnalizable,
  ClasificacionManual,
  GastoAnalizable,
  PerfilConRegla,
  ResumenAsesor,
} from "./analysis.types";

/** PostgREST devuelve como máximo 1000 filas por pedido: se pagina de a este tamaño. */
const PAGE_SIZE = 1000;

/** Fila vigente de `clasificacion_de_perfil` (sin `vigente_hasta`). */
interface ClasificacionVigente {
  id: string;
  cliente_id: string;
  perfil_id: string;
  asesor_id: string | null;
  motivo: string | null;
}

/**
 * Análisis de consumo calculado en el momento a partir de `gastos` (reglas en §4, backend/README.md). Al
 * calcularlo, persiste el perfil de gasto asignado por el sistema en
 * `clasificacion_de_perfil` cuando cambió respecto del vigente, salvo que el asesor haya
 * elegido uno: esa clasificación manual se respeta hasta que el asesor la quite.
 */
@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly timeZone: string;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly assignments: AssignmentsService,
    config: ConfigService,
  ) {
    this.timeZone = config.get<string>("APP_TIMEZONE") || DEFAULT_TIMEZONE;
  }

  /** Análisis de un cliente (GET /analysis/me y GET /analysis/clients/:id). */
  async getClientAnalysis(clientId: string): Promise<Analisis> {
    const analyses = await this.analyzeClients([clientId]);
    return analyses.get(clientId)!;
  }

  /** Perfil de gasto actual del cliente (lo usa el objeto `usuario`). */
  async getSpendingProfile(clientId: string): Promise<PerfilVigente | null> {
    return (await this.getClientAnalysis(clientId)).perfil_de_gasto;
  }

  /**
   * Analiza varios clientes con una sola lectura de gastos, catálogos y clasificaciones
   * vigentes, y sincroniza el perfil de cada uno.
   */
  async analyzeClients(clientIds: string[]): Promise<Map<string, Analisis>> {
    const today = todayIn(this.timeZone);
    const [expenses, categories, profiles, vigentes] = await Promise.all([
      this.fetchExpenses(clientIds),
      this.fetchCategories(),
      this.fetchProfiles(),
      this.fetchCurrentClassifications(clientIds),
    ]);

    const results = new Map<string, Analisis>();
    const assignments = new Map<string, AsignacionDePerfil | null>();
    clientIds.forEach((clientId) => {
      const { analisis, asignacion } = computeClientAnalysis({
        clientId,
        expenses: expenses.get(clientId) ?? [],
        categories,
        profiles,
        today,
        manual: toManual(vigentes, clientId),
      });
      results.set(clientId, analisis);
      assignments.set(clientId, asignacion);
    });

    if (vigentes) {
      await this.syncProfiles(assignments, vigentes);
    }
    return results;
  }

  /**
   * El asesor elige el perfil del cliente (PUT /clients/:id/spending-profile). Cierra la
   * clasificación vigente, sea automática o manual, y deja la nueva con `asesor_id`.
   * La asignación asesor ↔ cliente la controla quien llama.
   */
  async assignManualProfile(
    clientId: string,
    advisorId: string,
    profileId: string,
    motivo: string | null,
  ): Promise<PerfilVigente | null> {
    const profiles = await this.fetchProfiles();
    if (!profiles.some((profile) => profile.id === profileId)) {
      throw validationError("El perfil de gasto no existe.", ["perfil_id"]);
    }

    await this.closeClassifications(clientId, { onlyManual: false });
    const { error } = await this.supabase
      .from("clasificacion_de_perfil")
      .insert({
        cliente_id: clientId,
        perfil_id: profileId,
        asesor_id: advisorId,
        puntaje: null,
        motivo,
        vigente_desde: new Date().toISOString(),
      });
    if (error) {
      this.logger.error(`clasificacion_de_perfil manual: ${error.message}`);
      throw internalError("No se pudo asignar el perfil de gasto.");
    }
    return this.getSpendingProfile(clientId);
  }

  /**
   * Vuelve a la regla automática (DELETE /clients/:id/spending-profile): cierra la
   * clasificación manual y recalcula, lo que deja vigente la sugerencia del sistema.
   * Sin clasificación manual no cambia nada.
   */
  async resetToAutomaticProfile(
    clientId: string,
  ): Promise<PerfilVigente | null> {
    await this.closeClassifications(clientId, { onlyManual: true });
    return this.getSpendingProfile(clientId);
  }

  /** Resumen de la cartera del asesor (GET /analysis/advisor/summary). */
  async getAdvisorSummary(advisorId: string): Promise<ResumenAsesor> {
    const clientIds = await this.assignments.listClientIds(advisorId);
    const [analyses, sent] = await Promise.all([
      clientIds.length
        ? this.analyzeClients(clientIds)
        : Promise.resolve(new Map<string, Analisis>()),
      this.fetchSentRecommendations(advisorId),
    ]);

    return computeAdvisorSummary({
      advisorId,
      analyses: [...analyses.values()],
      sent,
      today: todayIn(this.timeZone),
    });
  }

  /**
   * Clasificaciones vigentes de los clientes. `null` si no se pudieron leer: el análisis
   * se responde igual (con la sugerencia del sistema) y no se sincroniza nada.
   */
  private async fetchCurrentClassifications(
    clientIds: string[],
  ): Promise<ClasificacionVigente[] | null> {
    const { data, error } = await this.supabase
      .from("clasificacion_de_perfil")
      .select("id, cliente_id, perfil_id, asesor_id, motivo")
      .in("cliente_id", clientIds)
      .is("vigente_hasta", null);
    if (error) {
      this.logger.warn(`clasificacion_de_perfil select: ${error.message}`);
      return null;
    }
    return (data ?? []) as ClasificacionVigente[];
  }

  /** Cierra (`vigente_hasta = ahora`) las vigentes del cliente: todas o solo las manuales. */
  private async closeClassifications(
    clientId: string,
    { onlyManual }: { onlyManual: boolean },
  ) {
    let query = this.supabase
      .from("clasificacion_de_perfil")
      .update({ vigente_hasta: new Date().toISOString() })
      .eq("cliente_id", clientId)
      .is("vigente_hasta", null);
    if (onlyManual) {
      query = query.not("asesor_id", "is", null);
    }
    const { error } = await query;
    if (error) {
      this.logger.error(`clasificacion_de_perfil cierre: ${error.message}`);
      throw internalError("No se pudo actualizar el perfil de gasto.");
    }
  }

  /**
   * Deja en `clasificacion_de_perfil` una sola clasificación vigente por cliente, igual
   * al perfil calculado. Solo escribe cuando hay diferencias; sin perfil calculado,
   * cierra la vigente. Los clientes con una clasificación manual vigente no se tocan.
   * Un fallo acá no impide responder el análisis.
   */
  private async syncProfiles(
    assignments: Map<string, AsignacionDePerfil | null>,
    vigentes: ClasificacionVigente[],
  ) {
    const now = new Date().toISOString();
    const toClose: string[] = [];
    const toInsert: Array<Record<string, unknown>> = [];

    assignments.forEach((asignacion, clientId) => {
      const current = vigentes.filter((row) => row.cliente_id === clientId);
      if (current.some((row) => row.asesor_id)) {
        return;
      }
      const unchanged = asignacion
        ? current.length === 1 && current[0].perfil_id === asignacion.perfil.id
        : !current.length;
      if (unchanged) {
        return;
      }

      toClose.push(...current.map((row) => row.id));
      if (asignacion) {
        toInsert.push({
          cliente_id: clientId,
          perfil_id: asignacion.perfil.id,
          asesor_id: null,
          puntaje: Math.round(asignacion.participacion * 100),
          motivo: systemProfileReason(asignacion),
          vigente_desde: now,
        });
      }
    });

    if (toClose.length) {
      const { error: closeError } = await this.supabase
        .from("clasificacion_de_perfil")
        .update({ vigente_hasta: now })
        .in("id", toClose);
      if (closeError) {
        this.logger.warn(
          `clasificacion_de_perfil cierre: ${closeError.message}`,
        );
        return;
      }
    }
    if (toInsert.length) {
      const { error: insertError } = await this.supabase
        .from("clasificacion_de_perfil")
        .insert(toInsert);
      if (insertError) {
        this.logger.warn(
          `clasificacion_de_perfil alta: ${insertError.message}`,
        );
      }
    }
  }

  /** Todos los gastos de los clientes, agrupados por cliente y en orden de carga. */
  private async fetchExpenses(
    clientIds: string[],
  ): Promise<Map<string, GastoAnalizable[]>> {
    const grouped = new Map<string, GastoAnalizable[]>(
      clientIds.map((clientId) => [clientId, []]),
    );
    if (!clientIds.length) {
      return grouped;
    }

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await this.supabase
        .from("gastos")
        .select("id, cliente_id, categoria_id, comercio, fecha_gasto, monto")
        .in("cliente_id", clientIds)
        .order("creado_en", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        this.logger.error(`gastos analisis: ${error.message}`);
        throw internalError("No se pudo calcular el analisis de consumo.");
      }

      (data ?? []).forEach((row) =>
        grouped.get(row.cliente_id)?.push({
          id: row.id,
          categoria_id: row.categoria_id,
          comercio: row.comercio,
          fecha_gasto: row.fecha_gasto,
          monto: Number(row.monto),
        }),
      );
      if (!data || data.length < PAGE_SIZE) {
        return grouped;
      }
    }
  }

  private async fetchCategories(): Promise<CategoriaAnalizable[]> {
    const { data, error } = await this.supabase
      .from("categorias_de_gasto")
      .select("id, nombre");
    if (error) {
      this.logger.error(`categorias_de_gasto: ${error.message}`);
      throw internalError("No se pudo calcular el analisis de consumo.");
    }
    return data ?? [];
  }

  /** Perfiles activos con una regla válida (`criterio_regla.discrecional_max` numérico). */
  private async fetchProfiles(): Promise<PerfilConRegla[]> {
    const { data, error } = await this.supabase
      .from("perfiles_de_gasto")
      .select("id, nombre, descripcion, criterio_regla")
      .eq("activo", true);

    if (error) {
      this.logger.error(`perfiles_de_gasto: ${error.message}`);
      throw internalError("No se pudo calcular el analisis de consumo.");
    }

    return (data ?? []).flatMap((row) => {
      const max = Number(
        (row.criterio_regla as { discrecional_max?: unknown } | null)
          ?.discrecional_max,
      );
      if (!Number.isFinite(max)) {
        this.logger.warn(
          `perfiles_de_gasto ${row.nombre}: criterio_regla sin discrecional_max`,
        );
        return [];
      }
      return [
        {
          id: row.id,
          nombre: row.nombre,
          descripcion: row.descripcion ?? "",
          discrecional_max: max,
        },
      ];
    });
  }

  private async fetchSentRecommendations(
    advisorId: string,
  ): Promise<Array<{ leida: boolean }>> {
    const { data, error } = await this.supabase
      .from("recomendaciones_financieras")
      .select("leida")
      .eq("asesor_id", advisorId);

    if (error) {
      this.logger.error(`recomendaciones_financieras: ${error.message}`);
      throw internalError("No se pudo calcular el resumen del asesor.");
    }
    return (data ?? []).map((row) => ({ leida: Boolean(row.leida) }));
  }
}

/** Clasificación manual vigente del cliente, si la hay. */
function toManual(
  vigentes: ClasificacionVigente[] | null,
  clientId: string,
): ClasificacionManual | null {
  const row = vigentes?.find(
    (item) => item.cliente_id === clientId && item.asesor_id,
  );
  return row ? { perfil_id: row.perfil_id, motivo: row.motivo } : null;
}
