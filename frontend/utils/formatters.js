import { APP_CONFIG } from "./constants.js";

/**
 * Convierte un valor numerico a texto monetario para mostrar montos en UI.
 * Tambien sirve para estandarizar moneda en reportes y tablas futuras.
 */
export function formatCurrency(value, currency = APP_CONFIG.DEFAULT_CURRENCY) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(APP_CONFIG.DEFAULT_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convierte el valor a Date. Las fechas "AAAA-MM-DD" (columnas date de la BD) se
 * interpretan en hora local: new Date("2026-04-12") las toma como UTC y en
 * Argentina mostraría el día anterior.
 */
function toLocalDate(dateValue) {
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(dateValue);
}

/**
 * Formatea una fecha completa en formato legible segun locale.
 * Es util para historiales, listados y auditorias.
 */
export function formatDate(dateValue, locale = APP_CONFIG.DEFAULT_LOCALE) {
  const date = toLocalDate(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formatea una fecha corta (mes y dia) para vistas compactas.
 * Puede reutilizarse en ejes de graficos o resumenes rapidos.
 */
export function formatShortDate(dateValue, locale = APP_CONFIG.DEFAULT_LOCALE) {
  const date = toLocalDate(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Construye una etiqueta de tendencia con flecha y porcentaje.
 * Pensada para indicadores comparativos (sube/baja).
 */
export function formatTrendLabel(direction, value, label) {
  const arrow = direction === "up" ? "▲" : "▼";
  return `${arrow} ${value}% ${label}`;
}
