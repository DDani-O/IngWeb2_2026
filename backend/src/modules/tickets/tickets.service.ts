import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { internalError, validationError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { OcrService, ParsedTicket } from "./ocr.service";

/** Tipos de imagen aceptados y tamaño máximo (spec §10.4). */
export const TICKET_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const TICKET_MAX_BYTES = 5 * 1024 * 1024;

const STORAGE_BUCKET = "tickets";

type EstadoTicket = "procesado" | "error";

/** Respuesta de `POST /tickets/upload` (spec §10.4). */
export interface ResultadoTicket {
  ticket: {
    id: string;
    nombre_archivo: string;
    estado_procesamiento: EstadoTicket;
  };
  analisis: {
    comercio_detectado: string | null;
    fecha_detectada: string | null;
    monto_detectado: number | null;
    categoria_sugerida: { id: string; nombre: string } | null;
    confianza_general: number | null;
  } | null;
}

/**
 * Carga de tickets en un solo paso: guarda la imagen en Supabase Storage, la analiza con
 * el modelo de IA y devuelve lo detectado. El gasto lo crea después `POST /expenses`
 * con `ticket_id`. Si la IA falla, el ticket queda en `error` y `analisis` es `null`.
 */
@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly ocrService: OcrService,
  ) {}

  async upload(
    file: Express.Multer.File | undefined,
    clientId: string,
  ): Promise<ResultadoTicket> {
    if (!file) {
      throw validationError("Falta la imagen del ticket.", ["archivo"]);
    }
    if (!TICKET_MIME_TYPES.includes(file.mimetype)) {
      throw validationError(
        "El archivo debe ser una imagen JPEG, PNG o WebP.",
        ["archivo"],
      );
    }
    if (file.size > TICKET_MAX_BYTES) {
      throw validationError("El archivo supera el tamano maximo de 5 MB.", [
        "archivo",
      ]);
    }

    const ticketId = await this.storeTicket(file, clientId);
    const parsed = await this.analyze(file);

    if (!parsed) {
      await this.setTicketState(ticketId, "error");
      return {
        ticket: {
          id: ticketId,
          nombre_archivo: file.originalname,
          estado_procesamiento: "error",
        },
        analisis: null,
      };
    }

    const categoria = await this.findCategoryByName(parsed.categoria_sugerida);
    const { error: analysisError } = await this.supabase
      .from("analisis_ocr")
      .insert({
        ticket_id: ticketId,
        texto_extraido: parsed.texto_extraido,
        comercio_detectado: parsed.comercio_detectado,
        fecha_detectada: parsed.fecha_detectada,
        monto_detectado: parsed.monto_detectado,
        categoria_sugerida_id: categoria?.id ?? null,
        confianza_general: parsed.confianza_general,
        respuesta_modelo: parsed.respuesta_modelo,
      });
    if (analysisError) {
      // Sin análisis persistido el gasto igual se puede crear: se informa lo detectado.
      this.logger.warn(`analisis_ocr insert: ${analysisError.message}`);
    }

    await this.setTicketState(ticketId, "procesado");
    return {
      ticket: {
        id: ticketId,
        nombre_archivo: file.originalname,
        estado_procesamiento: "procesado",
      },
      analisis: {
        comercio_detectado: parsed.comercio_detectado,
        fecha_detectada: parsed.fecha_detectada,
        monto_detectado: parsed.monto_detectado,
        categoria_sugerida: categoria,
        confianza_general: parsed.confianza_general,
      },
    };
  }

  /** Sube la imagen al bucket y crea la fila de `tickets` en estado `procesando`. */
  private async storeTicket(
    file: Express.Multer.File,
    clientId: string,
  ): Promise<string> {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const storagePath = `${clientId}/${Date.now()}_${safeName}`;

    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (storageError) {
      this.logger.error(
        `storage upload: ${storageError.message} (¿existe el bucket "${STORAGE_BUCKET}"?)`,
      );
      throw internalError("No se pudo guardar la imagen del ticket.");
    }

    const { data: urlData } = this.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    const { data: ticket, error: ticketError } = await this.supabase
      .from("tickets")
      .insert({
        cliente_id: clientId,
        url_archivo: urlData.publicUrl,
        nombre_archivo: file.originalname,
        tipo_mime: file.mimetype,
        tamano_bytes: file.size,
        estado_procesamiento: "procesando",
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      this.logger.error(`tickets insert: ${ticketError?.message}`);
      await this.supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw internalError("No se pudo registrar el ticket.");
    }
    return ticket.id;
  }

  /** Análisis con IA; `null` si el servicio no está configurado o falla. */
  private async analyze(
    file: Express.Multer.File,
  ): Promise<ParsedTicket | null> {
    if (!this.ocrService.isAvailable()) {
      this.logger.warn("OCR no disponible: falta GROQ_API_KEY.");
      return null;
    }
    try {
      return await this.ocrService.analyzeTicket(file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`OCR: ${(error as Error).message}`);
      return null;
    }
  }

  private async setTicketState(ticketId: string, estado: EstadoTicket) {
    const { error } = await this.supabase
      .from("tickets")
      .update({ estado_procesamiento: estado })
      .eq("id", ticketId);
    if (error) {
      this.logger.warn(`tickets estado: ${error.message}`);
    }
  }

  private async findCategoryByName(
    name: string | null,
  ): Promise<{ id: string; nombre: string } | null> {
    if (!name) {
      return null;
    }
    const { data } = await this.supabase
      .from("categorias_de_gasto")
      .select("id, nombre")
      .ilike("nombre", name)
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }
}
