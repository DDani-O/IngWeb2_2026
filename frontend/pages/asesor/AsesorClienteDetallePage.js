import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { recommendationCard } from "../../components/molecules/recommendationCard.js";
import { analysisCharts, analysisStats, merchantRanking, unusualExpenseList } from "../../components/molecules/spendingAnalysis.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { ChartCard } from "../../components/organisms/ChartCard.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { RecommendationDialog } from "../../components/organisms/RecommendationDialog.js";
import { analysisService } from "../../services/analysis.service.js";
import { clientsService } from "../../services/clients.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { EXPENSE_ORIGINS, RISK_LEVELS } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

const EXPENSES_LIMIT = 15;

/**
 * Análisis de un cliente para el asesor (consigna §3 y §4.5: analizar los gastos de cada usuario,
 * identificar patrones y gastos problemáticos, ver la clasificación de perfil y generar recomendaciones).
 * Ruta: #/asesor/clientes/:id.
 */
export class AsesorClienteDetallePage extends PageController {
  static template = "./pages/asesor/cliente-detalle.html";

  render() {
    this.clientId = this.options.params?.id;
    this.charts = {};
    this.expensesTable = this.mountChild(DataTable, "#clientExpenses", {
      caption: "Ultimos gastos del cliente",
      columns: [
        { key: "date", label: "Fecha", render: (expense) => formatDate(expense.date) },
        { key: "merchant", label: "Comercio" },
        { key: "category", label: "Categoria" },
        { key: "amount", label: "Monto", align: "end", render: (expense) => formatCurrency(expense.amount) },
        { key: "origin", label: "Origen", render: (expense) => badge({ text: EXPENSE_ORIGINS[expense.origin] || expense.origin, tone: expense.origin === "ticket" ? "success" : "neutral" }) },
      ],
      empty: { icon: "fa-receipt", title: "El cliente todavia no registro gastos" },
    });
    this.dialog = this.mountChild(RecommendationDialog, "#clientRecommendationDialog", { idPrefix: "clientDetailRec" });

    this._loadData(async () => {
      const [client, analysis, expenses, sent] = await Promise.all([
        clientsService.get(this.clientId),
        analysisService.getForClient(this.clientId),
        clientsService.listExpenses(this.clientId, { limit: EXPENSES_LIMIT }),
        recommendationsService.listSent({ clientId: this.clientId }),
      ]);
      if (!this._isAlive()) {
        return;
      }

      this.dialog.setRecipients([{ id: client.id, fullName: client.fullName }]);
      this._renderHeader(client);
      this._renderAnalysis(analysis);
      this.expensesTable.update({ rows: expenses.items });
      this._renderRecommendations(sent);
    });
  }

  attachEvents() {
    this.listen(this.element.querySelector('[data-action="new-recommendation"]'), "click", () => this.dialog.open(this.clientId));
    this.listen(this.element, "recommendation-submit", (event) => this._createRecommendation(event.detail.recommendation));
  }

  _renderHeader(client) {
    const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
    this._setText("#clientName", client.fullName);
    this._setText("#clientEmail", client.email);
    document.title = `${client.fullName} · FinTrack`;

    this.element.querySelector("#clientTags").innerHTML = html`
      ${badge({ text: client.spendingProfile ? `Perfil: ${client.spendingProfile.name}` : "Sin perfil asignado", tone: "info", icon: "fa-user-tag", title: "Asignado automaticamente por el sistema" })}
      ${badge({ text: `Riesgo ${risk.label.toLowerCase()}`, tone: risk.tone })}
      ${badge({ text: client.status === "activo" ? "Activo" : "Inactivo", tone: client.status === "activo" ? "success" : "neutral" })}
    `;
  }

  _renderAnalysis(analysis) {
    this.element.querySelector("#clientAlerts").innerHTML = html`${analysis.alerts.map((alert) => alertItem({ title: alert.title, description: alert.description, tone: alert.level }))}`;
    this.element.querySelector("#clientStats").innerHTML = analysisStats(analysis);
    this.element.querySelector("#clientUnusual").innerHTML = unusualExpenseList(analysis.unusualExpenses);
    this.element.querySelector("#clientMerchants").innerHTML = merchantRanking(analysis.merchantRanking);

    const charts = analysisCharts(analysis);
    [
      ["daily", "#clientDailyChart"],
      ["category", "#clientCategoryChart"],
      ["monthly", "#clientMonthlyChart"],
    ].forEach(([key, selector]) => {
      this.charts[key] = this.charts[key] ? this.charts[key].update(charts[key]) : this.mountChild(ChartCard, selector, charts[key]);
    });
  }

  _renderRecommendations(sent) {
    this.element.querySelector("#clientRecommendations").innerHTML = sent.length
      ? html`${sent.map((recommendation) => recommendationCard({ recommendation }))}`
      : emptyState({ icon: "fa-lightbulb", title: "Todavia no le enviaste recomendaciones" });
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
    const sent = await this._runAction(() => recommendationsService.listSent({ clientId: this.clientId }));
    if (sent && this._isAlive()) {
      this._renderRecommendations(sent);
    }
  }
}
