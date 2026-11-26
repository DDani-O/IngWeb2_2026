/**
 * Contenido visual de los perfiles de gasto (texto, emoji, comparativa).
 * Es estático del front: la BD solo guarda nombre y descripción (perfiles_de_gasto).
 * Se vincula con el catálogo de la API por nombre (sin distinguir mayúsculas ni tildes).
 */
export const SPENDING_PROFILES_CONTENT = [
  {
    id: "dracula",
    name: "Drácula Nocturno",
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
    name: "Equilibrista Cósmico",
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
    name: "Espíritu Libre",
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
];

/** Minúsculas y sin tildes, para comparar nombres. */
const normalizeName = (name) =>
  String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/**
 * Busca el contenido visual de un perfil por nombre (sin distinguir mayúsculas ni tildes).
 * @param {string} name
 */
export function findSpendingProfileContent(name = "") {
  const normalized = normalizeName(name);
  return SPENDING_PROFILES_CONTENT.find((profile) => normalizeName(profile.name) === normalized) || null;
}
