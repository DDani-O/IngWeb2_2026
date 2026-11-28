/** Página #/asesor/clientes/:id (asesor): análisis de un cliente, su perfil de gasto y sus recomendaciones. */
import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { button } from "../../components/atoms/button.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { formField, formGrid } from "../../components/molecules/formField.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { recommendationCard } from "../../components/molecules/recommendationCard.js";
import { analysisCharts, analysisStats, merchantRanking, unusualExpenseList } from "../../components/molecules/spendingAnalysis.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { ChartCard } from "../../components/organisms/ChartCard.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { RecommendationDialog } from "../../components/organisms/RecommendationDialog.js";
import { analysisService } from "../../services/analysis.service.js";
import { clientsService } from "../../services/clients.service.js";
import { profileService } from "../../services/profile.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { EXPENSE_ORIGINS, RISK_LEVELS } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

const EXPENSES_LIMIT = 15;
/** Igual que el máximo de `motivo` en PUT /clients/:id/spending-profile. */
const PROFILE_REASON_MAX = 300;

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
      const [client, analysis, expenses, sent, profiles] = await Promise.all([
        clientsService.get(this.clientId),
        analysisService.getForClient(this.clientId),
        clientsService.listExpenses(this.clientId, { limit: EXPENSES_LIMIT }),
        recommendationsService.listSent({ clientId: this.clientId }),
        profileService.listSpendingProfiles(),
      ]);
      if (!this._isAlive()) {
        return;
      }

      this.client = client;
      this.profileCatalog = profiles;
      this.dialog.setRecipients([{ id: client.id, fullName: client.fullName }]);
      this._renderHeader(client);
      this._renderProfile(analysis.spendingProfile, analysis.suggestedProfile);
      this._renderAnalysis(analysis);
      this.expensesTable.update({ rows: expenses.items });
      this._renderRecommendations(sent);
    });
  }

  attachEvents() {
    this.listen(this.element.querySelector('[data-action="new-recommendation"]'), "click", () => this.dialog.open(this.clientId));
    this.listen(this.element, "recommendation-submit", (event) => this._createRecommendation(event.detail.recommendation));
    this.listen(this.element.querySelector("#clientProfile"), "click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (trigger?.dataset.action === "assign-profile") {
        this._assignProfile(trigger);
      } else if (trigger?.dataset.action === "reset-profile") {
        this._resetProfile(trigger);
      }
    });
  }

  _renderHeader(client) {
    const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
    this._setText("#clientName", client.fullName);
    this._setText("#clientEmail", client.email);
    document.title = `${client.fullName} · FinTrack`;

    const profile = client.spendingProfile;
    this.element.querySelector("#clientTags").innerHTML = html`
      ${badge({ text: profile ? `Perfil: ${profile.name}` : "Sin perfil asignado", tone: "info", icon: "fa-user-tag", title: profile?.origin === "asesor" ? "Elegido por vos" : "Sugerido por el sistema" })}
      ${badge({ text: `Riesgo ${risk.label.toLowerCase()}`, tone: risk.tone })}
      ${badge({ text: client.status === "activo" ? "Activo" : "Inactivo", tone: client.status === "activo" ? "success" : "neutral" })}
    `;
  }

  /**
   * Perfil vigente, quién lo asignó y el formulario para elegir otro o volver al automático.
   * @param {object|null} current perfil vigente (origin "sistema" o "asesor")
   * @param {object|null} suggested lo que calcula la regla automática
   */
  _renderProfile(current, suggested) {
    const chosenByAdvisor = current?.origin === "asesor";
    const options = (this.profileCatalog || []).map((profile) => ({ value: profile.id, label: profile.name }));

    this.element.querySelector("#clientProfile").innerHTML = infoCard({
      icon: "fa-user-tag",
      title: current ? current.name : "Sin perfil asignado",
      subtitle: chosenByAdvisor ? "Elegido por vos" : "Sugerido por el sistema segun sus gastos",
      body: html`
        ${current?.reason ? html`<p>${chosenByAdvisor ? `Motivo: ${current.reason}` : current.reason}</p>` : ""}
        ${chosenByAdvisor ? html`<p class="text-muted">El sistema sugiere: ${suggested?.name || "sin sugerencia todavia"}.</p>` : ""}
        ${formGrid(html`
          ${formField({ id: "clientProfile-profile", name: "profileId", label: "Asignar perfil", type: "select", options, value: current?.id || "", placeholderOption: "Elegir perfil", required: true, width: "half" })}
          ${formField({ id: "clientProfile-reason", name: "reason", label: "Motivo (opcional)", width: "half", inputAttrs: { maxlength: PROFILE_REASON_MAX, placeholder: "Por que elegis este perfil" } })}
        `)}
      `,
      footer: html`
        ${button({ label: "Asignar perfil", icon: "fa-floppy-disk", action: "assign-profile" })}
        ${chosenByAdvisor ? button({ label: "Volver al automatico", variant: "ghost", icon: "fa-rotate-left", action: "reset-profile" }) : ""}
      `,
    });
  }

  async _assignProfile(trigger) {
    const profileId = this.element.querySelector("#clientProfile-profile")?.value || "";
    const reason = this.element.querySelector("#clientProfile-reason")?.value || "";
    if (!profileId) {
      this.options.showToast?.("Elegi un perfil para asignar.", "warning");
      return;
    }
    const assigned = await this._runAction(() => clientsService.assignSpendingProfile(this.clientId, { profileId, reason }), {
      button: trigger,
      successMessage: "Perfil asignado. El sistema ya no lo cambia automaticamente.",
    });
    if (assigned && this._isAlive()) {
      await this._refreshProfile();
    }
  }

  async _resetProfile(trigger) {
    const reset = await this._runAction(() => clientsService.resetSpendingProfile(this.clientId).then(() => true), {
      button: trigger,
      successMessage: "Listo: el perfil vuelve a calcularse automaticamente.",
    });
    if (reset && this._isAlive()) {
      await this._refreshProfile();
    }
  }

  /** Relee el análisis para mostrar el perfil vigente y la sugerencia actualizados. */
  async _refreshProfile() {
    const analysis = await this._runAction(() => analysisService.getForClient(this.clientId));
    if (!analysis || !this._isAlive()) {
      return;
    }
    this.client = { ...this.client, spendingProfile: analysis.spendingProfile };
    this._renderHeader(this.client);
    this._renderProfile(analysis.spendingProfile, analysis.suggestedProfile);
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
