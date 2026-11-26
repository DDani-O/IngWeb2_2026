import {
  addDays,
  monthKeysUntil,
  startOfMonthsBack,
  todayIn,
  weekday,
} from "./calendar";
import {
  assignSpendingProfile,
  computeAdvisorSummary,
  computeClientAnalysis,
  findUnusualExpenses,
  riskLevel,
} from "./analysis.rules";
import { GastoAnalizable, PerfilConRegla } from "./analysis.types";

/**
 * Reglas de la spec §10.6. La equivalencia completa con `frontend/mocks/analytics.js`
 * se verificó comparando ambos sobre el seed del mock; acá quedan los casos límite.
 */

const TODAY = "2026-11-26";
const CATEGORIES = [
  { id: "ali", nombre: "Alimentación" },
  { id: "ent", nombre: "Entretenimiento" },
  { id: "sus", nombre: "Suscripciones" },
  { id: "otr", nombre: "Otros" },
];
const PROFILES: PerfilConRegla[] = [
  { id: "p3", nombre: "Espíritu Libre", descripcion: "", discrecional_max: 1 },
  {
    id: "p1",
    nombre: "Drácula Nocturno",
    descripcion: "",
    discrecional_max: 0.1,
  },
  {
    id: "p2",
    nombre: "Equilibrista Cósmico",
    descripcion: "",
    discrecional_max: 0.3,
  },
];

let seq = 0;
const gasto = (
  fecha_gasto: string,
  monto: number,
  categoria_id = "ali",
  comercio = "Super",
): GastoAnalizable => ({
  id: `g${++seq}`,
  categoria_id,
  comercio,
  fecha_gasto,
  monto,
});

const analyze = (expenses: GastoAnalizable[], today = TODAY) =>
  computeClientAnalysis({
    clientId: "c1",
    expenses,
    categories: CATEGORIES,
    profiles: PROFILES,
    today,
  });

describe("calendar", () => {
  it("calcula hoy en la zona horaria de la app, no en la del servidor", () => {
    // 01:00 UTC del 1/12 todavía es 30/11 en Argentina (UTC-3).
    expect(
      todayIn(
        "America/Argentina/Buenos_Aires",
        new Date("2026-12-01T01:00:00Z"),
      ),
    ).toBe("2026-11-30");
    expect(todayIn("UTC", new Date("2026-12-01T01:00:00Z"))).toBe("2026-12-01");
  });

  it("opera sobre fechas sin corrimientos de mes ni de año", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(monthKeysUntil("2027-01-15", 3)).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
    expect(startOfMonthsBack("2026-01-31", 2)).toBe("2025-11-01");
    expect(weekday("2026-11-26")).toBe(4); // jueves
  });
});

describe("gastos inusuales", () => {
  const names = new Map(CATEGORIES.map((c) => [c.id, c.nombre]));
  const history = [
    gasto("2026-08-01", 100),
    gasto("2026-08-02", 100),
    gasto("2026-08-03", 100),
  ];

  it("marca un gasto reciente que supera en más de 35% el promedio de su categoría", () => {
    const [unusual] = findUnusualExpenses(
      [...history, gasto("2026-11-20", 136)],
      names,
      TODAY,
    );
    expect(unusual).toMatchObject({
      monto: 136,
      promedio_categoria: 100,
      desvio_porcentaje: 36,
      categoria: "Alimentación",
    });
  });

  it("no marca un gasto exactamente 35% arriba", () => {
    expect(
      findUnusualExpenses([...history, gasto("2026-11-20", 135)], names, TODAY),
    ).toEqual([]);
  });

  it("exige al menos 3 gastos previos en la categoría", () => {
    expect(
      findUnusualExpenses(
        [...history.slice(1), gasto("2026-11-20", 500)],
        names,
        TODAY,
      ),
    ).toEqual([]);
  });

  it("solo mira los últimos 30 días", () => {
    // 26/11 − 30 días = 27/10, que entra; el 26/10 ya queda afuera.
    expect(
      findUnusualExpenses([...history, gasto("2026-10-27", 500)], names, TODAY),
    ).toHaveLength(1);
    expect(
      findUnusualExpenses([...history, gasto("2026-10-26", 500)], names, TODAY),
    ).toEqual([]);
  });
});

