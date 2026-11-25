import { PageController } from "../../core/PageController.js";
import { analysisService } from "../../services/analysis.service.js";
import { CHART_PALETTE_SIZE } from "../../utils/constants.js";
import { formatCurrency, formatDate, formatMonth, formatTrendLabel, formatWeekday } from "../../utils/formatters.js";
import { getChartPalette, getChartThemeColors } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/** Cantidad de categorías que se muestran en el gráfico de evolución por categoría. */
const EVOLUTION_TOP_CATEGORIES = 4;

/**
 * Patrones de consumo (consigna §4.5): promedio mensual, categorías con más gasto,
 * evolución en el tiempo y gastos inusuales, calculados por el backend.
 */
export class PatronesPage extends PageController {
  static template = "./pages/cliente/patrones.html";

  constructor(element, options = {}) {
    super(element, options);
    this.charts = [];
  }

  render() {
    const userName = this.options.authManager?.getCurrentUser()?.fullName || "";
    this._setText("#patternsUserName", userName);

    this._loadData(async () => {
      const analysis = await analysisService.getMine();
      if (!this._isAlive()) {
        return;
      }

      this._renderHighlights(analysis);
      this._renderStats(analysis);
      this._renderCategoryList(analysis.byCategory);
      this._renderUnusualAlerts(analysis.unusualExpenses);
      this._initCharts(analysis);
    });
  }

  attachEvents() {
    this._bindDashboardBackButtons();
  }

  _renderHighlights(analysis) {
    const container = this.element.querySelector("#patternsKeyInsights");
    if (!container) {
      return;
    }

    const highlights = [];
    const dominant = analysis.dominantCategory;

    if (dominant) {
      highlights.push({
        type: dominant.percentage >= 40 ? "warning" : "positive",
        icon: "🏷️",
        title: `${dominant.name} concentra el ${dominant.percentage}% de tus gastos`,
        text: dominant.percentage >= 40 ? "Es la categoria donde mas impacto tiene cualquier ajuste." : "Tus gastos estan bien repartidos entre categorias.",
      });
    }

    if (analysis.mostFrequentMerchant) {
      highlights.push({
        type: "positive",
        icon: "🏪",
        title: `Tu comercio mas frecuente es ${analysis.mostFrequentMerchant.merchant}`,
        text: `Registraste ${analysis.mostFrequentMerchant.count} compras ahi.`,
      });
    }

    if (analysis.peakWeekday !== null) {
      highlights.push({
        type: "positive",
        icon: "📅",
        title: `Gastas mas los ${formatWeekday(analysis.peakWeekday)}`,
        text: "Es el dia de la semana con mayor gasto acumulado.",
      });
    }

    highlights.push(
      analysis.unusualExpenses.length
        ? { type: "warning", icon: "⚠️", title: `${analysis.unusualExpenses.length} gasto(s) inusual(es) este mes`, text: "Revisalos en la seccion de gastos inusuales." }
        : { type: "positive", icon: "✅", title: "Sin gastos inusuales", text: "Tus gastos recientes estan dentro de tu patron habitual." }
    );

    container.innerHTML = html`${highlights.map(
      (item) => html`
        <article class="patterns-insight patterns-insight--${item.type}">
          <h3 class="patterns-insight__title">${item.icon} ${item.title}</h3>
          <p class="patterns-insight__text">${item.text}</p>
        </article>
      `
    )}`;
  }

  _renderStats(analysis) {
    const container = this.element.querySelector("#patternsStatsGrid");
    if (!container) {
      return;
    }

    const change = analysis.changeVsPreviousMonth;
    const stats = [
      { icon: "📊", label: "Gasto promedio mensual", value: formatCurrency(analysis.monthlyAverage), subtitle: "Meses completos anteriores" },
      {
        icon: "💸",
        label: "Gasto del mes",
        value: formatCurrency(analysis.totalThisMonth),
        subtitle: "Mes en curso",
        trend: change === null ? null : { direction: change > 0 ? "up" : "down", value: Math.abs(change), good: change <= 0 },
      },
      { icon: "📅", label: "Dia de mayor gasto", value: analysis.peakWeekday === null ? "--" : formatWeekday(analysis.peakWeekday), subtitle: "Acumulado historico" },
      { icon: "🔎", label: "Gastos inusuales", value: String(analysis.unusualExpenses.length), subtitle: "Ultimos 30 dias" },
    ];

    container.innerHTML = html`${stats.map(
      (stat) => html`
        <article class="kpi-card patterns-kpi-card">
          <div class="kpi-card__head">
            <p class="kpi-card__label">${stat.icon} ${stat.label}</p>
          </div>
          <p class="kpi-card__value">${stat.value}</p>
          <p class="kpi-card__sub">${stat.subtitle}</p>
          ${stat.trend
            ? html`<p class="kpi-card__trend ${stat.trend.good ? "kpi-card__trend--up" : "kpi-card__trend--down"}">${formatTrendLabel(stat.trend.direction, stat.trend.value, "vs. mes anterior")}</p>`
            : ""}
        </article>
      `
    )}`;
  }

