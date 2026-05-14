/**
 * i18n.js
 * Centralización de textos, mensajes y contenidos visibles de la UI.
 * Separado de constants.js para distinguir claramente entre:
 *   - constants.js: Configuración técnica del sistema (APIs, rutas, eventos, timeouts)
 *   - i18n.js: Contenido textual visible para el usuario
 *
 * Principios:
 * - Modificar aquí para cambiar cualquier label, mensaje o descripción visible
 * - Facilita futura localización multiidioma
 * - Mejora mantenibilidad y búsqueda de contenidos
 *
 * @module i18n
 */

/**
 * Diccionario de textos de la aplicación
 * Organizado por secciones principales
 */
export const TEXTS = {
  landing: {
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
  },

  placeholders: {
    cargarGasto: {
      title: "Cargar Gasto",
      description:
        "Esta seccion estara disponible en la proxima fase. Mientras tanto, usa el dashboard para explorar tus metricas.",
      icon: "fa-receipt",
      ctaText: "Ir al Dashboard",
    },
    historial: {
      title: "Historial de Gastos",
      description:
        "Estamos trabajando en tu historial completo con filtros avanzados y exportacion.",
      icon: "fa-clock-rotate-left",
      ctaText: "Ir al Dashboard",
    },
    patrones: {
      title: "Patrones de Consumo",
      description:
        "Estamos ajustando comparativas historicas avanzadas y deteccion de anomalias.",
      icon: "fa-chart-pie",
      ctaText: "Ver Patrones",
    },
    perfil: {
      title: "Perfil de Usuario",
      description:
        "Muy pronto podras editar tus datos y preferencias de cuenta desde esta seccion.",
      icon: "fa-user-gear",
      ctaText: "Ir al Dashboard",
    },
    advisorClientes: {
      title: "Mis Clientes",
      description:
        "Estamos preparando la gestion completa de cartera con vista detallada por cliente.",
      icon: "fa-users",
      ctaText: "Volver al Panel",
    },
    advisorInbox: {
      title: "Inbox de Asesor",
      description:
        "La bandeja completa de conversaciones estara disponible en la siguiente iteracion.",
      icon: "fa-inbox",
      ctaText: "Volver al Panel",
    },
    advisorReportes: {
      title: "Reportes de Asesor",
      description:
        "Estamos armando reportes descargables y paneles de seguimiento avanzado.",
      icon: "fa-chart-column",
      ctaText: "Volver al Panel",
    },
  },

  dashboard: {
    usuario: {
      welcome: {
        subtitle:
          "Tu resumen financiero esta listo. Explora tus patrones de gasto y descubre como mejorar tu economia personal.",
      },
      alerts: {
        spentMore: {
          title: "Has gastado mas de lo normal",
          description:
            "Tu gasto diario excede el promedio. Revisa donde esta el incremento.",
          icon: "⚠️",
          level: "danger",
        },
        savingsOpportunity: {
          title: "Oportunidad de ahorro detectada",
          description: "Tienes 3 suscripciones activas que podrias revisar.",
          icon: "💡",
          level: "warning",
        },
        goodMonth: {
          title: "Buen mes de ahorro",
          description: "Estas 15% por encima de tu meta de esta semana.",
          icon: "🎯",
          level: "success",
        },
      },
      stats: {
        totalSpent: {
          label: "Total Gastado",
          emoji: "💸",
          subtitle: "Ultimos 30 dias",
          trendLabel: "vs mes anterior",
        },
        budgetLeft: {
          label: "Presupuesto Restante",
          emoji: "🤔",
          subtitle: "75% del limite utilizado",
          trendLabel: "respecto a semana pasada",
        },
        mainCategory: {
          label: "Categoria Principal",
          emoji: "🍽️",
          subtitle: "Alimentacion",
          trendLabel: "reduccion respecto a mes anterior",
        },
        microExpenses: {
          label: "Gastos Hormiga",
          emoji: "🐜",
          subtitle: "Acumulados del mes",
          trendLabel: "reduccion sostenida",
        },
      },
      profileCard: {
        name: "Equilibrista Cosmico",
        description:
          "Perfecto balance entre gasto y ahorro. Eres el tipo de persona que confunde su presupuesto con un arte.",
        categories: [
          "Alimentacion",
          "Transporte",
          "Entretenimiento",
          "Servicios",
        ],
      },
      summaryCards: {
        consumption: {
          title: "Patrones de Consumo",
          subtitle: "Analisis de tus gastos",
          icon: "fa-chart-pie",
          accent: "teal",
        },
        recommendations: {
          title: "Recomendaciones",
          subtitle: "3 activas para ti",
          icon: "fa-lightbulb",
          accent: "amber",
        },
        recentExpenses: {
          title: "Ultimos Gastos",
          subtitle: "Movimientos recientes",
          icon: "fa-clock-rotate-left",
          accent: "cyan",
        },
      },
      chartLabels: {
        alimentacion: "Alimentacion",
        transporte: "Transporte",
        entretenimiento: "Entretenimiento",
        servicios: "Servicios",
        otros: "Otros",
      },
      merchants: [
        { name: "Supermercado Central", icon: "🛒" },
        { name: "Restaurante La Cocina", icon: "🍽️" },
        { name: "Gasolinera Shell", icon: "⛽" },
        { name: "Gimnasio Fit Life", icon: "💪" },
        { name: "Netflix y Otros", icon: "🎬" },
      ],
      advisor: {
        name: "Maria Rodriguez",
        title: "Asesor Financiero Senior",
        avatar: "👩‍💼",
        message:
          "Estoy disponible para ayudarte a optimizar tus gastos y planificar tus proximos objetivos.",
      },
    },
  },

  profiles: {
    dracula: {
      name: "Dracula Nocturno",
      emoji: "🧛",
      tagline: "El Ahorrador Profesional",
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
    equilibrista: {
      name: "Equilibrista Cosmico",
      emoji: "⚖️",
      tagline: "El Balanceador Perfecto",
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
    espirituLibre: {
      name: "Espiritu Libre",
      emoji: "🦅",
      tagline: "El Gaudior Desenfrenado",
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
  },

  patterns: {
    highlights: {
      positive: {
        icon: "📈",
        title: "Tendencia Positiva",
        text: "Tus gastos bajaron 12% respecto al mes anterior. Buen trabajo.",
      },
      warning: {
        icon: "⚠️",
        title: "Area de Atencion",
        text: "Los gastos hormiga representan $3.450. Podrias ahorrar hasta $500/mes.",
      },
    },
    statsLabels: {
      monthlyAvg: {
        label: "Promedio Mensual",
        subtitle: "Promedio mensual del mes actual",
        icon: "📅",
      },
      mainCategory: {
        label: "Mayor Categoria",
        subtitle: "Categoria con mayor participacion",
        icon: "🏷️",
      },
      topExpense: {
        label: "Mayor Gasto Realizado",
        subtitle: "Compra de computadora",
        icon: "💻",
      },
      unusualExpenses: {
        label: "Gastos Inusuales",
        suffix: " eventos",
        subtitle: "Detectados en los ultimos 30 dias",
        icon: "🚨",
      },
    },
    categoryLabels: {
      alimentacion: "Alimentacion",
      transportes: "Transportes",
      entretenimiento: "Entretenimiento",
      servicios: "Servicios",
      otros: "Otros",
    },
    unusualLabels: {
      restaurantes: "Restaurantes",
      comprasOnline: "Compras Online",
      transporteApp: "Transporte App",
    },
  },

  recommendations: {
    reduce_streaming: {
      title: "Reduce gastos en streaming",
      priority: "Alta",
      status: "Pendiente",
      problem:
        "Detectamos muchas pequenas compras frecuentes que, aunque parecen insignificantes, suman rapidamente. Estos gastos representan $3.450 del mes (7.6% de tu presupuesto).",
      solution:
        "Reduce tus gastos hormiga con limites diarios y seguimiento semanal.",
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
    reduce_dining: {
      title: "Reduce comidas fuera de casa",
      priority: "Alta",
      status: "Pendiente",
      problem:
        "Este mes invertiste $8.450 en restaurantes. Si cocinases en casa mas frecuentemente, podrias preparar comidas nutritivas a una fraccion del costo.",
      solution:
        "Planifica tus comidas semanales y limita salidas a dos veces por semana.",
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
    review_subscriptions: {
      title: "Revisa tus suscripciones",
      priority: "Media",
      status: "Pendiente",
      problem:
        "Identificamos 5 suscripciones activas que podrian tener duplicadas o no estes usando. Varias plataformas de streaming pueden optimizarse.",
      solution:
        "Haz una limpieza mensual de suscripciones y comparte planes familiares si es posible.",
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
    optimize_transport: {
      title: "Optimiza tu transporte",
      priority: "Media",
      status: "Pendiente",
      problem:
        "Actualmente gastas $5.200 en transporte. Usar mas transporte publico o compartido podria reducir significativamente este monto.",
      solution:
        "Combina rutas de transporte publico y carpooling para reducir costos recurrentes.",
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
    emergency_fund: {
      title: "Fondo de emergencia completado",
      priority: "Media",
      status: "Completada",
      problem:
        "No contabas con un colchon financiero para imprevistos.",
      solution:
        "Lograste separar automaticamente un porcentaje fijo durante seis semanas.",
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
  },

  advisor: {
    dashboard: {
      alerts: {
        clientsFollowup: {
          icon: "👥",
          title: "3 clientes requieren seguimiento",
          description: "No registran gastos hace mas de 5 dias.",
          level: "warning",
        },
        unreadMessages: {
          icon: "💬",
          title: "7 mensajes sin leer",
          description: "Pendientes en inbox de hoy.",
          level: "success",
        },
        excellentPerformance: {
          icon: "⭐",
          title: "Excelente desempeno",
          description: "12 recomendaciones implementadas este mes.",
          level: "success",
        },
      },
    },
  },
};

/**
 * Helper para acceso anidado de textos con validación
 * @param {string} path - Ruta al texto (ej: 'landing.features.0.title')
 * @returns {*} Valor del texto o undefined si no existe
 *
 * @example
 * getText('landing.features.0.title') // "Registra al instante"
 * getText('landing.plans.0.name') // "Plan Basico"
 */
export function getText(path) {
  const keys = String(path).split(".");
  let value = TEXTS;

  for (const key of keys) {
    if (value && typeof value === "object") {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}
