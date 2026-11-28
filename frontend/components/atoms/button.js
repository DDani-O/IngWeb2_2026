/** Átomo `button` de la biblioteca de componentes; estilos en button.css. */
import { attrs, cx, html } from "../../utils/html.js";
import { icon as renderIcon } from "./icon.js";

const VARIANTS = ["primary", "ghost", "danger"];

/**
 * Átomo Button. Con `href` se renderiza como link.
 * @param {object} props
 * @param {string} props.label
 * @param {"primary"|"ghost"|"danger"} [props.variant="primary"]
 * @param {"sm"|"md"} [props.size="md"]
 * @param {string|null} [props.icon] clase de Font Awesome (ej. "fa-floppy-disk")
 * @param {"button"|"submit"} [props.type="button"]
 * @param {string|null} [props.href]
 * @param {boolean} [props.newTab=false] abre el link en pestaña nueva
 * @param {string|null} [props.action] valor de data-action (para delegación de eventos en el padre)
 * @param {string|null} [props.id] valor de data-id
 * @param {boolean} [props.block=false] ocupa todo el ancho
 * @param {boolean} [props.disabled=false]
 * @param {string|null} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function button({
  label,
  variant = "primary",
  size = "md",
  icon = null,
  type = "button",
  href = null,
  newTab = false,
  action = null,
  id = null,
  block = false,
  disabled = false,
  ariaLabel = null,
  className = "",
} = {}) {
  const classes = cx(
    "action-btn",
    `action-btn--${VARIANTS.includes(variant) ? variant : "primary"}`,
    size === "sm" && "action-btn--sm",
    block && "action-btn--block",
    className
  );
  const common = { class: classes, "data-action": action, "data-id": id, "aria-label": ariaLabel };
  const content = html`${renderIcon({ name: icon })}<span>${label}</span>`;

  if (href) {
    return html`<a ${attrs({ ...common, href, target: newTab ? "_blank" : null, rel: newTab ? "noopener" : null })}>${content}</a>`;
  }

  return html`<button ${attrs({ ...common, type, disabled })}>${content}</button>`;
}