  _renderCategoryList(byCategory) {
    const container = this.element.querySelector("#patternsCategoryList");
    if (!container) {
      return;
    }

    container.innerHTML = byCategory.length
      ? html`${byCategory.map(
          (item, index) => html`
            <article class="patterns-category-item">
              <div class="patterns-category-item__left">
                <span class="patterns-color-dot patterns-color-dot--c${(index % CHART_PALETTE_SIZE) + 1}"></span>
                <strong>${item.category}</strong>
              </div>
              <div class="patterns-category-item__right">
                <strong>${item.percentage}%</strong>
                <p>${formatCurrency(item.amount)}</p>
              </div>
            </article>
          `
        )}`
      : html`<p class="text-muted">Todavia no hay gastos registrados.</p>`;
  }

  _renderUnusualAlerts(unusualExpenses) {
    const container = this.element.querySelector("#patternsUnusualList");
    if (!container) {
      return;
    }

    container.innerHTML = unusualExpenses.length
      ? html`${unusualExpenses.map(
          (item) => html`
            <article class="patterns-unusual-alert patterns-unusual-alert--${item.deviationPercent >= 100 ? "high" : "medium"}">
              <h3>${item.merchant} · ${item.category}</h3>
              <p>Fecha ${formatDate(item.date)}</p>
              <p>Promedio de la categoria: ${formatCurrency(item.categoryAverage)}</p>
              <p>Detectado: ${formatCurrency(item.amount)}</p>
              <p class="patterns-unusual-alert__delta">+${item.deviationPercent}% sobre tu promedio</p>
            </article>
          `
        )}`
      : html`<p class="text-muted">No detectamos gastos inusuales en los ultimos 30 dias.</p>`;
  }

  _initCharts(analysis) {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();
    const colors = getChartThemeColors();
    const palette = getChartPalette();
    const axis = { ticks: { color: colors.label }, grid: { color: colors.grid } };
    const legend = { labels: { color: colors.label } };
    const monthLabels = analysis.byMonth.map((item) => formatMonth(item.month));

    this._addChart("#patternsCategoryChart", {
      type: "doughnut",
      data: {
        labels: analysis.byCategory.map((item) => item.category),
        datasets: [
          {
            data: analysis.byCategory.map((item) => item.percentage),
            backgroundColor: analysis.byCategory.map((_, index) => palette[index % palette.length]),
            borderColor: colors.border,
            borderWidth: 3,
          },
        ],
      },
      options: { cutout: "48%", plugins: { legend } },
    });

    this._addChart("#patternsEvolutionChart", {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Gasto Mensual",
            data: analysis.byMonth.map((item) => item.amount),
            borderColor: palette[0],
            backgroundColor: "transparent",
            tension: 0.34,
          },
        ],
      },
      options: { scales: { x: axis, y: axis }, plugins: { legend } },
    });

    const topCategories = analysis.byCategory.slice(0, EVOLUTION_TOP_CATEGORIES).map((item) => item.category);
    this._addChart("#patternsByCategoryChart", {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: topCategories.map((category, index) => ({
          label: category,
          data: analysis.byMonth.map(
            ({ month }) => analysis.byMonthCategory.find((item) => item.month === month && item.category === category)?.amount || 0
          ),
          borderColor: palette[index % palette.length],
          backgroundColor: "transparent",
          tension: 0.3,
        })),
      },
      options: { scales: { x: axis, y: axis }, plugins: { legend } },
    });

    this._addChart("#patternsUnusualChart", {
      type: "bar",
      data: {
        labels: analysis.unusualExpenses.map((item) => item.merchant),
        datasets: [
          { label: "Promedio de la categoria", data: analysis.unusualExpenses.map((item) => item.categoryAverage), backgroundColor: palette[7] },
          { label: "Gasto detectado", data: analysis.unusualExpenses.map((item) => item.amount), backgroundColor: palette[4] },
        ],
      },
      options: { scales: { x: axis, y: axis }, plugins: { legend } },
    });
  }

  _addChart(selector, config) {
    const canvas = this.element.querySelector(selector);
    if (canvas) {
      this.charts.push(new window.Chart(canvas, config));
    }
  }

  _destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  destroy() {
    this._destroyCharts();
    super.destroy();
  }
}
