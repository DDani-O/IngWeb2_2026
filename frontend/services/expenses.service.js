import { apiClient } from "../core/APIClient.js";
import { eventBus } from "../core/EventBus.js";
import { EVENTS } from "../utils/constants.js";
import { toExpense, toExpensePayload, toExpenseQuery } from "./adapters.js";

/**
 * CRUD de gastos del cliente: GET/POST /expenses, GET/PUT/DELETE /expenses/:id.
 * Las escrituras emiten expense:created/updated/deleted en el EventBus.
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
    const created = toExpense(await apiClient.post("/expenses", toExpensePayload(expense)));
    eventBus.emit(EVENTS.EXPENSE.CREATED, { expense: created });
    return created;
  },

  async update(id, expense) {
    const updated = toExpense(await apiClient.put(`/expenses/${encodeURIComponent(id)}`, toExpensePayload(expense)));
    eventBus.emit(EVENTS.EXPENSE.UPDATED, { expense: updated });
    return updated;
  },

  async remove(id) {
    await apiClient.delete(`/expenses/${encodeURIComponent(id)}`);
    eventBus.emit(EVENTS.EXPENSE.DELETED, { id });
  },
};
