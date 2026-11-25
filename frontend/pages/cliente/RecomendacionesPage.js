import { PageController } from "../../core/PageController.js";
import {
  MOCK_RECOMMENDATIONS,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_TYPES,
} from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const PRIORITY_WEIGHT = { alta: 3, media: 2, baja: 1 };
const PRIORITY_TONE = { alta: "danger", media: "warning", baja: "success" };

/**
 * Recomendaciones recibidas por el cliente (del sistema o de su asesor).
 * Modelo alineado con recomendaciones_financieras: titulo, mensaje, tipo, prioridad, origen, leida.
 */
export class RecomendacionesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.recommendations = JSON.parse(JSON.stringify(MOCK_RECOMMENDATIONS.recommendations));
    this.filteredRecommendations = [...this.recommendations];
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._applyFilters();
  }

  attachEvents() {
    [
      "#recommendationPriorityFilter",
      "#recommendationTypeFilter",
      "#recommendationReadFilter",
      "#recommendationSortFilter",
    ].forEach((selector) => {
      const select = this.element.querySelector(selector);
      this.listen(select, "change", () => this._applyFilters());
    });

    const groups = this.element.querySelector("#recommendationGroups");
    this.listen(groups, "click", (event) => this._handleCardAction(event));

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _applyFilters() {
    const priority = this._getValue("#recommendationPriorityFilter") || "todas";
    const type = this._getValue("#recommendationTypeFilter") || "todos";
    const readState = this._getValue("#recommendationReadFilter") || "todas";
    const sort = this._getValue("#recommendationSortFilter") || "reciente";

    let result = [...this.recommendations];

    if (priority !== "todas") {
      result = result.filter((item) => item.priority === priority);
    }

    if (type !== "todos") {
      result = result.filter((item) => item.type === type);
    }

    if (readState !== "todas") {
      const wantRead = readState === "leidas";
      result = result.filter((item) => item.read === wantRead);
    }

    if (sort === "prioridad") {
      result.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    } else {
      result.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }

    this.filteredRecommendations = result;

    const unreadCount = this.recommendations.filter((item) => !item.read).length;
    this._setText("#recommendationCount", `${result.length} recomendaciones · ${unreadCount} sin leer`);
    this._renderGroups();
  }

  _renderGroups() {
    const highContainer = this.element.querySelector("#recommendationsHighPriority");
    const otherContainer = this.element.querySelector("#recommendationsOtherPriority");
    const readContainer = this.element.querySelector("#recommendationsRead");

    if (!highContainer || !otherContainer || !readContainer) {
      return;
    }

    const unread = this.filteredRecommendations.filter((item) => !item.read);
    const groups = [
      {
        container: highContainer,
        items: unread.filter((item) => item.priority === "alta"),
        emptyText: "No hay recomendaciones de prioridad alta sin leer para este filtro.",
      },
      {
        container: otherContainer,
        items: unread.filter((item) => item.priority !== "alta"),
        emptyText: "No hay otras recomendaciones sin leer para este filtro.",
      },
      {
        container: readContainer,
        items: this.filteredRecommendations.filter((item) => item.read),
        emptyText: "Todavia no leiste recomendaciones de este filtro.",
      },
    ];

    groups.forEach(({ container, items, emptyText }) => {
      container.innerHTML = items.length
        ? html`${items.map((item) => this._buildRecommendationCard(item))}`
        : html`<p class="text-muted">${emptyText}</p>`;
    });
  }

  _buildRecommendationCard(item) {
    return html`
      <article class="recommendation-card recommendation-card--${item.priority} ${item.read ? "recommendation-card--leida" : ""}">
        <div class="recommendation-card__head">
          <div>
            <span class="badge-soft badge-soft--${PRIORITY_TONE[item.priority] || "warning"}">Prioridad ${this._label(RECOMMENDATION_PRIORITIES, item.priority)}</span>
            <span class="badge-soft badge-soft--warning">${this._label(RECOMMENDATION_TYPES, item.type)}</span>
            <h3 class="recommendation-card__title">${item.title}</h3>
          </div>
          <span class="badge-soft badge-soft--${item.read ? "success" : "danger"}">${item.read ? "Leida" : "Sin leer"}</span>
        </div>

        <p class="recommendation-card__text">${item.message}</p>

        <p class="text-muted">${this._originLabel(item)} · ${formatDate(item.date)}</p>

        <div class="recommendation-actions">
          ${item.read
            ? ""
            : html`<button class="action-btn action-btn--primary" data-action="read" data-id="${item.id}" type="button">Marcar como leida</button>`}
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

    const recommendation = this.recommendations.find((item) => item.id === actionTarget.dataset.id);
    if (!recommendation) {
      return;
    }

    if (actionTarget.dataset.action === "read") {
      recommendation.read = true;
      this.options.showToast?.("Recomendacion marcada como leida.", "success");
      this._applyFilters();
      return;
    }

    if (actionTarget.dataset.action === "detail") {
      this._openDetailModal(recommendation);
    }
  }

  _openDetailModal(recommendation) {
    const content = this.element.querySelector("#recommendationDetailContent");
    if (content) {
      content.innerHTML = html`
        <h6 class="mb-2">${recommendation.title}</h6>
        <p class="text-muted mb-2">${recommendation.message}</p>
        <p class="text-muted mb-2"><strong>Tipo:</strong> ${this._label(RECOMMENDATION_TYPES, recommendation.type)}</p>
        <p class="text-muted mb-2"><strong>Prioridad:</strong> ${this._label(RECOMMENDATION_PRIORITIES, recommendation.priority)}</p>
        <p class="text-muted mb-2"><strong>Origen:</strong> ${this._originLabel(recommendation)}</p>
        <p class="text-muted mb-0"><strong>Fecha:</strong> ${formatDate(recommendation.date)}</p>
      `;
    }

    this._showModal("#recommendationDetailModal");
  }

  _originLabel(item) {
    return item.origin === "asesor" ? `Enviada por ${item.advisorName || "tu asesor"}` : "Generada por el sistema";
  }

  _label(options, value) {
    return options.find((option) => option.value === value)?.label || value;
  }
}
