/** Servicio del front para las categorías de gasto; traduce las respuestas con adapters.js. */
import { apiClient } from "../core/APIClient.js";
import { toCategory } from "./adapters.js";

let cache = null;

/**
 * Categorías de gasto (GET /categories). Cambian muy poco, así que se cachean en memoria.
 */
export const categoriesService = {
  /**
   * Si el pedido falla, se borra la caché para que el próximo reintente.
   * @returns {Promise<{id: string, name: string, icon: string}[]>}
   */
  async list() {
    if (!cache) {
      cache = apiClient.get("/categories").then((items) => items.map(toCategory));
      cache.catch(() => {
        cache = null;
      });
    }
    return cache;
  },
};
