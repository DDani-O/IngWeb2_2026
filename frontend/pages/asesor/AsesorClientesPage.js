/** Página #/asesor/clientes (asesor): cartera de clientes con búsqueda y acceso al análisis. */
import { PageController } from "../../core/PageController.js";
import { CLIENT_TABLE_COLUMNS, CLIENT_VIEW_MODES, clientCard } from "../../components/molecules/clientCard.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { FilterBar } from "../../components/organisms/FilterBar.js";
import { RecommendationDialog } from "../../components/organisms/RecommendationDialog.js";
import { ViewToggle } from "../../components/organisms/ViewToggle.js";
import { clientsService } from "../../services/clients.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { RISK_LEVELS, ROUTES } from "../../utils/constants.js";
import { fillRoute } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const CLIENT_ACTIONS = [
  { action: "detail", label: "Ver analisis" },
  { action: "recommend", label: "Enviar recomendacion", variant: "primary" },
];

/**
 * Clientes asignados al asesor (consigna §3: visualizar usuarios y generar recomendaciones).
 */
export class AsesorClientesPage extends PageController {
  static template = "./pages/asesor/clientes.html";

  constructor(element, options = {}) {
    super(element, options);
    this.clients = [];
  }

  render() {
    this.filters = this.mountChild(FilterBar, "#clientsFilters", {
      idPrefix: "clients",
      ariaLabel: "Filtrar clientes",
      fields: [
        { type: "search", name: "search", label: "Buscar cliente", placeholder: "Nombre o perfil" },
        { type: "select", name: "risk", label: "Riesgo", options: [{ value: "", label: "Todos" }, ...Object.entries(RISK_LEVELS).map(([value, risk]) => ({ value, label: risk.label }))] },
        { type: "select", name: "status", label: "Estado", options: [{ value: "", label: "Todos" }, { value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ],
    });
    this.mountChild(ViewToggle, "#clientsView", { label: "Vista de clientes", value: "cards", modes: CLIENT_VIEW_MODES });
    this.table = this.mountChild(DataTable, "#clientsTable", {
      columns: CLIENT_TABLE_COLUMNS,
      caption: "Clientes asignados",
      actions: CLIENT_ACTIONS,
      empty: { icon: "fa-users", title: "No hay clientes para estos filtros" },
    });
    this.dialog = this.mountChild(RecommendationDialog, "#clientRecommendationDialog", { idPrefix: "clientsRec" });

    this._loadData(async () => {
      const clients = await clientsService.list();
      if (!this._isAlive()) {
        return;
      }

      this.clients = clients;
      this.dialog.setRecipients(clients);
      this._applyFilters();
    });
  }

  attachEvents() {
    this.listen(this.element, "filters-change", () => this._applyFilters());
    this.listen(this.element, "view-change", (event) => this._showView(event.detail.value));
    this.listen(this.element, "row-action", (event) => this._handleAction(event.detail.action, event.detail.id));
    this.listen(this.element.querySelector("#clientsCards"), "click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (trigger) {
        this._handleAction(trigger.dataset.action, trigger.dataset.id);
      }
    });
    this.listen(this.element.querySelector('[data-action="new-recommendation"]'), "click", () => this.dialog.open());
    this.listen(this.element, "recommendation-submit", (event) => this._createRecommendation(event.detail.recommendation));
  }

  _applyFilters() {
    const { search = "", risk = "", status = "" } = this.filters.getValues();
    const term = search.trim().toLowerCase();

    const visible = this.clients.filter((client) => {
      const matchesSearch =
        !term || client.fullName.toLowerCase().includes(term) || (client.spendingProfile?.name || "").toLowerCase().includes(term);
      return matchesSearch && (!risk || client.riskLevel === risk) && (!status || client.status === status);
    });

    this._setText("#clientsCount", `${visible.length} clientes visibles`);
    this.element.querySelector("#clientsCards").innerHTML = visible.length
      ? html`${visible.map((client) => clientCard({ client, actions: CLIENT_ACTIONS }))}`
      : emptyState({ icon: "fa-users", title: "No hay clientes para estos filtros" });
    this.table.update({ rows: visible });
  }

  _showView(view) {
    this.element.querySelector("#clientsCards").classList.toggle("app-hidden", view === "table");
    this.element.querySelector("#clientsTable").classList.toggle("app-hidden", view !== "table");
  }

  _handleAction(action, clientId) {
    const client = this.clients.find((item) => item.id === clientId);
    if (!client) {
      return;
    }

    if (action === "recommend") {
      this.dialog.open(client.id);
      return;
    }

    if (action === "detail") {
      this.options.router?.navigate(fillRoute(ROUTES.ADVISOR_CLIENTE_DETALLE, { id: client.id }));
    }
  }

  async _createRecommendation(recommendation) {
    this.dialog.setBusy(true);
    const created = await this._runAction(() => recommendationsService.create(recommendation), {
      successMessage: "Recomendacion creada y enviada al cliente.",
    });
    this.dialog.setBusy(false);

    if (created && this._isAlive()) {
      this.dialog.close();
    }
  }
}
