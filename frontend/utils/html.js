/**
 * html.js - Plantillas HTML con escapado por defecto.
 *
 * Toda interpolación dentro de html`...` se escapa salvo que ya sea un
 * fragmento seguro (otro html`...`) o un array de fragmentos seguros.
 * Así los datos que vienen de la API o del usuario nunca se interpretan como HTML.
 */

/**
 * Fragmento HTML ya escapado. Se reconoce como seguro al interpolarlo.
 */
export class SafeHtml {
  constructor(value = "") {
    this.value = String(value);
  }

  toString() {
    return this.value;
  }
}

/**
 * Escapa caracteres especiales de HTML de un valor cualquiera.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convierte un valor interpolado en HTML seguro.
 * @param {*} value
 * @returns {string}
 */
function toSafeString(value) {
  if (value instanceof SafeHtml) {
    return value.value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSafeString(item)).join("");
  }

  if (value === false || value === null || value === undefined) {
    return "";
  }

  return escapeHtml(value);
}

/**
 * Tagged template que escapa todas las interpolaciones.
 * Ejemplo: html`<p>${user.name}</p>` o html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`.
 * @returns {SafeHtml}
 */
export function html(strings, ...values) {
  const result = strings.reduce((accumulator, chunk, index) => {
    const value = index < values.length ? toSafeString(values[index]) : "";
    return accumulator + chunk + value;
  }, "");

  return new SafeHtml(result);
}

/**
 * Marca como seguro un HTML de confianza (solo para marcado fijo del propio código).
 * @param {string} trustedMarkup
 * @returns {SafeHtml}
 */
export function unsafeRaw(trustedMarkup) {
  return new SafeHtml(trustedMarkup);
}
