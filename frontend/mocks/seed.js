/**
 * seed.js - Datos iniciales del backend simulado.
 *
 * Las "tablas" respetan los nombres y columnas de la BD (migrations/0001_init_schema.sql).
 * Los gastos se generan de forma determinística y relativos a la fecha actual, para que
 * los gráficos y el análisis siempre tengan datos del mes en curso.
 * Solo se carga con el driver "mock" (ver API_CONFIG.DRIVERS).
 */

const MOCK_PASSWORD = "Fintrack2026*";

/** Subir al cambiar la forma de los datos: fuerza a regenerar la base guardada en localStorage. */
export const SEED_VERSION = 4;

/** Mismo catálogo que la BD (migraciones 0006 y 0018: nombres e íconos). */
const CATEGORIAS = [
  { id: "cat-alimentacion", nombre: "Alimentación", icono: "🍔" },
  { id: "cat-transporte", nombre: "Transporte", icono: "🚗" },
  { id: "cat-entretenimiento", nombre: "Entretenimiento", icono: "🎬" },
  { id: "cat-salud", nombre: "Salud", icono: "⚕️" },
  { id: "cat-educacion", nombre: "Educación", icono: "📚" },
  { id: "cat-hogar", nombre: "Hogar", icono: "🏠" },
  { id: "cat-ropa", nombre: "Ropa", icono: "👕" },
  { id: "cat-servicios", nombre: "Servicios", icono: "⚙️" },
  { id: "cat-suscripciones", nombre: "Suscripciones", icono: "🎬" },
  { id: "cat-otros", nombre: "Otros", icono: "📦" },
];

/** Comercios típicos y monto base (ARS) por categoría. */
const COMERCIOS_POR_CATEGORIA = {
  "cat-alimentacion": { base: 9000, comercios: ["Supermercado Central", "Verduleria Don Jose", "Cafe Estacion", "Restaurante La Cocina"] },
  "cat-transporte": { base: 3000, comercios: ["Subte Linea B", "Uber", "YPF"] },
  "cat-servicios": { base: 12000, comercios: ["Edenor", "Metrogas", "Personal"] },
  "cat-entretenimiento": { base: 7000, comercios: ["Cine Hoyts", "Bar El Patio", "Teatro Gran Rex"] },
  "cat-salud": { base: 5500, comercios: ["Farmacia Sur", "Optica Vision"] },
  "cat-educacion": { base: 4500, comercios: ["Libreria Centro", "Udemy"] },
  "cat-hogar": { base: 8000, comercios: ["Easy", "Sodimac", "Ferreteria El Tornillo"] },
  "cat-ropa": { base: 15000, comercios: ["Zara", "Falabella", "Dexter"] },
  "cat-suscripciones": { base: 3200, comercios: ["Netflix", "Spotify", "Disney+"] },
  "cat-otros": { base: 6000, comercios: ["Mercado Libre", "Kiosco 24hs"] },
};

/** Pesos por categoría según el tipo de cliente (definen el perfil que le asigna el sistema). */
const ARQUETIPOS = {
  ahorrista: { "cat-alimentacion": 5, "cat-transporte": 3, "cat-servicios": 2, "cat-salud": 1, "cat-educacion": 1, "cat-entretenimiento": 0.4, "cat-suscripciones": 0.3, "cat-otros": 0.2 },
  equilibrado: { "cat-alimentacion": 5, "cat-transporte": 3, "cat-servicios": 2, "cat-salud": 1, "cat-educacion": 0.8, "cat-entretenimiento": 1.4, "cat-suscripciones": 1, "cat-otros": 0.6 },
  gastador: { "cat-alimentacion": 4, "cat-transporte": 2, "cat-servicios": 1.5, "cat-salud": 0.6, "cat-educacion": 0.4, "cat-entretenimiento": 3.5, "cat-suscripciones": 2, "cat-otros": 2.5 },
};

const ASESOR_ID = "ase-001";

