import { PageController } from "../../core/PageController.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { statCard } from "../../components/molecules/statCard.js";
import { patternCharts, unusualExpenseList } from "../../components/molecules/spendingAnalysis.js";
import { analysisService } from "../../services/analysis.service.js";
import { CHART_PALETTE_SIZE } from "../../utils/constants.js";
import { formatCurrency, formatWeekday } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

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
        description: `Registraste ${analysis.mostFrequentMerchant.count} ${analysis.mostFrequentMerchant.count === 1 ? "compra" : "compras"} ahi.`,
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

    if (!analysis.expenseCount) {
      // Sin gastos en el período no hay patrón que evaluar: nada de "todo en orden".
      insights.push({ tone: "info", emoji: "💡", title: "Todavia no hay gastos en el periodo analizado", description: "Carga gastos (manuales o con un ticket) para ver tus patrones de consumo." });
    } else {
      insights.push(
        analysis.unusualExpenses.length
          ? { tone: "warning", emoji: "⚠️", title: `${analysis.unusualExpenses.length} gasto(s) inusual(es) en los ultimos 30 dias`, description: "Revisalos en la seccion de gastos inusuales." }
          : { tone: "success", emoji: "✅", title: "Sin gastos inusuales", description: "Tus gastos recientes estan dentro de tu patron habitual." }
      );
    }

    this.element.querySelector("#patternsInsights").innerHTML = html`${insights.map((insight) => alertItem(insight))}`;
  }

  _renderStats(analysis) {
    this.element.querySelector("#patternsStats").innerHTML = html`
      ${statCard({ label: "Gasto promedio mensual", emoji: "📊", value: analysis.monthlyAverage, format: "currency", subtitle: "Meses completos anteriores con gastos" })}
      ${statCard({ label: "Gasto del mes", emoji: "💸", value: analysis.totalThisMonth, format: "currency", subtitle: "Mes en curso", trend: { value: analysis.changeVsPreviousMonth, label: "vs. mes anterior" } })}
      ${statCard({ label: "Dia de mayor gasto", emoji: "📅", value: analysis.peakWeekday === null ? "--" : formatWeekday(analysis.peakWeekday), format: "text", subtitle: "Periodo analizado" })}
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
    this.element.querySelector("#patternsUnusualList").innerHTML = unusualExpenseList(unusualExpenses);
  }

  _renderCharts(analysis) {
    const charts = patternCharts(analysis);
    this._showCharts({
      "#patternsCategoryChart": charts.category,
      "#patternsMonthlyChart": charts.monthly,
      "#patternsByCategoryChart": charts.byCategory,
      "#patternsUnusualChart": charts.unusual,
    });
  }
}
