import { formatCurrency } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";
import { trend as renderTrend } from "../atoms/trend.js";

/**
 * Formatea un valor de KPI. Único lugar donde se decide el formato (antes había 3 versiones).
 * @param {*} value
 * @param {"currency"|"number"|"percent"|"text"} format
 */
export function formatStatValue(value, format = "number") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value}%`;
    case "number":
      return Number(value).toLocaleString("es-AR");
    default:
      return String(value);
  }
}

/**
 * Molécula StatCard (KPI).
 * @param {object} props
 * @param {string} props.label
 * @param {*} props.value
 * @param {"currency"|"number"|"percent"|"text"} [props.format="number"]
 * @param {string} [props.emoji]
 * @param {string} [props.subtitle]
 * @param {{value: number|null, label?: string, goodWhen?: "up"|"down"}|null} [props.trend]
 */
export function statCard({ label, value, format = "number", emoji = "", subtitle = "", trend = null } = {}) {
  return html`
    <article class="stat-card">
      <div class="stat-card__head">
        <p class="stat-card__label">${label}</p>
        ${emoji ? html`<span class="stat-card__emoji" aria-hidden="true">${emoji}</span>` : ""}
      </div>
      <p class="stat-card__value">${formatStatValue(value, format)}</p>
      ${subtitle ? html`<p class="stat-card__sub">${subtitle}</p>` : ""}
      ${trend ? html`<p class="stat-card__trend">${renderTrend(trend)}</p>` : ""}
    </article>
  `;
}
