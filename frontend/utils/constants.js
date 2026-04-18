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
      "El analisis ampliado por periodos y categorias estara disponible pronto.",
    icon: "fa-chart-pie",
    ctaText: "Ver Recomendaciones",
    ctaUrl: ROUTES.USER_RECOMENDACIONES,
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

export const LANDING_CONTENT = {
  nav: [
    { id: "inicio", label: "Inicio" },
    { id: "caracteristicas", label: "Caracteristicas" },
    { id: "ventajas", label: "Ventajas" },
    { id: "planes", label: "Planes" },
    { id: "testimonios", label: "Testimonios" },
  ],
  brands: [
    { name: "Banco Delta" },
    { name: "Cima Seguros" },
    { name: "Nova Wallet" },
    { name: "Astra Analytics" },
    { name: "Orbita Fintech" },
  ],
  features: [
    {
      icon: "fa-receipt",
      title: "Carga Inteligente de Gastos",
      description:
        "Digitaliza tickets con OCR y completa gastos en segundos, sin escribir todo a mano.",
    },
    {
      icon: "fa-brain",
      title: "Analisis de Habitos",
      description:
        "Detecta patrones de consumo y puntos de fuga para tomar decisiones con datos reales.",
    },
    {
      icon: "fa-shield-heart",
      title: "Acompanamiento de Asesor",
      description:
        "Recibe recomendaciones personalizadas y seguimiento de impacto financiero mensual.",
    },
    {
      icon: "fa-chart-line",
      title: "Paneles Claros",
      description:
        "Visualiza tendencias, categorias y progreso de ahorro con graficos accionables.",
    },
    {
      icon: "fa-bell",
      title: "Alertas Proactivas",
      description:
        "Enterate cuando tus gastos se desalinean del presupuesto o aparecen anomalias.",
    },
    {
      icon: "fa-mobile-screen-button",
      title: "Diseno Responsive",
      description:
        "Usa FinTrack desde desktop, tablet o movil con experiencia consistente.",
    },
  ],
  advantages: [
    {
      title: "Control Total Sin Friccion",
      text: "Unifica el registro, analisis y accion en una sola experiencia para evitar dispersarte entre planillas y apps sueltas.",
      points: [
        "Registro rapido con OCR",
        "Resumen diario con alertas",
        "Categorias y metas personalizadas",
      ],
      icon: "fa-layer-group",
    },
    {
      title: "Recomendaciones Con Impacto",
      text: "No son consejos genericos: cada recomendacion nace de tus datos, tu perfil y tus objetivos de corto plazo.",
      points: [
        "Prioridades por urgencia",
        "Ahorro potencial estimado",
        "Seguimiento de implementacion",
      ],
      icon: "fa-lightbulb",
    },
    {
      title: "Escalable Para Usuario y Asesor",
      text: "La misma plataforma resuelve el dia a dia del usuario y la gestion profesional de cartera para asesores.",
      points: [
        "Paneles diferenciados por rol",
        "Flujos desacoplados",
        "Arquitectura lista para crecer",
      ],
      icon: "fa-network-wired",
    },
  ],
  testimonials: [
    {
      name: "Camila Nunez",
      role: "Emprendedora",
      rating: 5,
      text: "En dos meses reduje mis gastos hormiga y por primera vez pude sostener una meta de ahorro real.",
    },
    {
      name: "Martin Farias",
      role: "Analista de Datos",
      rating: 5,
      text: "El dashboard me muestra exactamente donde se me va el dinero. Es claro, rapido y accionable.",
    },
    {
      name: "Lucia Torres",
      role: "Asesora Financiera",
      rating: 5,
      text: "Puedo priorizar clientes con riesgo y enviar recomendaciones con contexto, no intuicion.",
    },
  ],
  plans: [
    {
      name: "Basico",
      price: "Gratis",
      subtitle: "Para comenzar a ordenar tus gastos",
      highlighted: false,
      features: [
        "Carga manual de gastos",
        "Dashboard personal",
        "Categorias base",
        "Resumen mensual",
      ],
    },
    {
      name: "Pro",
      price: "$8.900/mes",
      subtitle: "Ideal para control y crecimiento",
      highlighted: true,
      features: [
        "Todo en Basico",
        "OCR de tickets",
        "Patrones avanzados",
        "Recomendaciones personalizadas",
        "Soporte prioritario",
      ],
    },
    {
      name: "Advisor",
      price: "$18.500/mes",
      subtitle: "Gestion profesional de cartera",
      highlighted: false,
      features: [
        "Panel de asesor",
        "Seguimiento de clientes",
        "Inbox y alertas",
        "Reportes ejecutivos",
        "Recomendaciones en lote",
      ],
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
      title: "Gasto alto detectado",
      description: "Tu categoria Entretenimiento subio 18% esta semana.",
      level: "danger",
    },
    {
      icon: "💡",
      title: "Oportunidad de ahorro",
      description: "Hay 3 suscripciones activas con bajo uso este mes.",
      level: "warning",
    },
    {
      icon: "🎯",
      title: "Meta semanal cumplida",
      description: "Lograste mantenerte bajo tu limite de gasto diario.",
      level: "success",
    },
  ],
  stats: [
    {
      key: "totalSpent",
      label: "Total Gastado",
      value: 45230,
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
      label: "Promedio Diario",
      value: 1508,
      suffix: "/dia",
      icon: "fa-calendar-day",
      emoji: "📅",
      subtitle: "Promedio del mes",
      trendValue: 7,
      trendDirection: "down",
      trendLabel: "mejorando consistencia",
    },
    {
      key: "microExpenses",
      label: "Gastos Hormiga",
      value: 3450,
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
    name: "Equilibrista",
    description:
      "Balanceas ahorro y disfrute. Mantienes control sin perder flexibilidad.",
    categories: ["Alimentacion", "Transporte", "Entretenimiento"],
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
      ],
      route: ROUTES.PLACEHOLDER,
      queryPreset: "patrones",
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
      { label: "Servicios", value: 16, color: "#a855f7" },
      { label: "Otros", value: 14, color: "#ec4899" },
    ],
    monthlyExpenses: [42000, 45000, 48000, 45230, 44500, 46200],
    monthlyLabels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"],
    dailySeries: [1200, 1800, 1400, 2000, 950, 1650, 1300, 1750, 1450, 1900, 1100, 1600, 1350, 1700],
    dailyLabels: ["L", "M", "X", "J", "V", "S", "D", "L", "M", "X", "J", "V", "S", "D"],
    merchants: [
      { name: "Supermercado Central", spending: "$18.500", icon: "🛒" },
      { name: "Restaurante La Cocina", spending: "$8.450", icon: "🍽️" },
      { name: "Gasolinera Norte", spending: "$5.200", icon: "⛽" },
      { name: "Gimnasio Fit Life", spending: "$3.200", icon: "💪" },
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
      name: "Dracula",
      emoji: "🧛",
      tagline: "El Ahorrador",
      colorClass: "profile-card--dracula",
      description:
        "Controlas cada peso, registras gastos con disciplina y priorizas metas de ahorro agresivas.",
      characteristics: [
        "Registro diario riguroso",
        "Ahorro promedio superior al 30%",
        "Baja tolerancia al gasto impulsivo",
        "Presupuesto mensual estricto",
      ],
      tips: [
        "Define metas de inversion trimestrales",
        "Evita sobrerrestriccion que afecte bienestar",
        "Revisa oportunidades de ahorro automatico",
      ],
      comparison: {
        registryFrequency: "Diario",
        impulseTolerance: "Muy baja",
        savingsPercentage: ">30%",
        mainGoal: "Maximizar ahorro",
        financialRisk: "Muy bajo",
      },
    },
    {
      id: "equilibrista",
      name: "Equilibrista",
      emoji: "⚖️",
      tagline: "El Equilibrado",
      colorClass: "profile-card--equilibrista",
      description:
        "Combinas control y disfrute: cuidas tus numeros, pero mantienes flexibilidad para vivir el presente.",
      characteristics: [
        "Balance entre gasto y ahorro",
        "Ahorro promedio entre 15% y 25%",
        "Gastos discrecionales moderados",
        "Seguimiento semanal consistente",
      ],
      tips: [
        "Mantene regla 70/30 en tu presupuesto",
        "Ajusta tus categorias cada fin de mes",
        "Reserva un monto fijo para imprevistos",
      ],
      comparison: {
        registryFrequency: "Frecuente",
        impulseTolerance: "Media",
        savingsPercentage: "15-25%",
        mainGoal: "Balance sostenible",
        financialRisk: "Bajo",
      },
    },
    {
      id: "espiritu-libre",
      name: "Espiritu Libre",
      emoji: "🌪️",
      tagline: "El Derrochador",
      colorClass: "profile-card--espiritu-libre",
      description:
        "Privilegias la inmediatez y tiendes al gasto impulsivo. Necesitas estructura para recuperar control.",
      characteristics: [
        "Registro irregular de gastos",
        "Ahorro por debajo del 10%",
        "Alta exposicion a gastos hormiga",
        "Presupuesto inestable",
      ],
      tips: [
        "Empieza con registro dos veces por semana",
        "Define un limite diario simple",
        "Recorta tu principal fuga de gasto primero",
      ],
      comparison: {
        registryFrequency: "Esporadico",
        impulseTolerance: "Alta",
        savingsPercentage: "0-10%",
        mainGoal: "Ordenar habitos",
        financialRisk: "Alto",
      },
    },
  ],
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
        "Detectamos multiples suscripciones activas con uso bajo durante las ultimas 4 semanas.",
      solution:
        "Consolida plataformas y deja una sola suscripcion premium por mes para reducir costo fijo.",
      savingsPotential: 450,
      implementationSteps: [
        "Lista tus suscripciones activas",
        "Identifica duplicados de contenido",
        "Cancela dos servicios de menor uso",
        "Revisa nuevamente en 30 dias",
      ],
      dateSent: "2026-04-15",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🎯",
    },
    {
      id: "rec-002",
      title: "Reduce comidas fuera de casa",
      priority: "Alta",
      status: "En Progreso",
      problem:
        "Tu gasto en restaurantes supera tu promedio historico y concentra una porcion alta del total mensual.",
      solution:
        "Planifica menu semanal y limita salidas pagas a dos por semana.",
      savingsPotential: 300,
      implementationSteps: [
        "Define menu de lunes a viernes",
        "Compra insumos en bloque",
        "Lleva almuerzo al trabajo 3 dias",
      ],
      dateSent: "2026-04-12",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🍕",
    },
    {
      id: "rec-003",
      title: "Optimiza transporte diario",
      priority: "Media",
      status: "Pendiente",
      problem:
        "Tus viajes individuales tienen alta frecuencia y costo por trayecto por encima de referencia.",
      solution:
        "Combina transporte publico y movilidad compartida en horarios pico.",
      savingsPotential: 150,
      implementationSteps: [
        "Mapea rutas frecuentes",
        "Compara costo de tres alternativas",
        "Define regla para viajes de corta distancia",
      ],
      dateSent: "2026-04-09",
      advisorName: "Maria Rodriguez",
      advisorEmail: "asesor@fintrack.local",
      icon: "🚗",
    },
    {
      id: "rec-004",
      title: "Crea fondo para imprevistos",
      priority: "Media",
      status: "Completada",
      problem:
        "No tenias un colchon especifico para gastos no planificados.",
      solution:
        "Separar automaticamente un porcentaje fijo de ingreso semanal.",
      savingsPotential: 250,
      implementationSteps: [
        "Define objetivo de 3 meses",
        "Automatiza transferencia semanal",
        "Evita usarlo para ocio",
      ],
      dateSent: "2026-03-28",
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
      suffix: "%",
      icon: "fa-chart-line",
      emoji: "📈",
      trendValue: 8,
      trendDirection: "up",
      trendLabel: "vs mes anterior",
    },
    {
      label: "Gasto Total Supervisado",
      value: 452300,
      icon: "fa-sack-dollar",
      emoji: "💼",
      trendValue: 4,
      trendDirection: "down",
      trendLabel: "clientes mas ordenados",
    },
  ],
  clients: [
    {
      id: "cli-001",
      name: "Juan Perez",
      email: "juan@correo.com",
      profile: "Equilibrista",
      totalSpent: 45230,
      status: "activo",
      unreadMessages: 2,
    },
    {
      id: "cli-002",
      name: "Carlos Gonzalez",
      email: "carlos@correo.com",
      profile: "Espiritu Libre",
      totalSpent: 62500,
      status: "activo",
      unreadMessages: 1,
    },
    {
      id: "cli-003",
      name: "Laura Martinez",
      email: "laura@correo.com",
      profile: "Dracula",
      totalSpent: 28900,
      status: "activo",
      unreadMessages: 0,
    },
    {
      id: "cli-004",
      name: "Sofia Torres",
      email: "sofia@correo.com",
      profile: "Espiritu Libre",
      totalSpent: 71200,
      status: "inactivo",
      unreadMessages: 1,
    },
  ],
  inbox: [
    {
      id: "msg-001",
      from: "Juan Perez",
      subject: "Consulta sobre gastos en alimentacion",
      date: "Hace 15 min",
      unread: true,
    },
    {
      id: "msg-002",
      from: "Carlos Gonzalez",
      subject: "Aumento de gasto en marzo",
      date: "Hace 2 h",
      unread: true,
    },
    {
      id: "msg-003",
      from: "Laura Martinez",
      subject: "Gracias por la ultima recomendacion",
      date: "Ayer",
      unread: false,
    },
  ],
  recommendations: [
    {
      id: "adv-rec-001",
      clientName: "Juan Perez",
      type: "Streaming",
      savingsAmount: 450,
      dateSent: "2026-04-15",
      status: "vista",
    },
    {
      id: "adv-rec-002",
      clientName: "Carlos Gonzalez",
      type: "Presupuesto",
      savingsAmount: 700,
      dateSent: "2026-04-13",
      status: "pendiente",
    },
    {
      id: "adv-rec-003",
      clientName: "Laura Martinez",
      type: "Ahorro automatico",
      savingsAmount: 300,
      dateSent: "2026-04-10",
      status: "aceptada",
    },
  ],
  charts: {
    profileDistribution: [
      { label: "Dracula", value: 2, color: "#8b5cf6" },
      { label: "Equilibrista", value: 3, color: "#2dd4bf" },
      { label: "Espiritu Libre", value: 3, color: "#f97316" },
    ],
    spendByProfile: [
      { label: "Dracula", value: 57800 },
      { label: "Equilibrista", value: 95500 },
      { label: "Espiritu Libre", value: 133700 },
    ],
    dailyActivityLabels: ["1", "5", "10", "15", "20", "25", "30"],
    dailyActivityValues: [4, 5, 6, 7, 6, 8, 7],
  },
};
