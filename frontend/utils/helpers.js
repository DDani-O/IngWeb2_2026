import { html } from "./html.js";

/**
 * Convierte una query string en objeto para simplificar lectura de parametros.
 */
export function parseQueryString(queryString = "") {
  const search = queryString.startsWith("?")
    ? queryString.slice(1)
    : queryString;

  const params = new URLSearchParams(search);
  const result = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

/**
 * Convierte un objeto en query string, omitiendo valores vacios.
 */
function stringifyQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

/**
 * Completa los parámetros de una ruta con `:param` (ej. "/cliente/gastos/:id" → "/cliente/gastos/gas-1").
 * @param {string} pattern
 * @param {Object<string, string>} params
 */
export function fillRoute(pattern, params = {}) {
  return pattern.replace(/:(\w+)/g, (_match, key) => encodeURIComponent(params[key] ?? ""));
}

/**
 * Construye un hash route consistente a partir de path y query.
 */
export function buildHash(path, query = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = stringifyQuery(query);

  if (!queryString) {
    return `#${normalizedPath}`;
  }

  return `#${normalizedPath}?${queryString}`;
}

/**
 * Limita un valor numerico a un rango minimo y maximo.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Devuelve una versión de `fn` que solo corre cuando pasan `delay` ms sin nuevas llamadas
 * (los buscadores de `FilterBar` no filtran en cada tecla).
 */
export function debounce(fn, delay = 250) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * Pausa asincrona (la usa el driver mock para simular la latencia de la red).
 */
export function sleep(ms = 200) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Valida que una URL sea relativa y segura para navegacion interna.
 */
export function isSafeRelativeUrl(url = "") {
  if (!url || typeof url !== "string") {
    return false;
  }

  if (url.startsWith("javascript:") || url.startsWith("data:")) {
    return false;
  }

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
    return false;
  }

  return url.startsWith("/");
}

/**
 * Renderiza estrellas HTML segun rating limitado entre 1 y 5.
 */
export function renderStars(rating = 5) {
  const stars = clamp(rating, 1, 5);
  return html`${Array.from({ length: stars }).map(() => html`<i class="fa-solid fa-star"></i>`)}`;
}

/**
 * Genera iniciales de un nombre para avatares o chips de usuario.
 */
export function getInitials(fullName = "") {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/**
 * Lee una variable CSS global con fallback para estilos dinamicos.
 */
function getCssVar(name, fallback = "") {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

/**
 * Paleta categórica de gráficos tomada de los tokens --chart-1 … --chart-N (global.css).
 * @param {number} size
 */
export function getChartPalette(size = 8) {
  const fallback = ["#39dfbf", "#31a8d4", "#f6b437", "#a78bfa", "#ff5d66", "#7dd87a", "#f08bd0", "#94a3b8"];
  return Array.from({ length: size }, (_, index) => getCssVar(`--chart-${index + 1}`, fallback[index % fallback.length]));
}

/**
 * Devuelve una paleta de colores basada en variables del tema actual.
 * Pensada para unificar colores de graficos entre paginas.
 */
export function getChartThemeColors() {
  return {
    label: getCssVar("--text-muted", "#94a3b8"),
    grid: getCssVar("--border-soft", "rgba(148, 163, 184, 0.2)"),
    border: getCssVar("--app-bg-end", "#021312"),
    primary: getCssVar("--color-primary", "#39dfbf"),
    info: getCssVar("--color-info", "#31d4c7"),
    danger: getCssVar("--color-danger", "#ff5d66"),
  };
}
