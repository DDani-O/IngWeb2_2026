/**
 * analytics.js - Cálculos de análisis de consumo del backend simulado.
 *
 * Reproduce lo que tiene que calcular el backend (tabla analisis_de_consumo y
 * clasificacion_de_perfil): totales por categoría, mes y día, ranking de comercios,
 * gastos inusuales, alertas, perfil de gasto asignado automáticamente y nivel de riesgo.
 * Devuelve objetos con la forma de la API (en español).
 */
import { toIsoDate } from "./seed.js";

/** Un gasto es inusual si supera en más de este factor el promedio de su categoría. */
const UNUSUAL_FACTOR = 1.35;
/** Mínimo de gastos previos en la categoría para poder comparar. */
const UNUSUAL_MIN_HISTORY = 3;
/** Solo se marcan como inusuales los gastos de los últimos N días. */
const UNUSUAL_WINDOW_DAYS = 30;
/** Categorías discrecionales para la regla de perfil (perfiles_de_gasto.criterio_regla). */
const DISCRETIONARY_CATEGORIES = ["cat-entretenimiento", "cat-suscripciones", "cat-otros"];
const DAILY_SERIES_DAYS = 14;
const MONTHS_IN_SERIES = 7;

const round = (value) => Math.round(value * 100) / 100;
const monthKey = (isoDate) => isoDate.slice(0, 7);

function monthKeysUntil(today, count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return toIsoDate(date).slice(0, 7);
  });
}

function sumBy(items, keyFn) {
  return items.reduce((accumulator, item) => {
    const key = keyFn(item);
    accumulator[key] = (accumulator[key] || 0) + item.monto;
    return accumulator;
  }, {});
}

/**
 * Detecta gastos recientes que superan el promedio de su categoría.
 */
