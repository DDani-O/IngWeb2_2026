/** Servicio de OCR: manda la imagen del ticket al modelo con visión de Groq y normaliza su respuesta. */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

/** Resultado del modelo, con los nombres de las columnas de `analisis_ocr`. */
export interface ParsedTicket {
  comercio_detectado: string | null;
  fecha_detectada: string | null;
  monto_detectado: number | null;
  /** Nombre de la categoría sugerida; el servicio de tickets lo resuelve a `categoria_sugerida_id`. */
  categoria_sugerida: string | null;
  confianza_general: number;
  texto_extraido: string | null;
  respuesta_modelo: Record<string, unknown>;
}

const ALLOWED_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Hogar",
  "Ropa",
  "Servicios",
  "Suscripciones",
  "Otros",
];

const TICKET_PROMPT = `Eres un sistema experto en análisis de tickets y facturas de compra argentinos.
Analiza la imagen del ticket proporcionada y extrae la información en formato JSON exacto:
{
  "comercio": "nombre visible del comercio (no la razón social ni CUIT)",
  "fecha": "YYYY-MM-DD o null si no se detecta",
  "monto_total": número decimal o null (SOLO el total final pagado, sin símbolo de moneda),
  "categoria": "una de: Alimentación, Transporte, Entretenimiento, Salud, Educación, Hogar, Ropa, Servicios, Suscripciones, Otros",
  "confianza": número entero entre 0 y 100,
  "texto_extraido": "todo el texto visible en el ticket"
}

Reglas importantes:
- monto_total: el TOTAL FINAL pagado, NO el subtotal ni los impuestos por separado. Si el ticket muestra "Total: $1.500,00" → 1500.00
- Formato decimal argentino: 1.500,50 significa mil quinientos con 50 centavos → 1500.50
- Ignora: CUIT/CUIT, número de caja, código de barras, número de ticket
- Para el comercio: usa el nombre comercial visible (ej: "Carrefour Express", "McDonald's", "YPF")
- Si el ticket no es legible o está muy borroso, confianza < 30
- Responde ÚNICAMENTE el JSON puro, sin markdown, sin explicaciones`;

/**
 * Modelo de Groq con visión que se usa si no se configura `GROQ_MODEL`.
 * Groq retira modelos sin aviso en el código (el 17/07/2026 dio de baja
 * `meta-llama/llama-4-scout-17b-16e-instruct`): por eso es configurable.
 * Los modelos con imagen de la cuenta se listan con GET /openai/v1/models.
 */
export const DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b";

/**
 * Límites del pedido a Groq. Un ticket tarda 3–5 s; con 12 s por intento y un solo
 * reintento, el peor caso (~25 s) entra en los 30 s que espera el front
 * (`API_CONFIG.UPLOAD_TIMEOUT_MS`). Si se excede, el ticket queda en `error`.
 */
export const OCR_TIMEOUT_MS = 12_000;
export const OCR_MAX_RETRIES = 1;
/** Alcanza para el JSON con `texto_extraido` de un ticket largo. */
const OCR_MAX_TOKENS = 2048;

/**
 * Convierte el monto que devuelve el modelo en un número con hasta 2 decimales.
 * - Si ya es number, se usa tal cual.
 * - Si es texto, el último `.` o `,` seguido de 1 o 2 dígitos al final es el separador
 *   decimal y los demás separadores son de miles: "1.500,50" y "1,500.50" → 1500.5;
 *   "35.537" → 35537 (tres dígitos: es separador de miles).
 * Devuelve null si no es un monto positivo.
 */
