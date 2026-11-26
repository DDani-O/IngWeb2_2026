import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { isUUID } from "class-validator";
import { forbiddenError, internalError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";

/**
 * Cartera del asesor. En la fase I3 suma el listado y el detalle de clientes;
 * por ahora expone el control de asignación que usan los demás módulos.
 */
@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /** 403 si el cliente no tiene una asignación activa con el asesor (spec §10, errores). */
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
}
