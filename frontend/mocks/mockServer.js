/**
 * mockServer.js - Backend simulado con el mismo contrato que la API NestJS.
 *
 * APIClient lo usa cuando API_CONFIG.DRIVER = "mock". Recibe { method, path, query, body, token }
 * y devuelve { status, body } con los cuerpos en español definidos en
 * especificaciones/EspecificacionDesarrolloFront.md §10. Los datos se guardan en localStorage
 * para que sobrevivan a la navegación y a la recarga.
 */
import { STORAGE_KEYS } from "../utils/constants.js";
import { computeAdvisorSummary, computeClientAnalysis } from "./analytics.js";
import { MOCK_MERCHANTS_BY_CATEGORY, SEED_VERSION, buildSeed, toIsoDate } from "./seed.js";

const TOKEN_PREFIX = "mock.";

class HttpError extends Error {
  constructor(status, codigo, mensaje, detalles = null) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

const notFound = (what) => new HttpError(404, "NO_ENCONTRADO", `${what} no encontrado.`);

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCK_DB);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.version === SEED_VERSION) {
      return parsed;
    }
  } catch {
    // Base corrupta: se regenera.
  }

  const seed = buildSeed(new Date());
  localStorage.setItem(STORAGE_KEYS.MOCK_DB, JSON.stringify(seed));
  return seed;
}

let db = loadDb();

function persist() {
  localStorage.setItem(STORAGE_KEYS.MOCK_DB, JSON.stringify(db));
}

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

// ---------- Serializadores (forma de la API) ----------

function serializeUser(user) {
  const base = {
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre_completo: user.nombre_completo,
    biografia: user.biografia || "",
    foto_perfil_url: user.foto_perfil_url,
    estado: user.estado,
    creado_en: user.creado_en,
  };

  if (user.rol === "cliente") {
    const profile = db.perfiles_usuarios.find((item) => item.usuario_id === user.id) || {};
    const assignment = db.asignaciones_de_clientes.find((item) => item.cliente_id === user.id && item.activo);
    const advisor = assignment ? db.usuarios.find((item) => item.id === assignment.asesor_id) : null;
    const analysis = computeClientAnalysis(db, user.id);

    base.perfil_cliente = {
      ocupacion: profile.ocupacion || "",
      ingreso_estimado: profile.ingreso_estimado ?? null,
      objetivo_financiero: profile.objetivo_financiero || "",
      perfil_de_gasto: analysis.perfil_de_gasto,
      asesor: advisor ? { id: advisor.id, nombre_completo: advisor.nombre_completo } : null,
    };
  } else {
    const profile = db.perfiles_asesores.find((item) => item.usuario_id === user.id) || {};
    base.perfil_asesor = {
      matricula: profile.matricula || "",
      especialidad: profile.especialidad || "",
      descripcion: profile.descripcion || "",
      clientes_asignados: db.asignaciones_de_clientes.filter((item) => item.asesor_id === user.id && item.activo).length,
    };
  }

  return base;
}

function serializeExpense(expense) {
  const category = db.categorias_de_gasto.find((item) => item.id === expense.categoria_id);
  return {
    id: expense.id,
    comercio: expense.comercio,
    fecha_gasto: expense.fecha_gasto,
    monto: expense.monto,
    descripcion: expense.descripcion || "",
    origen: expense.origen,
    moneda: expense.moneda,
    categoria: category ? { id: category.id, nombre: category.nombre, icono: category.icono } : null,
    ticket_principal_id: expense.ticket_principal_id,
    creado_en: expense.creado_en,
    actualizado_en: expense.actualizado_en || expense.creado_en,
  };
}

function serializeRecommendation(recommendation) {
  const advisor = recommendation.asesor_id ? db.usuarios.find((item) => item.id === recommendation.asesor_id) : null;
  const client = db.usuarios.find((item) => item.id === recommendation.cliente_id);
  return {
    id: recommendation.id,
    titulo: recommendation.titulo,
    mensaje: recommendation.mensaje,
    tipo: recommendation.tipo,
    prioridad: recommendation.prioridad,
    origen: recommendation.origen,
    leida: recommendation.leida,
    leida_en: recommendation.leida_en,
    creado_en: recommendation.creado_en,
    asesor: advisor ? { id: advisor.id, nombre_completo: advisor.nombre_completo } : null,
    cliente: client ? { id: client.id, nombre_completo: client.nombre_completo } : null,
  };
}

