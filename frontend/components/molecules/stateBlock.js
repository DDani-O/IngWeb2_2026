/** Moléculas de estado (vacío, cargando y error) de la biblioteca de componentes; estilos en stateBlock.css. */
import { html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { icon as renderIcon } from "../atoms/icon.js";

/**
 * Molécula EmptyState: no hay datos para mostrar.
 * @param {{icon?: string, title: string, message?: string, action?: object|null}} props
 *   `action`: props de un botón (ej. { label, href }).
 */
export function emptyState({ icon = "fa-inbox", title, message = "", action = null } = {}) {
  return html`
    <div class="state-block state-block--empty">
      ${renderIcon({ name: icon, className: "state-block__icon" })}
      <p class="state-block__title">${title}</p>
      ${message ? html`<p class="state-block__message">${message}</p>` : ""}
      ${action ? button({ variant: "ghost", size: "sm", ...action }) : ""}
    </div>
  `;
}

/**
 * Molécula LoadingState: carga en curso (anunciada a lectores de pantalla).
 */
export function loadingState({ message = "Cargando datos..." } = {}) {
  return html`
    <div class="state-block state-block--loading" role="status" aria-live="polite">
      <span class="state-block__spinner" aria-hidden="true"></span>
      <p class="state-block__message">${message}</p>
    </div>
  `;
}

/**
 * Molécula ErrorState: falló una carga. El botón emite clicks con data-action="retry".
 */
export function errorState({ message = "No pudimos cargar los datos.", retryLabel = "Reintentar" } = {}) {
  return html`
    <div class="state-block state-block--error" role="alert">
      ${renderIcon({ name: "fa-circle-exclamation", className: "state-block__icon" })}
      <p class="state-block__message">${message}</p>
      ${retryLabel ? button({ label: retryLabel, variant: "ghost", size: "sm", action: "retry" }) : ""}
    </div>
  `;
}
