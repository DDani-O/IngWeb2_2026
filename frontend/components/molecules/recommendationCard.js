import { PRIORITY_TONES, RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";
import { badge } from "../atoms/badge.js";
import { button } from "../atoms/button.js";

const labelOf = (options, value) => options.find((option) => option.value === value)?.label || value;

export const recommendationLabels = {
  type: (value) => labelOf(RECOMMENDATION_TYPES, value),
  priority: (value) => labelOf(RECOMMENDATION_PRIORITIES, value),
  origin: (item) => (item.origin === "asesor" ? `Enviada por ${item.advisorName || "tu asesor"}` : "Generada por el sistema"),
};

/**
 * Molécula RecommendationCard. Acciones por delegación (data-action/data-id).
 * @param {{recommendation: object, actions?: {action: string, label: string, variant?: string}[]}} props
 */
export function recommendationCard({ recommendation: item, actions = [] } = {}) {
  return html`
    <article class="recommendation-card recommendation-card--${item.priority} ${item.read ? "recommendation-card--read" : ""}">
      <header class="recommendation-card__head">
        <div class="recommendation-card__badges">
          ${badge({ text: `Prioridad ${recommendationLabels.priority(item.priority).toLowerCase()}`, tone: PRIORITY_TONES[item.priority] })}
          ${badge({ text: recommendationLabels.type(item.type) })}
          ${badge({ text: item.read ? "Leida" : "Sin leer", tone: item.read ? "success" : "info" })}
        </div>
        <h3 class="recommendation-card__title">${item.title}</h3>
      </header>
      <p class="recommendation-card__text">${item.message}</p>
      <p class="recommendation-card__meta">${recommendationLabels.origin(item)} · ${formatDate(item.date)}</p>
      ${actions.length
        ? html`<div class="recommendation-card__actions">${actions.map((action) =>
            button({ size: "sm", variant: action.variant || "ghost", label: action.label, action: action.action, id: item.id })
          )}</div>`
        : ""}
    </article>
  `;
}
