/**
 * Reglas del análisis de consumo (§4, backend/README.md), como funciones puras: no leen la BD ni
 * el reloj. Son el port exacto de `frontend/mocks/analytics.js`, que sigue siendo la
 * referencia ejecutable; si cambia una regla, se cambia en los dos lados y en ese §4.
 */
import {
  addDays,
  monthKey,
  monthKeysUntil,
  startOfMonthsBack,
  weekday,
} from "./calendar";
import {
  Alerta,
  Analisis,
  AsignacionDePerfil,
  CategoriaAnalizable,
  ClasificacionManual,
  GastoAnalizable,
  GastoInusual,
  NivelRiesgo,
  PerfilConRegla,
  ResumenAsesor,
} from "./analysis.types";
import { PerfilVigente } from "../users/usuario.types";

/** Un gasto es inusual si supera en más de este factor el promedio de su categoría. */
export const UNUSUAL_FACTOR = 1.35;
/** Mínimo de otros gastos en la categoría (de todo el historial) para poder comparar. */
export const UNUSUAL_MIN_HISTORY = 3;
/** Solo se marcan como inusuales los gastos de los últimos N días. */
export const UNUSUAL_WINDOW_DAYS = 30;
/** Ventana de la regla de perfil: el mes en curso y los N anteriores. */
export const PROFILE_PREVIOUS_MONTHS = 2;
/** Nombres (normalizados) de las categorías discrecionales de la regla de perfil. */
export const DISCRETIONARY_CATEGORY_NAMES = [
  "entretenimiento",
  "suscripciones",
  "otros",
];
/** Variación contra el mes anterior (%) que dispara la alerta y el riesgo `medio`. */
export const VARIATION_WARNING_PERCENT = 10;
/** Variación (%) a partir de la cual el riesgo es `alto`. */
export const VARIATION_HIGH_RISK_PERCENT = 25;
/** Cantidad de gastos inusuales a partir de la cual el riesgo es `alto`. */
export const HIGH_RISK_UNUSUAL_COUNT = 2;
/** Días sin gastos a partir de los cuales un cliente cuenta como inactivo. */
export const INACTIVITY_DAYS = 7;
export const DAILY_SERIES_DAYS = 14;
export const MONTHS_IN_SERIES = 7;
export const RANKING_SIZE = 5;

const NO_CATEGORY = "Sin categoria";
const NO_PROFILE = "Sin perfil";

const round = (value: number) => Math.round(value * 100) / 100;

/** Minúsculas y sin tildes, para comparar nombres de categoría. */
export const normalizeName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** Suma de montos agrupada por clave, conservando el orden de aparición. */
function sumBy<T extends { monto: number }>(
  items: T[],
  keyFn: (item: T) => string,
): Map<string, number> {
  const totals = new Map<string, number>();
  items.forEach((item) =>
    totals.set(keyFn(item), (totals.get(keyFn(item)) ?? 0) + item.monto),
  );
  return totals;
}

const sum = (items: Array<{ monto: number }>) =>
  items.reduce((total, item) => total + item.monto, 0);

/**
 * Gastos de los últimos 30 días que superan en más de un 35% el promedio del resto de
 * los gastos de su categoría (con al menos 3 para comparar). Mayor desvío primero.
 */
export function findUnusualExpenses(
  expenses: GastoAnalizable[],
  categoryNames: Map<string, string>,
  today: string,
): GastoInusual[] {
  const windowStart = addDays(today, -UNUSUAL_WINDOW_DAYS);

  return expenses
    .filter((expense) => expense.fecha_gasto >= windowStart)
    .flatMap((expense): GastoInusual[] => {
      const history = expenses.filter(
        (other) =>
          other.categoria_id === expense.categoria_id &&
          other.id !== expense.id,
      );
      if (history.length < UNUSUAL_MIN_HISTORY) {
        return [];
      }

      const average = sum(history) / history.length;
      if (expense.monto <= average * UNUSUAL_FACTOR) {
        return [];
      }

      return [
        {
          gasto_id: expense.id,
          comercio: expense.comercio,
          categoria: categoryNames.get(expense.categoria_id) ?? NO_CATEGORY,
          fecha_gasto: expense.fecha_gasto,
          monto: expense.monto,
          promedio_categoria: round(average),
          desvio_porcentaje: Math.round(
            ((expense.monto - average) / average) * 100,
          ),
        },
      ];
    })
    .sort((a, b) => b.desvio_porcentaje - a.desvio_porcentaje);
}

