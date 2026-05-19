import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class AsesorClientesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.clients = [];
    this.filteredClients = [];
    this.viewMode = "cards";
    this.detailModal = null;
    this.recommendationModal = null;
    this.profileModal = null;
    this.spendingProfiles = [];
  }

  async render() {
    this._resetViewPosition();

    const currentAdvisor = this.options.authManager?.getCurrentUser();
    const advisorName = currentAdvisor?.fullName || "Maria Rodriguez";
    this._setText("#advisorTopbarName", advisorName);

    this._renderRecommendationClientOptions();
    this._applyFilters();
    this._syncView();
    await this._loadSpendingProfiles();
    this._loadClients();
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
    const profileForm = this.element.querySelector("#advisorClientProfileForm");

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

    this.listen(profileForm, "submit", (event) => {
      event.preventDefault();
      this._handleAssignProfile();
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
          String(client.name || "").toLowerCase().includes(search) ||
          String(client.profile || "").toLowerCase().includes(search)
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
              <button class="action-btn action-btn--ghost" data-action="profile" data-id="${
                client.id
              }" type="button">Asignar perfil</button>
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
                <button class="action-btn action-btn--ghost" data-action="profile" data-id="${
                  client.id
                }" type="button">Perfil</button>
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

    if (action === "profile") {
      this._openProfileModal(client.id);
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

  async _loadSpendingProfiles() {
    try {
      const response = await apiClient.get("/users/spending-profiles");
      this.spendingProfiles = Array.isArray(response?.profiles) ? response.profiles : [];
    } catch (error) {
      this.spendingProfiles = [];
      this.options.showToast?.(
        error.message || "No se pudieron cargar los perfiles de gasto.",
        "warning",
      );
    }
  }

  _openProfileModal(clientId) {
    const select = this.element.querySelector("#advisorClientProfileSelect");
    const clientInput = this.element.querySelector("#advisorClientProfileClientId");
    const reasonInput = this.element.querySelector("#advisorClientProfileReason");

    if (!select || !clientInput) {
      return;
    }

    select.innerHTML = `
      <option value="">Seleccionar perfil</option>
      ${this.spendingProfiles
        .map((profile) => `<option value="${profile.id}">${profile.name}</option>`)
        .join("")}
    `;

    clientInput.value = clientId;
    if (reasonInput) {
      reasonInput.value = "";
    }

    this.profileModal = this._showModal("#advisorClientProfileModal");
  }

  async _handleAssignProfile() {
    const clientId = this._getValue("#advisorClientProfileClientId");
    const profileId = this._getValue("#advisorClientProfileSelect");
    const reason = this._getValue("#advisorClientProfileReason");

    if (!clientId || !profileId) {
      this.options.showToast?.("Selecciona un perfil valido.", "warning");
      return;
    }

    try {
      const response = await apiClient.patch(`/advisor/clients/${clientId}/profile`, {
        profileId,
        reason: reason || undefined,
      });

      const profileName = response?.profileName || "Perfil";
      this.options.showToast?.(`Perfil asignado: ${profileName}.`, "success");
      this.profileModal?.hide();
      await this._loadClients();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo asignar el perfil.",
        "warning",
      );
    }
  }

  async _openClientModal(client) {
    const content = this.element.querySelector("#advisorClientDetailContent");
    if (!content) {
      return;
    }

    try {
      const detail = await apiClient.get(`/advisor/clients/${client.id}`);
      const advisorName = detail?.advisorName || "";
      const profile = detail?.profile || client.profile || "Sin perfil";

      content.innerHTML = `
        <article class="history-detail-card">
          <p><strong>Cliente:</strong> ${detail?.name || client.name}</p>
          <p><strong>Perfil:</strong> ${profile}</p>
          <p><strong>Email:</strong> ${detail?.email || client.email || "-"}</p>
          <p><strong>Telefono:</strong> ${detail?.phone || "-"}</p>
          <p><strong>Pais:</strong> ${detail?.country || "-"}</p>
          <p><strong>Ocupacion:</strong> ${detail?.occupation || "-"}</p>
          <p><strong>Gasto promedio:</strong> ${formatCurrency(detail?.averageSpend || client.averageSpend)}</p>
          <p><strong>Cambio mensual:</strong> ${
            (detail?.changePercent ?? client.changePercent) >= 0 ? "+" : ""
          }${detail?.changePercent ?? client.changePercent}%</p>
          <p><strong>Riesgo:</strong> ${detail?.risk || client.risk}</p>
          <p><strong>Mensajes sin leer:</strong> ${detail?.unreadMessages ?? client.unreadMessages}</p>
          <p><strong>Asesor asignado:</strong> ${advisorName || "-"}</p>
          <p><strong>Ingreso mensual:</strong> ${formatCurrency(detail?.monthlyIncome || 0)}</p>
          <p><strong>Meta de ahorro:</strong> ${formatCurrency(detail?.savingsGoal || 0)}</p>
          <p><strong>Alerta de presupuesto:</strong> ${detail?.alertThreshold ?? 0}%</p>
        </article>
      `;

      this.detailModal = this._showModal("#advisorClientDetailModal");
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo cargar el detalle del cliente.",
        "warning"
      );
    }
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

  async _handleCreateRecommendation() {
    const form = this.element.querySelector("#advisorClientRecommendationForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const payload = this._getRecommendationPayload({
      clientSelector: "#advisorClientRecommendationClient",
      typeSelector: "#advisorClientRecommendationType",
      contentSelector: "#advisorClientRecommendationDescription",
      savingsSelector: "#advisorClientRecommendationSavings",
    });

    try {
      await apiClient.post("/advisor/recommendations", payload);
      this.options.showToast?.("Recomendacion creada y enviada al cliente.", "success");
      this.recommendationModal?.hide();
      form.reset();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo crear la recomendacion.",
        "warning"
      );
    }
  }

  async _loadClients() {
    try {
      const response = await apiClient.get("/advisor/clients", {
        query: { page: 1, limit: 100 },
      });
      this.clients = Array.isArray(response?.data) ? response.data : [];
      this._renderRecommendationClientOptions();
      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar los clientes.",
        "warning"
      );
    }
  }

  _getRecommendationPayload({
    clientSelector,
    typeSelector,
    contentSelector,
    savingsSelector,
  }) {
    const clientId = this._getValue(clientSelector);
    const typeValue = this._getValue(typeSelector);
    const content = this._getValue(contentSelector);
    const savingsRaw = this._getValue(savingsSelector);

    return {
      clientId,
      type: this._mapRecommendationType(typeValue),
      content,
      savingsPotential: Number(savingsRaw || 0),
    };
  }

  _mapRecommendationType(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("alerta") || normalized.includes("presupuesto")) {
      return "alerta";
    }
    if (normalized.includes("felicitacion")) {
      return "felicitacion";
    }
    return "consejo";
  }

}
