import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { OcrService } from "./ocr.service";
import { ConfirmTicketDto } from "./dto/confirm-ticket.dto";

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];
const MAX_BYTES = 8 * 1024 * 1024;
const STORAGE_BUCKET = "tickets";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly ocrService: OcrService,
  ) {}

  async uploadAndProcess(file: Express.Multer.File, userId: string) {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Admitidos: JPG, PNG, WEBP, HEIC, PDF`,
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException("El archivo supera el límite de 8 MB");
    }
    if (!this.ocrService.isAvailable()) {
      throw new BadRequestException(
        "OCR no disponible: GEMINI_API_KEY no configurada en el servidor",
      );
    }

    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const storagePath = `${userId}/${Date.now()}_${safeName}`;

    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) {
      this.logger.error(`Storage error: ${storageError.message}`);
      throw new BadRequestException(
        "Error al guardar el archivo. Verificá que el bucket 'tickets' exista en Supabase Storage.",
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    const { data: ticket, error: ticketError } = await this.supabase
      .from("tickets")
      .insert({
        cliente_id: userId,
        url_archivo: publicUrl,
        nombre_archivo: file.originalname,
        tipo_mime: file.mimetype,
        tamano_bytes: file.size,
        estado_procesamiento: "procesando",
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      await this.supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
        .catch(() => null);
      throw new BadRequestException("Error al registrar el ticket en la base de datos");
    }

    const ticketId: string = ticket.id;

    try {
      const parsed = await this.ocrService.analyzeTicket(
        file.buffer,
        file.mimetype,
      );

      const categoriaId = await this.resolveCategoryId(
        parsed.categoriaSugerida,
      );

      const { data: analysis, error: analysisError } = await this.supabase
        .from("analisis_ocr")
        .insert({
          ticket_id: ticketId,
          texto_extraido: parsed.textoExtraido,
          comercio_detectado: parsed.comercio,
          fecha_detectada: parsed.fecha,
          monto_detectado: parsed.montoDetectado,
          categoria_sugerida_id: categoriaId,
          confianza_general: parsed.confianciaGeneral,
          respuesta_modelo: parsed.respuestaModelo,
        })
        .select(
          `
          id,
          texto_extraido,
          comercio_detectado,
          fecha_detectada,
          monto_detectado,
          confianza_general,
          categorias_de_gasto (
            id,
            nombre
          )
        `,
        )
        .single();

      if (analysisError) {
        this.logger.warn(`Error guardando analisis_ocr: ${analysisError.message}`);
      }

      await this.supabase
        .from("tickets")
        .update({ estado_procesamiento: "procesado" })
        .eq("id", ticketId);

      const cat = (analysis?.categorias_de_gasto ?? null) as unknown as
        | { id: string; nombre: string }
        | null;

      return {
        ticketId,
        urlArchivo: publicUrl,
        analysis: {
          id: analysis?.id ?? null,
          textoExtraido: analysis?.texto_extraido ?? null,
          comercioDetectado: analysis?.comercio_detectado ?? null,
          fechaDetectada: analysis?.fecha_detectada ?? null,
          montoDetectado: analysis?.monto_detectado
            ? Number(analysis.monto_detectado)
            : null,
          categoriaSugeridaId: cat?.id ?? null,
          categoriaSugeridaNombre:
            cat?.nombre ?? parsed.categoriaSugerida ?? null,
          confianciaGeneral: analysis?.confianza_general
            ? Number(analysis.confianza_general)
            : parsed.confianciaGeneral,
        },
      };
    } catch (err) {
      await this.supabase
        .from("tickets")
        .update({ estado_procesamiento: "error" })
        .eq("id", ticketId);
      throw new BadRequestException(
        `Error al procesar el ticket con IA: ${(err as Error).message}`,
      );
    }
  }

  async confirmTicket(
    ticketId: string,
    userId: string,
    dto: ConfirmTicketDto,
  ) {
    const { data: ticket, error: ticketError } = await this.supabase
      .from("tickets")
      .select(
        `
        id,
        estado_procesamiento,
        analisis_ocr (
          id,
          confianza_general
        )
      `,
      )
      .eq("id", ticketId)
      .eq("cliente_id", userId)
      .single();

    if (ticketError || !ticket) {
      throw new NotFoundException("Ticket no encontrado");
    }
    if (ticket.estado_procesamiento !== "procesado") {
      throw new BadRequestException(
        `El ticket está en estado '${ticket.estado_procesamiento}', no puede confirmarse`,
      );
    }

    const { data: category } = await this.supabase
      .from("categorias_de_gasto")
      .select("id")
      .eq("id", dto.categoryId)
      .single();

    if (!category) {
      throw new BadRequestException("La categoría seleccionada no existe");
    }

    const analysisRows = ticket.analisis_ocr as
      | { id: string; confianza_general: number | null }[]
      | null;
    const analysisRow = Array.isArray(analysisRows) ? analysisRows[0] : null;

    const { data: expense, error: expenseError } = await this.supabase
      .from("gastos")
      .insert({
        cliente_id: userId,
        categoria_id: dto.categoryId,
        comercio: dto.comercio.trim(),
        fecha_gasto: dto.fecha,
        monto: dto.monto,
        descripcion: dto.descripcion ?? null,
        origen: "ticket",
        ticket_principal_id: ticketId,
        ocr_estado: "procesado",
        ocr_confianza: analysisRow?.confianza_general ?? null,
      })
      .select(
        `
        id,
        comercio,
        fecha_gasto,
        monto,
        descripcion,
        origen,
        ocr_estado,
        ocr_confianza,
        categorias_de_gasto (
          id,
          nombre
        )
      `,
      )
      .single();

    if (expenseError || !expense) {
      throw new BadRequestException(
        `Error al crear el gasto: ${expenseError?.message ?? "desconocido"}`,
      );
    }

    if (analysisRow?.id) {
      await this.supabase
        .from("analisis_ocr")
        .update({ gasto_id: expense.id })
        .eq("id", analysisRow.id);
    }

    const cat = (expense.categorias_de_gasto ?? null) as unknown as
      | { id: string; nombre: string }
      | null;

    return {
      id: expense.id,
      merchant: expense.comercio,
      date: expense.fecha_gasto,
      amount: Number(expense.monto),
      categoryId: cat?.id ?? null,
      categoryName: cat?.nombre ?? null,
      origin: expense.origen,
      ocrConfianza: expense.ocr_confianza
        ? Number(expense.ocr_confianza)
        : null,
    };
  }

  private async resolveCategoryId(
    categoryName: string | null,
  ): Promise<string | null> {
    if (!categoryName) return null;

    const { data } = await this.supabase
      .from("categorias_de_gasto")
      .select("id")
      .ilike("nombre", categoryName)
      .limit(1)
      .maybeSingle();

    return data?.id ?? null;
  }
}
