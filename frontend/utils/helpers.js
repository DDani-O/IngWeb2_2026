import { PLACEHOLDER_PRESETS, ROUTES } from "./constants.js";

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

export function buildHash(path, query = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = stringifyQuery(query);

  if (!queryString) {
    return `#${normalizedPath}`;
  }

  return `#${normalizedPath}?${queryString}`;
}

export function sanitizeText(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function debounce(fn, delay = 250) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

export function sleep(ms = 200) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function createElementFromHTML(htmlString) {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content.firstElementChild;
}

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

export function getPlaceholderPreset(presetName = "") {
  return PLACEHOLDER_PRESETS[presetName] || null;
}

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

export function renderStars(rating = 5) {
  const stars = clamp(rating, 1, 5);
  return Array.from({ length: stars })
    .map(() => '<i class="fa-solid fa-star"></i>')
    .join("");
}

export function getInitials(fullName = "") {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
