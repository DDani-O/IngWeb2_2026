import { apiClient } from "../core/APIClient.js";
import { toRegisterPayload, toSession, toUser } from "./adapters.js";

/**
 * Autenticación: POST /auth/login, POST /auth/register, GET /auth/me.
 * Devuelve { token, user } con el modelo de la UI. La sesión la persiste AuthManager.
 */
export const authService = {
  async login({ email, password }) {
    return toSession(await apiClient.post("/auth/login", { email, password }));
  },

  async register(form) {
    return toSession(await apiClient.post("/auth/register", toRegisterPayload(form)));
  },

  async me() {
    return toUser(await apiClient.get("/auth/me"));
  },
};