function serializeClientSummary(user) {
  const analysis = computeClientAnalysis(db, user.id);
  return {
    id: user.id,
    nombre_completo: user.nombre_completo,
    email: user.email,
    estado: user.estado,
    perfil_de_gasto: analysis.perfil_de_gasto,
    gasto_promedio_mensual: analysis.gasto_promedio_mensual,
    gasto_mes_actual: analysis.gasto_mes_actual,
    variacion_mes_anterior: analysis.variacion_mes_anterior,
    ultimo_gasto_fecha: analysis.ultimo_gasto_fecha,
    gastos_inusuales: analysis.gastos_inusuales.length,
    nivel_riesgo: analysis.nivel_riesgo,
  };
}

// ---------- Validaciones ----------

function requireFields(body, fields) {
  const missing = fields.filter((field) => body?.[field] === undefined || body?.[field] === null || String(body[field]).trim() === "");
  if (missing.length) {
    throw new HttpError(422, "VALIDACION", "Faltan datos obligatorios.", { campos: missing });
  }
}

function validateExpense(body, { partial = false } = {}) {
  if (!partial) {
    requireFields(body, ["comercio", "fecha_gasto", "monto", "categoria_id"]);
  }

  if (body.monto !== undefined && !(Number(body.monto) > 0)) {
    throw new HttpError(422, "VALIDACION", "El monto debe ser mayor a cero.", { campos: ["monto"] });
  }

  if (body.fecha_gasto !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_gasto)) {
    throw new HttpError(422, "VALIDACION", "La fecha debe tener formato AAAA-MM-DD.", { campos: ["fecha_gasto"] });
  }

  if (body.categoria_id !== undefined && !db.categorias_de_gasto.some((item) => item.id === body.categoria_id)) {
    throw new HttpError(422, "VALIDACION", "La categoria no existe.", { campos: ["categoria_id"] });
  }

  if (body.origen !== undefined && !["manual", "ticket"].includes(body.origen)) {
    throw new HttpError(422, "VALIDACION", "El origen debe ser manual o ticket.", { campos: ["origen"] });
  }
}

// ---------- Helpers de acceso ----------

function findOwnExpense(user, id) {
  const expense = db.gastos.find((item) => item.id === id && item.cliente_id === user.id);
  if (!expense) {
    throw notFound("Gasto");
  }
  return expense;
}

function assertAssignedClient(advisor, clientId) {
  const assigned = db.asignaciones_de_clientes.some(
    (item) => item.asesor_id === advisor.id && item.cliente_id === clientId && item.activo
  );
  if (!assigned) {
    throw new HttpError(403, "PROHIBIDO", "El cliente no esta asignado a este asesor.");
  }
}

function issueSession(user) {
  return { token: `${TOKEN_PREFIX}${user.id}`, usuario: serializeUser(user) };
}

