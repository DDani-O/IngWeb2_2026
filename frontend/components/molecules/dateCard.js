/** Molécula `dateCard` de la biblioteca de componentes; estilos en dateCard.css. */
import { APP_CONFIG } from "../../utils/constants.js";
import { html } from "../../utils/html.js";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Molécula DateCard: fecha destacada (día, mes, año y día de la semana).
 * @param {{date?: Date}} props
 */
export function dateCard({ date = new Date() } = {}) {
  const locale = APP_CONFIG.DEFAULT_LOCALE;
  return html`
    <div class="date-card">
      <div class="date-card__day">${date.getDate()}</div>
      <div class="date-card__month">${capitalize(date.toLocaleDateString(locale, { month: "long" }))}</div>
      <div class="date-card__meta">${date.getFullYear()}</div>
      <div class="date-card__meta">${capitalize(date.toLocaleDateString(locale, { weekday: "long" }))}</div>
    </div>
  `;
}
