export const APP_CONFIG = {
  APP_NAME: "FinTrack",
  APP_VERSION: "1.0.0",
  USE_MOCK_API: true,
  MOCK_DELAY_MS: 280,
  DEFAULT_THEME: "dark",
  DEFAULT_LOCALE: "es-AR",
  DEFAULT_CURRENCY: "ARS",
};

export const API_CONFIG = {
  BASE_URL: "http://api.fintrack.local/v1",
  TIMEOUT_MS: 8000,
  RETRIES: 1,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "fintrack.authToken",
  AUTH_USER: "fintrack.authUser",
  APP_THEME: "fintrack.theme",
  ACTIVE_PROFILE: "fintrack.activeProfile",
};

export const ROUTES = {
  HOME: "/",
  USER_DASHBOARD: "/usuario/dashboard",
  USER_PATRONES: "/usuario/patrones",
  USER_PERFILES: "/usuario/perfiles",
  USER_RECOMENDACIONES: "/usuario/recomendaciones",
  ADVISOR_DASHBOARD: "/asesor/dashboard",
  PLACEHOLDER: "/utils/placeholder",
};

export const EVENTS = {
  AUTH: {
    LOGIN: "auth:login",
    LOGOUT: "auth:logout",
    REGISTER: "auth:register",
    ROLE_SELECTED: "auth:roleSelected",
    SESSION_EXPIRED: "auth:sessionExpired",
  },
  ROUTER: {
    NAVIGATE: "router:navigate",
    CHANGED: "router:changed",
  },
  THEME: {
    CHANGED: "theme:changed",
  },
  STATE: {
    CHANGED: "state:changed",
    LOADING: "state:loading",
    ERROR: "state:error",
  },
  EXPENSE: {
    CREATED: "expense:created",
  },
  RECOMMENDATION: {
    UPDATED: "recommendation:updated",
  },
};

export const PLACEHOLDER_PRESETS = {
  cargarGasto: {
    title: "Cargar Gasto",
    description:
      "Esta seccion estara disponible en la proxima fase. Mientras tanto, usa el dashboard para explorar tus metricas.",
    icon: "fa-receipt",
    ctaText: "Ir al Dashboard",
    ctaUrl: ROUTES.USER_DASHBOARD,
  },
  historial: {
    title: "Historial de Gastos",
    description:
      "Estamos trabajando en tu historial completo con filtros avanzados y exportacion.",
    icon: "fa-clock-rotate-left",
    ctaText: "Ir al Dashboard",
    ctaUrl: ROUTES.USER_DASHBOARD,
  },
  patrones: {
    title: "Patrones de Consumo",
    description:
      "Estamos ajustando comparativas historicas avanzadas y deteccion de anomalias.",
    icon: "fa-chart-pie",
    ctaText: "Ver Patrones",
    ctaUrl: ROUTES.USER_PATRONES,
  },
  perfil: {
    title: "Perfil de Usuario",
    description:
      "Muy pronto podras editar tus datos y preferencias de cuenta desde esta seccion.",
    icon: "fa-user-gear",
    ctaText: "Ir al Dashboard",
    ctaUrl: ROUTES.USER_DASHBOARD,
  },
  advisorClientes: {
    title: "Mis Clientes",
    description:
      "Estamos preparando la gestion completa de cartera con vista detallada por cliente.",
    icon: "fa-users",
    ctaText: "Volver al Panel",
    ctaUrl: ROUTES.ADVISOR_DASHBOARD,
  },
  advisorInbox: {
    title: "Inbox de Asesor",
    description:
      "La bandeja completa de conversaciones estara disponible en la siguiente iteracion.",
    icon: "fa-inbox",
    ctaText: "Volver al Panel",
    ctaUrl: ROUTES.ADVISOR_DASHBOARD,
  },
  advisorReportes: {
    title: "Reportes de Asesor",
    description:
      "Estamos armando reportes descargables y paneles de seguimiento avanzado.",
    icon: "fa-chart-column",
    ctaText: "Volver al Panel",
    ctaUrl: ROUTES.ADVISOR_DASHBOARD,
  },
};