/**
 * Regla automática de perfil: participación del gasto discrecional en el mes en curso y
 * los dos anteriores, contra `discrecional_max` de cada perfil (el primero que la supera).
 * `null` si no hay gastos en la ventana o el catálogo está vacío.
 */
export function assignSpendingProfile(
  expenses: GastoAnalizable[],
  profiles: PerfilConRegla[],
  discretionaryCategoryIds: Set<string>,
  today: string,
): AsignacionDePerfil | null {
  const from = startOfMonthsBack(today, PROFILE_PREVIOUS_MONTHS);
  const recent = expenses.filter((expense) => expense.fecha_gasto >= from);
  const total = sum(recent);

  if (!total || !profiles.length) {
    return null;
  }

  const participacion =
    sum(
      recent.filter((expense) =>
        discretionaryCategoryIds.has(expense.categoria_id),
      ),
    ) / total;
  const ordered = [...profiles].sort(
    (a, b) => a.discrecional_max - b.discrecional_max,
  );
  const match =
    ordered.find((candidate) => participacion < candidate.discrecional_max) ??
    ordered[ordered.length - 1];

  return {
    perfil: {
      id: match.id,
      nombre: match.nombre,
      descripcion: match.descripcion,
    },
    participacion,
  };
}

/**
 * Alertas del análisis. `expenseCount` es la cantidad de gastos del período analizado:
 * sin gastos en el período o en el mes en curso no se muestra el "todo en orden" (success),
 * para no felicitar a un cliente con todos los indicadores en $0.
 */
function buildAlerts(
  unusual: GastoInusual[],
  variation: number | null,
  expenseCount: number,
  totalThisMonth: number,
): Alerta[] {
  if (!expenseCount) {
    return [
      {
        nivel: "info",
        titulo: "Sin gastos en el periodo analizado",
        descripcion: `No hay gastos registrados en los ultimos ${MONTHS_IN_SERIES} meses. Carga un gasto (manual o con un ticket) para ver tu analisis.`,
      },
    ];
  }

  const alerts: Alerta[] = [];
  if (unusual.length) {
    alerts.push({
      nivel: "danger",
      titulo: `Detectamos ${unusual.length} gasto(s) inusual(es)`,
      descripcion: `El mayor: ${unusual[0].comercio}, un ${unusual[0].desvio_porcentaje}% sobre tu promedio en ${unusual[0].categoria}.`,
    });
  }
  if (variation !== null && variation > VARIATION_WARNING_PERCENT) {
    alerts.push({
      nivel: "warning",
      titulo: "Gastas mas que el mes pasado",
      descripcion: `A esta altura del mes llevas un ${variation}% mas que en el mismo periodo del mes anterior.`,
    });
  }
  if (!alerts.length && !totalThisMonth) {
    alerts.push({
      nivel: "info",
      titulo: "Todavia no registraste gastos este mes",
      descripcion:
        "Cuando cargues los gastos del mes vas a ver como venis respecto del mes anterior.",
    });
  }
  if (!alerts.length) {
    alerts.push({
      nivel: "success",
      titulo: "Tus gastos estan dentro de lo habitual",
      descripcion: "No detectamos gastos fuera de tu patron este mes.",
    });
  }
  return alerts;
}

