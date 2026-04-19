import { PLACEHOLDER_PRESETS, ROUTES } from "./constants.js";

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
 * Es util para construir URLs limpias en navegacion y filtros.
 */
export function stringifyQuery(params = {}) {
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
 * Escapa caracteres HTML para prevenir inyecciones al renderizar texto dinamico.
 */
export function sanitizeText(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Limita un valor numerico a un rango minimo y maximo.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Retrasa ejecucion de una funcion para evitar llamadas excesivas.
 * Se puede usar en buscadores, resize o inputs reactivos.
 */
export function debounce(fn, delay = 250) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * Pausa asincrona util para simular latencia o encadenar transiciones.
 */
export function sleep(ms = 200) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Crea un nodo DOM desde un string HTML.
 * Puede aprovecharse para plantillas pequenas o componentes dinamicos.
 */
export function createElementFromHTML(htmlString) {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content.firstElementChild;
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
 * Obtiene un preset de placeholder por nombre.
 * Sirve para centralizar textos/iconos de paginas no implementadas.
 */
export function getPlaceholderPreset(presetName = "") {
  return PLACEHOLDER_PRESETS[presetName] || null;
}

/**
 * Construye el hash de placeholder usando preset y overrides opcionales.
 * Si no existe preset, aplica una configuracion por defecto.
 */
export function buildPlaceholderHashFromPreset(presetName, override = {}) {
  const preset = getPlaceholderPreset(presetName);

  if (!preset) {
    return buildHash(ROUTES.PLACEHOLDER, {
      title: "Pagina en Construccion",
      description: "Estamos trabajando en esta seccion. Vuelve pronto.",
      icon: "fa-hammer",
      ctaText: "Volver al Inicio",
      ctaUrl: ROUTES.HOME,
    });
  }

  return buildHash(ROUTES.PLACEHOLDER, {
    ...preset,
    ...override,
  });
}

/**
 * Renderiza estrellas HTML segun rating limitado entre 1 y 5.
 */
export function renderStars(rating = 5) {
  const stars = clamp(rating, 1, 5);
  return Array.from({ length: stars })
    .map(() => '<i class="fa-solid fa-star"></i>')
    .join("");
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
export function getCssVar(name, fallback = "") {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
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