export const TESTIMONIAL_AUTO_MS = 5000;

export const UI_LAYOUT = {
  LANDING_SCROLL_OFFSET: 12,
};

export const UI_TIMING = {
  TOAST_DISMISS_MS: 3200,
  AUTH_LOGIN_DELAY_MS: 220,
  AUTH_REGISTER_DELAY_MS: 260,
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
        "Chat directo con tu asesor",
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
    role: "usuario",
    fullName: "Juan Perez",
    email: "usuario@fintrack.local",
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
    email: "usuario@fintrack.local",
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
      route: ROUTES.USER_PATRONES,
    },
    {
      title: "Recomendaciones",
      subtitle: "3 activas para ti",
      icon: "fa-lightbulb",
      accent: "amber",
      items: [
        { label: "Streaming", value: "+$450/mes" },
        { label: "Comidas fuera", value: "+$300/mes" },
        { label: "Suscripciones", value: "+$200/mes" },
      ],
      route: ROUTES.USER_RECOMENDACIONES,
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
      route: ROUTES.PLACEHOLDER,
      queryPreset: "historial",
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
  advisor: {
    name: "Maria Rodriguez",
    title: "Asesor Financiero Senior",
    avatar: "👩‍💼",
    message:
      "Estoy disponible para ayudarte a optimizar tus gastos y planificar tus proximos objetivos.",
  },
};

