/** Servicio del front para la cartera del asesor; traduce las respuestas con adapters.js. */
import { apiClient } from "../core/APIClient.js";
import { toClientSummary, toExpense, toExpenseQuery, toSpendingProfile, toUser } from "./adapters.js";

/**
 * Clientes asignados al asesor: GET /clients, GET /clients/:id, GET /clients/:id/expenses y
 * PUT/DELETE /clients/:id/spending-profile (perfil elegido por el asesor).
 */
export const clientsService = {
  /** Clientes asignados, por nombre. */
  async list() {
    return (await apiClient.get("/clients")).map(toClientSummary);
  },

  /** Resumen del cliente y su `user` completo (403 si no está asignado). */
  async get(clientId) {
    const response = await apiClient.get(`/clients/${encodeURIComponent(clientId)}`);
    return { ...toClientSummary(response), user: toUser(response.usuario) };
  },

  /**
   * Gastos de un cliente asignado (mismos filtros que expensesService.list).
   * @returns {Promise<{items: object[], total: number}>}
   */
  async listExpenses(clientId, filters = {}) {
    const response = await apiClient.get(`/clients/${encodeURIComponent(clientId)}/expenses`, { query: toExpenseQuery(filters) });
    return { items: response.datos.map(toExpense), total: response.total };
  },

  /**
   * El asesor elige el perfil de gasto del cliente; la regla automática deja de pisarlo.
   * @param {string} clientId
   * @param {{profileId: string, reason?: string}} choice
   * @returns {Promise<object|null>} perfil vigente (origin "asesor")
   */
  async assignSpendingProfile(clientId, { profileId, reason = "" }) {
    const response = await apiClient.put(`/clients/${encodeURIComponent(clientId)}/spending-profile`, {
      perfil_id: profileId,
      motivo: reason.trim() || null,
    });
    return toSpendingProfile(response.perfil_de_gasto);
  },

  /**
   * Vuelve al perfil que sugiere el sistema.
   * @returns {Promise<object|null>} perfil vigente (origin "sistema"), o null si no hay gastos
   */
  async resetSpendingProfile(clientId) {
    const response = await apiClient.delete(`/clients/${encodeURIComponent(clientId)}/spending-profile`);
    return toSpendingProfile(response.perfil_de_gasto);
  },
};
