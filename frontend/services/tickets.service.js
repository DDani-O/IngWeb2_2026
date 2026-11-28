/** Servicio del front para la carga de tickets; traduce las respuestas con adapters.js. */
import { apiClient } from "../core/APIClient.js";
import { API_CONFIG } from "../utils/constants.js";
import { toTicketAnalysis } from "./adapters.js";

/**
 * Carga de tickets: POST /tickets/upload (multipart, campo "archivo").
 * El backend guarda la imagen, la manda al servicio de OCR/IA y devuelve los datos detectados.
 * Si la IA no puede leerla responde igual, con `recognized: false` y los datos vacíos.
 */
export const ticketsService = {
  /**
   * @param {File} file
   * @returns {Promise<{ticketId, fileName, recognized, merchant, date, amount, categoryId, categoryName, confidence}>}
   */
  async upload(file) {
    const formData = new FormData();
    formData.append("archivo", file);
    return toTicketAnalysis(await apiClient.post("/tickets/upload", formData, { timeoutMs: API_CONFIG.UPLOAD_TIMEOUT_MS }));
  },
};