export const MOCK_SPENDING_PROFILES = {
  user: {
    name: "Juan Perez",
    email: "usuario@fintrack.local",
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
      tips: [
        "Reduce tus gastos discrecionales en un 30-40%",
        "Elimina suscripciones innecesarias",
        "Lleva un registro detallado de cada gasto",
        "Establece un presupuesto mensual estricto",
        "Crea alertas para gastos superiores a un monto fijo",
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
      tips: [
        "Continua siguiendo tu presupuesto flexible",
        "Revisa regularmente categorias de gasto",
        "Aumenta gradualmente tu fondo de emergencia",
        "Considera invertir una parte de tus ahorros",
        "Manten el seguimiento de tus metas financieras",
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
      tips: [
        "Identifica y elimina tus top 5 gastos innecesarios",
        "Crea un presupuesto realista pero manejable",
        "Reduce gastos discrecionales gradualmente",
        "Establece un fondo de emergencia pequeno primero",
        "Busca consejos personalizados de tu asesor",
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
  stats: {
    totalSavingsPotential: 1150,
    activeRecommendations: 4,
    completedThisMonth: 3,
    estimatedImpact: "15%",
  },
  recommendations: [
    {
      id: "rec-001",
      title: "Reduce gastos en streaming",
      priority: "Alta",
      status: "Pendiente",
      problem:
        "Detectamos muchas pequenas compras frecuentes que, aunque parecen insignificantes, suman rapidamente. Estos gastos representan $3.450 del mes (7.6% de tu presupuesto).",
      solution:
        "Reduce tus gastos hormiga con limites diarios y seguimiento semanal.",
      savingsPotential: 500,
      implementationSteps: [
        "Identifica tus compras hormiga (cafe, snacks, apps)",
        "Lleva efectivo limitado para estos gastos",
        "Establece un limite diario de $30",
        "Realiza un seguimiento semanal",
      ],
      dateSent: "12 Abr",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🎯",
    },
    {
      id: "rec-002",
      title: "Reduce comidas fuera de casa",
      priority: "Alta",
      status: "Pendiente",
      problem:
        "Este mes invertiste $8.450 en restaurantes. Si cocinases en casa mas frecuentemente, podrias preparar comidas nutritivas a una fraccion del costo.",
      solution:
        "Planifica tus comidas semanales y limita salidas a dos veces por semana.",
      savingsPotential: 300,
      implementationSteps: [
        "Planifica comidas para la semana",
        "Compra ingredientes en oferta local",
        "Limita restaurantes a 2 veces/semana",
        "Prepara lunch para el trabajo",
      ],
      dateSent: "10 Abr",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🍕",
    },
    {
      id: "rec-003",
      title: "Revisa tus suscripciones",
      priority: "Media",
      status: "Pendiente",
      problem:
        "Identificamos 5 suscripciones activas que podrian tener duplicadas o no estes usando. Varias plataformas de streaming pueden optimizarse.",
      solution:
        "Haz una limpieza mensual de suscripciones y comparte planes familiares si es posible.",
      savingsPotential: 200,
      implementationSteps: [
        "Lista todas tus suscripciones activas",
        "Elimina las que no uses mensualmente",
        "Comparte cuentas familiares si es posible",
        "Configura recordatorios de renovacion",
      ],
      dateSent: "08 Abr",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🎬",
    },
    {
      id: "rec-004",
      title: "Optimiza tu transporte",
      priority: "Media",
      status: "Pendiente",
      problem:
        "Actualmente gastas $5.200 en transporte. Usar mas transporte publico o compartido podria reducir significativamente este monto.",
      solution:
        "Combina rutas de transporte publico y carpooling para reducir costos recurrentes.",
      savingsPotential: 150,
      implementationSteps: [
        "Evalua rutas de transporte publico",
        "Prueba apps de carpooling",
        "Considera pase mensual si es mas barato",
        "Combina transporte segun necesidad",
      ],
      dateSent: "03 Abr",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🚗",
    },
    {
      id: "rec-005",
      title: "Fondo de emergencia completado",
      priority: "Media",
      status: "Completada",
      problem:
        "No contabas con un colchon financiero para imprevistos.",
      solution:
        "Lograste separar automaticamente un porcentaje fijo durante seis semanas.",
      savingsPotential: 180,
      implementationSteps: [
        "Definiste objetivo inicial",
        "Automatizaste transferencias",
        "Mantuviste disciplina semanal",
      ],
      dateSent: "26 Mar",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🛟",
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
      icon: "💬",
      title: "7 mensajes sin leer",
      description: "Pendientes en inbox de hoy.",
      level: "success",
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
      label: "Efectividad Recomendaciones",
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
      unreadMessages: 2,
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
      unreadMessages: 1,
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
      unreadMessages: 0,
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
      unreadMessages: 0,
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
      unreadMessages: 1,
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
      unreadMessages: 3,
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
      unreadMessages: 0,
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
      unreadMessages: 0,
    },
  ],
  inbox: [
    {
      id: "msg-001",
      from: "Juan Perez",
      subject: "Cual es tu recomendacion para reducir mis gastos de alimentacion?",
      date: "Hace 15 min",
      type: "mensaje",
      unread: true,
    },
    {
      id: "msg-002",
      from: "Carlos Gonzalez",
      subject: "He visto que mi gasto se incremento un 18%. Es normal?",
      date: "Hace 2 h",
      type: "ticket",
      unread: true,
    },
    {
      id: "msg-003",
      from: "Fernanda Lopez",
      subject: "Gracias por la recomendacion anterior. Ya implemente cambios.",
      date: "Hace 5 h",
      type: "mensaje",
      unread: true,
    },
    {
      id: "msg-004",
      from: "Laura Martinez",
      subject: "Quiero reducir mis gastos de entretenimiento. Que sugiere?",
      date: "Hace 1 d",
      type: "mensaje",
      unread: false,
    },
    {
      id: "msg-005",
      from: "Sofia Torres",
      subject: "Mi perfil cambio a Derrochador. Que significa?",
      date: "Hace 2 d",
      type: "ticket",
      unread: false,
    },
  ],
  recommendations: [
    {
      id: "adv-rec-001",
      title: "Enviadas",
      count: 1,
      icon: "💡",
      items: [
        { clientName: "Sofia Torres", action: "Implementa presupuesto semanal" },
      ],
    },
    {
      id: "adv-rec-002",
      title: "Vistas",
      count: 1,
      icon: "💡",
      items: [
        { clientName: "Juan Perez", action: "Reduce gastos hormiga" },
      ],
    },
    {
      id: "adv-rec-003",
      title: "Implementadas",
      count: 2,
      icon: "💡",
      items: [
        { clientName: "Carlos Gonzalez", action: "Aumentar presupuesto de ahorro" },
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