/** OCR simulado: deriva comercio, monto y categoría del nombre del archivo. */
function simulateOcr(fileName) {
  const hash = Array.from(fileName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const categoryIds = Object.keys(MOCK_MERCHANTS_BY_CATEGORY);
  const categoryId = categoryIds[hash % categoryIds.length];
  const { base, comercios } = MOCK_MERCHANTS_BY_CATEGORY[categoryId];
  const category = db.categorias_de_gasto.find((item) => item.id === categoryId);

  return {
    comercio_detectado: comercios[hash % comercios.length],
    fecha_detectada: toIsoDate(new Date()),
    monto_detectado: Math.round(base * (0.8 + (hash % 40) / 100)),
    categoria_sugerida: category ? { id: category.id, nombre: category.nombre } : null,
    confianza_general: 80 + (hash % 18),
  };
}

// ---------- Rutas ----------

const routes = [
  {
    method: "POST", path: "/auth/login", auth: false,
    handler: ({ body }) => {
      requireFields(body, ["email", "password"]);
      const user = db.usuarios.find((item) => item.email.toLowerCase() === String(body.email).toLowerCase());
      if (!user || user.password !== body.password) {
        throw new HttpError(401, "CREDENCIALES_INVALIDAS", "Email o contrasena invalida.");
      }
      return { status: 200, body: issueSession(user) };
    },
  },
  {
    method: "POST", path: "/auth/register", auth: false,
    handler: ({ body }) => {
      requireFields(body, ["nombre_completo", "email", "password", "rol"]);
      if (!["cliente", "asesor"].includes(body.rol)) {
        throw new HttpError(422, "VALIDACION", "El rol debe ser cliente o asesor.", { campos: ["rol"] });
      }
      if (body.rol === "asesor") {
        requireFields(body, ["matricula", "especialidad"]);
      }
      if (db.usuarios.some((item) => item.email.toLowerCase() === String(body.email).toLowerCase())) {
        throw new HttpError(409, "EMAIL_DUPLICADO", "El email ya se encuentra registrado.");
      }

      const user = {
        id: newId(body.rol === "cliente" ? "cli" : "ase"),
        email: body.email,
        password: body.password,
        rol: body.rol,
        nombre_completo: body.nombre_completo,
        biografia: "",
        foto_perfil_url: null,
        estado: "activo",
        creado_en: nowIso(),
      };
      db.usuarios.push(user);

      if (user.rol === "cliente") {
        db.perfiles_usuarios.push({ usuario_id: user.id, ocupacion: "", ingreso_estimado: null, objetivo_financiero: "" });
        // Demo: los clientes nuevos se asignan al primer asesor disponible.
        const advisor = db.usuarios.find((item) => item.rol === "asesor");
        if (advisor) {
          db.asignaciones_de_clientes.push({ asesor_id: advisor.id, cliente_id: user.id, activo: true });
        }
      } else {
        db.perfiles_asesores.push({ usuario_id: user.id, matricula: body.matricula, especialidad: body.especialidad, descripcion: "" });
      }

      persist();
      return { status: 201, body: issueSession(user) };
    },
  },
  { method: "GET", path: "/auth/me", handler: ({ user }) => ({ status: 200, body: serializeUser(user) }) },
  {
    method: "PUT", path: "/auth/profile",
    handler: ({ user, body }) => {
      requireFields(body, ["nombre_completo"]);
      user.nombre_completo = body.nombre_completo;
      user.biografia = body.biografia ?? user.biografia;

      if (user.rol === "cliente") {
        const profile = db.perfiles_usuarios.find((item) => item.usuario_id === user.id);
        Object.assign(profile, {
          ocupacion: body.ocupacion ?? profile.ocupacion,
          ingreso_estimado: body.ingreso_estimado ?? profile.ingreso_estimado,
          objetivo_financiero: body.objetivo_financiero ?? profile.objetivo_financiero,
        });
      } else {
        requireFields(body, ["matricula", "especialidad"]);
        const profile = db.perfiles_asesores.find((item) => item.usuario_id === user.id);
        Object.assign(profile, {
          matricula: body.matricula,
          especialidad: body.especialidad,
          descripcion: body.descripcion ?? profile.descripcion,
        });
      }

      persist();
      return { status: 200, body: serializeUser(user) };
    },
  },
  { method: "GET", path: "/categories", handler: () => ({ status: 200, body: db.categorias_de_gasto }) },
  {
    method: "GET", path: "/spending-profiles",
    handler: () => ({ status: 200, body: db.perfiles_de_gasto.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion })) }),
  },
  {
    method: "GET", path: "/expenses", role: "cliente",
    handler: ({ user, query }) => {
      let items = db.gastos.filter((item) => item.cliente_id === user.id);
      const search = String(query.busqueda || "").toLowerCase();

      if (search) {
        items = items.filter((item) => item.comercio.toLowerCase().includes(search) || (item.descripcion || "").toLowerCase().includes(search));
      }
      if (query.categoria_id) items = items.filter((item) => item.categoria_id === query.categoria_id);
      if (query.origen) items = items.filter((item) => item.origen === query.origen);
      if (query.desde) items = items.filter((item) => item.fecha_gasto >= query.desde);
      if (query.hasta) items = items.filter((item) => item.fecha_gasto <= query.hasta);

      const sorters = {
        monto_desc: (a, b) => b.monto - a.monto,
        monto_asc: (a, b) => a.monto - b.monto,
        fecha: (a, b) => b.fecha_gasto.localeCompare(a.fecha_gasto) || b.creado_en.localeCompare(a.creado_en),
      };
      items = [...items].sort(sorters[query.orden] || sorters.fecha);

      const total = items.length;
      const limit = Number(query.limite) || total;
      return { status: 200, body: { datos: items.slice(0, limit).map(serializeExpense), total } };
    },
  },
  { method: "GET", path: "/expenses/:id", role: "cliente", handler: ({ user, params }) => ({ status: 200, body: serializeExpense(findOwnExpense(user, params.id)) }) },
  {
    method: "POST", path: "/expenses", role: "cliente",
    handler: ({ user, body }) => {
      validateExpense(body);
      const expense = {
        id: newId("gas"),
        cliente_id: user.id,
        categoria_id: body.categoria_id,
        comercio: String(body.comercio).trim(),
        fecha_gasto: body.fecha_gasto,
        monto: Number(body.monto),
        descripcion: body.descripcion || "",
        origen: body.origen || "manual",
        moneda: "ARS",
        ticket_principal_id: body.ticket_id || null,
        creado_en: nowIso(),
      };
      db.gastos.push(expense);
      persist();
      return { status: 201, body: serializeExpense(expense) };
    },
  },
  {
    method: "PUT", path: "/expenses/:id", role: "cliente",
    handler: ({ user, params, body }) => {
      const expense = findOwnExpense(user, params.id);
      validateExpense(body, { partial: true });
      ["comercio", "fecha_gasto", "categoria_id", "descripcion"].forEach((field) => {
        if (body[field] !== undefined) expense[field] = body[field];
      });
      if (body.monto !== undefined) expense.monto = Number(body.monto);
      expense.actualizado_en = nowIso();
      persist();
      return { status: 200, body: serializeExpense(expense) };
    },
  },
  {
    method: "DELETE", path: "/expenses/:id", role: "cliente",
    handler: ({ user, params }) => {
      const expense = findOwnExpense(user, params.id);
      db.gastos = db.gastos.filter((item) => item.id !== expense.id);
      persist();
      return { status: 204, body: null };
    },
  },
  {
    method: "POST", path: "/tickets/upload", role: "cliente",
    handler: ({ user, body }) => {
      const file = body instanceof FormData ? body.get("archivo") : null;
      if (!file || typeof file === "string") {
        throw new HttpError(422, "VALIDACION", "Falta la imagen del ticket.", { campos: ["archivo"] });
      }
      if (file.type && !file.type.startsWith("image/")) {
        throw new HttpError(422, "VALIDACION", "El archivo debe ser una imagen.", { campos: ["archivo"] });
      }

      const ticket = {
        id: newId("tic"),
        cliente_id: user.id,
        url_archivo: `mock://tickets/${file.name}`,
        nombre_archivo: file.name,
        tipo_mime: file.type || null,
        tamano_bytes: file.size || null,
        estado_procesamiento: "procesado",
        subido_en: nowIso(),
      };
      db.tickets.push(ticket);
      persist();

      return {
        status: 201,
        body: {
          ticket: { id: ticket.id, nombre_archivo: ticket.nombre_archivo, estado_procesamiento: ticket.estado_procesamiento },
          analisis: simulateOcr(file.name),
        },
      };
    },
  },
  {
    method: "GET", path: "/recommendations", role: "cliente",
    handler: ({ user }) => ({
      status: 200,
      body: db.recomendaciones_financieras
        .filter((item) => item.cliente_id === user.id)
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
        .map(serializeRecommendation),
    }),
  },
  {
    method: "PUT", path: "/recommendations/:id/read", role: "cliente",
    handler: ({ user, params }) => {
      const recommendation = db.recomendaciones_financieras.find((item) => item.id === params.id && item.cliente_id === user.id);
      if (!recommendation) {
        throw notFound("Recomendacion");
      }
      if (!recommendation.leida) {
        recommendation.leida = true;
        recommendation.leida_en = nowIso();
        persist();
      }
      return { status: 200, body: serializeRecommendation(recommendation) };
    },
  },
  {
    method: "GET", path: "/recommendations/sent", role: "asesor",
    handler: ({ user, query }) => {
      const items = db.recomendaciones_financieras
        .filter((item) => item.asesor_id === user.id)
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
      const limit = Number(query.limite) || items.length;
      return { status: 200, body: items.slice(0, limit).map(serializeRecommendation) };
    },
  },
  {
    method: "POST", path: "/recommendations", role: "asesor",
    handler: ({ user, body }) => {
      requireFields(body, ["cliente_id", "titulo", "mensaje", "tipo", "prioridad"]);
      assertAssignedClient(user, body.cliente_id);
      if (!["sugerencia", "alerta", "observacion"].includes(body.tipo)) {
        throw new HttpError(422, "VALIDACION", "Tipo de recomendacion invalido.", { campos: ["tipo"] });
      }
      if (!["baja", "media", "alta"].includes(body.prioridad)) {
        throw new HttpError(422, "VALIDACION", "Prioridad invalida.", { campos: ["prioridad"] });
      }

      const recommendation = {
        id: newId("rec"),
        cliente_id: body.cliente_id,
        asesor_id: user.id,
        origen: "asesor",
        tipo: body.tipo,
        titulo: String(body.titulo).trim(),
        mensaje: String(body.mensaje).trim(),
        prioridad: body.prioridad,
        leida: false,
        leida_en: null,
        creado_en: nowIso(),
      };
      db.recomendaciones_financieras.push(recommendation);
      persist();
      return { status: 201, body: serializeRecommendation(recommendation) };
    },
  },
  { method: "GET", path: "/analysis/me", role: "cliente", handler: ({ user }) => ({ status: 200, body: computeClientAnalysis(db, user.id) }) },
  {
    method: "GET", path: "/analysis/clients/:id", role: "asesor",
    handler: ({ user, params }) => {
      assertAssignedClient(user, params.id);
      return { status: 200, body: computeClientAnalysis(db, params.id) };
    },
  },
  { method: "GET", path: "/analysis/advisor/summary", role: "asesor", handler: ({ user }) => ({ status: 200, body: computeAdvisorSummary(db, user.id) }) },
  {
    method: "GET", path: "/clients", role: "asesor",
    handler: ({ user }) => {
      const clientIds = db.asignaciones_de_clientes.filter((item) => item.asesor_id === user.id && item.activo).map((item) => item.cliente_id);
      const clients = db.usuarios.filter((item) => clientIds.includes(item.id));
      return { status: 200, body: clients.map(serializeClientSummary) };
    },
  },
  {
    method: "GET", path: "/clients/:id", role: "asesor",
    handler: ({ user, params }) => {
      assertAssignedClient(user, params.id);
      const client = db.usuarios.find((item) => item.id === params.id);
      if (!client) {
        throw notFound("Cliente");
      }
      return { status: 200, body: { ...serializeClientSummary(client), usuario: serializeUser(client) } };
    },
  },
];

