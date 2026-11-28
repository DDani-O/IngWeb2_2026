import { ConfigService } from "@nestjs/config";
import { APIConnectionTimeoutError } from "openai";
import {
  DEFAULT_GROQ_MODEL,
  OCR_MAX_RETRIES,
  OCR_TIMEOUT_MS,
  OcrService,
  parseMonto,
  parseTicketResponse,
} from "./ocr.service";

/**
 * Normalización del monto que devuelve el modelo de IA. El bug original borraba todos
 * los puntos: 355.37 se guardaba como 35537.
 */
describe("parseMonto", () => {
  it.each([
    [355.37, 355.37],
    [1500, 1500],
    ["355.37", 355.37],
    ["355,37", 355.37],
    ["1.500,50", 1500.5],
    ["1,500.50", 1500.5],
    ["1.234.567,8", 1234567.8],
    ["35.537", 35537],
    ["35,537", 35537],
    ["$ 1.234,56", 1234.56],
    ["ARS 990", 990],
    ["ars 990,5", 990.5],
    [" 17.230,74 ", 17230.74],
    [10.005, 10.01],
  ])("%p → %p", (input, expected) => {
    expect(parseMonto(input)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    ["abc"],
    ["12abc"],
    [""],
    ["$"],
    [0],
    ["0"],
    ["0,00"],
    [-50],
    ["-1.500,50"],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [{ monto: 10 }],
  ])("%p → null", (input) => {
    expect(parseMonto(input)).toBeNull();
  });
});

/** Respuesta del modelo → `ParsedTicket`; lo que no se puede leer lanza un error. */
describe("parseTicketResponse", () => {
  const valid = {
    comercio: " Carrefour Express ",
    fecha: "2026-11-20",
    monto_total: "1.500,50",
    categoria: "alimentación",
    confianza: 87.6,
    texto_extraido: "TOTAL $1.500,50",
  };

  it("normaliza los campos de un JSON válido", () => {
    expect(parseTicketResponse(JSON.stringify(valid))).toEqual({
      comercio_detectado: "Carrefour Express",
      fecha_detectada: "2026-11-20",
      monto_detectado: 1500.5,
      categoria_sugerida: "Alimentación",
      confianza_general: 88,
      texto_extraido: "TOTAL $1.500,50",
      respuesta_modelo: valid,
    });
  });

  it("acepta el JSON envuelto en un bloque de markdown", () => {
    const raw = "```json\n" + JSON.stringify(valid) + "\n```";
    expect(parseTicketResponse(raw).monto_detectado).toBe(1500.5);
  });

  it("reconoce la categoría Ropa y manda las desconocidas a Otros", () => {
    const ropa = { ...valid, categoria: "Ropa" };
    const rara = { ...valid, categoria: "Mascotas" };
    expect(parseTicketResponse(JSON.stringify(ropa)).categoria_sugerida).toBe(
      "Ropa",
    );
    expect(parseTicketResponse(JSON.stringify(rara)).categoria_sugerida).toBe(
      "Otros",
    );
  });

  it.each([["2026-02-30"], ["2026-13-01"], ["20/11/2026"], [null]])(
    "descarta la fecha %p",
    (fecha) => {
      const raw = JSON.stringify({ ...valid, fecha });
      expect(parseTicketResponse(raw).fecha_detectada).toBeNull();
    },
  );

  it("usa confianza 50 si no viene un número y la acota a 0–100", () => {
    const sin = { ...valid, confianza: "alta" };
    const alta = { ...valid, confianza: 140 };
    expect(parseTicketResponse(JSON.stringify(sin)).confianza_general).toBe(50);
    expect(parseTicketResponse(JSON.stringify(alta)).confianza_general).toBe(
      100,
    );
  });

  it.each([
    ["JSON cortado", JSON.stringify(valid).slice(0, 60)],
    ["texto libre", "No puedo leer este ticket."],
    ["vacío", ""],
    ["un array", "[1, 2]"],
    ["null", "null"],
    [
      "un objeto sin datos",
      JSON.stringify({
        comercio: null,
        fecha: null,
        monto_total: null,
        confianza: 10,
      }),
    ],
  ])("lanza un error con %s", (_caso, raw) => {
    expect(() => parseTicketResponse(raw)).toThrow();
  });
});

/** El servicio con el cliente de Groq simulado: no sale a la red. */
describe("OcrService", () => {
  const config = (values: Record<string, string>) =>
    ({ get: (key: string) => values[key] }) as unknown as ConfigService;

  const withFakeClient = (create: jest.Mock) => {
    const service = new OcrService(config({ GROQ_API_KEY: "clave-de-prueba" }));
    const client = (service as unknown as { client: { chat: unknown } }).client;
    client.chat = { completions: { create } };
    return service;
  };
  const respuesta = (content: string, finish_reason = "stop") => ({
    choices: [{ finish_reason, message: { content } }],
  });

  it("configura el cliente con timeout y reintentos acotados", () => {
    const service = new OcrService(config({ GROQ_API_KEY: "clave-de-prueba" }));
    const client = (
      service as unknown as {
        client: { timeout: number; maxRetries: number };
      }
    ).client;
    expect(client.timeout).toBe(OCR_TIMEOUT_MS);
    expect(client.maxRetries).toBe(OCR_MAX_RETRIES);
    // Peor caso (intento + reintento) por debajo de los 30 s que espera el front.
    expect(OCR_TIMEOUT_MS * (OCR_MAX_RETRIES + 1)).toBeLessThan(30_000);
  });

  it("sin GROQ_API_KEY no está disponible y analyzeTicket falla", async () => {
    const service = new OcrService(config({}));
    expect(service.isAvailable()).toBe(false);
    await expect(
      service.analyzeTicket(Buffer.from("x"), "image/png"),
    ).rejects.toThrow("OCR no disponible");
  });

  it("manda la imagen como data URL al modelo configurado", async () => {
    const create = jest
      .fn()
      .mockResolvedValue(
        respuesta(JSON.stringify({ comercio: "YPF", monto_total: 990 })),
      );
    const parsed = await withFakeClient(create).analyzeTicket(
      Buffer.from("abc"),
      "image/jpeg",
    );

    expect(parsed).toMatchObject({
      comercio_detectado: "YPF",
      monto_detectado: 990,
    });
    const [body] = create.mock.calls[0];
    expect(body.model).toBe(DEFAULT_GROQ_MODEL);
    expect(body.messages[0].content[1].image_url.url).toBe(
      `data:image/jpeg;base64,${Buffer.from("abc").toString("base64")}`,
    );
  });

  it("propaga el timeout del cliente (el servicio de tickets responde analisis: null)", async () => {
    const create = jest.fn().mockRejectedValue(new APIConnectionTimeoutError());
    await expect(
      withFakeClient(create).analyzeTicket(Buffer.from("x"), "image/png"),
    ).rejects.toBeInstanceOf(APIConnectionTimeoutError);
  });

  it("rechaza una respuesta cortada por max_tokens aunque parezca JSON", async () => {
    const create = jest
      .fn()
      .mockResolvedValue(respuesta('{"comercio": "YPF"}', "length"));
    await expect(
      withFakeClient(create).analyzeTicket(Buffer.from("x"), "image/png"),
    ).rejects.toThrow("cortada");
  });
});
