// src/modules/analytics/constants/analytics.constants.ts

export const ANALYTICS_CONSTANTS = {
  // Z-score thresholds
  ZSCORE_THRESHOLD: 2.5, // 2.5σ = ~1.2% probability
  PERCENTILE_THRESHOLD: 95,

  // Cache TTLs (en milisegundos)
  CONSUMPTION_CACHE_TTL: 10 * 60 * 1000, // 10 minutos
  ANOMALY_CACHE_TTL: 15 * 60 * 1000, // 15 minutos

  // Análisis default
  DEFAULT_MONTHS_BACK: 12,
  MIN_RECORDS_FOR_ANOMALY: 5,
  MAX_UNUSUAL_EXPENSES_RETURNED: 10,

  // Agregación
  TOP_CATEGORIES_LIMIT: 10,
  DEFAULT_PAGE_SIZE: 50,

  // Trend thresholds
  TREND_UP_THRESHOLD: 5, // % aumento
  TREND_DOWN_THRESHOLD: -5, // % disminución

  // Cache keys
  CACHE_KEY_PREFIX: 'fintrack:analytics',
  CONSUMPTION_CACHE_KEY: (clientId: string, monthsBack: number) =>
    `${ANALYTICS_CONSTANTS.CACHE_KEY_PREFIX}:consumption:${clientId}:${monthsBack}`,
  ANOMALY_CACHE_KEY: (clientId: string, days: number) =>
    `${ANALYTICS_CONSTANTS.CACHE_KEY_PREFIX}:anomaly:${clientId}:${days}`,
};
