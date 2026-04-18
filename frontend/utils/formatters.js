import { APP_CONFIG } from "./constants.js";

export function formatCurrency(value, currency = APP_CONFIG.DEFAULT_CURRENCY) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(APP_CONFIG.DEFAULT_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value) {
  return `${Number(value || 0)}%`;
}

export function formatDate(dateValue, locale = APP_CONFIG.DEFAULT_LOCALE) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(dateValue, locale = APP_CONFIG.DEFAULT_LOCALE) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTrendLabel(direction, value, label) {
  const arrow = direction === "up" ? "▲" : "▼";
  return `${arrow} ${value}% ${label}`;
}
