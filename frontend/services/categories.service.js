import { apiClient } from "../core/APIClient.js";
import { toCategory } from "./adapters.js";

let cache = null;

/**
 * Categorías de gasto (GET /categories). Cambian muy poco, así que se cachean en memoria.
 */
export const categoriesService = {
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