/** `alto` con 2+ inusuales o variación > 25%; `medio` con 1 o variación > 10%; si no, `bajo`. */
export function riskLevel(
  unusualCount: number,
  variation: number | null,
): NivelRiesgo {
  if (
    unusualCount >= HIGH_RISK_UNUSUAL_COUNT ||
    (variation !== null && variation > VARIATION_HIGH_RISK_PERCENT)
  ) {
    return "alto";
  }
  if (
    unusualCount >= 1 ||
    (variation !== null && variation > VARIATION_WARNING_PERCENT)
  ) {
    return "medio";
  }
  return "bajo";
}

/** Texto de `motivo` de una clasificación automática (se guarda y se muestra). */
export function systemProfileReason(asignacion: AsignacionDePerfil): string {
  const porcentaje = Math.round(asignacion.participacion * 100);
  return `Asignado por el sistema: el gasto discrecional fue el ${porcentaje}% de los ultimos 3 meses.`;
}

/**
 * Perfil vigente del cliente. La elección del asesor tiene prioridad sobre la regla
 * automática: el sistema sigue calculando su sugerencia, pero no la pisa. Si el perfil
 * que eligió el asesor ya no está en el catálogo activo, se vuelve a la sugerencia.
 */
export function resolveSpendingProfile(
  asignacion: AsignacionDePerfil | null,
  manual: ClasificacionManual | null,
  profiles: PerfilConRegla[],
): PerfilVigente | null {
  const chosen =
    manual && profiles.find((profile) => profile.id === manual.perfil_id);
  if (chosen) {
    return {
      id: chosen.id,
      nombre: chosen.nombre,
      descripcion: chosen.descripcion,
      origen: "asesor",
      motivo: manual.motivo,
    };
  }
  if (!asignacion) {
    return null;
  }
  return {
    ...asignacion.perfil,
    origen: "sistema",
    motivo: systemProfileReason(asignacion),
  };
}

export interface ClientAnalysisInput {
  clientId: string;
  expenses: GastoAnalizable[];
  categories: CategoriaAnalizable[];
  profiles: PerfilConRegla[];
  today: string;
  /** Clasificación vigente cargada por el asesor, si la hay. */
  manual?: ClasificacionManual | null;
}

/**
 * Análisis completo de un cliente (GET /analysis/me y GET /analysis/clients/:id).
 * Devuelve también la participación discrecional que justifica el perfil asignado.
 */
