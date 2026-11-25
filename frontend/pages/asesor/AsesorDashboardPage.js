import { PageController } from "../../core/PageController.js";
import {
  fillRecommendationClients,
  mountAdvisorRecommendationModal,
  readRecommendationForm,
} from "../../components/modals/AdvisorRecommendationModal.js";
import { analysisService } from "../../services/analysis.service.js";
import { clientsService } from "../../services/clients.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { RISK_LEVELS, ROUTES } from "../../utils/constants.js";
import { formatCurrency, formatDaysAgo } from "../../utils/formatters.js";
import { buildHash, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const MODAL_PREFIX = "advisorRecommendation";
const ALERT_ICONS = { danger: "⚠️", warning: "👥", success: "⭐", info: "📨" };
const BOARD_ITEMS_PER_COLUMN = 3;

/**
 * Dashboard del asesor: estado de la cartera, clientes asignados y últimas recomendaciones enviadas.
 */
export class AsesorDashboardPage extends PageController {
  static template = "./pages/asesor/dashboard.html";

  constructor(element, options = {}) {
    super(element, options);
    this.clients = [];
    this.clientsViewMode = "cards";
  }

  render() {
    const fullName = this.options.authManager?.getCurrentUser()?.fullName || "";
    const firstName = fullName.split(" ")[0] || fullName;
    this._setText("#advisorWelcomeTitle", firstName ? `Hola, ${firstName}!` : "Hola!");
    this._renderCalendar();
    this._syncClientsView();
    const modalReady = this._mountRecommendationModal();

    this._loadData(async () => {
      const [summary, clients, sent] = await Promise.all([
        analysisService.getAdvisorSummary(),
        clientsService.list(),
        recommendationsService.listSent({ limit: 10 }),
        modalReady,
      ]);
      if (!this._isAlive()) {
        return;
      }

      this.clients = clients;
      this._renderAlerts(summary.alerts);
      this._renderStats(summary);
      this._renderClients();
      this._renderRecommendations(sent);
      fillRecommendationClients(this.element, MODAL_PREFIX, clients);
    });
  }

  attachEvents() {
    this.listen(this.element.querySelector("#advisorClientsViewToggle"), "click", () => {
      this.clientsViewMode = this.clientsViewMode === "cards" ? "table" : "cards";
      this._syncClientsView();
    });

    this.listen(this.element.querySelector("#openCreateRecommendationButton"), "click", () => {
      this._showModal(`#${MODAL_PREFIX}Modal`);
    });

  }

  /**
   * Inserta el modal de nueva recomendación en su slot y engancha el envío del formulario.
   */
  async _mountRecommendationModal() {
    await mountAdvisorRecommendationModal(this.element, {
      slotSelector: "#advisorRecommendationModalSlot",
      idPrefix: MODAL_PREFIX,
    });

    this.listen(this.element.querySelector(`#${MODAL_PREFIX}Form`), "submit", (event) => {
      event.preventDefault();
      this._handleCreateRecommendation(event.target);
    });
  }

  _renderCalendar() {
    const today = new Date();
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    this._setText("#advisorCalendarDay", String(today.getDate()));
    this._setText("#advisorCalendarMonth", capitalize(today.toLocaleDateString("es-AR", { month: "long" })));
    this._setText("#advisorCalendarYear", String(today.getFullYear()));
    this._setText("#advisorCalendarDayName", capitalize(today.toLocaleDateString("es-AR", { weekday: "long" })));
  }

  _renderAlerts(alerts) {
    const container = this.element.querySelector("#advisorAlertsList");
    if (!container) {
      return;
    }

    container.innerHTML = html`${alerts.map(
      (alert) => html`
        <article class="alert-card alert-card--${alert.level}">
          <div>${ALERT_ICONS[alert.level] || "💡"}</div>
          <div>
            <h3 class="alert-card__title">${alert.title}</h3>
            <p class="alert-card__description">${alert.description}</p>
          </div>
        </article>
      `
    )}`;
  }

  _renderStats(summary) {
    const container = this.element.querySelector("#advisorStatsGrid");
    if (!container) {
      return;
    }

    const readRate = summary.sentRecommendations
      ? Math.round((summary.readRecommendations / summary.sentRecommendations) * 100)
      : 0;
    const stats = [
      { label: "Clientes Activos", emoji: "👥", value: String(summary.activeClients), subtitle: "Asignados a tu cartera" },
      { label: "Recomendaciones leidas", emoji: "📈", value: `${readRate}%`, subtitle: `${summary.readRecommendations} de ${summary.sentRecommendations} enviadas` },
      { label: "Clientes con gastos inusuales", emoji: "📌", value: String(summary.clientsWithAlerts), subtitle: "Requieren seguimiento" },
    ];

    container.innerHTML = html`${stats.map(
      (stat) => html`
        <article class="kpi-card">
          <div class="kpi-card__head">
            <p class="kpi-card__label">${stat.label}</p>
            <span>${stat.emoji}</span>
          </div>
          <p class="kpi-card__value">${stat.value}</p>
          <p class="kpi-card__sub">${stat.subtitle}</p>
        </article>
      `
    )}`;
  }

  _renderClients() {
    const cardsContainer = this.element.querySelector("#advisorClientsCards");
    const tableBody = this.element.querySelector("#advisorClientsTableBody");

    if (!cardsContainer || !tableBody) {
      return;
    }

    this._setText("#advisorClientsCount", String(this.clients.length));
    const manageHref = buildHash(ROUTES.ADVISOR_CLIENTES);

    cardsContainer.innerHTML = html`${this.clients.map((client) => {
      const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
      return html`
        <article class="advisor-client-card">
          <div class="advisor-client-head">
            <div class="d-flex gap-2 align-items-start">
              <span class="avatar-badge">${getInitials(client.fullName)}</span>
              <div>
                <p class="advisor-client-name">${client.fullName}</p>
                <p class="advisor-client-mail">${client.spendingProfile?.name || "Sin perfil"}</p>
              </div>
            </div>
            <span class="risk-pill risk-pill--${risk.cssModifier}">${risk.label}</span>
          </div>

          <div class="advisor-client-metrics">
            <div>
              <p>ULTIMO GASTO</p>
              <strong>${formatDaysAgo(client.lastExpenseDate)}</strong>
            </div>
            <div>
              <p>GASTO PROMEDIO</p>
              <strong>${formatCurrency(client.monthlyAverage)}</strong>
            </div>
          </div>

          ${this._changeLabel(client)}
          <a class="action-btn action-btn--ghost mt-2" href="${manageHref}">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            Gestionar cliente
          </a>
        </article>
      `;
    })}`;

    tableBody.innerHTML = html`${this.clients.map((client) => {
      const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
      return html`
        <tr>
          <td>
            <div class="advisor-table-client">
              <span class="avatar-badge">${getInitials(client.fullName)}</span>
              <strong>${client.fullName}</strong>
            </div>
          </td>
          <td>${client.spendingProfile?.name || "Sin perfil"}</td>
          <td>${formatDaysAgo(client.lastExpenseDate)}</td>
          <td>${formatCurrency(client.monthlyAverage)}</td>
          <td>${this._changeLabel(client)}</td>
          <td><span class="risk-pill risk-pill--${risk.cssModifier}">${risk.label}</span></td>
          <td><a class="action-btn action-btn--ghost" href="${manageHref}">Gestionar</a></td>
        </tr>
      `;
    })}`;
  }

  /** Variación del gasto vs. el mes anterior: subir es negativo (rojo). */
  _changeLabel(client) {
    if (client.changePercent === null || client.changePercent === undefined) {
      return html`<p class="advisor-client-change">--</p>`;
    }

    const direction = client.changePercent >= 0 ? "up" : "down";
    return html`<p class="advisor-client-change advisor-client-change--${direction}">${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%</p>`;
  }

  _renderRecommendations(sent) {
    const container = this.element.querySelector("#advisorRecommendationsList");
    if (!container) {
      return;
    }

    const columns = [
      { title: "Sin leer", icon: "📨", items: sent.filter((item) => !item.read) },
      { title: "Leidas", icon: "✅", items: sent.filter((item) => item.read) },
    ];

    container.innerHTML = html`${columns.map(
      (column) => html`
        <article class="advisor-rec-column">
          <div class="advisor-rec-column__head">
            <span>${column.icon}</span>
            <div>
              <h3>${column.title}</h3>
              <p>${column.items.length} recomendaciones</p>
            </div>
          </div>
          <div class="advisor-rec-column__list">
            ${column.items.length
              ? column.items
                  .slice(0, BOARD_ITEMS_PER_COLUMN)
                  .map((item) => html`<p><span>${item.clientName}</span><strong>${item.title}</strong></p>`)
              : html`<p><span>Sin recomendaciones</span></p>`}
          </div>
        </article>
      `
    )}`;
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
      ? html`<i class="fa-solid fa-border-all"></i> Ver como Cards`
      : html`<i class="fa-solid fa-table"></i> Ver como Tabla`;
  }

  async _handleCreateRecommendation(form) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const created = await this._runAction(() => recommendationsService.create(readRecommendationForm(this.element, MODAL_PREFIX)), {
      button: form.querySelector('[type="submit"]'),
      successMessage: "Recomendacion creada y enviada al cliente.",
    });

    if (!created || !this._isAlive()) {
      return;
    }

    this._getModalInstance(`#${MODAL_PREFIX}Modal`)?.hide();
    form.reset();

    const sent = await this._runAction(() => recommendationsService.listSent({ limit: 10 }));
    if (sent && this._isAlive()) {
      this._renderRecommendations(sent);
    }
  }
}
