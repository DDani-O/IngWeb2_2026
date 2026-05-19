import { PageController } from "../../core/PageController.js";
import { apiClient } from "../../core/APIClient.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getChartThemeColors, getInitials } from "../../utils/helpers.js";

export class PatronesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = null;
    this.charts = [];
    this.isLoading = false;
  }

  async render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "Usuario";

    this._setText("#patternsUserName", userName);
    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "U");

    // Cargar datos reales de la API
    await this._loadConsumptionAnalysis();

    if (this.data) {
      this._renderHighlights();
      this._renderStats();
      this._renderCategoryList();
      this._renderUnusualAlerts();
      this._initCharts();
    }
  }

  async _loadConsumptionAnalysis() {
    try {
      this.isLoading = true;
      const analysisData = await apiClient.get("/users/me/consumption-analysis?monthsBack=12");
      
      if (!analysisData) {
        throw new Error("No data received from server");
      }

      this.data = this._transformApiDataToPageFormat(analysisData);
    } catch (error) {
      console.error("Error loading consumption analysis:", error);
      this.element.innerHTML = `
        <div class="error-message" style="padding: 2rem; text-align: center;">
          <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">Error al cargar los patrones de consumo</p>
          <p style="color: #999;">${error.message}</p>
        </div>
      `;
    } finally {
      this.isLoading = false;
    }
  }

  _transformApiDataToPageFormat(apiData) {
    // apiData es: { highlights: {...}, categoryDistribution: [...], monthlyEvolution: [...], unusualExpenses: [...] }
    const highlights = apiData.highlights || {};
    const categoryDist = apiData.categoryDistribution || [];
    const monthlyEvo = apiData.monthlyEvolution || [];
    const unusualExp = apiData.unusualExpenses || [];

    // Construir highlights inteligentes
    const pageHighlights = [];
    if (monthlyEvo.length >= 2) {
      const latest = monthlyEvo[monthlyEvo.length - 1];
      const previous = monthlyEvo[monthlyEvo.length - 2];
      const change = latest.variationPercentage || 0;
      
      if (change < -5) {
        pageHighlights.push({
          type: "positive",
          icon: "📉",
          title: "Tendencia Positiva",
          text: `Tus gastos bajaron ${Math.abs(change).toFixed(1)}% respecto al mes anterior.`,
        });
      } else if (change > 5) {
        pageHighlights.push({
          type: "warning",
          icon: "📈",
          title: "Area de Atención",
          text: `Tus gastos aumentaron ${change.toFixed(1)}% respecto al mes anterior.`,
        });
      }
    }

    if (unusualExp.length > 0) {
      pageHighlights.push({
        type: "warning",
        icon: "⚠️",
        title: "Gastos Inusuales Detectados",
        text: `Se detectaron ${unusualExp.length} gastos potencialmente anómalos.`,
      });
    }

    // Construir stats
    const stats = [];
    const total = highlights.totalExpense || 0;
    const avg = highlights.averageExpense || 0;
    const maxExp = highlights.maxExpense || 0;
    const transCount = highlights.transactionCount || 0;

    stats.push({
      label: "Gasto Total",
      value: total,
      format: "currency",
      subtitle: "Período analizado",
      trendValue: 0,
      trendDirection: "stable",
      trendLabel: "",
      icon: "💰",
    });

    stats.push({
      label: "Promedio por Transacción",
      value: avg,
      format: "currency",
      subtitle: "Promedio de gastos",
      trendValue: 0,
      trendDirection: "stable",
      trendLabel: "",
      icon: "📅",
    });

    stats.push({
      label: "Mayor Gasto",
      value: maxExp,
      format: "currency",
      subtitle: `${transCount} transacciones`,
      trendValue: 0,
      trendDirection: "up",
      trendLabel: "",
      icon: "💳",
    });

    stats.push({
      label: "Gastos Inusuales",
      value: unusualExp.length,
      format: "number",
      suffix: " eventos",
      subtitle: "Detectados",
      trendValue: unusualExp.length > 0 ? 1 : 0,
      trendDirection: "up",
      trendLabel: unusualExp.length > 0 ? "revisa" : "ninguno",
      icon: "🚨",
    });

    // Construir categorías para chart (top 5)
    const categories = categoryDist.slice(0, 5).map((cat, idx) => {
      const colors = ["#3ad5c7", "#21b6d7", "#f6a40a", "#9952dd", "#e04697"];
      return {
        label: cat.categoryName || `Categoría ${idx + 1}`,
        percentage: Math.round(cat.percentage || 0),
        amount: cat.amount || 0,
        color: colors[idx % colors.length],
      };
    });

    // Construir evolución mensual
    const labels = monthlyEvo.map((entry) => {
      // entry.month es formato YYYY-MM
      const [year, month] = entry.month.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString("es-ES", { month: "short" });
    });

    const values = monthlyEvo.map((entry) => entry.totalExpense || 0);

    // Construir evolución por categoría (top 3)
    const categoryEvolution = {
      labels: labels,
      series: categoryDist.slice(0, 3).map((cat, idx) => {
        const colors = ["#3ad5c7", "#21b6d7", "#f6a40a"];
        // Para simplificar: distribuir proporcionalmente cada mes
        const avgPerMonth = (cat.amount / (monthlyEvo.length || 1));
        return {
          name: cat.categoryName || `Cat ${idx + 1}`,
          color: colors[idx % colors.length],
          values: monthlyEvo.map(() => avgPerMonth),
        };
      }),
    };

    // Construir gastos inusuales para chart (top 5)
    const unusualLabels = unusualExp.slice(0, 5).map((exp) => exp.category || "Otros");
    const unusualExpected = unusualExp.slice(0, 5).map((exp) => {
      // Estimado basado en z-score
      return exp.amount / Math.max(exp.anomalyScore || 1, 0.1);
    });
    const unusualDetected = unusualExp.slice(0, 5).map((exp) => exp.amount);

    return {
      highlights: pageHighlights && pageHighlights.length > 0 ? pageHighlights : [{
        type: "positive",
        icon: "✅",
        title: "Gastos bajo control",
        text: "No se detectaron anomalías significativas.",
      }],
      stats,
      categories,
      monthlyEvolution: { labels, values },
      categoryEvolution,
      unusualExpenses: {
        labels: unusualLabels,
        expected: unusualExpected,
        detected: unusualDetected,
        alerts: unusualExp.map((exp) => ({
          title: `${exp.category} (${exp.reason === "HIGH_ZSCORE" ? "Alta" : "Percentil"})`,
          date: new Date(exp.date).toLocaleDateString("es-ES"),
          expected: exp.amount / Math.max(exp.anomalyScore || 1, 0.1),
          detected: exp.amount,
          delta: `Score: ${(exp.anomalyScore || 0).toFixed(2)}`,
          severity: exp.anomalyScore > 0.7 ? "high" : "medium",
        })),
      },
    };
  }

  attachEvents() {
    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
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