describe("perfil de gasto", () => {
  const discretionary = new Set(["ent", "sus", "otr"]);

  it.each([
    [5, "p1"],
    [10, "p2"], // el límite es estricto: 10% ya no es Drácula
    [29, "p2"],
    [30, "p3"],
    [90, "p3"],
  ])("con %i%% de gasto discrecional asigna %s", (percent, expected) => {
    const expenses = [
      gasto("2026-11-10", 100 - percent),
      gasto("2026-11-11", percent, "ent"),
    ];
    expect(
      assignSpendingProfile(expenses, PROFILES, discretionary, TODAY)?.perfil
        .id,
    ).toBe(expected);
  });

  it("usa el mes en curso y los dos anteriores desde el día 1", () => {
    const expenses = [
      gasto("2026-08-31", 1000, "ent"),
      gasto("2026-09-01", 100),
    ];
    expect(
      assignSpendingProfile(expenses, PROFILES, discretionary, TODAY),
    ).toMatchObject({ perfil: { id: "p1" }, participacion: 0 });
  });

  it("queda en null sin gastos en la ventana o sin catálogo", () => {
    expect(
      assignSpendingProfile(
        [gasto("2026-01-10", 100)],
        PROFILES,
        discretionary,
        TODAY,
      ),
    ).toBeNull();
    expect(
      assignSpendingProfile(
        [gasto("2026-11-10", 100)],
        [],
        discretionary,
        TODAY,
      ),
    ).toBeNull();
  });

  it("reconoce las categorías discrecionales por nombre, con o sin tildes", () => {
    const { analisis } = analyze([
      gasto("2026-11-10", 50),
      gasto("2026-11-11", 50, "otr"),
    ]);
    expect(analisis.perfil_de_gasto?.id).toBe("p3");
  });
});