function matchRoute(method, path) {
  const pathParts = path.split("/").filter(Boolean);

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const routeParts = route.path.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) {
      continue;
    }

    const params = {};
    const matches = routeParts.every((part, index) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(pathParts[index]);
        return true;
      }
      return part === pathParts[index];
    });

    if (matches) {
      return { route, params };
    }
  }

  return null;
}

/**
 * Atiende un pedido con la misma semántica HTTP que el backend real.
 * @returns {Promise<{status:number, body:any}>}
 */
export async function handleMockRequest({ method, path, query = {}, body = null, token = null }) {
  try {
    const match = matchRoute(method, path);
    if (!match) {
      throw new HttpError(404, "RUTA_INEXISTENTE", `No existe ${method} ${path}.`);
    }

    const { route, params } = match;
    let user = null;

    if (route.auth !== false) {
      const userId = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
      user = db.usuarios.find((item) => item.id === userId) || null;
      if (!user) {
        throw new HttpError(401, "NO_AUTENTICADO", "La sesion no es valida o expiro.");
      }
      if (route.role && user.rol !== route.role) {
        throw new HttpError(403, "PROHIBIDO", "No tenes permiso para esta accion.");
      }
    }

    // Copia para que el llamador no comparta referencias con la "base".
    const result = route.handler({ user, params, query, body });
    return { status: result.status, body: result.body === null ? null : JSON.parse(JSON.stringify(result.body)) };
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: { error: true, mensaje: error.message, codigo: error.codigo, detalles: error.detalles } };
    }
    return { status: 500, body: { error: true, mensaje: "Error interno del servidor simulado.", codigo: "ERROR_INTERNO", detalles: null } };
  }
}
