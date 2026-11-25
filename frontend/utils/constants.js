export const APP_CONFIG = {
  DEFAULT_THEME: "dark",
  DEFAULT_LOCALE: "es-AR",
  DEFAULT_CURRENCY: "ARS",
};

/**
 * Configuración de la API.
 * - DRIVER: "mock" usa el backend simulado de mocks/ (mismo contrato que NestJS); "http" usa fetch.
 *   Para probar sin tocar código: localStorage.setItem("fintrack.apiDriver", "http").
 * - BASE_URLS: se elige "local" cuando el front corre en localhost; si no, "production"
 *   (completar con la URL pública del backend al hacer el deploy).
 */
export const API_CONFIG = {
  DRIVER: "mock",
  BASE_URLS: {
    local: "http://localhost:3000",
    production: "",
  },
  TIMEOUT_MS: 8000,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "fintrack.authToken",
  AUTH_USER: "fintrack.authUser",
  APP_THEME: "fintrack.theme",
  // Las claves por usuario se completan con el id: `${CLAVE}.${userId}`.
  EXPENSE_DRAFT: "fintrack.expenseDraft",
  API_DRIVER: "fintrack.apiDriver",
  MOCK_DB: "fintrack.mockDb",
  TAB_REGISTRY: "fintrack.openTabs.v1",
  TAB_ID: "fintrack.tabId",
};

/**
 * Roles de cuenta. "Usuario" es cualquier cuenta; el rol que registra gastos es "cliente".
 */
export const ROLES = {
  CLIENT: "cliente",
  ADVISOR: "asesor",
};

export const ROUTES = {
  HOME: "/",
  CLIENT_DASHBOARD: "/cliente/dashboard",
  CLIENT_CARGAR_GASTO: "/cliente/cargar-gasto",
  CLIENT_HISTORIAL: "/cliente/historial",
  CLIENT_PERFIL: "/cliente/perfil",
  CLIENT_PATRONES: "/cliente/patrones",
  CLIENT_PERFILES: "/cliente/perfiles",
  CLIENT_RECOMENDACIONES: "/cliente/recomendaciones",
  ADVISOR_DASHBOARD: "/asesor/dashboard",
  ADVISOR_CLIENTES: "/asesor/clientes",
  ADVISOR_PERFIL: "/asesor/perfil",
  PLACEHOLDER: "/utils/placeholder",
};

export const EVENTS = {
  AUTH: {
    LOGIN: "auth:login",
    LOGOUT: "auth:logout",
    REGISTER: "auth:register",
    SESSION_EXPIRED: "auth:sessionExpired",
  },
  ROUTER: {
    CHANGED: "router:changed",
  },
  THEME: {
    CHANGED: "theme:changed",
  },
  STATE: {
    CHANGED: "state:changed",
  },
  EXPENSE: {
    CREATED: "expense:created",
    UPDATED: "expense:updated",
    DELETED: "expense:deleted",
  },
  RECOMMENDATION: {
    CREATED: "recommendation:created",
    READ: "recommendation:read",
  },
  PROFILE: {
    UPDATED: "profile:updated",
  },
};

export const UI_LAYOUT = {
  LANDING_SCROLL_OFFSET: 12,
};

export const UI_TIMING = {
  TOAST_DISMISS_MS: 3200,
  TESTIMONIAL_AUTOPLAY_MS: 5000,
  TAB_CLOSE_FALLBACK_MS: 120,
  MOCK_LATENCY_MS: 220,
  SEARCH_DEBOUNCE_MS: 300,
};

/**
 * Valores alineados con los ENUM de la BD (migrations/0001_init_schema.sql).
 */
export const RECOMMENDATION_TYPES = [
  { value: "sugerencia", label: "Sugerencia" },
  { value: "alerta", label: "Alerta" },
  { value: "observacion", label: "Observacion" },
];

export const RECOMMENDATION_PRIORITIES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

/**
 * Cantidad de colores de la paleta de gráficos (tokens --chart-1 … --chart-N en global.css).
 */
export const CHART_PALETTE_SIZE = 8;

