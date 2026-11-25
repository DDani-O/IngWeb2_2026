import { PageController } from "../../core/PageController.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { CLIENT_TABLE_COLUMNS, CLIENT_VIEW_MODES, clientCard } from "../../components/molecules/clientCard.js";
import { dateCard } from "../../components/molecules/dateCard.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { statCard } from "../../components/molecules/statCard.js";
import { ChartCard } from "../../components/organisms/ChartCard.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { RecommendationDialog } from "../../components/organisms/RecommendationDialog.js";
import { ViewToggle } from "../../components/organisms/ViewToggle.js";
import { analysisService } from "../../services/analysis.service.js";
import { clientsService } from "../../services/clients.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { ROUTES } from "../../utils/constants.js";
import { formatMonth } from "../../utils/formatters.js";
import { buildHash } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const BOARD_ITEMS_PER_COLUMN = 3;
const SENT_LIMIT = 10;

/**
 * Dashboard del asesor: estado de la cartera, clientes, análisis por perfil y recomendaciones enviadas.
 */
export class AsesorDashboardPage extends PageController {
  static template = "./pages/asesor/dashboard.html";

  constructor(element, options = {}) {
    super(element, options);
    this.clients = [];
    this.charts = {};
  }

  render() {
    const firstName = (this.options.authManager?.getCurrentUser()?.fullName || "").split(" ")[0];
    this._setText("#advisorWelcome", firstName ? `Hola, ${firstName}!` : "Hola!");
    this.element.querySelector("#advisorDate").innerHTML = dateCard();

    this.mountChild(ViewToggle, "#advisorClientsView", { label: "Vista de clientes", value: "cards", modes: CLIENT_VIEW_MODES });
    this.clientsTable = this.mountChild(DataTable, "#advisorClientsTable", {
      columns: CLIENT_TABLE_COLUMNS,
      caption: "Clientes asignados",
      actions: [{ action: "manage", label: "Gestionar" }],
      empty: { icon: "fa-users", title: "Todavia no tenes clientes asignados" },
    });
    this.dialog = this.mountChild(RecommendationDialog, "#advisorRecommendationDialog", { idPrefix: "advisorDashboardRec" });

    this._loadData(async () => {
      const [summary, clients, sent] = await Promise.all([
        analysisService.getAdvisorSummary(),
        clientsService.list(),
        recommendationsService.listSent({ limit: SENT_LIMIT }),
      ]);
      if (!this._isAlive()) {
        return;
      }

      this.clients = clients;
      this.dialog.setRecipients(clients);
      this._renderAlerts(summary.alerts);
      this._renderStats(summary);
      this._renderClients();
      this._renderCharts(summary);
      this._renderRecommendations(sent);
    });
  }

  attachEvents() {
    this.listen(this.element, "view-change", (event) => this._showView(event.detail.value));
    this.listen(this.element, "row-action", () => this.options.router?.navigate(ROUTES.ADVISOR_CLIENTES));
    this.listen(this.element, "recommendation-submit", (event) => this._createRecommendation(event.detail.recommendation));
    this.listen(this.element.querySelector('[data-action="new-recommendation"]'), "click", () => this.dialog.open());
  }

  _renderAlerts(alerts) {
    this.element.querySelector("#advisorAlerts").innerHTML = html`${alerts.map((alert) => alertItem({ title: alert.title, description: alert.description, tone: alert.level }))}`;
  }

  _renderStats(summary) {
    const readRate = summary.sentRecommendations ? Math.round((summary.readRecommendations / summary.sentRecommendations) * 100) : 0;
    this.element.querySelector("#advisorStats").innerHTML = html`
      ${statCard({ label: "Clientes activos", emoji: "👥", value: summary.activeClients, subtitle: "Asignados a tu cartera" })}
      ${statCard({ label: "Recomendaciones leidas", emoji: "📈", value: readRate, format: "percent", subtitle: `${summary.readRecommendations} de ${summary.sentRecommendations} enviadas` })}
      ${statCard({ label: "Clientes con gastos inusuales", emoji: "📌", value: summary.clientsWithAlerts, subtitle: "Requieren seguimiento" })}
    `;
  }

  _renderClients() {
    this._setText("#advisorClientsCount", String(this.clients.length));
    const manage = [{ action: "manage", label: "Gestionar cliente", href: buildHash(ROUTES.ADVISOR_CLIENTES) }];

    this.element.querySelector("#advisorClientsCards").innerHTML = this.clients.length
      ? html`${this.clients.map((client) => clientCard({ client, actions: manage }))}`
      : emptyState({ icon: "fa-users", title: "Todavia no tenes clientes asignados" });
    this.clientsTable.update({ rows: this.clients });
  }

  _showView(view) {
    this.element.querySelector("#advisorClientsCards").classList.toggle("app-hidden", view === "table");
    this.element.querySelector("#advisorClientsTable").classList.toggle("app-hidden", view !== "table");
  }

  _renderCharts(summary) {
    const charts = {
      "#advisorProfileChart": {
        title: "Clientes por perfil de gasto",
        icon: "fa-chart-pie",
        type: "doughnut",
        labels: summary.profileDistribution.map((item) => item.profile),
        datasets: [{ label: "Clientes", data: summary.profileDistribution.map((item) => item.count) }],
      },
      "#advisorSpendChart": {
        title: "Gasto mensual por perfil",
        icon: "fa-chart-column",
        type: "bar",
        valueFormat: "currency",
        caption: "Suma del gasto promedio mensual de los clientes de cada perfil.",
        labels: summary.spendByProfile.map((item) => item.profile),
        datasets: [{ label: "Gasto", data: summary.spendByProfile.map((item) => item.amount) }],
      },
      "#advisorActivityChart": {
        title: "Actividad de clientes (ultimos 7 meses)",
        icon: "fa-chart-line",
        type: "line",
        caption: "Clientes que registraron al menos un gasto en el mes.",
        labels: summary.monthlyActivity.map((item) => formatMonth(item.month)),
        datasets: [{ label: "Clientes activos", data: summary.monthlyActivity.map((item) => item.activeClients) }],
      },
    };

    Object.entries(charts).forEach(([selector, props]) => {
      this.charts[selector] = this.charts[selector] ? this.charts[selector].update(props) : this.mountChild(ChartCard, selector, props);
    });
  }

  _renderRecommendations(sent) {
    const column = (title, icon, items) =>
      infoCard({
        title,
        icon,
        subtitle: `${items.length} recomendaciones`,
        body: items.length
          ? html`<div class="media-list">${items.slice(0, BOARD_ITEMS_PER_COLUMN).map((item) => mediaItem({ title: item.title, subtitle: item.clientName }))}</div>`
          : html`<p class="text-muted">Sin recomendaciones.</p>`,
      });

    this.element.querySelector("#advisorRecommendations").innerHTML = html`
      ${column("Sin leer", "fa-envelope", sent.filter((item) => !item.read))}
      ${column("Leidas", "fa-envelope-open", sent.filter((item) => item.read))}
    `;
  }

  async _createRecommendation(recommendation) {
    this.dialog.setBusy(true);
    const created = await this._runAction(() => recommendationsService.create(recommendation), {
      successMessage: "Recomendacion creada y enviada al cliente.",
    });
    this.dialog.setBusy(false);

    if (!created || !this._isAlive()) {
      return;
    }

    this.dialog.close();
    const sent = await this._runAction(() => recommendationsService.listSent({ limit: SENT_LIMIT }));
    if (sent && this._isAlive()) {
      this._renderRecommendations(sent);
    }
  }
}
