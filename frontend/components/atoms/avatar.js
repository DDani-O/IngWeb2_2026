import { getInitials } from "../../utils/helpers.js";
import { attrs, html } from "../../utils/html.js";

/**
 * Átomo Avatar: iniciales de una persona.
 * @param {{name: string, size?: "sm"|"md"|"lg"}} props
 */
export function avatar({ name = "", size = "md" } = {}) {
  return html`<span ${attrs({ class: `avatar avatar--${size}`, "aria-hidden": "true" })}>${getInitials(name) || "?"}</span>`;
}
