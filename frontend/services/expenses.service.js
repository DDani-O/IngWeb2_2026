/** Servicio del front para los gastos; traduce las respuestas con adapters.js. */
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

  /** Un gasto propio (404 si no existe o es de otro cliente). */
  async get(id) {
    return toExpense(await apiClient.get(`/expenses/${encodeURIComponent(id)}`));
  },

  /** Alta de un gasto; con `ticketId`, queda vinculado al ticket. */
  async create(expense) {
    return toExpense(await apiClient.post("/expenses", toExpensePayload(expense)));
  },

  /** Edición parcial (también cambia la categoría). */
  async update(id, expense) {
    return toExpense(await apiClient.put(`/expenses/${encodeURIComponent(id)}`, toExpensePayload(expense)));
  },

  /** Baja de un gasto propio. */
  async remove(id) {
    await apiClient.delete(`/expenses/${encodeURIComponent(id)}`);
  },
};
