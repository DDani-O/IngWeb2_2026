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
 * Etiqueta corta de un mes "AAAA-MM" (ej: "nov 26").
 */
export function formatMonth(isoMonth, locale = APP_CONFIG.DEFAULT_LOCALE) {
  const [year, month] = String(isoMonth).split("-").map(Number);
  if (!year || !month) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }).format(new Date(year, month - 1, 1));
}

/**
 * Nombre del día de la semana (0 = domingo, como Date.getDay()).
 */
export function formatWeekday(dayIndex, locale = APP_CONFIG.DEFAULT_LOCALE) {
  if (dayIndex === null || dayIndex === undefined) {
    return "--";
  }

  // 2023-01-01 fue domingo.
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2023, 0, 1 + Number(dayIndex)));
}

/**
 * Distancia en días desde una fecha "AAAA-MM-DD" hasta hoy (ej: "Hoy", "Hace 3 d").
 */
export function formatDaysAgo(dateValue) {
  if (!dateValue) {
    return "Sin gastos";
  }

  const date = toLocalDate(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - date) / 86400000);

  if (days <= 0) {
    return "Hoy";
  }

  return days === 1 ? "Ayer" : `Hace ${days} d`;
}

/**
 * Fecha de hoy en formato "AAAA-MM-DD" (hora local), para inputs type="date".
 */
export function todayIsoDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
