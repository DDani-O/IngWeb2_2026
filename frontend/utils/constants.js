export const APP_CONFIG = {
  DEFAULT_THEME: "dark",
  DEFAULT_LOCALE: "es-AR",
  DEFAULT_CURRENCY: "ARS",
};

export const API_CONFIG = {
  BASE_URL: "http://api.fintrack.local/v1",
  TIMEOUT_MS: 8000,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "fintrack.authToken",
  AUTH_USER: "fintrack.authUser",
  APP_THEME: "fintrack.theme",
  // Las claves por usuario se completan con el id: `${CLAVE}.${userId}`.
  CLIENT_PROFILE: "fintrack.clientProfile",
  ADVISOR_PROFILE: "fintrack.advisorProfile",
  EXPENSE_DRAFT: "fintrack.expenseDraft",
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
  },
  RECOMMENDATION: {
    UPDATED: "recommendation:updated",
  },
};

export const UI_LAYOUT = {
  LANDING_SCROLL_OFFSET: 12,
};

export const UI_TIMING = {
  TOAST_DISMISS_MS: 3200,
  TESTIMONIAL_AUTOPLAY_MS: 5000,
  TAB_CLOSE_FALLBACK_MS: 120,
  AUTH_LOGIN_DELAY_MS: 220,
  AUTH_REGISTER_DELAY_MS: 260,
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

export const MOCK_AUTH_USERS = [
  {
    id: "usr-001",
    role: "cliente",
    fullName: "Juan Perez",
    email: "cliente@fintrack.local",
    password: "Fintrack2026*",
    profile: "Equilibrista",
  },
  {
    id: "adv-001",
    role: "asesor",
    fullName: "Maria Rodriguez",
    email: "asesor@fintrack.local",
    password: "Fintrack2026*",
    profile: "Asesor Senior",
  },
];

export const MOCK_USER_DASHBOARD = {
  user: {
    id: "usr-001",
    name: "Juan Perez",
    email: "cliente@fintrack.local",
    activeProfile: "Equilibrista",
  },
  calendar: {
    day: "14",
    month: "Abril",
    year: "2026",
    dayName: "Lunes",
  },
  alerts: [
    {
      icon: "⚠️",
      title: "Has gastado mas de lo normal",
      description: "Tu gasto diario excede el promedio. Revisa donde esta el incremento.",
      level: "danger",
    },
    {
      icon: "💡",
      title: "Oportunidad de ahorro detectada",
      description: "Tienes 3 suscripciones activas que podrias revisar.",
      level: "warning",
    },
    {
      icon: "🎯",
      title: "Buen mes de ahorro",
      description: "Estas 15% por encima de tu meta de esta semana.",
      level: "success",
    },
  ],
  stats: [
    {
      key: "totalSpent",
      label: "Total Gastado",
      value: 45230,
      format: "currency",
      suffix: "",
      icon: "fa-wallet",
      emoji: "💸",
      subtitle: "Ultimos 30 dias",
      trendValue: 12,
      trendDirection: "down",
      trendLabel: "vs mes anterior",
    },
    {
      key: "budgetLeft",
      label: "Presupuesto Restante",
      value: 14770,
      format: "currency",
      suffix: "",
      icon: "fa-scale-balanced",
      emoji: "🤔",
      subtitle: "75% del limite utilizado",
      trendValue: 5,
      trendDirection: "up",
      trendLabel: "respecto a semana pasada",
    },
    {
      key: "dailyAverage",
      label: "Categoria Principal",
      value: 35,
      format: "percent",
      suffix: "%",
      icon: "fa-calendar-day",
      emoji: "🍽️",
      subtitle: "Alimentacion",
      trendValue: 8,
      trendDirection: "down",
      trendLabel: "reduccion respecto a mes anterior",
    },
    {
      key: "microExpenses",
      label: "Gastos Hormiga",
      value: 3450,
      format: "currency",
      suffix: "",
      icon: "fa-bug",
      emoji: "🐜",
      subtitle: "Acumulados del mes",
      trendValue: 15,
      trendDirection: "down",
      trendLabel: "reduccion sostenida",
    },
  ],
  profileCard: {
    name: "Equilibrista Cosmico",
    description:
      "Perfecto balance entre gasto y ahorro. Eres el tipo de persona que confunde su presupuesto con un arte.",
    categories: ["Alimentacion", "Transporte", "Entretenimiento", "Servicios"],
  },
  summaryCards: [
    {
      title: "Patrones de Consumo",
      subtitle: "Analisis de tus gastos",
      icon: "fa-chart-pie",
      accent: "teal",
      items: [
        { label: "Alimentacion", value: "35%" },
        { label: "Transporte", value: "20%" },
        { label: "Entretenimiento", value: "15%" },
        { label: "+1 mas", value: "Ver detalle" },
      ],
      route: ROUTES.CLIENT_PATRONES,
    },
    {
      title: "Recomendaciones",
      subtitle: "3 sin leer",
      icon: "fa-lightbulb",
      accent: "amber",
      items: [
        { label: "Reduce gastos en streaming", value: "Alta" },
        { label: "Reduce comidas fuera", value: "Alta" },
        { label: "Revisa tus suscripciones", value: "Media" },
      ],
      route: ROUTES.CLIENT_RECOMENDACIONES,
    },
    {
      title: "Ultimos Gastos",
      subtitle: "Movimientos recientes",
      icon: "fa-clock-rotate-left",
      accent: "cyan",
      items: [
        { label: "Supermercado", value: "$18.500" },
        { label: "Servicios", value: "$12.300" },
        { label: "Restaurante", value: "$8.450" },
        { label: "+1 mas", value: "Ver historial" },
      ],
      route: ROUTES.CLIENT_HISTORIAL,
    },
  ],
  charts: {
    categoryDistribution: [
      { label: "Alimentacion", value: 35, color: "#2dd4bf" },
      { label: "Transporte", value: 20, color: "#06b6d4" },
      { label: "Entretenimiento", value: 15, color: "#f59e0b" },
      { label: "Otros", value: 30, color: "#a855f7" },
    ],
    monthlyExpenses: [42000, 45000, 48000, 45200, 44500, 46200],
    monthlyLabels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"],
    dailySeries: [1200, 1600, 1400, 1800, 1100, 1450, 1300, 1750, 1500, 1900, 1250, 1700, 1450, 1650],
    dailyLabels: ["L", "M", "X", "J", "V", "S", "D", "L", "M", "X", "J", "V", "S", "D"],
    merchants: [
      { name: "Supermercado Central", spending: "$18.500", icon: "🛒" },
      { name: "Restaurante La Cocina", spending: "$8.450", icon: "🍽️" },
      { name: "Gasolinera Shell", spending: "$5.200", icon: "⛽" },
      { name: "Gimnasio Fit Life", spending: "$3.200", icon: "💪" },
      { name: "Netflix y Otros", spending: "$2.150", icon: "🎬" },
    ],
  },
};

export const MOCK_SPENDING_PROFILES = {
  user: {
    name: "Juan Perez",
    email: "cliente@fintrack.local",
    activeProfile: "Equilibrista",
  },
  profiles: [
    {
      id: "dracula",
      name: "Dracula Nocturno",
      emoji: "🧛",
      tagline: "El Ahorrador Profesional",
      colorClass: "profile-card--dracula",
      description:
        "Eres tan cuidadoso con tu dinero que hasta los vampiros toman apuntes. Te encanta guardar cada peso y ves el ahorro como un deporte olimpico.",
      characteristics: [
        "Gastos muy controlados y predecibles",
        "Ratio de ahorro: 40-50% de tus ingresos",
        "Evitas gastos hormiga a toda costa",
        "Presupuesto planificado mes a mes",
        "Perfectamente alineado con metas financieras",
      ],
      comparison: {
        savingsRange: "40-50%",
        controlLevel: "Muy Alto",
        flexibility: "Baja",
        riskLevel: "Muy Bajo",
        funLevel: "Bajo",
      },
    },
    {
      id: "equilibrista",
      name: "Equilibrista Cosmico",
      emoji: "⚖️",
      tagline: "El Balanceador Perfecto",
      colorClass: "profile-card--equilibrista",
      description:
        "Perfecto balance entre gasto y ahorro. Eres el tipo de persona que confunde su presupuesto con un arte. Disfrutas la vida sin sacrificar tu futuro.",
      characteristics: [
        "Balance perfecto entre gasto y ahorro",
        "Ratio de ahorro: 25-35% de tus ingresos",
        "Gastos en entretenimiento controlados",
        "Presupuesto flexible pero responsable",
        "Buen control sin obsesionarse",
      ],
      comparison: {
        savingsRange: "25-35%",
        controlLevel: "Equilibrado",
        flexibility: "Alta",
        riskLevel: "Bajo",
        funLevel: "Alto",
      },
    },
    {
      id: "espiritu-libre",
      name: "Espiritu Libre",
      emoji: "🦅",
      tagline: "El Gaudior Desenfrenado",
      colorClass: "profile-card--espiritu-libre",
      description:
        "Gastas con libertad... quizas demasiada. Pero hey, la vida es para vivirla. Aunque tambien es para pagarla. Necesitas mas cuidado con tus finanzas.",
      characteristics: [
        "Gastos altos sin mucho control",
        "Ratio de ahorro: 0-15% de tus ingresos",
        "Muchos gastos hormiga acumulados",
        "Presupuesto poco definido o inexistente",
        "Alto riesgo de endeudamiento",
      ],
      comparison: {
        savingsRange: "0-15%",
        controlLevel: "Bajo",
        flexibility: "Muy Alta",
        riskLevel: "Muy Alto",
        funLevel: "Muy Alto",
      },
    },
  ],
};

export const MOCK_CONSUMPTION_PATTERNS = {
  user: {
    name: "Juan Perez",
  },
  highlights: [
    {
      type: "positive",
      icon: "📈",
      title: "Tendencia Positiva",
      text: "Tus gastos bajaron 12% respecto al mes anterior. Buen trabajo.",
    },
    {
      type: "warning",
      icon: "⚠️",
      title: "Area de Atencion",
      text: "Los gastos hormiga representan $3.450. Podrias ahorrar hasta $500/mes.",
    },
  ],
  stats: [
    {
      label: "Promedio Mensual",
      value: 45230,
      format: "currency",
      subtitle: "Promedio mensual del mes actual",
      trendValue: 2.1,
      trendDirection: "down",
      trendLabel: "vs. mes anterior",
      icon: "📅",
    },
    {
      label: "Mayor Categoria",
      value: "Alimentacion",
      format: "text",
      suffix: "35%",
      subtitle: "Categoria con mayor participacion",
      trendValue: 0,
      trendDirection: "up",
      trendLabel: "estable",
      icon: "🏷️",
    },
    {
      label: "Mayor Gasto Realizado",
      value: 185000,
      format: "currency",
      subtitle: "Compra de computadora",
      trendValue: 1,
      trendDirection: "up",
      trendLabel: "02 Abr",
      icon: "💻",
    },
    {
      label: "Gastos Inusuales",
      value: 3,
      format: "number",
      suffix: " eventos",
      subtitle: "Detectados en los ultimos 30 dias",
      trendValue: 1,
      trendDirection: "up",
      trendLabel: "requiere seguimiento",
      icon: "🚨",
    },
  ],
  categories: [
    { label: "Alimentacion", percentage: 35, amount: 15750, color: "#3ad5c7" },
    { label: "Transportes", percentage: 20, amount: 9000, color: "#21b6d7" },
    { label: "Entretenimiento", percentage: 15, amount: 6750, color: "#f6a40a" },
    { label: "Servicios", percentage: 15, amount: 6750, color: "#9952dd" },
    { label: "Otros", percentage: 15, amount: 6980, color: "#e04697" },
  ],
  monthlyEvolution: {
    labels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"],
    values: [42000, 45000, 48000, 45200, 44500, 46200, 45230],
  },
  categoryEvolution: {
    labels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"],
    series: [
      { name: "Alimentacion", color: "#3ad5c7", values: [15000, 15700, 16800, 15800, 15500, 16200, 15750] },
      { name: "Transportes", color: "#21b6d7", values: [8200, 8800, 9500, 9000, 8850, 9300, 9000] },
      { name: "Entretenimiento", color: "#f6a40a", values: [6200, 6900, 7900, 6800, 6500, 6800, 6750] },
      { name: "Servicios", color: "#9952dd", values: [6400, 6700, 6800, 6900, 7000, 7100, 6750] },
      { name: "Otros", color: "#e04697", values: [6100, 6600, 6900, 6700, 7000, 6900, 6980] },
    ],
  },
  unusualExpenses: {
    labels: ["Restaurantes", "Compras Online", "Transporte App"],
    expected: [4200, 2800, 1500],
    detected: [8450, 5900, 3200],
    alerts: [
      {
        title: "Restaurantes (Alta)",
        date: "12 Abr",
        expected: 4200,
        detected: 8450,
        delta: "+$ 4.250 (101%) sobre tu promedio",
        severity: "high",
      },
      {
        title: "Compras Online (Alta)",
        date: "05 Abr",
        expected: 2800,
        detected: 5900,
        delta: "+$ 3.100 (111%) sobre tu promedio",
        severity: "high",
      },
      {
        title: "Transporte App (Media)",
        date: "09 Abr",
        expected: 1500,
        detected: 3200,
        delta: "+$ 1.700 (113%) sobre tu promedio",
        severity: "medium",
      },
    ],
  },
};

export const MOCK_RECOMMENDATIONS = {
  recommendations: [
    {
      id: "rec-001",
      title: "Reduce gastos en streaming",
      message:
        "Detectamos muchas compras chicas y frecuentes que suman $3.450 en el mes (7,6% de tu presupuesto). Fija un limite diario y revisalo cada semana.",
      type: "sugerencia",
      priority: "alta",
      origin: "asesor",
      advisorName: "Maria Rodriguez",
      date: "2026-04-12",
      read: false,
    },
    {
      id: "rec-002",
      title: "Gasto elevado en comidas fuera de casa",
      message:
        "Este mes llevas $8.450 en restaurantes, un 40% mas que tu promedio. Planificar las comidas de la semana te ayuda a bajar este rubro.",
      type: "alerta",
      priority: "alta",
      origin: "sistema",
      advisorName: null,
      date: "2026-04-10",
      read: false,
    },
    {
      id: "rec-003",
      title: "Revisa tus suscripciones",
      message:
        "Tenes 5 suscripciones activas y algunas podrian estar duplicadas. Una limpieza mensual evita pagos que no usas.",
      type: "sugerencia",
      priority: "media",
      origin: "asesor",
      advisorName: "Maria Rodriguez",
      date: "2026-04-08",
      read: false,
    },
    {
      id: "rec-004",
      title: "Transporte estable",
      message:
        "Tu gasto en transporte se mantuvo estable los ultimos 3 meses. Combinar transporte publico y compartido puede reducirlo un poco mas.",
      type: "observacion",
      priority: "baja",
      origin: "sistema",
      advisorName: null,
      date: "2026-04-03",
      read: false,
    },
    {
      id: "rec-005",
      title: "Buen ritmo de ahorro",
      message:
        "Separaste un porcentaje fijo de tus ingresos durante seis semanas seguidas. Mantener ese habito te da un colchon para imprevistos.",
      type: "observacion",
      priority: "media",
      origin: "asesor",
      advisorName: "Maria Rodriguez",
      date: "2026-03-26",
      read: true,
    },
  ],
};

export const MOCK_ADVISOR_DASHBOARD = {
  advisor: {
    name: "Maria Rodriguez",
    email: "asesor@fintrack.local",
    role: "Asesor Financiero",
  },
  calendar: {
    day: "15",
    month: "Abril",
    year: "2026",
    dayName: "Martes",
  },
  alerts: [
    {
      icon: "👥",
      title: "3 clientes requieren seguimiento",
      description: "No registran gastos hace mas de 5 dias.",
      level: "warning",
    },
    {
      icon: "⚠️",
      title: "2 clientes con gastos inusuales",
      description: "Superaron en mas de un 35% su promedio historico en alguna categoria.",
      level: "danger",
    },
    {
      icon: "⭐",
      title: "Excelente desempeno",
      description: "12 recomendaciones implementadas este mes.",
      level: "success",
    },
  ],
  stats: [
    {
      label: "Clientes Activos",
      value: 8,
      icon: "fa-users",
      emoji: "👥",
      trendValue: 2,
      trendDirection: "up",
      trendLabel: "nuevos este mes",
    },
    {
      label: "Recomendaciones leidas",
      value: 60,
      format: "percent",
      suffix: "%",
      icon: "fa-chart-line",
      emoji: "📈",
      trendValue: 8,
      trendDirection: "up",
      trendLabel: "vs mes anterior",
    },
    {
      label: "Clientes con seguimiento",
      value: 3,
      icon: "fa-user-clock",
      emoji: "📌",
      trendValue: 1,
      trendDirection: "down",
      trendLabel: "menos que semana pasada",
    },
  ],
  clients: [
    {
      id: "cli-001",
      name: "Juan Perez",
      email: "juan@correo.com",
      profile: "Equilibrista Cosmico",
      totalSpent: 45230,
      averageSpend: 45230,
      lastExpense: "Hace 4d",
      changePercent: -12,
      risk: "Bajo",
      riskLevel: "low",
      status: "activo",
    },
    {
      id: "cli-002",
      name: "Carlos Gonzalez",
      email: "carlos@correo.com",
      profile: "Espiritu Libre",
      totalSpent: 62500,
      averageSpend: 62500,
      lastExpense: "Hace 6d",
      changePercent: 18,
      risk: "Alto",
      riskLevel: "high",
      status: "activo",
    },
    {
      id: "cli-003",
      name: "Laura Martinez",
      email: "laura@correo.com",
      profile: "Ahorrista Minimalista",
      totalSpent: 28900,
      averageSpend: 28900,
      lastExpense: "Hace 3d",
      changePercent: -8,
      risk: "Bajo",
      riskLevel: "low",
      status: "activo",
    },
    {
      id: "cli-004",
      name: "Roberto Sanchez",
      email: "roberto@correo.com",
      profile: "Planificador Prudente",
      totalSpent: 38750,
      averageSpend: 38750,
      lastExpense: "Hace 8d",
      changePercent: 5,
      risk: "Medio",
      riskLevel: "medium",
      status: "activo",
    },
    {
      id: "cli-005",
      name: "Sofia Torres",
      email: "sofia@correo.com",
      profile: "Espiritu Libre",
      totalSpent: 71200,
      averageSpend: 71200,
      lastExpense: "Hace 7d",
      changePercent: 35,
      risk: "Alto",
      riskLevel: "high",
      status: "activo",
    },
    {
      id: "cli-006",
      name: "Fernanda Lopez",
      email: "fernanda@correo.com",
      profile: "Equilibrista Cosmico",
      totalSpent: 52100,
      averageSpend: 52100,
      lastExpense: "Hace 5d",
      changePercent: 22,
      risk: "Alto",
      riskLevel: "high",
      status: "activo",
    },
    {
      id: "cli-007",
      name: "Diego Ramirez",
      email: "diego@correo.com",
      profile: "Ahorrista Minimalista",
      totalSpent: 19500,
      averageSpend: 19500,
      lastExpense: "Hace 10d",
      changePercent: -5,
      risk: "Bajo",
      riskLevel: "low",
      status: "activo",
    },
    {
      id: "cli-008",
      name: "Miguel Vargas",
      email: "miguel@correo.com",
      profile: "Planificador Prudente",
      totalSpent: 42300,
      averageSpend: 42300,
      lastExpense: "Hace 4d",
      changePercent: -3,
      risk: "Bajo",
      riskLevel: "low",
      status: "activo",
    },
  ],
  recommendations: [
    {
      id: "adv-rec-unread",
      title: "Sin leer",
      count: 2,
      icon: "📨",
      items: [
        { clientName: "Sofia Torres", action: "Implementa presupuesto semanal" },
        { clientName: "Carlos Gonzalez", action: "Gasto elevado en entretenimiento" },
      ],
    },
    {
      id: "adv-rec-read",
      title: "Leidas",
      count: 2,
      icon: "✅",
      items: [
        { clientName: "Juan Perez", action: "Reduce gastos en streaming" },
        { clientName: "Laura Martinez", action: "Manten tu ahorro consistente" },
      ],
    },
  ],
  charts: {
    profileDistribution: [
      { label: "Ahorrista", value: 2, color: "#8b5cf6" },
      { label: "Equilibrista", value: 3, color: "#2dd4bf" },
      { label: "Espiritu Libre", value: 3, color: "#f97316" },
    ],
    spendByProfile: [
      { label: "Ahorrista", value: 57800 },
      { label: "Equilibrista", value: 95500 },
      { label: "Espiritu Libre", value: 133700 },
    ],
    dailyActivityLabels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"],
    dailyActivityValues: [3, 4, 6, 5, 6, 7, 7],
  },
};

export const MOCK_USER_EXPENSE_FORM = {
  categories: [
    "Alimentacion",
    "Transporte",
    "Servicios",
    "Entretenimiento",
    "Salud",
    "Educacion",
    "Suscripciones",
    "Otros",
  ],
  suggestedMerchants: [
    "Supermercado Central",
    "Restaurante La Cocina",
    "Farmacia Sur",
    "Subte Linea B",
    "Netflix",
  ],
  ocrSample: {
    merchant: "Supermercado Central",
    amount: 18500,
    category: "Alimentacion",
    date: "2026-04-16",
    description: "Compra semanal con ticket OCR",
  },
};

export const MOCK_USER_EXPENSE_HISTORY = {
  expenses: [
    {
      id: "exp-001",
      date: "2026-04-18",
      merchant: "Supermercado Central",
      category: "Alimentacion",
      amount: 18500,
      origin: "ticket",
      description: "Compra principal semanal",
    },
    {
      id: "exp-002",
      date: "2026-04-17",
      merchant: "Restaurante La Cocina",
      category: "Entretenimiento",
      amount: 8450,
      origin: "ticket",
      description: "Cena sabado",
    },
    {
      id: "exp-003",
      date: "2026-04-16",
      merchant: "Subte Linea B",
      category: "Transporte",
      amount: 2200,
      origin: "manual",
      description: "Recarga tarjeta",
    },
    {
      id: "exp-004",
      date: "2026-04-15",
      merchant: "Netflix",
      category: "Suscripciones",
      amount: 2900,
      origin: "ticket",
      description: "Plan mensual",
    },
    {
      id: "exp-005",
      date: "2026-04-14",
      merchant: "Farmacia Sur",
      category: "Salud",
      amount: 5100,
      origin: "ticket",
      description: "Medicacion",
    },
    {
      id: "exp-006",
      date: "2026-04-13",
      merchant: "Libreria Centro",
      category: "Educacion",
      amount: 3600,
      origin: "manual",
      description: "Material de estudio",
    },
    {
      id: "exp-007",
      date: "2026-04-12",
      merchant: "Servicios Hogar",
      category: "Servicios",
      amount: 12300,
      origin: "ticket",
      description: "Factura de servicios",
    },
    {
      id: "exp-008",
      date: "2026-04-11",
      merchant: "Cafe Estacion",
      category: "Alimentacion",
      amount: 1400,
      origin: "manual",
      description: "Gasto hormiga",
    },
    {
      id: "exp-009",
      date: "2026-04-10",
      merchant: "Uber",
      category: "Transporte",
      amount: 3200,
      origin: "ticket",
      description: "Regreso nocturno",
    },
  ],
};

export const MOCK_USER_PROFILE_DETAILS = {
  fullName: "Juan Perez",
  email: "cliente@fintrack.local",
  occupation: "Disenador UX",
  estimatedIncome: 285000,
  financialGoal: "Juntar un fondo de emergencia de 3 meses de gastos",
  bio: "",
  theme: "dark",
  memberSince: "Octubre 2025",
  advisorName: "Maria Rodriguez",
  spendingProfile: "Equilibrista Cosmico",
};

export const MOCK_ADVISOR_PROFILE_DETAILS = {
  fullName: "Maria Rodriguez",
  email: "asesor@fintrack.local",
  specialty: "Finanzas personales",
  licenseNumber: "A-12345",
  description: "Acompano a clientes en presupuesto mensual y control de gastos.",
  assignedClients: 8,
  memberSince: "Mayo 2021",
};
