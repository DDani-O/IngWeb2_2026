import { parseMonto, parseTicketResponse } from "./ocr.service";

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
