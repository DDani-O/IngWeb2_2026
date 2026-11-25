import { apiClient } from "../core/APIClient.js";
import { toTicketAnalysis } from "./adapters.js";

/**
 * Carga de tickets: POST /tickets/upload (multipart, campo "archivo").
 * El backend guarda la imagen, la manda al servicio de OCR/IA y devuelve los datos detectados.
 */
export const ticketsService = {
  /**
   * @param {File} file
   * @returns {Promise<{ticketId, fileName, merchant, date, amount, categoryId, categoryName, confidence}>}
   */
  async upload(file) {
    const formData = new FormData();
    formData.append("archivo", file);
    return toTicketAnalysis(await apiClient.post("/tickets/upload", formData));
  },
};
