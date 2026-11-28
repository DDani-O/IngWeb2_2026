/**
 * adapters.js - Única capa de traducción entre la API (en español, igual que la BD)
 * y el modelo que usan las páginas (identificadores en inglés).
 *
 * Si el contrato del backend cambia, se ajusta acá y no en las páginas.
 */

const dateOnly = (value) => (value ? String(value).slice(0, 10) : null);

// ---------- Usuarios ----------

export function toUser(apiUser) {
  if (!apiUser) {
    return null;
  }

  const user = {
    id: apiUser.id,
    email: apiUser.email,
    role: apiUser.rol,
    fullName: apiUser.nombre_completo,
    bio: apiUser.biografia || "",
    photoUrl: apiUser.foto_perfil_url || null,
    status: apiUser.estado,
    createdAt: apiUser.creado_en,
  };

  if (apiUser.perfil_cliente) {
    const profile = apiUser.perfil_cliente;
    user.client = {
      occupation: profile.ocupacion || "",
      estimatedIncome: profile.ingreso_estimado ?? null,
      financialGoal: profile.objetivo_financiero || "",
      spendingProfile: toSpendingProfile(profile.perfil_de_gasto),
      advisor: profile.asesor ? { id: profile.asesor.id, fullName: profile.asesor.nombre_completo } : null,
    };
  }

  if (apiUser.perfil_asesor) {
    const profile = apiUser.perfil_asesor;
    user.advisor = {
      licenseNumber: profile.matricula || "",
      specialty: profile.especialidad || "",
      description: profile.descripcion || "",
      assignedClients: profile.clientes_asignados ?? 0,
    };
  }

  return user;
}

export function toSession(apiSession) {
  return { token: apiSession.token, user: toUser(apiSession.usuario) };
}

export function toRegisterPayload(form) {
  const payload = {
    nombre_completo: form.fullName,
    email: form.email,
    password: form.password,
    rol: form.role,
  };

  if (form.role === "asesor") {
    payload.matricula = form.licenseNumber;
    payload.especialidad = form.specialty;
  }

  return payload;
}

export function toProfilePayload(profile, role) {
  const payload = { nombre_completo: profile.fullName, biografia: profile.bio || "" };

  if (role === "asesor") {
    return {
      ...payload,
      matricula: profile.licenseNumber,
      especialidad: profile.specialty,
      descripcion: profile.description || "",
    };
  }

  return {
    ...payload,
    ocupacion: profile.occupation || "",
    ingreso_estimado: profile.estimatedIncome === "" || profile.estimatedIncome === null ? null : Number(profile.estimatedIncome),
    objetivo_financiero: profile.financialGoal || "",
  };
}

// ---------- Catálogos ----------

export function toCategory(apiCategory) {
  return { id: apiCategory.id, name: apiCategory.nombre, icon: apiCategory.icono || "" };
}

/**
 * Perfil de gasto. En el perfil vigente de un cliente llegan además `origen` ("sistema"
 * o "asesor") y `motivo`; en el catálogo, no (quedan en null).
 */
export function toSpendingProfile(apiProfile) {
  if (!apiProfile) {
    return null;
  }
  return {
    id: apiProfile.id,
    name: apiProfile.nombre,
    description: apiProfile.descripcion || "",
    origin: apiProfile.origen || null,
    reason: apiProfile.motivo ?? null,
  };
}

// ---------- Gastos y tickets ----------

export function toExpense(apiExpense) {
  return {
    id: apiExpense.id,
    merchant: apiExpense.comercio,
    date: apiExpense.fecha_gasto,
    amount: Number(apiExpense.monto),
    description: apiExpense.descripcion || "",
    categoryId: apiExpense.categoria?.id || null,
    category: apiExpense.categoria?.nombre || "Sin categoria",
    origin: apiExpense.origen,
    currency: apiExpense.moneda,
    ticketId: apiExpense.ticket_principal_id || null,
    createdAt: apiExpense.creado_en,
  };
}

export function toExpensePayload(expense) {
  const payload = {
    comercio: expense.merchant,
    fecha_gasto: expense.date,
    monto: Number(expense.amount),
    categoria_id: expense.categoryId,
    descripcion: expense.description || "",
  };

  if (expense.origin) {
    payload.origen = expense.origin;
  }
  if (expense.ticketId) {
    payload.ticket_id = expense.ticketId;
  }

  return payload;
}

export function toExpenseQuery(filters = {}) {
  return {
    busqueda: filters.search,
    categoria_id: filters.categoryId,
    origen: filters.origin,
    desde: filters.from,
    hasta: filters.to,
    orden: filters.sort,
    limite: filters.limit,
  };
}

export function toTicketAnalysis(apiResult) {
  const analysis = apiResult.analisis || {};
  return {
    ticketId: apiResult.ticket?.id || null,
    fileName: apiResult.ticket?.nombre_archivo || "",
    // false si la IA no pudo leer la imagen (analisis: null): el ticket queda guardado igual.
    recognized: Boolean(apiResult.analisis),
    merchant: analysis.comercio_detectado || "",
    date: analysis.fecha_detectada || "",
    amount: analysis.monto_detectado ?? null,
    categoryId: analysis.categoria_sugerida?.id || "",
    categoryName: analysis.categoria_sugerida?.nombre || "",
    confidence: analysis.confianza_general ?? null,
  };
}

