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

  /** Permite usarlo dentro de template strings comunes como texto ya escapado. */
  toString() {
    return this.value;
  }
}

/**
 * Escapa caracteres especiales de HTML de un valor cualquiera.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
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
 * Arma atributos HTML seguros a partir de un objeto. Omite valores false/null/undefined;
 * `true` genera un atributo booleano. Los nombres se validan y los valores se escapan.
 * Ejemplo: html`<button ${attrs({ "data-id": id, disabled: busy })}>`.
 * @param {Object<string, *>} attributes
 * @returns {SafeHtml}
 */
export function attrs(attributes = {}) {
  const parts = Object.entries(attributes)
    .filter(([name, value]) => /^[a-zA-Z][\w:-]*$/.test(name) && value !== false && value !== null && value !== undefined)
    .map(([name, value]) => (value === true ? name : `${name}="${escapeHtml(value)}"`));

  return new SafeHtml(parts.join(" "));
}

/**
 * Une clases CSS ignorando valores vacíos.
 * @param {...(string|false|null|undefined)} classNames
 */
export function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}
