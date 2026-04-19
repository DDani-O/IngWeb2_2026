import { PageController } from "../../core/PageController.js";
import { ROUTES, MOCK_USER_DASHBOARD } from "../../utils/constants.js";
import {
  buildHash,
  getChartThemeColors,
} from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class DashboardPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_USER_DASHBOARD));
    this.charts = [];
    this.chatModal = null;
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || this.data.user.name;
    const shortName = userName.split(" ")[0] || userName;

    const titleElement = this.element.querySelector("#userWelcomeTitle");
    if (titleElement) {
      titleElement.textContent = `Hola, ${shortName}!`;
    }

    this._setText("#userTopbarName", userName);

    const subtitleElement = this.element.querySelector("#userWelcomeSubtitle");
    if (subtitleElement) {
      subtitleElement.textContent =
        "Tu resumen financiero esta listo. Explora tus patrones de gasto y descubre como mejorar tu economia personal.";
    }

    this._renderCalendar();
    this._renderAlerts();
    this._renderStats();
    this._renderProfileCard();
    this._renderSummaryCards();
    this._renderMerchants();
    this._renderAdvisorMessage();
    this._renderChatSeed();
    this._initCharts();
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
    if (!container) {
      return;
    }

    const { advisor } = this.data;
    container.textContent = `${advisor.name} esta disponible ahora. Puedes pedir una guia rapida para optimizar tus gastos.`;
  }

  _renderChatSeed() {
    const messages = this.element.querySelector("#advisorChatMessages");
    if (!messages) {
      return;
    }

    messages.innerHTML = `
      <div class="chat-message chat-message--advisor">
        Hola, soy ${this.data.advisor.name}. Estoy aqui para ayudarte a priorizar tus recomendaciones de esta semana.
      </div>
    `;
  }

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
      this.charts.push(
        new window.Chart(categoryCtx, {
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

    if (monthlyCtx) {
      this.charts.push(
        new window.Chart(monthlyCtx, {
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

    if (dailyCtx) {
      this.charts.push(
        new window.Chart(dailyCtx, {
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
