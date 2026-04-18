import { Component } from "../../core/Component.js";
import { ROUTES, MOCK_USER_DASHBOARD } from "../../utils/constants.js";
import {
  buildHash,
  buildPlaceholderHashFromPreset,
  getInitials,
} from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class DashboardPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_USER_DASHBOARD));
    this.charts = [];
    this.chatModal = null;
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || this.data.user.name;

    const titleElement = this.element.querySelector("#userWelcomeTitle");
    if (titleElement) {
      titleElement.textContent = `Hola, ${userName.split(" ")[0]}`;
    }

    const subtitleElement = this.element.querySelector("#userWelcomeSubtitle");
    if (subtitleElement) {
      subtitleElement.textContent =
        "Tu resumen financiero esta listo. Revisa metricas, alertas y proximas acciones.";
    }

    this._renderPlaceholderLinks();
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
    const sendButton = this.element.querySelector("#advisorChatSendButton");
    const input = this.element.querySelector("#advisorChatInput");

    this.listen(openChatButton, "click", () => {
      this._openChatModal();
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

    [
      "#userLogoutButton",
      "#userLogoutButtonSidebar",
      "#userLogoutButtonMobile",
    ].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderPlaceholderLinks() {
    this.element.querySelectorAll(".js-placeholder-link").forEach((anchor) => {
      const preset = anchor.dataset.preset;
      anchor.setAttribute("href", buildPlaceholderHashFromPreset(preset));
    });
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
            <p class="kpi-card__value">${formatCurrency(stat.value)}${stat.suffix || ""}</p>
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
      <a class="action-btn action-btn--ghost" href="${buildHash(ROUTES.USER_PERFILES)}">
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
        const link = card.queryPreset
          ? buildPlaceholderHashFromPreset(card.queryPreset)
          : buildHash(card.route);

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
            <a class="action-btn action-btn--ghost mt-2" href="${link}">Ver detalle</a>
          </article>
        `;
      })
      .join("");
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
    container.textContent = `${advisor.name}: ${advisor.message}`;
  }

  _renderChatSeed() {
    const messages = this.element.querySelector("#advisorChatMessages");
    if (!messages) {
      return;
    }

    messages.innerHTML = `
      <div class="chat-message chat-message--advisor">
        Hola, soy ${this.data.advisor.name}. Puedo ayudarte a priorizar las recomendaciones de esta semana.
      </div>
    `;
  }

  _initCharts() {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();

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
                borderColor: "#0b1120",
                borderWidth: 2,
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
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
                ticks: { color: "#94a3b8" },
              },
              y: {
                ticks: { color: "#94a3b8" },
              },
            },
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
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
                borderColor: "#06b6d4",
                backgroundColor: "rgba(6, 182, 212, 0.2)",
                fill: true,
                tension: 0.35,
              },
            ],
          },
          options: {
            scales: {
              x: {
                ticks: { color: "#94a3b8" },
              },
              y: {
                ticks: { color: "#94a3b8" },
              },
            },
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
              },
            },
          },
        })
      );
    }
  }

  _openChatModal() {
    const modalElement = this.element.querySelector("#advisorChatModal");
    if (!modalElement || !window.bootstrap) {
      return;
    }

    this.chatModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    this.chatModal.show();
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
      "Gracias por tu mensaje. Revisare tus datos y te comparto una recomendacion concreta.";
    messages.appendChild(answerBubble);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion finalizada correctamente.", "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  _setText(selector, value) {
    const element = this.element.querySelector(selector);
    if (element) {
      element.textContent = value;
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
