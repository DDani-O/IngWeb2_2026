/** Servicio del front para la autenticación; traduce las respuestas con adapters.js. */
import { apiClient } from "../core/APIClient.js";
import { toRegisterPayload, toSession, toUser } from "./adapters.js";

/**
 * Autenticación: POST /auth/login, POST /auth/register, GET /auth/me.
 * Devuelve { token, user } con el modelo de la UI. La sesión la persiste AuthManager.
 */
export const authService = {
  /** @returns {Promise<{token: string, user: object}>} */
  async login({ email, password }) {
    return toSession(await apiClient.post("/auth/login", { email, password }));
  },

  /** Crea la cuenta y deja la sesión iniciada. @returns {Promise<{token: string, user: object}>} */
  async register(form) {
    return toSession(await apiClient.post("/auth/register", toRegisterPayload(form)));
  },

  /** Usuario de la sesión actual. */
  async me() {
    return toUser(await apiClient.get("/auth/me"));
  },
};
