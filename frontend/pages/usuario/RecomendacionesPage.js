import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class RecomendacionesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = {
      stats: {
        totalSavingsPotential: 0,
        activeRecommendations: 0,
        completedThisMonth: 0,
        estimatedImpact: "0%",
      },
      recommendations: [],
    };
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
    this._loadRecommendations();
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

    // Delegación global para capturar acciones en recomendaciones
    this.listen(this.element, "click", (event) => this._handleCardAction(event));

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

    const low = this.filteredRecommendations.filter(
      (item) => item.priority === "Baja" && item.status !== "Completada" && item.status !== "Descartada"
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

    const lowContainer = this.element.querySelector("#recommendationsLowPriority");
    if (lowContainer) {
      lowContainer.innerHTML = low.length
        ? low.map((item) => this._buildRecommendationCard(item)).join("")
        : '<p class="text-muted">No hay recomendaciones de prioridad baja para este filtro.</p>';
    }

    completedContainer.innerHTML = completed.length
      ? completed.map((item) => this._buildRecommendationCard(item)).join("")
      : '<p class="text-muted">Aun no tienes recomendaciones completadas en este filtro.</p>';
  }

  async _loadRecommendations() {
    try {
      const response = await apiClient.get("/users/me/recommendations");
      this.data = this._mapRecommendations(response);
      this.filteredRecommendations = [...this.data.recommendations];
      this._renderSummary();
      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar recomendaciones.",
        "warning"
      );
    }
  }

  _mapRecommendations(payload) {
    const stats = payload?.stats || {};
    const items = Array.isArray(payload?.recommendations)
      ? payload.recommendations
      : [];

    return {
      stats: {
        totalSavingsPotential: Number(stats.totalSavingsPotential) || 0,
        activeRecommendations: Number(stats.activeRecommendations) || 0,
        completedThisMonth: Number(stats.completedThisMonth) || 0,
        estimatedImpact: stats.estimatedImpact || "0%",
      },
      recommendations: items.map((item) => ({
        ...item,
        priority: item.priority || "Media",
        status: item.status || "Pendiente",
        icon: item.icon || "💡",
        implementationSteps: Array.isArray(item.implementationSteps)
          ? item.implementationSteps
          : [],
        dateSentLabel: this._formatDateLabel(item.dateSent),
      })),
    };
  }

  _formatDateLabel(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  _buildRecommendationCard(item) {
    const priorityClass = item.priority === "Alta" ? "alta" : "media";
    const completedClass = item.status === "Completada" ? "recommendation-card--completada" : "";
    const dateLabel = item.dateSentLabel || item.dateSent || "-";

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

        <p class="text-muted">Enviado el ${dateLabel}</p>

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
    if (!recommendationId) {
      return;
    }

    const recommendation = this.data.recommendations.find((item) => item.id === recommendationId);
    if (!recommendation) {
      return;
    }

    if (action === "complete") {
      event.preventDefault();
      this._updateRecommendationStatus(recommendation, "completada");
      return;
    }

    if (action === "discard") {
      event.preventDefault();
      this._updateRecommendationStatus(recommendation, "descartada");
      return;
    }

    if (action === "detail") {
      event.preventDefault();
      this._openDetailModal(recommendation);
      return;
    }
  }

  async _updateRecommendationStatus(recommendation, status) {
    try {
      const result = await apiClient.patch(
        `/users/me/recommendations/${recommendation.id}`,
        { status },
      );
      recommendation.status = result.status;
      this.options.showToast?.(
        status === "completada"
          ? "Recomendacion marcada como completada."
          : "Recomendacion descartada.",
        status === "completada" ? "success" : "warning",
      );
      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo actualizar la recomendacion.",
        "warning",
      );
    }
  }

  _openDetailModal(recommendation) {
    this.activeRecommendation = recommendation;

    if (!recommendation.isRead) {
      apiClient
        .patch(`/users/me/recommendations/${recommendation.id}`, { isRead: true })
        .then(() => {
          recommendation.isRead = true;
        })
        .catch(() => {});
    }

    const content = this.element.querySelector("#recommendationDetailContent");
    if (content) {
      content.innerHTML = `
        <h6 class="mb-2">${recommendation.icon} ${recommendation.title}</h6>
        <p class="text-muted mb-2"><strong>Problema:</strong> ${recommendation.problem}</p>
        <p class="text-muted mb-2"><strong>Solucion:</strong> ${recommendation.solution}</p>
        <p class="text-muted mb-2"><strong>Ahorro potencial:</strong> ${formatCurrency(
          recommendation.savingsPotential
        )} por mes</p>
        <p class="text-muted mb-2"><strong>Asesor:</strong> ${recommendation.advisorName || "-"}</p>
        <p class="text-muted mb-2"><strong>Estado:</strong> ${recommendation.status}</p>
        <p class="text-muted mb-0"><strong>Leida:</strong> ${recommendation.isRead ? "Si" : "No"}</p>
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
