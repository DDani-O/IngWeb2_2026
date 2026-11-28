import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { isUUID } from "class-validator";
import { forbiddenError, internalError } from "../errors";
import { SUPABASE_CLIENT } from "../supabase/supabase.provider";

/**
 * Relación asesor ↔ cliente (`asignaciones_de_clientes` activas). La comparten los
 * módulos que exponen datos de un cliente al asesor.
 */
@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * 403 si el cliente no tiene una asignación activa con el asesor (spec §10, errores).
   * Un id que no es UUID da 403 sin consultar la base: PostgreSQL rechazaría el filtro
   * por la columna uuid con un error que terminaría en 500.
   */
  async assertAssigned(advisorId: string, clientId: string): Promise<void> {
    if (!isUUID(clientId)) {
      throw forbiddenError("El cliente no esta asignado a este asesor.");
    }
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("id")
      .eq("asesor_id", advisorId)
      .eq("cliente_id", clientId)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error(`asignaciones_de_clientes: ${error.message}`);
      throw internalError("No se pudo verificar la asignacion del cliente.");
    }
    if (!data) {
      throw forbiddenError("El cliente no esta asignado a este asesor.");
    }
  }

  /** Ids de los clientes con asignación activa al asesor. */
  async listClientIds(advisorId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("asignaciones_de_clientes")
      .select("cliente_id")
      .eq("asesor_id", advisorId)
      .eq("activo", true);

    if (error) {
      this.logger.error(`asignaciones_de_clientes: ${error.message}`);
      throw internalError("No se pudieron obtener los clientes asignados.");
    }
    return [...new Set((data ?? []).map((row) => row.cliente_id as string))];
  }
}
