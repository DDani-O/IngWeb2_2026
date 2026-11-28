/** Servicio del front para las recomendaciones; traduce las respuestas con adapters.js. */
import { apiClient } from "../core/APIClient.js";
import { toRecommendation, toRecommendationPayload } from "./adapters.js";

/**
 * Recomendaciones financieras.
 * Cliente: GET /recommendations, PUT /recommendations/:id/read.
 * Asesor: GET /recommendations/sent, POST /recommendations.
 */
export const recommendationsService = {
  /** Recomendaciones recibidas por el cliente. */
  async listMine() {
    return (await apiClient.get("/recommendations")).map(toRecommendation);
  },

  /** La marca como leída y devuelve la recomendación actualizada. */
  async markAsRead(id) {
    return toRecommendation(await apiClient.put(`/recommendations/${encodeURIComponent(id)}/read`));
  },

  /**
   * @param {{limit?: number, clientId?: string}} options `clientId` filtra las enviadas a ese cliente
   */
  async listSent({ limit, clientId } = {}) {
    return (await apiClient.get("/recommendations/sent", { query: { limite: limit, cliente_id: clientId } })).map(toRecommendation);
  },

  /**
   * @param {{clientId, title, message, type, priority}} recommendation
   */
  async create(recommendation) {
    return toRecommendation(await apiClient.post("/recommendations", toRecommendationPayload(recommendation)));
  },
};
