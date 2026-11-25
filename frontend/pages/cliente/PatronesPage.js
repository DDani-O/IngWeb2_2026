import { PageController } from "../../core/PageController.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { statCard } from "../../components/molecules/statCard.js";
import { ChartCard } from "../../components/organisms/ChartCard.js";
import { analysisService } from "../../services/analysis.service.js";
import { CHART_PALETTE_SIZE } from "../../utils/constants.js";
import { formatCurrency, formatDate, formatMonth, formatWeekday } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

/** Cantidad de categorías que se muestran en el gráfico de evolución por categoría. */
const EVOLUTION_TOP_CATEGORIES = 4;

/**
 * Patrones de consumo (consigna §4.5): promedio mensual, categorías con más gasto,
 * evolución en el tiempo y gastos inusuales, calculados por el backend.
 */
export class PatronesPage extends PageController {
  static template = "./pages/cliente/patrones.html";

  render() {
    this._loadData(async () => {
      const analysis = await analysisService.getMine();
      if (!this._isAlive()) {
        return;
      }

      this._renderInsights(analysis);
      this._renderStats(analysis);
      this._renderCategoryList(analysis.byCategory);
      this._renderUnusualList(analysis.unusualExpenses);
      this._renderCharts(analysis);
    });
  }

  attachEvents() {
    this._bindDashboardBackButtons();
  }

  _renderInsights(analysis) {
    const insights = [];
    const dominant = analysis.dominantCategory;

    if (dominant) {
      insights.push({
        tone: dominant.percentage >= 40 ? "warning" : "success",
        emoji: "🏷️",
        title: `${dominant.name} concentra el ${dominant.percentage}% de tus gastos`,
        description: dominant.percentage >= 40 ? "Es la categoria donde mas impacto tiene cualquier ajuste." : "Tus gastos estan bien repartidos entre categorias.",
      });
    }

    if (analysis.mostFrequentMerchant) {
      insights.push({
        tone: "info",
        emoji: "🏪",
        title: `Tu comercio mas frecuente es ${analysis.mostFrequentMerchant.merchant}`,
        description: `Registraste ${analysis.mostFrequentMerchant.count} compras ahi.`,
      });
    }

    if (analysis.peakWeekday !== null) {
      insights.push({
        tone: "info",
        emoji: "📅",
        title: `Gastas mas los ${formatWeekday(analysis.peakWeekday)}`,
        description: "Es el dia de la semana con mayor gasto acumulado.",
      });
    }

    insights.push(
      analysis.unusualExpenses.length
        ? { tone: "warning", emoji: "⚠️", title: `${analysis.unusualExpenses.length} gasto(s) inusual(es) este mes`, description: "Revisalos en la seccion de gastos inusuales." }
        : { tone: "success", emoji: "✅", title: "Sin gastos inusuales", description: "Tus gastos recientes estan dentro de tu patron habitual." }
    );

    this.element.querySelector("#patternsInsights").innerHTML = html`${insights.map((insight) => alertItem(insight))}`;
  }

  _renderStats(analysis) {
    this.element.querySelector("#patternsStats").innerHTML = html`
      ${statCard({ label: "Gasto promedio mensual", emoji: "📊", value: analysis.monthlyAverage, format: "currency", subtitle: "Meses completos anteriores" })}
      ${statCard({ label: "Gasto del mes", emoji: "💸", value: analysis.totalThisMonth, format: "currency", subtitle: "Mes en curso", trend: { value: analysis.changeVsPreviousMonth, label: "vs. mes anterior" } })}
      ${statCard({ label: "Dia de mayor gasto", emoji: "📅", value: analysis.peakWeekday === null ? "--" : formatWeekday(analysis.peakWeekday), format: "text", subtitle: "Acumulado historico" })}
      ${statCard({ label: "Gastos inusuales", emoji: "🔎", value: analysis.unusualExpenses.length, subtitle: "Ultimos 30 dias" })}
    `;
  }

  _renderCategoryList(byCategory) {
    this.element.querySelector("#patternsCategoryList").innerHTML = byCategory.length
      ? html`${byCategory.map((item, index) =>
          mediaItem({
            leading: html`<span class="patterns-color-dot patterns-color-dot--c${(index % CHART_PALETTE_SIZE) + 1}" aria-hidden="true"></span>`,
            title: item.category,
            subtitle: formatCurrency(item.amount),
            trailing: `${item.percentage}%`,
          })
        )}`
      : emptyState({ icon: "fa-layer-group", title: "Todavia no hay gastos registrados" });
  }

  _renderUnusualList(unusualExpenses) {
    this.element.querySelector("#patternsUnusualList").innerHTML = unusualExpenses.length
      ? html`${unusualExpenses.map((item) =>
          alertItem({
            tone: item.deviationPercent >= 100 ? "danger" : "warning",
            title: `${item.merchant} · ${item.category}`,
            description: `${formatDate(item.date)}: ${formatCurrency(item.amount)} contra un promedio de ${formatCurrency(item.categoryAverage)} (+${item.deviationPercent}%).`,
          })
        )}`
      : emptyState({ icon: "fa-circle-check", title: "Sin gastos inusuales", message: "No detectamos gastos fuera de tu patron en los ultimos 30 dias." });
  }

  _renderCharts(analysis) {
    const monthLabels = analysis.byMonth.map((item) => formatMonth(item.month));
    const topCategories = analysis.byCategory.slice(0, EVOLUTION_TOP_CATEGORIES).map((item) => item.category);

    const charts = {
      "#patternsCategoryChart": {
        title: "Distribucion por categoria",
        icon: "fa-chart-pie",
        type: "doughnut",
        valueFormat: "percent",
        labels: analysis.byCategory.map((item) => item.category),
        datasets: [{ label: "Porcentaje", data: analysis.byCategory.map((item) => item.percentage) }],
      },
      "#patternsMonthlyChart": {
        title: "Gasto total mensual",
        icon: "fa-chart-line",
        type: "line",
        valueFormat: "currency",
        labels: monthLabels,
        datasets: [{ label: "Gasto mensual", data: analysis.byMonth.map((item) => item.amount) }],
      },
      "#patternsByCategoryChart": {
        title: "Evolucion por categoria",
        icon: "fa-chart-line",
        type: "line",
        valueFormat: "currency",
        labels: monthLabels,
        datasets: topCategories.map((category) => ({
          label: category,
          data: analysis.byMonth.map(({ month }) => analysis.byMonthCategory.find((item) => item.month === month && item.category === category)?.amount || 0),
        })),
      },
      "#patternsUnusualChart": {
        title: "Inusual vs. promedio de la categoria",
        icon: "fa-chart-column",
        type: "bar",
        valueFormat: "currency",
        emptyMessage: "No hay gastos inusuales para comparar.",
        labels: analysis.unusualExpenses.map((item) => item.merchant),
        datasets: [
          { label: "Promedio de la categoria", data: analysis.unusualExpenses.map((item) => item.categoryAverage) },
          { label: "Gasto detectado", data: analysis.unusualExpenses.map((item) => item.amount) },
        ],
      },
    };

    this.charts = this.charts || {};
    Object.entries(charts).forEach(([selector, props]) => {
      if (this.charts[selector]) {
        this.charts[selector].update(props);
      } else {
        this.charts[selector] = this.mountChild(ChartCard, selector, props);
      }
    });
  }
}