describe("análisis del cliente", () => {
  it("compara el mes en curso con el anterior hasta el mismo día", () => {
    const { analisis } = analyze([
      gasto("2026-10-10", 100),
      gasto("2026-10-27", 900),
      gasto("2026-11-05", 150),
    ]);
    expect(analisis.gasto_mes_anterior_a_la_fecha).toBe(100);
    expect(analisis.variacion_mes_anterior).toBe(50);
  });

  it("sin datos del mes anterior la variación es null", () => {
    expect(
      analyze([gasto("2026-11-05", 150)]).analisis.variacion_mes_anterior,
    ).toBeNull();
  });

  it("arma series de 7 meses y 14 días y un ranking por monto", () => {
    const { analisis } = analyze([
      gasto("2026-11-20", 10, "ali", "Kiosco"),
      gasto("2026-11-21", 10, "ali", "Kiosco"),
      gasto("2026-11-22", 500, "ali", "Mueblería"),
    ]);
    expect(analisis.gastos_por_mes.map((item) => item.mes)).toEqual(
      monthKeysUntil(TODAY, 7),
    );
    expect(analisis.gastos_por_dia).toHaveLength(14);
    expect(analisis.gastos_por_dia[13]).toEqual({ fecha: TODAY, monto: 0 });
    expect(analisis.ranking_comercios[0]).toEqual({
      comercio: "Mueblería",
      monto: 500,
      cantidad: 1,
    });
    expect(analisis.comercio_mas_frecuente).toEqual({
      comercio: "Kiosco",
      cantidad: 2,
    });
  });

  it("sin gastos devuelve una alerta informativa y riesgo bajo", () => {
    const { analisis } = analyze([]);
    expect(analisis.alertas).toEqual([
      expect.objectContaining({ nivel: "info" }),
    ]);
    expect(analisis).toMatchObject({
      nivel_riesgo: "bajo",
      perfil_de_gasto: null,
      ultimo_gasto_fecha: null,
      dia_mayor_gasto: null,
    });
  });

  it("con gastos solo fuera del período: todo vacío y alerta informativa, sin 'success'", () => {
    // Caso real de la base el 26/11: el último gasto es de abril, antes del período (desde 1/5).
    const { analisis } = analyze([
      gasto("2026-04-10", 50000, "ent", "Cine"),
      gasto("2025-04-01", 25, "otr", "Zara"),
    ]);
    expect(analisis.periodo).toEqual({ desde: "2026-05-01", hasta: TODAY });
    expect(analisis).toMatchObject({
      cantidad_gastos: 0,
      gasto_mes_actual: 0,
      gastos_por_categoria: [],
      ranking_comercios: [],
      categoria_dominante: null,
      comercio_mas_frecuente: null,
      dia_mayor_gasto: null,
      ultimo_gasto_fecha: "2026-04-10",
    });
    expect(analisis.alertas).toEqual([
      expect.objectContaining({
        nivel: "info",
        titulo: "Sin gastos en el periodo analizado",
      }),
    ]);
  });

  it("la torta, el ranking y los conteos solo usan gastos del período", () => {
    const { analisis } = analyze([
      gasto("2026-04-30", 999999, "ent", "Viejo"),
      gasto("2026-05-01", 1000, "ali", "Super"),
      gasto("2026-11-20", 3000, "sus", "Netflix"),
    ]);
    expect(analisis.cantidad_gastos).toBe(2);
    expect(analisis.gastos_por_categoria.map((item) => item.categoria)).toEqual(
      ["Suscripciones", "Alimentación"],
    );
    expect(analisis.ranking_comercios.map((item) => item.comercio)).toEqual([
      "Netflix",
      "Super",
    ]);
    expect(analisis.categoria_dominante).toMatchObject({ porcentaje: 75 });
  });

  it("con gastos en el período pero ninguno este mes: alerta informativa del mes, no 'success'", () => {
    const { analisis } = analyze([gasto("2026-09-10", 1000)]);
    expect(analisis.gasto_mes_actual).toBe(0);
    expect(analisis.alertas).toEqual([
      expect.objectContaining({
        nivel: "info",
        titulo: "Todavia no registraste gastos este mes",
      }),
    ]);
  });

  it("con gastos este mes y sin alertas: success", () => {
    const { analisis } = analyze([gasto("2026-11-02", 1000)]);
    expect(analisis.alertas).toEqual([
      expect.objectContaining({ nivel: "success" }),
    ]);
  });

  it.each([
    [0, null, "bajo"],
    [0, 11, "medio"],
    [1, null, "medio"],
    [0, 26, "alto"],
    [2, 0, "alto"],
  ])(
    "nivel de riesgo con %i inusuales y variación %p es %s",
    (unusual, variation, expected) => {
      expect(riskLevel(unusual, variation)).toBe(expected);
    },
  );
});

describe("resumen del asesor", () => {
  it("cuenta clientes, alertas, recomendaciones y actividad", () => {
    const activo = analyze([gasto("2026-11-25", 100)]).analisis;
    const inactivo = analyze([gasto("2026-10-01", 100)]).analisis;
    const summary = computeAdvisorSummary({
      advisorId: "a1",
      analyses: [activo, inactivo],
      sent: [{ leida: true }, { leida: false }],
      today: TODAY,
    });

    expect(summary).toMatchObject({
      clientes_activos: 2,
      recomendaciones_enviadas: 2,
      recomendaciones_leidas: 1,
    });
    expect(summary.alertas.map((alerta) => alerta.nivel)).toEqual([
      "warning",
      "info",
    ]);
    expect(summary.actividad_mensual.slice(-2)).toEqual([
      { mes: "2026-10", clientes_activos: 1 },
      { mes: "2026-11", clientes_activos: 1 },
    ]);
  });
});
