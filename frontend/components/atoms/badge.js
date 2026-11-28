/** Átomo `badge` de la biblioteca de componentes; estilos en badge.css. */
import { attrs, html } from "../../utils/html.js";
import { icon as renderIcon } from "./icon.js";

const TONES = ["neutral", "success", "warning", "danger", "info"];

/**
 * Átomo Badge: etiqueta corta de estado, prioridad, riesgo o categoría.
 * @param {{text: string, tone?: "neutral"|"success"|"warning"|"danger"|"info", icon?: string|null, title?: string|null}} props
 */
export function badge({ text, tone = "neutral", icon = null, title = null } = {}) {
  const safeTone = TONES.includes(tone) ? tone : "neutral";
  return html`<span ${attrs({ class: `status-badge status-badge--${safeTone}`, title })}>${renderIcon({ name: icon })}${text}</span>`;
}
