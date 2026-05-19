import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

export interface ParsedTicket {
  comercio: string | null;
  fecha: string | null;
  montoDetectado: number | null;
  categoriaSugerida: string | null;
  confianciaGeneral: number;
  textoExtraido: string | null;
  respuestaModelo: Record<string, unknown>;
}

const ALLOWED_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Hogar",
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
  "categoria": "una de: Alimentación, Transporte, Entretenimiento, Salud, Educación, Hogar, Servicios, Suscripciones, Otros",
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

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GROQ_API_KEY");
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      this.logger.log(`Groq Vision inicializado (${GROQ_MODEL})`);
    } else {
      this.logger.warn(
        "GROQ_API_KEY no configurada. El OCR no estará disponible.",
      );
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

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
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: TICKET_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const rawText = response.choices[0]?.message?.content?.trim() ?? "";
    this.logger.debug(`Respuesta Groq: ${rawText.slice(0, 300)}`);

    return this.parseResponse(rawText);
  }

  private parseResponse(rawText: string): ParsedTicket {
    const clean = rawText.replace(/```json\s*|\s*```/g, "").trim();

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(clean);
    } catch {
      this.logger.warn(
        `Gemini devolvió JSON no parseable: ${clean.slice(0, 200)}`,
      );
    }

    return {
      comercio: this.extractString(parsed.comercio),
      fecha: this.extractDate(parsed.fecha),
      montoDetectado: this.extractMonto(parsed.monto_total),
      categoriaSugerida: this.extractCategory(parsed.categoria),
      confianciaGeneral: this.extractConfianza(parsed.confianza),
      textoExtraido: this.extractString(parsed.texto_extraido),
      respuestaModelo: parsed,
    };
  }

  private extractString(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    return null;
  }

  private extractDate(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const date = new Date(match[0]);
    return isNaN(date.getTime()) ? null : match[0];
  }

  private extractMonto(value: unknown): number | null {
    if (value == null) return null;
    const str = String(value)
      .replace(/\s/g, "")
      .replace(/\$|ARS/gi, "")
      .trim();
    if (str === "" || str === "null") return null;
    const normalized = str.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0) return null;
    return Math.round(num * 100) / 100;
  }

  private extractCategory(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const found = ALLOWED_CATEGORIES.find(
      (cat) => cat.toLowerCase() === value.toLowerCase(),
    );
    return found ?? "Otros";
  }

  private extractConfianza(value: unknown): number {
    if (typeof value !== "number") return 50;
    return Math.min(100, Math.max(0, Math.round(value)));
  }
}
