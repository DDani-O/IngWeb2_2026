import { apiClient } from "../core/APIClient.js";
import { eventBus } from "../core/EventBus.js";
import { EVENTS } from "../utils/constants.js";
import { toProfilePayload, toSpendingProfile, toUser } from "./adapters.js";

/**
 * Perfil de cuenta (cliente o asesor) y catálogo de perfiles de gasto.
 */
export const profileService = {
  /** Datos completos del usuario autenticado (incluye perfil de gasto asignado por el sistema). */
  async getMine() {
    return toUser(await apiClient.get("/auth/me"));
  },

  /**
   * PUT /auth/profile. Emite profile:updated con el usuario actualizado.
   * @param {object} profile campos del formulario (modelo UI)
   * @param {"cliente"|"asesor"} role
   */
  async update(profile, role) {
    const user = toUser(await apiClient.put("/auth/profile", toProfilePayload(profile, role)));
    eventBus.emit(EVENTS.PROFILE.UPDATED, { user });
    return user;
  },

  /** GET /spending-profiles: catálogo de perfiles de gasto. */
  async listSpendingProfiles() {
    return (await apiClient.get("/spending-profiles")).map(toSpendingProfile);
  },
};