// ---------- Recomendaciones ----------

export function toRecommendation(apiRecommendation) {
  return {
    id: apiRecommendation.id,
    title: apiRecommendation.titulo,
    message: apiRecommendation.mensaje,
    type: apiRecommendation.tipo,
    priority: apiRecommendation.prioridad,
    origin: apiRecommendation.origen,
    advisorName: apiRecommendation.asesor?.nombre_completo || null,
    clientId: apiRecommendation.cliente?.id || null,
    clientName: apiRecommendation.cliente?.nombre_completo || null,
    read: Boolean(apiRecommendation.leida),
    readAt: apiRecommendation.leida_en || null,
    date: dateOnly(apiRecommendation.creado_en),
  };
}

export function toRecommendationPayload(recommendation) {
  return {
    cliente_id: recommendation.clientId,
    titulo: recommendation.title,
    mensaje: recommendation.message,
    tipo: recommendation.type,
    prioridad: recommendation.priority,
  };
}

// ---------- Análisis ----------

export function toClientAnalysis(api) {
  return {
    clientId: api.cliente_id,
    period: { from: api.periodo?.desde || null, to: api.periodo?.hasta || null },
    totalThisMonth: api.gasto_mes_actual,
    previousMonthToDate: api.gasto_mes_anterior_a_la_fecha,
    changeVsPreviousMonth: api.variacion_mes_anterior,
    monthlyAverage: api.gasto_promedio_mensual,
    expenseCount: api.cantidad_gastos,
    dominantCategory: api.categoria_dominante
      ? { id: api.categoria_dominante.id, name: api.categoria_dominante.nombre, percentage: api.categoria_dominante.porcentaje }
      : null,
    mostFrequentMerchant: api.comercio_mas_frecuente
      ? { merchant: api.comercio_mas_frecuente.comercio, count: api.comercio_mas_frecuente.cantidad }
      : null,
    peakWeekday: api.dia_mayor_gasto,
    byCategory: (api.gastos_por_categoria || []).map((item) => ({
      categoryId: item.categoria_id,
      category: item.categoria,
      amount: item.monto,
      percentage: item.porcentaje,
    })),
    byMonth: (api.gastos_por_mes || []).map((item) => ({ month: item.mes, amount: item.monto })),
    byMonthCategory: (api.gastos_por_mes_y_categoria || []).map((item) => ({ month: item.mes, category: item.categoria, amount: item.monto })),
    byDay: (api.gastos_por_dia || []).map((item) => ({ date: item.fecha, amount: item.monto })),
    merchantRanking: (api.ranking_comercios || []).map((item) => ({ merchant: item.comercio, amount: item.monto, count: item.cantidad })),
    unusualExpenses: (api.gastos_inusuales || []).map((item) => ({
      expenseId: item.gasto_id,
      merchant: item.comercio,
      category: item.categoria,
      date: item.fecha_gasto,
      amount: item.monto,
      categoryAverage: item.promedio_categoria,
      deviationPercent: item.desvio_porcentaje,
    })),
    alerts: (api.alertas || []).map(toAlert),
    spendingProfile: toSpendingProfile(api.perfil_de_gasto),
    suggestedProfile: toSpendingProfile(api.perfil_sugerido),
    riskLevel: api.nivel_riesgo,
    lastExpenseDate: api.ultimo_gasto_fecha || null,
  };
}

export function toAlert(apiAlert) {
  return { level: apiAlert.nivel, title: apiAlert.titulo, description: apiAlert.descripcion };
}

export function toClientSummary(api) {
  return {
    id: api.id,
    fullName: api.nombre_completo,
    email: api.email,
    status: api.estado,
    spendingProfile: toSpendingProfile(api.perfil_de_gasto),
    monthlyAverage: api.gasto_promedio_mensual,
    totalThisMonth: api.gasto_mes_actual,
    changePercent: api.variacion_mes_anterior,
    lastExpenseDate: api.ultimo_gasto_fecha,
    unusualCount: api.gastos_inusuales,
    riskLevel: api.nivel_riesgo,
  };
}

export function toAdvisorSummary(api) {
  return {
    activeClients: api.clientes_activos,
    clientsWithAlerts: api.clientes_con_alertas,
    sentRecommendations: api.recomendaciones_enviadas,
    readRecommendations: api.recomendaciones_leidas,
    alerts: (api.alertas || []).map(toAlert),
    profileDistribution: (api.distribucion_por_perfil || []).map((item) => ({ profile: item.perfil, count: item.cantidad })),
    spendByProfile: (api.gasto_por_perfil || []).map((item) => ({ profile: item.perfil, amount: item.monto })),
    monthlyActivity: (api.actividad_mensual || []).map((item) => ({ month: item.mes, activeClients: item.clientes_activos })),
  };
}
