import { PageController } from "../../core/PageController.js";
import { MOCK_RECOMMENDATIONS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class RecomendacionesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_RECOMMENDATIONS));
    this.filteredRecommendations = [...this.data.recommendations];
    this.detailModal = null;
    this.contactModal = null;
    this.activeRecommendation = null;
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "Juan Perez";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "JP");

    this._renderSummary();
    this._applyFilters();
  }

  attachEvents() {
    [
      "#recommendationPriorityFilter",
      "#recommendationStatusFilter",
      "#recommendationSortFilter",
    ].forEach((selector) => {
      const select = this.element.querySelector(selector);
      this.listen(select, "change", () => this._applyFilters());
    });

    [
      "#recommendationsHighPriority",
      "#recommendationsMediumPriority",
      "#recommendationsCompleted",
    ].forEach((selector) => {
      const group = this.element.querySelector(selector);
      this.listen(group, "click", (event) => this._handleCardAction(event));
    });

    const openContact = this.element.querySelector("#openRecommendationContactButton");
    this.listen(openContact, "click", () => this._openContactModal());
    this._bindDashboardBackButtons();
    this._bindLogoutButtons();

    const contactForm = this.element.querySelector("#recommendationContactForm");
    this.listen(contactForm, "submit", (event) => {
      event.preventDefault();
      this.options.showToast?.("Mensaje enviado a tu asesor.", "success");
      this.contactModal?.hide();
      contactForm.reset();
    });
  }

  _renderSummary() {
    this._setText(
      "#summarySavingsValue",
      `+${formatCurrency(this.data.stats.totalSavingsPotential)}/mes`
    );
    this._setText("#summaryActiveValue", String(this.data.stats.activeRecommendations));
    this._setText("#summaryCompletedValue", String(this.data.stats.completedThisMonth));
    this._setText(
      "#summaryImpactValue",
      formatCurrency(this.data.stats.totalSavingsPotential * 12)
    );
  }

  _applyFilters() {
    const priority = this._getValue("#recommendationPriorityFilter");
    const status = this._getValue("#recommendationStatusFilter");
    const sort = this._getValue("#recommendationSortFilter");

    let recommendations = [...this.data.recommendations];

    if (priority && priority !== "Todas") {
      recommendations = recommendations.filter((item) => item.priority === priority);
    }

    if (status && status !== "Todas") {
      recommendations = recommendations.filter((item) => item.status === status);
    }

    if (sort === "ahorro") {
      recommendations.sort((a, b) => b.savingsPotential - a.savingsPotential);
    } else if (sort === "prioridad") {
      recommendations.sort((a, b) => this._priorityWeight(b.priority) - this._priorityWeight(a.priority));
    } else {
      recommendations.sort((a, b) => new Date(b.dateSent) - new Date(a.dateSent));
    }

    this.filteredRecommendations = recommendations;
    this._setText("#recommendationCount", `${recommendations.length} recomendaciones`);
    this._renderGroups();
  }

  _renderGroups() {
    const highContainer = this.element.querySelector("#recommendationsHighPriority");
    const mediumContainer = this.element.querySelector("#recommendationsMediumPriority");
    const completedContainer = this.element.querySelector("#recommendationsCompleted");

    if (!highContainer || !mediumContainer || !completedContainer) {
      return;
    }

    const high = this.filteredRecommendations.filter(
      (item) => item.priority === "Alta" && item.status !== "Completada" && item.status !== "Descartada"
    );

    const medium = this.filteredRecommendations.filter(
      (item) => item.priority === "Media" && item.status !== "Completada" && item.status !== "Descartada"
    );

    const completed = this.filteredRecommendations.filter(
      (item) => item.status === "Completada" || item.status === "Descartada"
    );

    highContainer.innerHTML = high.length
      ? high.map((item) => this._buildRecommendationCard(item)).join("")
      : '<p class="text-muted">No hay recomendaciones de alta prioridad para este filtro.</p>';

    mediumContainer.innerHTML = medium.length
      ? medium.map((item) => this._buildRecommendationCard(item)).join("")
      : '<p class="text-muted">No hay recomendaciones de prioridad media para este filtro.</p>';

    completedContainer.innerHTML = completed.length
      ? completed.map((item) => this._buildRecommendationCard(item)).join("")
      : '<p class="text-muted">Aun no tienes recomendaciones completadas en este filtro.</p>';
  }

  _buildRecommendationCard(item) {
    const priorityClass = item.priority === "Alta" ? "alta" : "media";
    const completedClass = item.status === "Completada" ? "recommendation-card--completada" : "";

    return `
      <article class="recommendation-card recommendation-card--${priorityClass} ${completedClass}">
        <div class="recommendation-card__head">
          <div>
            <span class="badge-soft badge-soft--${
              item.priority === "Alta" ? "danger" : "warning"
            }">${item.priority}</span>
            <h3 class="recommendation-card__title">${item.icon} ${item.title}</h3>
          </div>
          <span class="badge-soft badge-soft--${this._statusColor(item.status)}">${item.status}</span>
        </div>

        <p class="recommendation-card__text"><strong>Problema:</strong> ${item.problem}</p>
        <p class="recommendation-card__text"><strong>Solucion:</strong> ${item.solution}</p>

        <span class="recommendation-savings">
          <i class="fa-solid fa-sack-dollar"></i>
          Ahorro potencial: ${formatCurrency(item.savingsPotential)}/mes
        </span>

        <ol class="recommendation-steps">
          ${item.implementationSteps.map((step) => `<li>${step}</li>`).join("")}
        </ol>

        <p class="text-muted">Enviado el ${item.dateSent}</p>

        <div class="recommendation-actions">
          ${
            item.status !== "Completada" && item.status !== "Descartada"
              ? `<button class="action-btn action-btn--primary" data-action="complete" data-id="${item.id}" type="button">Marcar completada</button>
                 <button class="action-btn action-btn--ghost" data-action="discard" data-id="${item.id}" type="button">Descartar</button>`
              : ""
          }
          <button class="action-btn action-btn--ghost" data-action="detail" data-id="${item.id}" type="button">Ver detalle</button>
        </div>
      </article>
    `;
  }

  _handleCardAction(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;
    const recommendationId = actionTarget.dataset.id;
    const recommendation = this.data.recommendations.find((item) => item.id === recommendationId);

    if (!recommendation) {
      return;
    }

    if (action === "complete") {
      recommendation.status = "Completada";
      this.options.showToast?.("Recomendacion marcada como completada.", "success");
      this._applyFilters();
      return;
    }

    if (action === "discard") {
      recommendation.status = "Descartada";
      this.options.showToast?.("Recomendacion descartada.", "warning");
      this._applyFilters();
      return;
    }

    if (action === "detail") {
      this._openDetailModal(recommendation);
    }
  }

  _openDetailModal(recommendation) {
    this.activeRecommendation = recommendation;

    const content = this.element.querySelector("#recommendationDetailContent");
    if (content) {
      content.innerHTML = `
        <h6 class="mb-2">${recommendation.icon} ${recommendation.title}</h6>
        <p class="text-muted mb-2"><strong>Problema:</strong> ${recommendation.problem}</p>
        <p class="text-muted mb-2"><strong>Solucion:</strong> ${recommendation.solution}</p>
        <p class="text-muted mb-2"><strong>Ahorro potencial:</strong> ${formatCurrency(
          recommendation.savingsPotential
        )} por mes</p>
        <p class="text-muted mb-2"><strong>Asesor:</strong> ${recommendation.advisorName}</p>
        <p class="text-muted mb-0"><strong>Contacto:</strong> ${recommendation.advisorEmail}</p>
      `;
    }

    this.detailModal = this._showModal("#recommendationDetailModal");
  }

  _openContactModal() {
    this.contactModal = this._showModal("#recommendationContactModal");
  }

  _statusColor(status) {
    if (status === "Completada") {
      return "success";
    }

    if (status === "Descartada") {
      return "warning";
    }

    return status === "Pendiente" ? "danger" : "warning";
  }

  _priorityWeight(priority) {
    return priority === "Alta" ? 2 : 1;
  }
}
