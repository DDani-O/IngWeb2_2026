import { Component } from "../../core/Component.js";
import { MOCK_CONSUMPTION_PATTERNS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getChartThemeColors } from "../../utils/helpers.js";

export class PatronesPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_CONSUMPTION_PATTERNS));
    this.charts = [];
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const fallbackName = this.data.user.name;
    const userName = currentUser?.fullName || fallbackName;

    this._setText("#patternsUserName", userName);
    this._renderHighlights();
    this._renderStats();
    this._renderCategoryList();
    this._renderUnusualAlerts();
    this._initCharts();
  }

  _renderHighlights() {
    const container = this.element.querySelector("#patternsKeyInsights");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.highlights
      .map((item) => {
        return `
          <article class="patterns-insight patterns-insight--${item.type}">
            <h3 class="patterns-insight__title">${item.icon} ${item.title}</h3>
            <p class="patterns-insight__text">${item.text}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderStats() {
    const container = this.element.querySelector("#patternsStatsGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.stats
      .map((stat) => {
        return `
          <article class="kpi-card patterns-kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.icon} ${stat.label}</p>
            </div>
            <p class="kpi-card__value">${this._formatStatValue(stat)}</p>
            <p class="kpi-card__sub">${stat.subtitle}</p>
            <p class="kpi-card__trend ${
              stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down"
            }">${this._buildTrendLabel(stat)}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderCategoryList() {
    const container = this.element.querySelector("#patternsCategoryList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.categories
      .map((item) => {
        const colorToken = this._toToken(item.label);

        return `
          <article class="patterns-category-item">
            <div class="patterns-category-item__left">
              <span class="patterns-color-dot patterns-color-dot--${colorToken}"></span>
              <strong>${item.label}</strong>
            </div>
            <div class="patterns-category-item__right">
              <strong>${item.percentage}%</strong>
              <p>${formatCurrency(item.amount)}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderUnusualAlerts() {
    const container = this.element.querySelector("#patternsUnusualList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.unusualExpenses.alerts
      .map((alert) => {
        return `
          <article class="patterns-unusual-alert patterns-unusual-alert--${alert.severity}">
            <h3>${alert.title}</h3>
            <p>Fecha ${alert.date}</p>
            <p>Esperado: ${formatCurrency(alert.expected)}</p>
            <p>Detectado: ${formatCurrency(alert.detected)}</p>
            <p class="patterns-unusual-alert__delta">${alert.delta}</p>
          </article>
        `;
      })
      .join("");
  }

  _initCharts() {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();
    this.chartColors = getChartThemeColors();

    this._initCategoryChart();
    this._initMonthlyEvolutionChart();
    this._initCategoryEvolutionChart();
    this._initUnusualChart();
  }

  _initCategoryChart() {
    const canvas = this.element.querySelector("#patternsCategoryChart");
    if (!canvas) {
      return;
    }

    this.charts.push(
      new window.Chart(canvas, {
        type: "doughnut",
        data: {
          labels: this.data.categories.map((item) => item.label),
          datasets: [
            {
              data: this.data.categories.map((item) => item.percentage),
              backgroundColor: this.data.categories.map((item) => item.color),
              borderColor: this.chartColors.border,
              borderWidth: 3,
            },
          ],
        },
        options: {
          cutout: "48%",
          plugins: {
            legend: {
              labels: {
                color: this.chartColors.label,
              },
            },
          },
        },
      })
    );
  }

  _initMonthlyEvolutionChart() {
    const canvas = this.element.querySelector("#patternsEvolutionChart");
    if (!canvas) {
      return;
    }

    this.charts.push(
      new window.Chart(canvas, {
        type: "line",
        data: {
          labels: this.data.monthlyEvolution.labels,
          datasets: [
            {
              label: "Gasto Mensual",
              data: this.data.monthlyEvolution.values,
              borderColor: "#2dd4bf",
              backgroundColor: "rgba(45, 212, 191, 0.18)",
              fill: true,
              tension: 0.34,
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
            y: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
          },
          plugins: {
            legend: {
              labels: { color: this.chartColors.label },
            },
          },
        },
      })
    );
  }

  _initCategoryEvolutionChart() {
    const canvas = this.element.querySelector("#patternsByCategoryChart");
    if (!canvas) {
      return;
    }

    this.charts.push(
      new window.Chart(canvas, {
        type: "line",
        data: {
          labels: this.data.categoryEvolution.labels,
          datasets: this.data.categoryEvolution.series.map((series) => {
            return {
              label: series.name,
              data: series.values,
              borderColor: series.color,
              backgroundColor: "transparent",
              tension: 0.3,
            };
          }),
        },
        options: {
          scales: {
            x: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
            y: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
          },
          plugins: {
            legend: {
              labels: { color: this.chartColors.label },
            },
          },
        },
      })
    );
  }

  _initUnusualChart() {
    const canvas = this.element.querySelector("#patternsUnusualChart");
    if (!canvas) {
      return;
    }

    this.charts.push(
      new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: this.data.unusualExpenses.labels,
          datasets: [
            {
              label: "Promedio Esperado",
              data: this.data.unusualExpenses.expected,
              backgroundColor: "rgba(117, 138, 163, 0.5)",
              borderColor: "#758aa3",
              borderWidth: 1,
            },
            {
              label: "Gasto Detectado",
              data: this.data.unusualExpenses.detected,
              backgroundColor: "rgba(239, 68, 68, 0.35)",
              borderColor: "#ef4444",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
            y: {
              ticks: { color: this.chartColors.label },
              grid: { color: this.chartColors.grid },
            },
          },
          plugins: {
            legend: {
              labels: { color: this.chartColors.label },
            },
          },
        },
      })
    );
  }

  _formatStatValue(stat) {
    if (stat.format === "currency") {
      return formatCurrency(stat.value);
    }

    if (stat.format === "percent") {
      return `${stat.value}${stat.suffix || "%"}`;
    }

    if (stat.format === "number") {
      return `${stat.value}${stat.suffix || ""}`;
    }

    if (stat.format === "text") {
      return `${stat.value}${stat.suffix ? ` ${stat.suffix}` : ""}`;
    }

    return String(stat.value);
  }

  _buildTrendLabel(stat) {
    if (!stat.trendValue) {
      return stat.trendLabel || "Sin cambios";
    }

    const arrow = stat.trendDirection === "up" ? "▲" : "▼";
    return `${arrow} ${stat.trendValue}% ${stat.trendLabel || ""}`.trim();
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }

  _toToken(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
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