export const RISK_LEVELS = {
  bajo: { label: "Bajo", cssModifier: "low" },
  medio: { label: "Medio", cssModifier: "medium" },
  alto: { label: "Alto", cssModifier: "high" },
};

export const EXPENSE_ORIGINS = {
  manual: "Manual",
  ticket: "Ticket",
};

export const LANDING_CONTENT = {
  nav: [
    { id: "como-funciona", label: "Como Funciona" },
    { id: "ventajas", label: "Ventajas" },
    { id: "planes", label: "Planes" },
  ],
  brands: [
    { name: "Visa", icon: "fa-cc-visa" },
    { name: "Mastercard", icon: "fa-cc-mastercard" },
    { name: "PayPal", icon: "fa-cc-paypal" },
    { name: "Stripe", icon: "fa-cc-stripe" },
  ],
  features: [
    {
      icon: "fa-receipt",
      title: "Registra al instante",
      description:
        "Sube gastos como prefieras: tomale una foto a tu ticket o cargalo a mano en segundos.",
    },
    {
      icon: "fa-eye",
      title: "Alguien vigila por ti",
      description:
        "Tu asesor revisa tu actividad para detectar gastos hormiga, fugas y patrones extranos.",
    },
    {
      icon: "fa-comments-dollar",
      title: "Interactua y mejora",
      description:
        "Analiza tus graficos de manera simple y lee los consejos de tu asesor para decidir mejor.",
    },
  ],
  advantages: [
    {
      title: "Carga automatizada con IA",
      text: "Nuestra Inteligencia Artificial extrae los datos al instante de tus fotos.",
      icon: "fa-robot",
    },
    {
      title: "Asesor real",
      text: "Feedback humano y profesional justo cuando mas lo necesitas.",
      icon: "fa-user-tie",
    },
    {
      title: "Alertas inteligentes",
      text: "Recibe avisos automaticos si tus gastos se salen de presupuesto.",
      icon: "fa-bell",
    },
    {
      title: "Seguridad bancaria",
      text: "Tus datos financieros viajan encriptados y protegidos al maximo nivel.",
      icon: "fa-shield-halved",
    },
  ],
  testimonials: [
    {
      name: "Lucas",
      role: "Freelancer",
      rating: 5,
      text: "Ya no siento que mi cajero hable solo. Con FinTrack veo justo lo que debo pagar y cuanto puedo ahorrar.",
    },
    {
      name: "Camila",
      role: "Disenadora UX",
      rating: 5,
      text: "En dos semanas deje de improvisar. Ahora entiendo en que se me va la plata y que puedo ajustar sin sufrir.",
    },
    {
      name: "Nicolas",
      role: "Emprendedor",
      rating: 4,
      text: "Lo mejor fue tener una vista clara por categorias. Con eso pude recortar gastos invisibles y ordenar mis metas.",
    },
  ],
  plans: [
    {
      name: "Plan Basico",
      price: "$0",
      subtitle: "Perfecto para empezar a organizarte.",
      highlighted: false,
      features: [
        "Carga de tickets con IA (limitado)",
        "Registro manual ilimitado",
        "Graficos de gastos basicos",
        "Asesor virtual incluido",
      ],
      cta: "Comenzar Gratis",
    },
    {
      name: "Plan Pro",
      price: "$4.99",
      subtitle: "Tus finanzas supervisadas por expertos.",
      highlighted: true,
      features: [
        "Asesor financiero asignado",
        "Recomendaciones mensuales",
        "Deteccion de gastos hormiga",
        "Carga con IA ilimitada",
      ],
      cta: "Elegir Pro",
    },
    {
      name: "Plan Premium",
      price: "$12.99",
      subtitle: "Comunicacion directa y prioritaria.",
      highlighted: false,
      features: [
        "Todo lo del Plan Pro",
        "Recomendaciones personalizadas de tu asesor",
        "Alertas de desvio en tiempo real",
        "Analisis de inversiones y ahorros",
      ],
      cta: "Elegir Premium",
    },
  ],
};
