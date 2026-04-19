import { Component } from "../../core/Component.js";
import { MOCK_ADVISOR_DASHBOARD, ROUTES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class AsesorDashboardPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_ADVISOR_DASHBOARD));
    this.clientsViewMode = "cards";
    this.recommendationModal = null;
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const fullName = currentUser?.fullName || this.data.advisor.name;
    const firstName = fullName.split(" ")[0] || fullName;

    this._setText("#advisorTopbarName", fullName);
    this._setText("#advisorWelcomeTitle", `Hola, ${firstName}!`);

    this._renderCalendar();
    this._renderAlerts();
    this._renderStats();
    this._renderClients();
    this._renderInbox();
    this._renderRecommendations();
    this._renderRecommendationClientOptions();
    this._syncClientsView();
  }

  attachEvents() {
    const toggleViewButton = this.element.querySelector("#advisorClientsViewToggle");
    this.listen(toggleViewButton, "click", () => {
      this.clientsViewMode = this.clientsViewMode === "cards" ? "table" : "cards";
      this._syncClientsView();
    });

    const recommendationButton = this.element.querySelector("#openCreateRecommendationButton");
    this.listen(recommendationButton, "click", () => this._openRecommendationModal());

    const recommendationForm = this.element.querySelector("#advisorRecommendationForm");
    this.listen(recommendationForm, "submit", (event) => {
      event.preventDefault();
      this._handleCreateRecommendation();
    });

    const inboxList = this.element.querySelector("#advisorInboxList");
    this.listen(inboxList, "click", (event) => this._handleInboxNavigation(event));
    this.listen(inboxList, "keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      this._handleInboxNavigation(event);
    });

    ["#advisorLogoutButton", "#advisorLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderCalendar() {
    this._setText("#advisorCalendarDay", this.data.calendar.day);
    this._setText("#advisorCalendarMonth", this.data.calendar.month);
    this._setText("#advisorCalendarYear", this.data.calendar.year);
    this._setText("#advisorCalendarDayName", this.data.calendar.dayName);
  }

  _renderAlerts() {
    const container = this.element.querySelector("#advisorAlertsList");
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
    const container = this.element.querySelector("#advisorStatsGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.stats
      .map((stat) => {
        return `
          <article class="kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.label}</p>
              <span>${stat.emoji}</span>
            </div>
            <p class="kpi-card__value">${this._formatStatValue(stat)}</p>
            <p class="kpi-card__trend ${
              stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down"
            }">${formatTrendLabel(stat.trendDirection, stat.trendValue, stat.trendLabel)}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderClients() {
    const cardsContainer = this.element.querySelector("#advisorClientsCards");
    const tableBody = this.element.querySelector("#advisorClientsTableBody");
    const count = this.element.querySelector("#advisorClientsCount");

    if (!cardsContainer || !tableBody) {
      return;
    }

    if (count) {
      count.textContent = String(this.data.clients.length);
    }

    cardsContainer.innerHTML = this.data.clients
      .map((client) => {
        return `
          <article class="advisor-client-card">
            <div class="advisor-client-head">
              <div class="d-flex gap-2 align-items-start">
                <span class="avatar-badge">${getInitials(client.name)}</span>
                <div>
                  <p class="advisor-client-name">${client.name}</p>
                  <p class="advisor-client-mail">${client.profile}</p>
                </div>
              </div>
              <span class="risk-pill risk-pill--${client.riskLevel}">${client.risk}</span>
            </div>

            ${
              client.unreadMessages
                ? `<p class="advisor-client-unread"><i class="fa-solid fa-envelope"></i> ${client.unreadMessages} mensaje(s) sin leer</p>`
                : ""
            }

            <div class="advisor-client-metrics">
              <div>
                <p>ULTIMO GASTO</p>
                <strong>${client.lastExpense}</strong>
              </div>
              <div>
                <p>GASTO PROMEDIO</p>
                <strong>${formatCurrency(client.averageSpend)}</strong>
              </div>
            </div>

            <p class="advisor-client-change advisor-client-change--${
              client.changePercent >= 0 ? "up" : "down"
            }">
              ${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%
            </p>
            <a class="action-btn action-btn--ghost mt-2" href="#/asesor/clientes">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Gestionar cliente
            </a>
          </article>
        `;
      })
      .join("");

    tableBody.innerHTML = this.data.clients
      .map((client) => {
        return `
          <tr>
            <td>
              <div class="advisor-table-client">
                <span class="avatar-badge">${getInitials(client.name)}</span>
                <strong>${client.name}</strong>
              </div>
            </td>
            <td>${client.profile}</td>
            <td>${client.lastExpense}</td>
            <td>${formatCurrency(client.averageSpend)}</td>
            <td class="advisor-client-change advisor-client-change--${
              client.changePercent >= 0 ? "up" : "down"
            }">${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%</td>
            <td>${client.unreadMessages > 0 ? client.unreadMessages : "-"}</td>
            <td><span class="risk-pill risk-pill--${client.riskLevel}">${client.risk}</span></td>
            <td>
              <a class="action-btn action-btn--ghost" href="#/asesor/clientes">
                Gestionar
              </a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  _renderInbox() {
    const container = this.element.querySelector("#advisorInboxList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.inbox
      .map((message) => {
        const badge = message.type === "ticket" ? "TICKET" : "MENSAJE";
        return `
          <article
            class="inbox-item ${message.unread ? "inbox-item--unread" : ""}"
            data-message-id="${message.id}"
            tabindex="0"
            role="button"
            aria-label="Abrir mensaje de ${message.from}"
          >
            <span class="avatar-badge">${getInitials(message.from)}</span>
            <div>
              <p class="inbox-title">
                ${message.from}
                <span class="inbox-badge">${badge}</span>
              </p>
              <p class="inbox-sub">${message.subject}</p>
            </div>
            <div class="text-end">
              <p class="inbox-sub">${message.date}</p>
              ${message.unread ? '<span class="badge-soft badge-soft--success">Nuevo</span>' : ""}
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderRecommendations() {
    const container = this.element.querySelector("#advisorRecommendationsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.recommendations
      .map((column) => {
        return `
          <article class="advisor-rec-column">
            <div class="advisor-rec-column__head">
              <span>${column.icon}</span>
              <div>
                <h3>${column.title}</h3>
                <p>${column.count} recomendaciones</p>
              </div>
            </div>
            <div class="advisor-rec-column__list">
              ${column.items
                .map((item) => `<p><span>${item.clientName}</span><strong>${item.action}</strong></p>`)
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderRecommendationClientOptions() {
    const select = this.element.querySelector("#advisorRecommendationClient");
    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">Seleccionar cliente</option>
      ${this.data.clients
        .map((client) => `<option value="${client.id}">${client.name}</option>`)
        .join("")}
    `;
  }

  _syncClientsView() {
    const cards = this.element.querySelector("#advisorClientsCards");
    const tableWrap = this.element.querySelector("#advisorClientsTableWrap");
    const toggle = this.element.querySelector("#advisorClientsViewToggle");

    if (!cards || !tableWrap || !toggle) {
      return;
    }

    const showTable = this.clientsViewMode === "table";
    cards.classList.toggle("app-hidden", showTable);
    tableWrap.classList.toggle("app-hidden", !showTable);

    toggle.innerHTML = showTable
      ? '<i class="fa-solid fa-border-all"></i> Ver como Cards'
      : '<i class="fa-solid fa-table"></i> Ver como Tabla';
  }

  _openRecommendationModal() {
    if (!window.bootstrap) {
      return;
    }

    const modalElement = this.element.querySelector("#advisorRecommendationModal");
    this.recommendationModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    this.recommendationModal.show();
  }

  _handleCreateRecommendation() {
    const form = this.element.querySelector("#advisorRecommendationForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.options.showToast?.("Recomendacion creada y enviada al cliente.", "success");
    this.recommendationModal?.hide();
    form.reset();
  }

  _handleInboxNavigation(event) {
    const target = event.target.closest("[data-message-id]");
    if (!target) {
      return;
    }

    event.preventDefault();
    this.options.router?.navigate(ROUTES.ADVISOR_INBOX, {
      messageId: target.dataset.messageId,
    });
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion de asesor finalizada.", "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  _formatStatValue(stat) {
    if (stat.format === "percent") {
      return `${stat.value}${stat.suffix || "%"}`;
    }

    if (String(stat.label).toLowerCase().includes("gasto")) {
      return formatCurrency(stat.value);
    }

    return String(stat.value);
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }
}