function findUnusualExpenses(expenses, categoriesById, today) {
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - UNUSUAL_WINDOW_DAYS);
  const windowStartIso = toIsoDate(windowStart);

  return expenses
    .filter((expense) => expense.fecha_gasto >= windowStartIso)
    .map((expense) => {
      const history = expenses.filter(
        (other) => other.categoria_id === expense.categoria_id && other.id !== expense.id
      );
      if (history.length < UNUSUAL_MIN_HISTORY) {
        return null;
      }

      const average = history.reduce((sum, other) => sum + other.monto, 0) / history.length;
      if (expense.monto <= average * UNUSUAL_FACTOR) {
        return null;
      }

      return {
        gasto_id: expense.id,
        comercio: expense.comercio,
        categoria: categoriesById[expense.categoria_id]?.nombre || "Sin categoria",
        fecha_gasto: expense.fecha_gasto,
        monto: expense.monto,
        promedio_categoria: round(average),
        desvio_porcentaje: Math.round(((expense.monto - average) / average) * 100),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.desvio_porcentaje - a.desvio_porcentaje);
}

/**
 * Regla automática de perfil: participación del gasto discrecional en los últimos 3 meses.
 * @returns {{perfil: object, participacion: number}|null} igual que assignSpendingProfile del back
 */
function assignSpendingProfile(expenses, profiles, today) {
  const from = toIsoDate(new Date(today.getFullYear(), today.getMonth() - 2, 1));
  const recent = expenses.filter((expense) => expense.fecha_gasto >= from);
  const total = recent.reduce((sum, expense) => sum + expense.monto, 0);

  if (!total) {
    return null;
  }

  const discretionary = recent
    .filter((expense) => DISCRETIONARY_CATEGORIES.includes(expense.categoria_id))
    .reduce((sum, expense) => sum + expense.monto, 0);
  const share = discretionary / total;

  const ordered = [...profiles].sort(
    (a, b) => a.criterio_regla.discrecional_max - b.criterio_regla.discrecional_max
  );
  const profile = ordered.find((candidate) => share < candidate.criterio_regla.discrecional_max) || ordered[ordered.length - 1];

  return { perfil: { id: profile.id, nombre: profile.nombre, descripcion: profile.descripcion }, participacion: share };
}

/** Mismo texto que systemProfileReason del back. */
function systemProfileReason(asignacion) {
  const porcentaje = Math.round(asignacion.participacion * 100);
  return `Asignado por el sistema: el gasto discrecional fue el ${porcentaje}% de los ultimos 3 meses.`;
}

/**
 * Perfil vigente: la elección del asesor tiene prioridad sobre la sugerencia del sistema
 * (igual que resolveSpendingProfile del back).
 */
function resolveSpendingProfile(asignacion, manual, profiles) {
  const chosen = manual && profiles.find((profile) => profile.id === manual.perfil_id);
  if (chosen) {
    return { id: chosen.id, nombre: chosen.nombre, descripcion: chosen.descripcion, origen: "asesor", motivo: manual.motivo };
  }
  return asignacion ? { ...asignacion.perfil, origen: "sistema", motivo: systemProfileReason(asignacion) } : null;
}

function buildAlerts({ unusual, variation, totalThisMonth, expenseCount }) {
  const alerts = [];

  if (!expenseCount) {
    return [
      {
        nivel: "info",
        titulo: "Sin gastos en el periodo analizado",
        descripcion: `No hay gastos registrados en los ultimos ${MONTHS_IN_SERIES} meses. Carga un gasto (manual o con un ticket) para ver tu analisis.`,
      },
    ];
  }

  if (unusual.length) {
    alerts.push({
      nivel: "danger",
      titulo: `Detectamos ${unusual.length} gasto(s) inusual(es)`,
      descripcion: `El mayor: ${unusual[0].comercio}, un ${unusual[0].desvio_porcentaje}% sobre tu promedio en ${unusual[0].categoria}.`,
    });
  }

  if (variation !== null && variation > 10) {
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
      descripcion: "Cuando cargues los gastos del mes vas a ver como venis respecto del mes anterior.",
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

function riskLevel(unusualCount, variation) {
  if (unusualCount >= 2 || (variation !== null && variation > 25)) {
    return "alto";
  }

  if (unusualCount >= 1 || (variation !== null && variation > 10)) {
    return "medio";
  }

  return "bajo";
}

/**
 * Análisis completo de un cliente (GET /analysis/me y GET /analysis/clients/:id).
 */
export function computeClientAnalysis(db, clientId, today = new Date()) {
  const categoriesById = Object.fromEntries(db.categorias_de_gasto.map((category) => [category.id, category]));
  const expenses = db.gastos.filter((expense) => expense.cliente_id === clientId);
  const todayIso = toIsoDate(today);
  const months = monthKeysUntil(today, MONTHS_IN_SERIES);
  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  // Período analizado (el `periodo` de la respuesta): distribuciones, ranking y conteos se
  // calculan sobre él, igual que la serie mensual. El historial completo solo se usa como
  // base de los gastos inusuales. Igual que el back (analysis.rules.ts).
  const periodStart = `${months[0]}-01`;
  const periodExpenses = expenses.filter((expense) => expense.fecha_gasto >= periodStart && expense.fecha_gasto <= todayIso);

  const byMonth = sumBy(expenses, (expense) => monthKey(expense.fecha_gasto));
  const totalThisMonth = byMonth[currentMonth] || 0;

  // Comparación justa: mes anterior hasta el mismo día del mes.
  const sameDayPrevious = `${previousMonth}-${String(today.getDate()).padStart(2, "0")}`;
  const previousToDate = expenses
    .filter((expense) => monthKey(expense.fecha_gasto) === previousMonth && expense.fecha_gasto <= sameDayPrevious)
    .reduce((sum, expense) => sum + expense.monto, 0);
  const variation = previousToDate ? Math.round(((totalThisMonth - previousToDate) / previousToDate) * 100) : null;

  const completedMonths = months.slice(0, -1).filter((key) => byMonth[key]);
  const monthlyAverage = completedMonths.length
    ? completedMonths.reduce((sum, key) => sum + byMonth[key], 0) / completedMonths.length
    : totalThisMonth;

  const total = periodExpenses.reduce((sum, expense) => sum + expense.monto, 0);
  const byCategory = Object.entries(sumBy(periodExpenses, (expense) => expense.categoria_id))
    .map(([categoryId, amount]) => ({
      categoria_id: categoryId,
      categoria: categoriesById[categoryId]?.nombre || "Sin categoria",
      monto: round(amount),
      porcentaje: total ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto);

  const byMonthCategory = [];
  months.forEach((month) => {
    const monthExpenses = expenses.filter((expense) => monthKey(expense.fecha_gasto) === month);
    Object.entries(sumBy(monthExpenses, (expense) => expense.categoria_id)).forEach(([categoryId, amount]) => {
      byMonthCategory.push({ mes: month, categoria: categoriesById[categoryId]?.nombre || "Sin categoria", monto: round(amount) });
    });
  });

  const byDay = Array.from({ length: DAILY_SERIES_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (DAILY_SERIES_DAYS - 1 - index));
    const iso = toIsoDate(date);
    const amount = expenses.filter((expense) => expense.fecha_gasto === iso).reduce((sum, expense) => sum + expense.monto, 0);
    return { fecha: iso, monto: round(amount) };
  });

  const merchants = {};
  periodExpenses.forEach((expense) => {
    merchants[expense.comercio] = merchants[expense.comercio] || { comercio: expense.comercio, monto: 0, cantidad: 0 };
    merchants[expense.comercio].monto += expense.monto;
    merchants[expense.comercio].cantidad += 1;
  });
  const ranking = Object.values(merchants)
    .map((item) => ({ ...item, monto: round(item.monto) }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);
  const mostFrequent = Object.values(merchants).sort((a, b) => b.cantidad - a.cantidad)[0] || null;

  const byWeekday = sumBy(periodExpenses, (expense) => {
    const [year, month, day] = expense.fecha_gasto.split("-").map(Number);
    return new Date(year, month - 1, day).getDay();
  });
  const peakWeekday = Object.entries(byWeekday).sort((a, b) => b[1] - a[1])[0];

  const unusual = findUnusualExpenses(expenses, categoriesById, today);
  const profiles = db.perfiles_de_gasto;
  const asignacion = assignSpendingProfile(expenses, profiles, today);
  const manual = (db.clasificacion_de_perfil || []).find((row) => row.cliente_id === clientId && !row.vigente_hasta) || null;

  return {
    cliente_id: clientId,
    periodo: { desde: periodStart, hasta: todayIso },
    gasto_mes_actual: round(totalThisMonth),
    gasto_mes_anterior_a_la_fecha: round(previousToDate),
    variacion_mes_anterior: variation,
    gasto_promedio_mensual: round(monthlyAverage),
    cantidad_gastos: periodExpenses.length,
    categoria_dominante: byCategory[0]
      ? { id: byCategory[0].categoria_id, nombre: byCategory[0].categoria, porcentaje: byCategory[0].porcentaje }
      : null,
    comercio_mas_frecuente: mostFrequent ? { comercio: mostFrequent.comercio, cantidad: mostFrequent.cantidad } : null,
    dia_mayor_gasto: peakWeekday ? Number(peakWeekday[0]) : null,
    gastos_por_categoria: byCategory,
    gastos_por_mes: months.map((month) => ({ mes: month, monto: round(byMonth[month] || 0) })),
    gastos_por_mes_y_categoria: byMonthCategory,
    gastos_por_dia: byDay,
    ranking_comercios: ranking,
    gastos_inusuales: unusual,
    alertas: buildAlerts({ unusual, variation, totalThisMonth, expenseCount: periodExpenses.length }),
    perfil_de_gasto: resolveSpendingProfile(asignacion, manual, profiles),
    perfil_sugerido: asignacion?.perfil ?? null,
    nivel_riesgo: riskLevel(unusual.length, variation),
    ultimo_gasto_fecha: expenses.map((expense) => expense.fecha_gasto).sort().pop() || null,
  };
}

/**
 * Resumen del asesor (GET /analysis/advisor/summary).
 */
export function computeAdvisorSummary(db, advisorId, today = new Date()) {
  const clientIds = db.asignaciones_de_clientes
    .filter((assignment) => assignment.asesor_id === advisorId && assignment.activo)
    .map((assignment) => assignment.cliente_id);
  const analyses = clientIds.map((clientId) => computeClientAnalysis(db, clientId, today));
  const sent = db.recomendaciones_financieras.filter((recommendation) => recommendation.asesor_id === advisorId);
  const months = monthKeysUntil(today, MONTHS_IN_SERIES);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = toIsoDate(weekAgo);

  const withUnusual = analyses.filter((analysis) => analysis.gastos_inusuales.length);
  const inactive = analyses.filter((analysis) => !analysis.ultimo_gasto_fecha || analysis.ultimo_gasto_fecha < weekAgoIso);
  const unreadSent = sent.filter((recommendation) => !recommendation.leida);

  const profileCounts = {};
  const profileSpend = {};
  analyses.forEach((analysis) => {
    const name = analysis.perfil_de_gasto?.nombre || "Sin perfil";
    profileCounts[name] = (profileCounts[name] || 0) + 1;
    profileSpend[name] = (profileSpend[name] || 0) + analysis.gasto_promedio_mensual;
  });

  const alerts = [];
  if (withUnusual.length) {
    alerts.push({ nivel: "danger", titulo: `${withUnusual.length} clientes con gastos inusuales`, descripcion: "Superaron en mas de un 35% su promedio en alguna categoria." });
  }
  if (inactive.length) {
    alerts.push({ nivel: "warning", titulo: `${inactive.length} clientes sin actividad reciente`, descripcion: "No registran gastos hace mas de 7 dias." });
  }
  if (unreadSent.length) {
    alerts.push({ nivel: "info", titulo: `${unreadSent.length} recomendaciones sin leer`, descripcion: "Tus clientes todavia no las abrieron." });
  }
  if (!alerts.length) {
    alerts.push({ nivel: "success", titulo: "Cartera sin alertas", descripcion: "Ningun cliente requiere seguimiento hoy." });
  }

  return {
    asesor_id: advisorId,
    clientes_activos: clientIds.length,
    clientes_con_alertas: withUnusual.length,
    recomendaciones_enviadas: sent.length,
    recomendaciones_leidas: sent.filter((recommendation) => recommendation.leida).length,
    alertas: alerts,
    distribucion_por_perfil: Object.entries(profileCounts).map(([perfil, cantidad]) => ({ perfil, cantidad })),
    gasto_por_perfil: Object.entries(profileSpend).map(([perfil, monto]) => ({ perfil, monto: round(monto) })),
    actividad_mensual: months.map((month) => ({
      mes: month,
      clientes_activos: clientIds.filter((clientId) =>
        db.gastos.some((expense) => expense.cliente_id === clientId && monthKey(expense.fecha_gasto) === month)
      ).length,
    })),
  };
}
