import { apiClient } from "../core/APIClient.js";
import { toClientSummary, toUser } from "./adapters.js";

/**
 * Clientes asignados al asesor: GET /clients y GET /clients/:id.
 */
export const clientsService = {
  async list() {
    return (await apiClient.get("/clients")).map(toClientSummary);
  },

  async get(clientId) {
    const response = await apiClient.get(`/clients/${encodeURIComponent(clientId)}`);
    return { ...toClientSummary(response), user: toUser(response.usuario) };
  },
};
