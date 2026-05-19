import { PageController } from "../../core/PageController.js";
import { apiClient } from "../../core/APIClient.js";
import { ROUTES } from "../../utils/constants.js";
import {
  buildHash,
  getChartThemeColors,
} from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class DashboardPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = null;
    this.charts = [];
    this.chatModal = null;
    this.isLoading = false;
    this.loadError = null;
  }

  async render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const shortName = (currentUser?.fullName || "Usuario").split(" ")[0];

    const titleElement = this.element.querySelector("#userWelcomeTitle");
    if (titleElement) {
      titleElement.textContent = `Hola, ${shortName}!`;
    }

    this._setText("#userTopbarName", currentUser?.fullName || "Usuario");

    const subtitleElement = this.element.querySelector("#userWelcomeSubtitle");
    if (subtitleElement) {
      subtitleElement.textContent =
        "Tu resumen financiero esta listo. Explora tus patrones de gasto y descubre como mejorar tu economia personal.";
    }

    // Cargar datos reales de la API
    await this._loadDashboardData();

    if (this.data) {
      this._renderCalendar();
      this._renderAlerts();
      this._renderStats();
      this._renderProfileCard();
      this._renderSummaryCards();
      this._renderMerchants();
      this._renderAdvisorMessage();
      this._initCharts();
    } else {
      this._renderEmptyState();
    }
  }

  async _loadDashboardData() {
    try {
      this.isLoading = true;
      this.loadError = null;

      const [dashboardData, consumptionData] = await Promise.all([
        apiClient.get("/users/me/dashboard"),
        apiClient.get("/users/me/consumption-analysis?monthsBack=6"),
      ]);

      if (!dashboardData) {
        throw new Error("No se pudieron cargar los datos del dashboard");
      }

      this.data = this._transformApiDataToPageFormat(dashboardData, consumptionData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.loadError = error?.message || "No se pudo cargar el dashboard.";
      this.data = null;
    } finally {
      this.isLoading = false;
    }
  }

  _transformApiDataToPageFormat(dashboardData, consumptionData) {
    const consumption = consumptionData || {};
    const highlights = consumption.highlights || {};
    const categoryDist = consumption.categoryDistribution || [];
    const monthlyEvo = consumption.monthlyEvolution || [];
    const recommendations = dashboardData.recommendations || {};
    const profile = dashboardData.profile || {};
    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "Usuario";

    const now = new Date();
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const dayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    const stats = [];
    const totalSpent = highlights.totalExpense || 0;
    const avgExpense = highlights.averageExpense || 0;

    stats.push({
      key: "totalSpent",
      label: "Total Gastado",
      value: totalSpent,
      format: "currency",
      emoji: "💸",
      subtitle: "Últimos 6 meses",
      trendValue: 0,
      trendDirection: "stable",
      trendLabel: "",
    });

    stats.push({
      key: "budgetLeft",
      label: "Promedio por Transacción",
      value: avgExpense,
      format: "currency",
      emoji: "💳",
      subtitle: "Promedio calculado",
      trendValue: 0,
      trendDirection: "stable",
      trendLabel: "",
    });

    stats.push({
      key: "activeRecommendations",
      label: "Recomendaciones Activas",
      value: recommendations.activeRecommendations || 0,
      format: "number",
      emoji: "📝",
      subtitle: "Basado en tus sugerencias actuales",
      trendValue: 0,
      trendDirection: "stable",
      trendLabel: "",
    });

    const alerts = [];
    if (monthlyEvo.length >= 2) {
      const latest = monthlyEvo[monthlyEvo.length - 1];
      const variation = latest.variationPercentage || 0;

      if (variation > 15) {
        alerts.push({
          icon: "⚠️",
          title: "Has gastado más de lo normal",
          description: `Tus gastos aumentaron ${variation.toFixed(1)}% respecto al mes anterior.`,
          level: "danger",
        });
      } else if (variation < -10) {
        alerts.push({
          icon: "✅",
          title: "Buen control de gastos",
          description: `Has reducido tu gasto ${Math.abs(variation).toFixed(1)}% en relación al mes anterior.`,
          level: "success",
        });
      }
    }

    if (alerts.length === 0) {
      alerts.push({
        icon: "✅",
        title: "Finanzas bajo control",
        description: "No se detectaron anomalías significativas.",
        level: "success",
      });
    }

    const currency = profile.currency || "ARS";
    const mostFrequentMerchant = highlights.mostFrequentMerchant || "Sin datos";
    const merchantItems = [
      {
        name: mostFrequentMerchant,
        icon: "🏪",
        spending:
          highlights.maxExpense && highlights.maxExpense > 0
            ? formatCurrency(highlights.maxExpense, currency)
            : "Sin registros",
      },
    ];

    const categoryItems = categoryDist.slice(0, 4).map((cat) => ({
      label: cat.categoryName || "Otro",
      value: `${Math.round(cat.percentage || 0)}%`,
    }));

    const monthLabels = monthlyEvo.map((entry) => {
      const [year, month] = entry.month.split("-");
      const date = new Date(year, parseInt(month, 10) - 1);
      return date.toLocaleDateString("es-ES", { month: "short" });
    });

    return {
      user: {
        id: profile.userId || "",
        name: userName,
        activeProfile: profile.occupation || "Sin perfil activo",
      },
      calendar: {
        day: String(now.getDate()).padStart(2, "0"),
        month: months[now.getMonth()],
        year: String(now.getFullYear()),
        dayName: dayNames[now.getDay()],
      },
      alerts,
      stats,
      profileCard: {
        name: profile.occupation ? "Perfil Activo" : "Perfil no cargado",
        description: profile.financialGoal
          ? `Objetivo: ${profile.financialGoal}`
          : "Actualiza tu información financiera para obtener recomendaciones más precisas.",
        categories: categoryDist.slice(0, 4).map((cat) => cat.categoryName || "Otros"),
      },
      summaryCards: [
        {
          title: "Patrones de Consumo",
          subtitle: `${categoryDist.length} categorías`,
          icon: "fa-chart-pie",
          accent: "teal",
          items: categoryItems.length
            ? categoryItems
            : [{ label: "Sin datos", value: "-" }],
          route: ROUTES.USER_PATRONES,
        },
        {
          title: "Recomendaciones",
          subtitle: `${recommendations.activeRecommendations || 0} activas`,
          icon: "fa-lightbulb",
          accent: "cyan",
          items: [
            {
              label: "Ahorro potencial",
              value: formatCurrency(recommendations.totalSavingsPotential || 0, currency),
            },
          ],
          route: ROUTES.USER_RECOMENDACIONES,
        },
      ],
      charts: {
        categoryDistribution: categoryDist.slice(0, 5).map((cat, idx) => {
          const colors = [
            "#2dd4bf",
            "#06b6d4",
            "#f59e0b",
            "#a855f7",
            "#ec4899",
          ];
          return {
            label: cat.categoryName || `Cat ${idx + 1}`,
            value: Math.round(cat.percentage || 0),
            color: colors[idx % colors.length],
          };
        }),
        monthlyExpenses: monthlyEvo.map((entry) => entry.totalExpense || 0),
        monthlyLabels: monthLabels,
        dailySeries: monthlyEvo.map((entry) => (entry.totalExpense || 0) / 30),
        dailyLabels: ["L", "M", "X", "J", "V", "S", "D"],
        merchants: merchantItems,
      },
      advisor: {
        name: "Tu Asesor",
        title: "Soporte Financiero",
        avatar: "👨‍💼",
        message: "Estoy disponible para ayudarte a optimizar tus gastos y patrones.",
      },
    };
  }

  attachEvents() {
    const openChatButton = this.element.querySelector("#openAdvisorChatButton");
    const openChatBubble = this.element.querySelector("#openAdvisorChatBubble");
    const closeTeaser = this.element.querySelector("#advisorTeaserClose");
    const sendButton = this.element.querySelector("#advisorChatSendButton");
    const input = this.element.querySelector("#advisorChatInput");

    this.listen(openChatButton, "click", () => {
      this._openChatModal();
    });

    this.listen(openChatBubble, "click", () => {
      this._openChatModal();
    });

    this.listen(closeTeaser, "click", () => {
      const teaser = this.element.querySelector("#advisorTeaserCard");
      teaser?.classList.add("app-hidden");
    });

    this.listen(sendButton, "click", () => {
      this._sendChatMessage();
    });

    this.listen(input, "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this._sendChatMessage();
      }
    });

    this._bindLogoutButtons();
  }

  _renderCalendar() {
    const { calendar } = this.data;

    this._setText("#userCalendarDay", calendar.day);
    this._setText("#userCalendarMonth", calendar.month);
    this._setText("#userCalendarYear", calendar.year);
    this._setText("#userCalendarDayName", calendar.dayName);
  }

  _renderAlerts() {
    const container = this.element.querySelector("#userAlertsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.alerts
      .map((alert) => {
        return `
          <article class="alert-card alert-card--${alert.level}">
            <div>${alert.icon}</div>
            <div>
              <h3 class="alert-card__title">${alert.title}</h3>
              <p class="alert-card__description">${alert.description}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderStats() {
    const container = this.element.querySelector("#userStatsGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.stats
      .map((stat) => {
        const trendClass =
          stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down";

        return `
          <article class="kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.label}</p>
              <span>${stat.emoji}</span>
            </div>
            <p class="kpi-card__value">${this._formatStatValue(stat)}</p>
            <p class="kpi-card__sub">${stat.subtitle}</p>
            <p class="kpi-card__trend ${trendClass}">${formatTrendLabel(
              stat.trendDirection,
              stat.trendValue,
              stat.trendLabel
            )}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderProfileCard() {
    const container = this.element.querySelector("#userProfileCard");
    if (!container) {
      return;
    }

    const { profileCard } = this.data;

    container.innerHTML = `
      <div>
        <h2 class="section-title mb-1">
          <i class="fa-solid fa-user-shield accent"></i>
          Perfil Activo: ${profileCard.name}
        </h2>
        <p class="text-muted">${profileCard.description}</p>
        <div class="profile-highlight__tags">
          ${profileCard.categories
            .map((category) => `<span class="profile-tag">${category}</span>`)
            .join("")}
        </div>
      </div>
      <a class="action-btn action-btn--ghost" href="${buildHash(
        ROUTES.USER_PERFILES
      )}" target="_blank">
        <i class="fa-solid fa-rotate"></i>
        Cambiar perfil
      </a>
    `;
  }

  _renderSummaryCards() {
    const container = this.element.querySelector("#userSummaryGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.summaryCards
      .map((card) => {
        const link = buildHash(card.route);
        const openInNewTab = this._isSecondaryPageRoute(card.route);

        return `
          <article class="summary-card">
            <h3 class="summary-card__title">
              <i class="fa-solid ${card.icon} accent"></i>
              ${card.title}
            </h3>
            <p class="text-muted mb-2">${card.subtitle}</p>
            <div class="summary-card__list">
              ${card.items
                .map((item) => {
                  return `<div class="summary-card__row"><span>${item.label}</span><strong>${item.value}</strong></div>`;
                })
                .join("")}
            </div>
            <a class="action-btn action-btn--ghost mt-2" href="${link}" ${
              openInNewTab ? 'target="_blank"' : ""
            }>Ver detalle</a>
          </article>
        `;
      })
      .join("");
  }

  _isSecondaryPageRoute(route) {
    return [
      ROUTES.USER_HISTORIAL,
      ROUTES.USER_PATRONES,
      ROUTES.USER_PERFIL,
      ROUTES.USER_PERFILES,
      ROUTES.USER_RECOMENDACIONES,
    ].includes(route);
  }

  _renderMerchants() {
    const container = this.element.querySelector("#userMerchantsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.charts.merchants
      .map((merchant) => {
        return `
          <div class="merchant-item">
            <div class="merchant-item__left">
              <span>${merchant.icon}</span>
              <div>
                <p>${merchant.name}</p>
              </div>
            </div>
            <strong>${merchant.spending}</strong>
          </div>
        `;
      })
      .join("");
  }

  _renderAdvisorMessage() {
    const container = this.element.querySelector("#advisorPanelMessage");
    if (!container || !this.data) {
      return;
    }

    const { advisor } = this.data;
    container.textContent = `${advisor.name} está disponible ahora. Puedes pedir una guía rápida para optimizar tus gastos.`;
  }

  _renderEmptyState() {
    this._destroyCharts();

    const emptyMessage = this.loadError
      ? `No se pudieron cargar datos reales: ${this.loadError}`
      : "No hay datos disponibles en este momento.";

    const containers = [
      "#userAlertsList",
      "#userStatsGrid",
      "#userProfileCard",
      "#userSummaryGrid",
      "#userMerchantsList",
    ];

    containers.forEach((selector) => {
      const container = this.element.querySelector(selector);
      if (container) {
        container.innerHTML = "";
      }
    });

    const alertContainer = this.element.querySelector("#userAlertsList");
    if (alertContainer) {
      alertContainer.innerHTML = `
        <article class="alert-card alert-card--warning">
          <div>ℹ️</div>
          <div>
            <h3 class="alert-card__title">Sin datos reales</h3>
            <p class="alert-card__description">${emptyMessage}</p>
          </div>
        </article>
      `;
    }
  }

  /**
   * Inicializa todos los gráficos de la página si Chart.js está disponible
   * @private
   */
  _initCharts() {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();
    const chartColors = getChartThemeColors();

    const categoryCtx = this.element.querySelector("#userCategoryChart");
    const monthlyCtx = this.element.querySelector("#userMonthlyChart");
    const dailyCtx = this.element.querySelector("#userDailyChart");

    if (categoryCtx) {
      this._initCategoryChart(categoryCtx, chartColors);
    }

    if (monthlyCtx) {
      this._initMonthlyChart(monthlyCtx, chartColors);
    }

    if (dailyCtx) {
      this._initDailyChart(dailyCtx, chartColors);
    }
  }

  /**
   * Inicializa el gráfico de distribución de categorías (doughnut)
   * @private
   * @param {HTMLElement} ctx - Canvas context
   * @param {object} chartColors - Colores temáticos del gráfico
   */
  _initCategoryChart(ctx, chartColors) {
    this.charts.push(
      new window.Chart(ctx, {
        type: "doughnut",
        data: {
          labels: this.data.charts.categoryDistribution.map((item) => item.label),
          datasets: [
            {
              data: this.data.charts.categoryDistribution.map((item) => item.value),
              backgroundColor: this.data.charts.categoryDistribution.map(
                (item) => item.color
              ),
              borderColor: chartColors.border,
              borderWidth: 2,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              labels: { color: chartColors.label },
            },
          },
        },
      })
    );
  }

  /**
   * Inicializa el gráfico de gastos mensuales (bar chart)
   * @private
   * @param {HTMLElement} ctx - Canvas context
   * @param {object} chartColors - Colores temáticos del gráfico
   */
  _initMonthlyChart(ctx, chartColors) {
    this.charts.push(
      new window.Chart(ctx, {
        type: "bar",
        data: {
          labels: this.data.charts.monthlyLabels,
          datasets: [
            {
              label: "Gasto Mensual",
              data: this.data.charts.monthlyExpenses,
              backgroundColor: "rgba(45, 212, 191, 0.4)",
              borderColor: "#2dd4bf",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: { color: chartColors.label },
              grid: { color: chartColors.grid },
            },
            y: {
              ticks: { color: chartColors.label },
              grid: { color: chartColors.grid },
            },
          },
          plugins: {
            legend: {
              labels: { color: chartColors.label },
            },
          },
        },
      })
    );
  }

  /**
   * Inicializa el gráfico de gastos diarios (line chart)
   * @private
   * @param {HTMLElement} ctx - Canvas context
   * @param {object} chartColors - Colores temáticos del gráfico
   */
  _initDailyChart(ctx, chartColors) {
    this.charts.push(
      new window.Chart(ctx, {
        type: "line",
        data: {
          labels: this.data.charts.dailyLabels,
          datasets: [
            {
              label: "Gasto Diario",
              data: this.data.charts.dailySeries,
              borderColor: chartColors.info,
              backgroundColor: "rgba(6, 182, 212, 0.2)",
              fill: true,
              tension: 0.35,
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: { color: chartColors.label },
              grid: { color: chartColors.grid },
            },
            y: {
              ticks: { color: chartColors.label },
              grid: { color: chartColors.grid },
            },
          },
          plugins: {
            legend: {
              labels: { color: chartColors.label },
            },
          },
        },
      })
    );
  }

  _openChatModal() {
    this.chatModal = this._showModal("#advisorChatModal");
  }

  _sendChatMessage() {
    const input = this.element.querySelector("#advisorChatInput");
    const messages = this.element.querySelector("#advisorChatMessages");

    if (!input || !messages) {
      return;
    }

    const message = input.value.trim();
    if (!message) {
      return;
    }

    const userBubble = document.createElement("div");
    userBubble.className = "chat-message chat-message--user";
    userBubble.textContent = message;
    messages.appendChild(userBubble);

    const answerBubble = document.createElement("div");
    answerBubble.className = "chat-message chat-message--advisor";
    answerBubble.textContent =
      "Muy buena observacion. Te preparo una recomendacion puntual en base a tus datos recientes.";
    messages.appendChild(answerBubble);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }

  _destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  _formatStatValue(stat) {
    if (stat.format === "percent") {
      return `${stat.value}${stat.suffix || "%"}`;
    }

    if (stat.format === "text") {
      return `${stat.value}${stat.suffix ? ` ${stat.suffix}` : ""}`;
    }

    if (stat.format === "number") {
      return `${stat.value}${stat.suffix || ""}`;
    }

    return `${formatCurrency(stat.value)}${stat.suffix || ""}`;
  }

  destroy() {
    this._destroyCharts();
    super.destroy();
  }
}
