import { PageController } from "../../core/PageController.js";
import { MOCK_ADVISOR_DASHBOARD, ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class AsesorClientesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.clients = JSON.parse(JSON.stringify(MOCK_ADVISOR_DASHBOARD.clients));
    this.filteredClients = [...this.clients];
    this.viewMode = "cards";
    this.detailModal = null;
    this.recommendationModal = null;
  }

  render() {
    this._resetViewPosition();

    const currentAdvisor = this.options.authManager?.getCurrentUser();
    const advisorName = currentAdvisor?.fullName || "Maria Rodriguez";
    this._setText("#advisorTopbarName", advisorName);

    this._renderRecommendationClientOptions();
    this._applyFilters();
    this._syncView();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#clientsSearchInput");
    const riskFilter = this.element.querySelector("#clientsRiskFilter");
    const statusFilter = this.element.querySelector("#clientsStatusFilter");
    const viewToggle = this.element.querySelector("#clientsViewToggle");
    const cards = this.element.querySelector("#clientsCards");
    const tableBody = this.element.querySelector("#clientsTableBody");
    const backButton = this.element.querySelector("#backToAdvisorDashboardButton");
    const openRecommendationButton = this.element.querySelector("#openClientRecommendationButton");
    const recommendationForm = this.element.querySelector("#advisorClientRecommendationForm");

    this.listen(searchInput, "input", () => this._applyFilters());
    this.listen(riskFilter, "change", () => this._applyFilters());
    this.listen(statusFilter, "change", () => this._applyFilters());

    this.listen(viewToggle, "click", () => {
      this.viewMode = this.viewMode === "cards" ? "table" : "cards";
      this._syncView();
    });

    this.listen(cards, "click", (event) => this._handleAction(event));
    this.listen(tableBody, "click", (event) => this._handleAction(event));

    this.listen(openRecommendationButton, "click", () => this._openRecommendationModal());
    this.listen(recommendationForm, "submit", (event) => {
      event.preventDefault();
      this._handleCreateRecommendation();
    });

    this.listen(backButton, "click", () => {
      this.options.router?.navigate(ROUTES.ADVISOR_DASHBOARD);
    });

    this._bindLogoutButtons({
      role: "asesor",
      toastMessage: "Sesion de asesor finalizada.",
    });
  }

  _applyFilters() {
    const search = this._getValue("#clientsSearchInput").toLowerCase();
    const risk = this._getValue("#clientsRiskFilter") || "Todos";
    const status = this._getValue("#clientsStatusFilter") || "Todos";

    let result = [...this.clients];

    if (search) {
      result = result.filter((client) => {
        return (
          client.name.toLowerCase().includes(search) ||
          client.profile.toLowerCase().includes(search)
        );
      });
    }

    if (risk !== "Todos") {
      result = result.filter((client) => client.riskLevel === risk);
    }

    if (status !== "Todos") {
      result = result.filter((client) => client.status === status);
    }

    this.filteredClients = result;
    this._renderClients();
  }

  _renderClients() {
    const cards = this.element.querySelector("#clientsCards");
    const tableBody = this.element.querySelector("#clientsTableBody");
    const count = this.element.querySelector("#clientsCountLabel");

    if (!cards || !tableBody || !count) {
      return;
    }

    count.textContent = `${this.filteredClients.length} clientes visibles`;

    cards.innerHTML = this.filteredClients
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
            <div class="advisor-client-metrics">
              <div>
                <p>Ultimo gasto</p>
                <strong>${client.lastExpense}</strong>
              </div>
              <div>
                <p>Promedio</p>
                <strong>${formatCurrency(client.averageSpend)}</strong>
              </div>
            </div>
            <p class="advisor-client-change advisor-client-change--${
              client.changePercent >= 0 ? "up" : "down"
            }">
              ${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%
            </p>
            <div class="d-flex flex-wrap gap-2 mt-2">
              <button class="action-btn action-btn--ghost" data-action="detail" data-id="${
                client.id
              }" type="button">Ver detalle</button>
              <button class="action-btn action-btn--primary" data-action="recommend" data-id="${
                client.id
              }" type="button">Enviar recomendacion</button>
            </div>
          </article>
        `;
      })
      .join("");

    tableBody.innerHTML = this.filteredClients
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
            <td><span class="risk-pill risk-pill--${client.riskLevel}">${client.risk}</span></td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button class="action-btn action-btn--ghost" data-action="detail" data-id="${
                  client.id
                }" type="button">Detalle</button>
                <button class="action-btn action-btn--primary" data-action="recommend" data-id="${
                  client.id
                }" type="button">Recomendar</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
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
      ? '<i class="fa-solid fa-border-all"></i> Ver como cards'
      : '<i class="fa-solid fa-table"></i> Ver como tabla';
  }

  _handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    const clientId = button.dataset.id;
    const client = this.clients.find((item) => item.id === clientId);

    if (!client) {
      return;
    }

    if (action === "recommend") {
      this._openRecommendationModal(client.id);
      return;
    }

    this._openClientModal(client);
  }

  _renderRecommendationClientOptions() {
    const select = this.element.querySelector("#advisorClientRecommendationClient");
    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">Seleccionar cliente</option>
      ${this.clients.map((client) => `<option value="${client.id}">${client.name}</option>`).join("")}
    `;
  }

  _openClientModal(client) {
    const content = this.element.querySelector("#advisorClientDetailContent");
    if (!content) {
      return;
    }

    content.innerHTML = `
      <article class="history-detail-card">
        <p><strong>Cliente:</strong> ${client.name}</p>
        <p><strong>Perfil:</strong> ${client.profile}</p>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>Gasto promedio:</strong> ${formatCurrency(client.averageSpend)}</p>
        <p><strong>Cambio mensual:</strong> ${
          client.changePercent >= 0 ? "+" : ""
        }${client.changePercent}%</p>
        <p><strong>Riesgo:</strong> ${client.risk}</p>
        <p><strong>Mensajes sin leer:</strong> ${client.unreadMessages}</p>
      </article>
    `;

    this.detailModal = this._showModal("#advisorClientDetailModal");
  }

  _openRecommendationModal(clientId = "") {
    const clientSelect = this.element.querySelector("#advisorClientRecommendationClient");

    if (!clientSelect) {
      return;
    }

    this._renderRecommendationClientOptions();
    clientSelect.value = clientId;

    this.recommendationModal = this._showModal("#advisorClientRecommendationModal");
  }

  _handleCreateRecommendation() {
    const form = this.element.querySelector("#advisorClientRecommendationForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.options.showToast?.("Recomendacion creada y enviada al cliente.", "success");
    this.recommendationModal?.hide();
    form.reset();
  }

}
