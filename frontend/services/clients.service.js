import { apiClient } from "../core/APIClient.js";
import { toClientSummary, toExpense, toExpenseQuery, toUser } from "./adapters.js";

/**
 * Clientes asignados al asesor: GET /clients, GET /clients/:id y GET /clients/:id/expenses.
 */
export const clientsService = {
  async list() {
    return (await apiClient.get("/clients")).map(toClientSummary);
  },

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
};
