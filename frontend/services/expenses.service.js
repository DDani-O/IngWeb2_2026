import { apiClient } from "../core/APIClient.js";
import { toExpense, toExpensePayload, toExpenseQuery } from "./adapters.js";

/**
 * CRUD de gastos del cliente: GET/POST /expenses, GET/PUT/DELETE /expenses/:id.
 */
export const expensesService = {
  /**
   * @param {{search?, categoryId?, origin?, from?, to?, sort?: "fecha"|"monto_desc"|"monto_asc", limit?}} filters
   * @returns {Promise<{items: object[], total: number}>}
   */
  async list(filters = {}) {
    const response = await apiClient.get("/expenses", { query: toExpenseQuery(filters) });
    return { items: response.datos.map(toExpense), total: response.total };
  },

  async get(id) {
    return toExpense(await apiClient.get(`/expenses/${encodeURIComponent(id)}`));
  },

  async create(expense) {
    return toExpense(await apiClient.post("/expenses", toExpensePayload(expense)));
  },

  async update(id, expense) {
    return toExpense(await apiClient.put(`/expenses/${encodeURIComponent(id)}`, toExpensePayload(expense)));
  },

  async remove(id) {
    await apiClient.delete(`/expenses/${encodeURIComponent(id)}`);
  },
};