export function parseMonto(value: unknown): number | null {
  let amount: number;
  if (typeof value === "number") {
    amount = value;
  } else if (typeof value === "string") {
    const clean = value.replace(/\s/g, "").replace(/\$|ARS/gi, "");
    if (!/^-?[\d.,]+$/.test(clean)) return null;
    const decimal = clean.match(/^(.*)[.,](\d{1,2})$/);
    const normalized = decimal
      ? `${decimal[1].replace(/[.,]/g, "") || "0"}.${decimal[2]}`
      : clean.replace(/[.,]/g, "");
    amount = Number(normalized);
  } else {
    return null;
  }
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

/**
 * Lectura de tickets con un modelo de visión de Groq (API compatible con OpenAI). Sin
 * `GROQ_API_KEY` la app arranca igual y los tickets se cargan a mano.
 */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.model =
      this.configService.get<string>("GROQ_MODEL") || DEFAULT_GROQ_MODEL;
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
        timeout: OCR_TIMEOUT_MS,
        maxRetries: OCR_MAX_RETRIES,
      });
      this.logger.log(`Groq Vision inicializado (${this.model})`);
    } else {
      this.logger.warn(
        "GROQ_API_KEY no configurada. El OCR no estará disponible.",
      );
    }
  }

  /** `false` si no se configuró `GROQ_API_KEY`. */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Analiza la imagen con el modelo. Lanza un error si el servicio no responde a tiempo,
   * si la respuesta quedó cortada o si no es un JSON válido: en todos esos casos el
   * ticket "no se pudo leer" y el servicio de tickets responde `analisis: null`.
   */
  async analyzeTicket(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<ParsedTicket> {
    if (!this.client) {
      throw new Error(
        "OCR no disponible: configurá GROQ_API_KEY en el archivo .env",
      );
    }

    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    this.logger.debug(
      `Enviando a Groq: ${mimeType}, ${fileBuffer.length} bytes`,
    );

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: TICKET_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: OCR_MAX_TOKENS,
      temperature: 0.1,
    });

    const choice = response.choices[0];
    if (choice?.finish_reason === "length") {
      throw new Error("la respuesta del modelo quedó cortada (max_tokens)");
    }
    const rawText = choice?.message?.content?.trim() ?? "";
    this.logger.debug(`Respuesta Groq: ${rawText.slice(0, 300)}`);

    return parseTicketResponse(rawText);
  }
}

/**
 * Convierte el texto del modelo en un `ParsedTicket`. Lanza un error si no es un objeto
 * JSON (respuesta cortada, texto libre, etc.) o si no trae comercio, fecha ni monto:
 * un ticket vacío no se informa como leído.
 */
export function parseTicketResponse(rawText: string): ParsedTicket {
  const clean = rawText.replace(/```json\s*|\s*```/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`JSON no parseable: ${clean.slice(0, 200)}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("la respuesta del modelo no es un objeto JSON");
  }
  const ticket = toParsedTicket(parsed as Record<string, unknown>);
  if (
    !ticket.comercio_detectado &&
    !ticket.fecha_detectada &&
    ticket.monto_detectado === null
  ) {
    throw new Error("el modelo no detectó comercio, fecha ni monto");
  }
  return ticket;
}

function toParsedTicket(parsed: Record<string, unknown>): ParsedTicket {
  return {
    comercio_detectado: extractString(parsed.comercio),
    fecha_detectada: extractDate(parsed.fecha),
    monto_detectado: parseMonto(parsed.monto_total),
    categoria_sugerida: extractCategory(parsed.categoria),
    confianza_general: extractConfianza(parsed.confianza),
    texto_extraido: extractString(parsed.texto_extraido),
    respuesta_modelo: parsed,
  };
}

function extractString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

/** Fecha `AAAA-MM-DD` que exista en el calendario (descarta, por ejemplo, 2026-02-30). */
function extractDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return null;
  const date = new Date(`${match[0]}T00:00:00Z`);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(match[0])
    ? match[0]
    : null;
}

function extractCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const found = ALLOWED_CATEGORIES.find(
    (cat) => cat.toLowerCase() === value.toLowerCase(),
  );
  return found ?? "Otros";
}

function extractConfianza(value: unknown): number {
  if (typeof value !== "number") return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}