export function computeClientAnalysis(input: ClientAnalysisInput): {
  analisis: Analisis;
  asignacion: AsignacionDePerfil | null;
} {
  const { clientId, expenses, categories, profiles, today } = input;
  const manual = input.manual ?? null;
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.nombre]),
  );
  const discretionaryIds = new Set(
    categories
      .filter((category) =>
        DISCRETIONARY_CATEGORY_NAMES.includes(normalizeName(category.nombre)),
      )
      .map((category) => category.id),
  );
  const nameOf = (categoryId: string) =>
    categoryNames.get(categoryId) ?? NO_CATEGORY;

  const months = monthKeysUntil(today, MONTHS_IN_SERIES);
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  // Período analizado (el `periodo` de la respuesta): las distribuciones, el ranking y los
  // conteos se calculan sobre él, igual que la serie mensual. El historial completo solo
  // se usa como base de los gastos inusuales.
  const periodStart = `${months[0]}-01`;
  const periodExpenses = expenses.filter(
    (expense) =>
      expense.fecha_gasto >= periodStart && expense.fecha_gasto <= today,
  );

  const byMonth = sumBy(expenses, (expense) => monthKey(expense.fecha_gasto));
  const totalThisMonth = byMonth.get(currentMonth) ?? 0;

  // Comparación justa: el mes en curso está incompleto, así que se compara con el mes
  // anterior hasta el mismo día. Si ese día no existe (31 contra un mes de 30), la
  // comparación de textos "AAAA-MM-31" toma el mes anterior completo.
  const sameDayPrevious = `${previousMonth}-${today.slice(8, 10)}`;
  const previousToDate = sum(
    expenses.filter(
      (expense) =>
        monthKey(expense.fecha_gasto) === previousMonth &&
        expense.fecha_gasto <= sameDayPrevious,
    ),
  );
  const variation = previousToDate
    ? Math.round(((totalThisMonth - previousToDate) / previousToDate) * 100)
    : null;

  // Promedio de los meses completos con gastos: el mes en curso bajaría el promedio y los
  // meses vacíos (antes de que el cliente empezara a cargar) también. Sin meses completos,
  // se usa lo que va del mes.
  const completedMonths = months.slice(0, -1).filter((key) => byMonth.get(key));
  const monthlyAverage = completedMonths.length
    ? completedMonths.reduce(
        (total, key) => total + (byMonth.get(key) ?? 0),
        0,
      ) / completedMonths.length
    : totalThisMonth;

  const total = sum(periodExpenses);
  const byCategory = [
    ...sumBy(periodExpenses, (expense) => expense.categoria_id),
  ]
    .map(([categoryId, amount]) => ({
      categoria_id: categoryId,
      categoria: nameOf(categoryId),
      monto: round(amount),
      porcentaje: total ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto);

  const byMonthCategory = months.flatMap((month) =>
    [
      ...sumBy(
        expenses.filter((expense) => monthKey(expense.fecha_gasto) === month),
        (expense) => expense.categoria_id,
      ),
    ].map(([categoryId, amount]) => ({
      mes: month,
      categoria: nameOf(categoryId),
      monto: round(amount),
    })),
  );

  const byDay = Array.from({ length: DAILY_SERIES_DAYS }, (_, index) => {
    const fecha = addDays(today, -(DAILY_SERIES_DAYS - 1 - index));
    return {
      fecha,
      monto: round(
        sum(expenses.filter((expense) => expense.fecha_gasto === fecha)),
      ),
    };
  });

  const merchants = new Map<
    string,
    { comercio: string; monto: number; cantidad: number }
  >();
  periodExpenses.forEach((expense) => {
    const entry = merchants.get(expense.comercio) ?? {
      comercio: expense.comercio,
      monto: 0,
      cantidad: 0,
    };
    entry.monto += expense.monto;
    entry.cantidad += 1;
    merchants.set(expense.comercio, entry);
  });
  const ranking = [...merchants.values()]
    .map((item) => ({ ...item, monto: round(item.monto) }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, RANKING_SIZE);
  const mostFrequent =
    [...merchants.values()].sort((a, b) => b.cantidad - a.cantidad)[0] ?? null;

  // Días de la semana en orden 0..6; ante empate gana el primero (igual que el mock).
  const byWeekday = sumBy(periodExpenses, (expense) =>
    String(weekday(expense.fecha_gasto)),
  );
  const peakWeekday = [...byWeekday]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .sort((a, b) => b[1] - a[1])[0];

  const unusual = findUnusualExpenses(expenses, categoryNames, today);
  const asignacion = assignSpendingProfile(
    expenses,
    profiles,
    discretionaryIds,
    today,
  );

  const analisis: Analisis = {
    cliente_id: clientId,
    periodo: { desde: periodStart, hasta: today },
    gasto_mes_actual: round(totalThisMonth),
    gasto_mes_anterior_a_la_fecha: round(previousToDate),
    variacion_mes_anterior: variation,
    gasto_promedio_mensual: round(monthlyAverage),
    cantidad_gastos: periodExpenses.length,
    categoria_dominante: byCategory[0]
      ? {
          id: byCategory[0].categoria_id,
          nombre: byCategory[0].categoria,
          porcentaje: byCategory[0].porcentaje,
        }
      : null,
    comercio_mas_frecuente: mostFrequent
      ? { comercio: mostFrequent.comercio, cantidad: mostFrequent.cantidad }
      : null,
    dia_mayor_gasto: peakWeekday ? Number(peakWeekday[0]) : null,
    gastos_por_categoria: byCategory,
    gastos_por_mes: months.map((month) => ({
      mes: month,
      monto: round(byMonth.get(month) ?? 0),
    })),
    gastos_por_mes_y_categoria: byMonthCategory,
    gastos_por_dia: byDay,
    ranking_comercios: ranking,
    gastos_inusuales: unusual,
    alertas: buildAlerts(
      unusual,
      variation,
      periodExpenses.length,
      totalThisMonth,
    ),
    perfil_de_gasto: resolveSpendingProfile(asignacion, manual, profiles),
    perfil_sugerido: asignacion?.perfil ?? null,
    nivel_riesgo: riskLevel(unusual.length, variation),
    ultimo_gasto_fecha:
      expenses
        .map((expense) => expense.fecha_gasto)
        .sort()
        .pop() ?? null,
  };

  return { analisis, asignacion };
}

export interface AdvisorSummaryInput {
  advisorId: string;
  /** Análisis de cada cliente con asignación activa. */
  analyses: Analisis[];
  /** Recomendaciones enviadas por el asesor. */
  sent: Array<{ leida: boolean }>;
  today: string;
}

/** Resumen de la cartera del asesor (GET /analysis/advisor/summary). */
export function computeAdvisorSummary(
  input: AdvisorSummaryInput,
): ResumenAsesor {
  const { advisorId, analyses, sent, today } = input;
  const months = monthKeysUntil(today, MONTHS_IN_SERIES);
  const weekAgo = addDays(today, -INACTIVITY_DAYS);

  const withUnusual = analyses.filter(
    (analysis) => analysis.gastos_inusuales.length,
  );
  const inactive = analyses.filter(
    (analysis) =>
      !analysis.ultimo_gasto_fecha || analysis.ultimo_gasto_fecha < weekAgo,
  );
  const unreadSent = sent.filter((recommendation) => !recommendation.leida);

  const profileCounts = new Map<string, number>();
  const profileSpend = new Map<string, number>();
  analyses.forEach((analysis) => {
    const name = analysis.perfil_de_gasto?.nombre ?? NO_PROFILE;
    profileCounts.set(name, (profileCounts.get(name) ?? 0) + 1);
    profileSpend.set(
      name,
      (profileSpend.get(name) ?? 0) + analysis.gasto_promedio_mensual,
    );
  });

  const alerts: Alerta[] = [];
  if (withUnusual.length) {
    alerts.push({
      nivel: "danger",
      titulo: `${withUnusual.length} clientes con gastos inusuales`,
      descripcion:
        "Superaron en mas de un 35% su promedio en alguna categoria.",
    });
  }
  if (inactive.length) {
    alerts.push({
      nivel: "warning",
      titulo: `${inactive.length} clientes sin actividad reciente`,
      descripcion: "No registran gastos hace mas de 7 dias.",
    });
  }
  if (unreadSent.length) {
    alerts.push({
      nivel: "info",
      titulo: `${unreadSent.length} recomendaciones sin leer`,
      descripcion: "Tus clientes todavia no las abrieron.",
    });
  }
  if (!alerts.length) {
    alerts.push({
      nivel: "success",
      titulo: "Cartera sin alertas",
      descripcion: "Ningun cliente requiere seguimiento hoy.",
    });
  }

  return {
    asesor_id: advisorId,
    clientes_activos: analyses.length,
    clientes_con_alertas: withUnusual.length,
    recomendaciones_enviadas: sent.length,
    recomendaciones_leidas: sent.filter(
      (recommendation) => recommendation.leida,
    ).length,
    alertas: alerts,
    distribucion_por_perfil: [...profileCounts].map(([perfil, cantidad]) => ({
      perfil,
      cantidad,
    })),
    gasto_por_perfil: [...profileSpend].map(([perfil, monto]) => ({
      perfil,
      monto: round(monto),
    })),
    // Un mes cuenta si el cliente registró al menos un gasto (los montos son > 0).
    actividad_mensual: months.map((mes) => ({
      mes,
      clientes_activos: analyses.filter((analysis) =>
        analysis.gastos_por_mes.some(
          (item) => item.mes === mes && item.monto > 0,
        ),
      ).length,
    })),
  };
}
