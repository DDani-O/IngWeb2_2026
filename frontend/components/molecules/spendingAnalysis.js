import { formatCurrency, formatDate, formatMonth, formatShortDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";
import { alertItem } from "./alertItem.js";
import { mediaItem } from "./mediaItem.js";
import { emptyState } from "./stateBlock.js";
import { statCard } from "./statCard.js";

/**
 * Bloques de presentación del análisis de consumo (modelo de analysisService).
 * Los comparten el dashboard del cliente, patrones de consumo y el análisis por cliente del asesor.
 */

/** KPIs principales del análisis. */
export function analysisStats(analysis) {
  return html`
    ${statCard({ label: "Gasto del mes", emoji: "💸", value: analysis.totalThisMonth, format: "currency", subtitle: "Mes en curso", trend: { value: analysis.changeVsPreviousMonth, label: "vs. mismo periodo del mes anterior" } })}
    ${statCard({ label: "Promedio mensual", emoji: "📊", value: analysis.monthlyAverage, format: "currency", subtitle: "Meses completos anteriores con gastos" })}
    ${statCard({ label: "Categoria principal", emoji: "🏷️", value: analysis.dominantCategory?.name || "--", format: "text", subtitle: analysis.dominantCategory ? `${analysis.dominantCategory.percentage}% de los gastos` : "Sin gastos registrados" })}
    ${statCard({ label: "Gastos inusuales", emoji: "🔎", value: analysis.unusualExpenses.length, subtitle: "Ultimos 30 dias" })}
  `;
}

/**
 * Props de ChartCard para los gráficos de la consigna: por día, por categoría (torta) y por mes (barras con promedio).
 * @param {object} analysis
 * @param {{categoryLink?: object}} options
 */
export function analysisCharts(analysis, { categoryLink = null } = {}) {
  // La línea de promedio es el mismo `gasto_promedio_mensual` del KPI (spec §10.6), no un
  // promedio simple de la serie: así los dos números que se ven en pantalla coinciden.
  const average = analysis.monthlyAverage || 0;

  return {
    daily: {
      title: "Gastos por dia (ultimas 2 semanas)",
      icon: "fa-chart-line",
      type: "line",
      valueFormat: "currency",
      labels: analysis.byDay.map((item) => formatShortDate(item.date)),
      datasets: [{ label: "Gasto diario", data: analysis.byDay.map((item) => item.amount) }],
    },
    category: {
      title: "Gastos por categoria",
      icon: "fa-chart-pie",
      type: "doughnut",
      valueFormat: "currency",
      labels: analysis.byCategory.map((item) => item.category),
      datasets: [{ label: "Gasto", data: analysis.byCategory.map((item) => item.amount) }],
      link: categoryLink,
    },
    monthly: {
      title: "Gasto mensual",
      icon: "fa-chart-column",
      type: "bar",
      valueFormat: "currency",
      caption: "Ultimos 7 meses. La linea punteada es el promedio.",
      labels: analysis.byMonth.map((item) => formatMonth(item.month)),
      datasets: [
        { label: "Gasto mensual", data: analysis.byMonth.map((item) => item.amount) },
        { label: "Promedio", kind: "line", dashed: true, data: analysis.byMonth.map(() => Math.round(average * 100) / 100) },
      ],
    },
  };
}

/** Ranking de comercios por monto (consigna §4.4). */
export function merchantRanking(ranking) {
  return ranking.length
    ? html`${ranking.map((merchant, index) =>
        mediaItem({ variant: "accent", leading: html`${index + 1}.`, title: merchant.merchant, subtitle: `${merchant.count} compras`, trailing: formatCurrency(merchant.amount) })
      )}`
    : emptyState({ icon: "fa-store", title: "Sin comercios todavia", message: "Cuando haya gastos registrados vas a ver aca los comercios mas frecuentes." });
}

/** Gastos inusuales detectados por el backend (consigna §4.5). */
export function unusualExpenseList(unusualExpenses) {
  return unusualExpenses.length
    ? html`${unusualExpenses.map((item) =>
        alertItem({
          tone: item.deviationPercent >= 100 ? "danger" : "warning",
          title: `${item.merchant} · ${item.category}`,
          description: `${formatDate(item.date)}: ${formatCurrency(item.amount)} contra un promedio de ${formatCurrency(item.categoryAverage)} (+${item.deviationPercent}%).`,
        })
      )}`
    : emptyState({ icon: "fa-circle-check", title: "Sin gastos inusuales", message: "No se detectaron gastos fuera del patron en los ultimos 30 dias." });
}
