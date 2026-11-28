/** Molécula `infoCard` de la biblioteca de componentes; estilos en infoCard.css. */
import { html } from "../../utils/html.js";
import { icon as renderIcon } from "../atoms/icon.js";

/**
 * Molécula InfoCard: tarjeta con encabezado, cuerpo y pie (slots).
 * @param {{title: string, icon?: string|null, subtitle?: string, body?: *, footer?: *, highlight?: boolean}} props
 *   `body` y `footer` son SafeHtml (contenido inyectado por el padre).
 */
export function infoCard({ title, icon = null, subtitle = "", body = null, footer = null, highlight = false } = {}) {
  return html`
    <article class="info-card ${highlight ? "info-card--highlight" : ""}">
      <header class="info-card__header">
        <h3 class="info-card__title">${renderIcon({ name: icon, className: "accent" })}${title}</h3>
        ${subtitle ? html`<p class="info-card__subtitle">${subtitle}</p>` : ""}
      </header>
      ${body ? html`<div class="info-card__body">${body}</div>` : ""}
      ${footer ? html`<footer class="info-card__footer">${footer}</footer>` : ""}
    </article>
  `;
}
