/** Átomo `trend` de la biblioteca de componentes; estilos en trend.css. */
import { html } from "../../utils/html.js";

/**
 * Átomo Trend: variación porcentual con flecha y color según si es buena o mala.
 * @param {object} props
 * @param {number|null} props.value porcentaje con signo (ej. -12, 18); null muestra "--"
 * @param {string} [props.label] texto que sigue al porcentaje
 * @param {"up"|"down"} [props.goodWhen="down"] dirección que se considera positiva (en gastos, bajar)
 */
export function trend({ value, label = "", goodWhen = "down" } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return html`<span class="trend trend--neutral">--</span>`;
  }

  const number = Number(value);
  const direction = number > 0 ? "up" : number < 0 ? "down" : "flat";
  const tone = direction === "flat" ? "neutral" : direction === goodWhen ? "good" : "bad";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
  const sign = number > 0 ? "+" : "";

  return html`<span class="trend trend--${tone}"><span aria-hidden="true">${arrow}</span> ${sign}${number}%${label ? ` ${label}` : ""}</span>`;
}
