import { apiClient } from "../core/APIClient.js";
import { eventBus } from "../core/EventBus.js";
import { EVENTS } from "../utils/constants.js";
import { toRecommendation, toRecommendationPayload } from "./adapters.js";

/**
 * Recomendaciones financieras.
 * Cliente: GET /recommendations, PUT /recommendations/:id/read.
 * Asesor: GET /recommendations/sent, POST /recommendations.
 */
export const recommendationsService = {
  async listMine() {
    return (await apiClient.get("/recommendations")).map(toRecommendation);
  },

  async markAsRead(id) {
    const recommendation = toRecommendation(await apiClient.put(`/recommendations/${encodeURIComponent(id)}/read`));
    eventBus.emit(EVENTS.RECOMMENDATION.READ, { recommendation });
    return recommendation;
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
    const created = toRecommendation(await apiClient.post("/recommendations", toRecommendationPayload(recommendation)));
    eventBus.emit(EVENTS.RECOMMENDATION.CREATED, { recommendation: created });
    return created;
  },
};
