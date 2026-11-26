import { attrs, html } from "../../utils/html.js";

/**
 * Átomo Icon: ícono de Font Awesome.
 * @param {{name: string, label?: string|null, className?: string}} props
 *   `label` lo hace accesible (role="img"); sin label es decorativo (aria-hidden).
 */
export function icon({ name, label = null, className = "" } = {}) {
  if (!name) {
    return html``;
  }

  return html`<i ${attrs({
    class: `fa-solid ${name} ${className}`.trim(),
    role: label ? "img" : null,
    "aria-label": label,
    "aria-hidden": label ? null : "true",
  })}></i>`;
}
