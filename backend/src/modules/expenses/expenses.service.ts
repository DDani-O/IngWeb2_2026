import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { isUUID } from "class-validator";
import {
  internalError,
  notFoundError,
  validationError,
} from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { QueryExpensesDto } from "./dto/query-expenses.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { Gasto, GASTO_SELECT, GastoRow, toGasto } from "./gasto.mapper";

/** Respuesta de los listados de gastos (spec §10.3). */
export interface ListaDeGastos {
  datos: Gasto[];
  total: number;
}

/** Caracteres que rompen el filtro `or()` de PostgREST o actúan como comodín. */
const SEARCH_UNSAFE = /[%_*(),\\]/g;

/**
 * Gastos del cliente: listado con filtros, alta (manual o desde ticket), edición y baja.
 * Todas las operaciones se acotan al `cliente_id` recibido: un gasto ajeno responde 404.
 */
@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Gastos de un cliente con los filtros y el orden de la spec §10.3. Lo usan
   * `GET /expenses` (cliente) y `GET /clients/:id/expenses` (asesor).
   */
  async list(
    clientId: string,
    query: QueryExpensesDto,
  ): Promise<ListaDeGastos> {
    let request = this.supabase
      .from("gastos")
      .select(GASTO_SELECT, { count: "exact" })
      .eq("cliente_id", clientId);

    const search = query.busqueda?.replace(SEARCH_UNSAFE, "").trim();
    if (search) {
      request = request.or(
        `comercio.ilike.%${search}%,descripcion.ilike.%${search}%`,
      );
    }
    if (query.categoria_id)
      request = request.eq("categoria_id", query.categoria_id);
    if (query.origen) request = request.eq("origen", query.origen);
    if (query.desde) request = request.gte("fecha_gasto", query.desde);
    if (query.hasta) request = request.lte("fecha_gasto", query.hasta);

    if (query.orden === "monto_desc" || query.orden === "monto_asc") {
      request = request
        .order("monto", { ascending: query.orden === "monto_asc" })
        .order("fecha_gasto", { ascending: false });
    } else {
      request = request
        .order("fecha_gasto", { ascending: false })
        .order("creado_en", { ascending: false });
    }
    if (query.limite) {
      request = request.limit(query.limite);
    }

    const { data, count, error } = await request;
    if (error) {
      this.logger.error(`gastos list: ${error.message}`);
      throw internalError("No se pudieron obtener los gastos.");
    }

    const datos = ((data ?? []) as unknown as GastoRow[]).map(toGasto);
    return { datos, total: count ?? datos.length };
  }

  /** Un gasto del cliente; 404 si no existe o es de otro (no se distingue a propósito). */
  async get(clientId: string, id: string): Promise<Gasto> {
    return toGasto(await this.findOwnRow(clientId, id));
  }

  /**
   * Alta de un gasto. Con `ticket_id` valida que el ticket sea del cliente, marca el gasto
   * como de origen `ticket` con el OCR procesado y vincula el `analisis_ocr` (spec §10.4).
   */
  async create(clientId: string, dto: CreateExpenseDto): Promise<Gasto> {
    await this.assertCategoryExists(dto.categoria_id);
    const analysis = dto.ticket_id
      ? await this.findTicketAnalysis(clientId, dto.ticket_id)
      : null;

    const { data, error } = await this.supabase
      .from("gastos")
      .insert({
        cliente_id: clientId,
        categoria_id: dto.categoria_id,
        comercio: dto.comercio,
        fecha_gasto: dto.fecha_gasto,
        monto: dto.monto,
        descripcion: dto.descripcion || null,
        origen: dto.ticket_id ? "ticket" : (dto.origen ?? "manual"),
        moneda: "ARS",
        ...(dto.ticket_id
          ? {
              ticket_principal_id: dto.ticket_id,
              // Sin análisis guardado la IA no pudo leer el ticket (spec §10.4).
              ocr_estado: analysis ? "procesado" : "fallido",
              ocr_confianza: analysis?.confianza_general ?? null,
            }
          : {}),
      })
      .select(GASTO_SELECT)
      .single();

    if (error || !data) {
      this.logger.error(`gastos insert: ${error?.message}`);
      throw internalError("No se pudo crear el gasto.");
    }

    if (analysis && !analysis.gasto_id) {
      const { error: linkError } = await this.supabase
        .from("analisis_ocr")
        .update({ gasto_id: data.id })
        .eq("id", analysis.id);
      if (linkError) {
        this.logger.warn(`analisis_ocr vinculo: ${linkError.message}`);
      }
    }

    return toGasto(data as unknown as GastoRow);
  }

  /** Edición parcial. `origen` y `ticket_id` no se modifican (ver UpdateExpenseDto). */
  async update(
    clientId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Gasto> {
    await this.findOwnRow(clientId, id);
    if (dto.categoria_id !== undefined) {
      await this.assertCategoryExists(dto.categoria_id);
    }

    const changes = Object.fromEntries(
      Object.entries({
        comercio: dto.comercio,
        fecha_gasto: dto.fecha_gasto,
        monto: dto.monto,
        categoria_id: dto.categoria_id,
        descripcion:
          dto.descripcion === undefined ? undefined : dto.descripcion || null,
      }).filter(([, value]) => value !== undefined),
    );
    if (!Object.keys(changes).length) {
      return this.get(clientId, id);
    }

    const { data, error } = await this.supabase
      .from("gastos")
      .update({ ...changes, actualizado_en: new Date().toISOString() })
      .eq("id", id)
      .eq("cliente_id", clientId)
      .select(GASTO_SELECT)
      .single();

    if (error || !data) {
      this.logger.error(`gastos update: ${error?.message}`);
      throw internalError("No se pudo actualizar el gasto.");
    }
    return toGasto(data as unknown as GastoRow);
  }

  /** Baja de un gasto propio (404 si no lo es). */
  async remove(clientId: string, id: string): Promise<void> {
    await this.findOwnRow(clientId, id);
    const { error } = await this.supabase
      .from("gastos")
      .delete()
      .eq("id", id)
      .eq("cliente_id", clientId);
    if (error) {
      this.logger.error(`gastos delete: ${error.message}`);
      throw internalError("No se pudo eliminar el gasto.");
    }
  }

  private async findOwnRow(clientId: string, id: string): Promise<GastoRow> {
    if (!isUUID(id)) {
      throw notFoundError("Gasto no encontrado.");
    }
    const { data, error } = await this.supabase
      .from("gastos")
      .select(GASTO_SELECT)
      .eq("id", id)
      .eq("cliente_id", clientId)
      .maybeSingle();

    if (error) {
      this.logger.error(`gastos get: ${error.message}`);
      throw internalError("No se pudo obtener el gasto.");
    }
    if (!data) {
      throw notFoundError("Gasto no encontrado.");
    }
    return data as unknown as GastoRow;
  }

  private async assertCategoryExists(categoryId: string) {
    const { data, error } = await this.supabase
      .from("categorias_de_gasto")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();
    if (error) {
      this.logger.error(`categorias_de_gasto: ${error.message}`);
      throw internalError("No se pudo validar la categoria.");
    }
    if (!data) {
      throw validationError("La categoria no existe.", ["categoria_id"]);
    }
  }

  /** El ticket tiene que ser del cliente; devuelve su análisis más reciente, si lo hay. */
  private async findTicketAnalysis(clientId: string, ticketId: string) {
    const { data: ticket, error } = await this.supabase
      .from("tickets")
      .select("id")
      .eq("id", ticketId)
      .eq("cliente_id", clientId)
      .maybeSingle();

    if (error) {
      this.logger.error(`tickets get: ${error.message}`);
      throw internalError("No se pudo validar el ticket.");
    }
    if (!ticket) {
      throw validationError("El ticket no existe.", ["ticket_id"]);
    }

    const { data: analysis } = await this.supabase
      .from("analisis_ocr")
      .select("id, confianza_general, gasto_id")
      .eq("ticket_id", ticketId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    return analysis as {
      id: string;
      confianza_general: number | null;
      gasto_id: string | null;
    } | null;
  }
}
