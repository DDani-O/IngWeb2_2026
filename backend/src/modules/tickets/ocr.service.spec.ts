import { parseMonto } from "./ocr.service";

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
