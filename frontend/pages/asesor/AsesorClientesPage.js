import { PageController } from "../../core/PageController.js";
import {
  fillRecommendationClients,
  mountAdvisorRecommendationModal,
  readRecommendationForm,
} from "../../components/modals/AdvisorRecommendationModal.js";
import { clientsService } from "../../services/clients.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { RISK_LEVELS, ROUTES, UI_TIMING } from "../../utils/constants.js";
import { formatCurrency, formatDate, formatDaysAgo } from "../../utils/formatters.js";
import { debounce, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const MODAL_PREFIX = "advisorClientRecommendation";

/**
 * Clientes asignados al asesor (consigna §3: visualizar usuarios y generar recomendaciones).
 */
export class AsesorClientesPage extends PageController {
  static template = "./pages/asesor/clientes.html";

  constructor(element, options = {}) {
    super(element, options);
    this.clients = [];
    this.filteredClients = [];
    this.viewMode = "cards";
    this._debouncedFilter = debounce(() => this._applyFilters(), UI_TIMING.SEARCH_DEBOUNCE_MS);
  }

  render() {
    this._syncView();
    const modalReady = this._mountRecommendationModal();

    this._loadData(async () => {
      const [clients] = await Promise.all([clientsService.list(), modalReady]);
      if (!this._isAlive()) {
        return;
      }

      this.clients = clients;
      fillRecommendationClients(this.element, MODAL_PREFIX, clients);
      this._applyFilters();
    });
  }

  attachEvents() {
    this.listen(this.element.querySelector("#clientsSearchInput"), "input", () => this._debouncedFilter());
    this.listen(this.element.querySelector("#clientsRiskFilter"), "change", () => this._applyFilters());
    this.listen(this.element.querySelector("#clientsStatusFilter"), "change", () => this._applyFilters());

    this.listen(this.element.querySelector("#clientsViewToggle"), "click", () => {
      this.viewMode = this.viewMode === "cards" ? "table" : "cards";
      this._syncView();
    });

    this.listen(this.element.querySelector("#clientsCards"), "click", (event) => this._handleAction(event));
    this.listen(this.element.querySelector("#clientsTableBody"), "click", (event) => this._handleAction(event));

    this.listen(this.element.querySelector("#openClientRecommendationButton"), "click", () => this._openRecommendationModal());

    this.listen(this.element.querySelector("#backToAdvisorDashboardButton"), "click", () => {
      this.options.router?.navigate(ROUTES.ADVISOR_DASHBOARD);
    });
  }

  /**
   * Inserta el modal de nueva recomendación en su slot y engancha el envío del formulario.
   */
  async _mountRecommendationModal() {
    await mountAdvisorRecommendationModal(this.element, {
      slotSelector: "#advisorClientRecommendationModalSlot",
      idPrefix: MODAL_PREFIX,
    });

    this.listen(this.element.querySelector(`#${MODAL_PREFIX}Form`), "submit", (event) => {
      event.preventDefault();
      this._handleCreateRecommendation(event.target);
    });
  }

  _applyFilters() {
    const search = this._getValue("#clientsSearchInput").toLowerCase();
    const risk = this._getValue("#clientsRiskFilter");
    const status = this._getValue("#clientsStatusFilter");

    this.filteredClients = this.clients.filter((client) => {
      const profileName = client.spendingProfile?.name || "";
      const matchesSearch =
        !search || client.fullName.toLowerCase().includes(search) || profileName.toLowerCase().includes(search);
      return matchesSearch && (!risk || client.riskLevel === risk) && (!status || client.status === status);
    });

    this._renderClients();
  }

  _renderClients() {
    const cards = this.element.querySelector("#clientsCards");
    const tableBody = this.element.querySelector("#clientsTableBody");

    if (!cards || !tableBody) {
      return;
    }

    this._setText("#clientsCountLabel", `${this.filteredClients.length} clientes visibles`);

    cards.innerHTML = this.filteredClients.length
      ? html`${this.filteredClients.map((client) => {
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
                  <p>Ultimo gasto</p>
                  <strong>${formatDaysAgo(client.lastExpenseDate)}</strong>
                </div>
                <div>
                  <p>Promedio</p>
                  <strong>${formatCurrency(client.monthlyAverage)}</strong>
                </div>
              </div>
              ${this._changeLabel(client)}
              <div class="d-flex flex-wrap gap-2 mt-2">
                <button class="action-btn action-btn--ghost" data-action="detail" data-id="${client.id}" type="button">Ver detalle</button>
                <button class="action-btn action-btn--primary" data-action="recommend" data-id="${client.id}" type="button">Enviar recomendacion</button>
              </div>
            </article>
          `;
        })}`
      : html`<p class="text-muted">No hay clientes para estos filtros.</p>`;

    tableBody.innerHTML = html`${this.filteredClients.map((client) => {
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
          <td>
            <div class="d-flex flex-wrap gap-2">
              <button class="action-btn action-btn--ghost" data-action="detail" data-id="${client.id}" type="button">Detalle</button>
              <button class="action-btn action-btn--primary" data-action="recommend" data-id="${client.id}" type="button">Recomendar</button>
            </div>
          </td>
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

  _syncView() {
    const cards = this.element.querySelector("#clientsCards");
    const tableWrap = this.element.querySelector("#clientsTableWrap");
    const toggle = this.element.querySelector("#clientsViewToggle");

    if (!cards || !tableWrap || !toggle) {
      return;
    }

    const showTable = this.viewMode === "table";
    cards.classList.toggle("app-hidden", showTable);
    tableWrap.classList.toggle("app-hidden", !showTable);

    toggle.innerHTML = showTable
      ? html`<i class="fa-solid fa-border-all"></i> Ver como cards`
      : html`<i class="fa-solid fa-table"></i> Ver como tabla`;
  }

  _handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const client = this.clients.find((item) => item.id === button.dataset.id);
    if (!client) {
      return;
    }

    if (button.dataset.action === "recommend") {
      this._openRecommendationModal(client.id);
      return;
    }

    this._openClientModal(client);
  }

  _openClientModal(client) {
    const content = this.element.querySelector("#advisorClientDetailContent");
    if (!content) {
      return;
    }

    const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
    const change = client.changePercent === null ? "--" : `${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%`;

    content.innerHTML = html`
      <article class="history-detail-card">
        <p><strong>Cliente:</strong> ${client.fullName}</p>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>Perfil de gasto:</strong> ${client.spendingProfile?.name || "Sin perfil"}</p>
        <p><strong>Gasto promedio mensual:</strong> ${formatCurrency(client.monthlyAverage)}</p>
        <p><strong>Gasto del mes:</strong> ${formatCurrency(client.totalThisMonth)}</p>
        <p><strong>Cambio vs. mes anterior:</strong> ${change}</p>
        <p><strong>Gastos inusuales:</strong> ${client.unusualCount}</p>
        <p><strong>Ultimo gasto:</strong> ${client.lastExpenseDate ? formatDate(client.lastExpenseDate) : "Sin gastos"}</p>
        <p><strong>Riesgo:</strong> ${risk.label}</p>
      </article>
    `;

    this._showModal("#advisorClientDetailModal");
  }

  _openRecommendationModal(clientId = "") {
    fillRecommendationClients(this.element, MODAL_PREFIX, this.clients, clientId);
    this._showModal(`#${MODAL_PREFIX}Modal`);
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

    if (created && this._isAlive()) {
      this._getModalInstance(`#${MODAL_PREFIX}Modal`)?.hide();
      form.reset();
    }
  }
}
