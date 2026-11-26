import { apiClient } from "../core/APIClient.js";
import { toAdvisorSummary, toClientAnalysis } from "./adapters.js";

/**
 * Análisis de consumo (consigna §4.5): calculado por el backend.
 * Cliente: GET /analysis/me. Asesor: GET /analysis/clients/:id y GET /analysis/advisor/summary.
 */
export const analysisService = {
  async getMine() {
    return toClientAnalysis(await apiClient.get("/analysis/me"));
  },

  async getForClient(clientId) {
    return toClientAnalysis(await apiClient.get(`/analysis/clients/${encodeURIComponent(clientId)}`));
  },

  async getAdvisorSummary() {
    return toAdvisorSummary(await apiClient.get("/analysis/advisor/summary"));
  },
};