const CLIENTES = [
  { id: "cli-001", nombre: "Juan Perez", email: "cliente@fintrack.local", arquetipo: "equilibrado", escala: 1, gastosPorMes: 14, pico: "cat-alimentacion", ocupacion: "Disenador UX", ingreso: 285000, objetivo: "Juntar un fondo de emergencia de 3 meses de gastos" },
  { id: "cli-002", nombre: "Carlos Gonzalez", email: "carlos@fintrack.local", arquetipo: "gastador", escala: 1.3, gastosPorMes: 16, pico: "cat-entretenimiento", ocupacion: "Comerciante", ingreso: 320000, objetivo: "Ordenar mis gastos de salidas" },
  { id: "cli-003", nombre: "Fernanda Lopez", email: "fernanda@fintrack.local", arquetipo: "ahorrista", escala: 0.8, gastosPorMes: 11, pico: null, ocupacion: "Docente", ingreso: 210000, objetivo: "Comprar un auto usado" },
  { id: "cli-004", nombre: "Laura Martinez", email: "laura@fintrack.local", arquetipo: "equilibrado", escala: 1.1, gastosPorMes: 13, pico: null, ocupacion: "Contadora", ingreso: 340000, objetivo: "Viajar en vacaciones sin endeudarme" },
  { id: "cli-005", nombre: "Sofia Torres", email: "sofia@fintrack.local", arquetipo: "gastador", escala: 1.1, gastosPorMes: 15, pico: "cat-otros", ocupacion: "Estudiante", ingreso: 150000, objetivo: "Llegar a fin de mes" },
  { id: "cli-006", nombre: "Martin Diaz", email: "martin@fintrack.local", arquetipo: "gastador", escala: 1.5, gastosPorMes: 15, pico: "cat-suscripciones", ocupacion: "Programador", ingreso: 450000, objetivo: "Invertir parte del sueldo" },
  { id: "cli-007", nombre: "Lucia Romero", email: "lucia@fintrack.local", arquetipo: "ahorrista", escala: 0.9, gastosPorMes: 10, pico: null, ocupacion: "Enfermera", ingreso: 230000, objetivo: "Ahorrar para una mudanza" },
  { id: "cli-008", nombre: "Diego Castro", email: "diego@fintrack.local", arquetipo: "equilibrado", escala: 1, gastosPorMes: 12, pico: null, ocupacion: "Arquitecto", ingreso: 300000, objetivo: "Reducir gastos fijos" },
];

/** PRNG determinístico (mulberry32) para que la semilla sea reproducible. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(weights, random) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let threshold = random() * total;

  for (const [key, weight] of entries) {
    threshold -= weight;
    if (threshold <= 0) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(today, days) {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Genera 6 meses previos + el mes en curso de gastos para un cliente.
 */
function generateExpenses(client, clientIndex, today) {
  const random = createRandom(1000 + clientIndex * 97);
  const weights = ARQUETIPOS[client.arquetipo];
  const expenses = [];
  let counter = 0;

  for (let monthOffset = 6; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const lastDay = monthOffset === 0 ? today.getDate() : daysInMonth;
    const count = Math.max(2, Math.round((client.gastosPorMes * lastDay) / daysInMonth));

    for (let index = 0; index < count; index += 1) {
      const categoryId = pickWeighted(weights, random);
      const { base, comercios } = COMERCIOS_POR_CATEGORIA[categoryId];
      const day = 1 + Math.floor(random() * lastDay);
      const amount = Math.round((base * client.escala * (0.6 + random() * 0.8)) / 10) * 10;
      counter += 1;

      expenses.push({
        id: `gas-${client.id}-${counter}`,
        cliente_id: client.id,
        categoria_id: categoryId,
        comercio: comercios[Math.floor(random() * comercios.length)],
        fecha_gasto: toIsoDate(new Date(monthStart.getFullYear(), monthStart.getMonth(), day)),
        monto: amount,
        descripcion: "",
        origen: random() < 0.35 ? "ticket" : "manual",
        moneda: "ARS",
        ticket_principal_id: null,
        creado_en: new Date(monthStart.getFullYear(), monthStart.getMonth(), day, 12).toISOString(),
      });
    }
  }

  // Gasto inusual reciente en la categoría "pico" del cliente.
  if (client.pico) {
    const { base, comercios } = COMERCIOS_POR_CATEGORIA[client.pico];
    const date = daysAgo(today, 3);
    expenses.push({
      id: `gas-${client.id}-pico`,
      cliente_id: client.id,
      categoria_id: client.pico,
      comercio: comercios[0],
      fecha_gasto: toIsoDate(date),
      monto: Math.round(base * client.escala * 2.6),
      descripcion: "Gasto fuera de lo habitual",
      origen: "manual",
      moneda: "ARS",
      ticket_principal_id: null,
      creado_en: date.toISOString(),
    });
  }

  return expenses;
}

/**
 * Construye la base inicial completa.
 * @param {Date} today
 */
export function buildSeed(today = new Date()) {
  const createdAt = (days) => daysAgo(today, days).toISOString();

  const usuarios = [
    {
      id: ASESOR_ID,
      email: "asesor@fintrack.local",
      password: MOCK_PASSWORD,
      rol: "asesor",
      nombre_completo: "Maria Rodriguez",
      biografia: "",
      foto_perfil_url: null,
      estado: "activo",
      creado_en: createdAt(1650),
    },
    ...CLIENTES.map((client, index) => ({
      id: client.id,
      email: client.email,
      password: MOCK_PASSWORD,
      rol: "cliente",
      nombre_completo: client.nombre,
      biografia: "",
      foto_perfil_url: null,
      estado: "activo",
      creado_en: createdAt(400 - index * 20),
    })),
  ];

  const perfiles_usuarios = CLIENTES.map((client) => ({
    usuario_id: client.id,
    ocupacion: client.ocupacion,
    ingreso_estimado: client.ingreso,
    objetivo_financiero: client.objetivo,
  }));

  const perfiles_asesores = [
    {
      usuario_id: ASESOR_ID,
      matricula: "A-12345",
      especialidad: "Finanzas personales",
      descripcion: "Acompano a clientes en presupuesto mensual y control de gastos.",
      // La BD limita los clientes activos por asesor (por defecto 5); la demo tiene 8.
      capacidad_maxima: 10,
    },
  ];

  const asignaciones_de_clientes = CLIENTES.map((client) => ({
    asesor_id: ASESOR_ID,
    cliente_id: client.id,
    activo: true,
  }));

  const perfiles_de_gasto = [
    // Mismo catálogo que la BD (migración 0016).
    { id: "pdg-ahorrista", nombre: "Drácula Nocturno", descripcion: "Gastos muy controlados y alto ahorro.", criterio_regla: { discrecional_max: 0.1 } },
    { id: "pdg-equilibrado", nombre: "Equilibrista Cósmico", descripcion: "Balance entre gasto y ahorro.", criterio_regla: { discrecional_max: 0.3 } },
    { id: "pdg-gastador", nombre: "Espíritu Libre", descripcion: "Gasto discrecional alto y poco control.", criterio_regla: { discrecional_max: 1 } },
  ];

  const gastos = CLIENTES.flatMap((client, index) => generateExpenses(client, index, today));

  const rec = (id, clienteId, dias, data) => ({
    id,
    cliente_id: clienteId,
    asesor_id: data.origen === "asesor" ? ASESOR_ID : null,
    leida: false,
    leida_en: null,
    creado_en: createdAt(dias),
    ...data,
  });

  const recomendaciones_financieras = [
    rec("rec-001", "cli-001", 2, { origen: "asesor", tipo: "sugerencia", prioridad: "alta", titulo: "Reduce gastos en streaming", mensaje: "Tenes varias suscripciones activas que suman un monto importante por mes. Revisalas y quedate solo con las que usas." }),
    rec("rec-002", "cli-001", 4, { origen: "sistema", tipo: "alerta", prioridad: "alta", titulo: "Gasto elevado en alimentacion", mensaje: "Registraste un gasto en alimentacion muy por encima de tu promedio. Planificar las compras de la semana ayuda a bajar este rubro." }),
    rec("rec-003", "cli-001", 9, { origen: "asesor", tipo: "sugerencia", prioridad: "media", titulo: "Revisa tus suscripciones", mensaje: "Algunas suscripciones podrian estar duplicadas. Una limpieza mensual evita pagos que no usas." }),
    rec("rec-004", "cli-001", 18, { origen: "sistema", tipo: "observacion", prioridad: "baja", titulo: "Transporte estable", mensaje: "Tu gasto en transporte se mantuvo estable los ultimos meses. Combinar transporte publico y compartido puede reducirlo un poco mas." }),
    { ...rec("rec-005", "cli-001", 40, { origen: "asesor", tipo: "observacion", prioridad: "media", titulo: "Buen ritmo de ahorro", mensaje: "Separaste un porcentaje fijo de tus ingresos durante seis semanas seguidas. Mantener ese habito te da un colchon para imprevistos." }), leida: true, leida_en: createdAt(38) },
    rec("rec-006", "cli-005", 1, { origen: "asesor", tipo: "sugerencia", prioridad: "alta", titulo: "Implementa un presupuesto semanal", mensaje: "Definir un monto semanal para gastos varios te ayuda a llegar a fin de mes." }),
    rec("rec-007", "cli-002", 3, { origen: "asesor", tipo: "alerta", prioridad: "alta", titulo: "Gasto elevado en entretenimiento", mensaje: "Este mes tu gasto en salidas supera ampliamente tu promedio." }),
    { ...rec("rec-008", "cli-004", 12, { origen: "asesor", tipo: "observacion", prioridad: "media", titulo: "Manten tu ahorro consistente", mensaje: "Vas muy bien con tu objetivo de viaje. Segui separando el mismo monto cada mes." }), leida: true, leida_en: createdAt(10) },
  ];

  return {
    version: SEED_VERSION,
    usuarios,
    perfiles_usuarios,
    perfiles_asesores,
    asignaciones_de_clientes,
    categorias_de_gasto: CATEGORIAS,
    perfiles_de_gasto,
    gastos,
    tickets: [],
    recomendaciones_financieras,
    // Solo las clasificaciones que carga el asesor: la automática se calcula en cada pedido.
    clasificacion_de_perfil: [],
  };
}

/** Comercios conocidos por categoría (los usa el OCR simulado). */
export const MOCK_MERCHANTS_BY_CATEGORY = COMERCIOS_POR_CATEGORIA;
