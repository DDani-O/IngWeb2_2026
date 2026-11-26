import { UI_TIMING } from "../../utils/constants.js";

/**
 * Servicio Toast: avisos breves en un contenedor con aria-live.
 * @param {HTMLElement|null} container
 * @returns {(message: string, tone?: "success"|"warning"|"danger", options?: {persistent?: boolean}) => () => void}
 *   Devuelve una función que cierra el aviso (útil para los persistentes).
 */
export function createToaster(container) {
  return function showToast(message, tone = "success", { persistent = false } = {}) {
    if (!container) {
      return () => {};
    }

    const toast = document.createElement("article");
    toast.className = `app-toast app-toast--${tone}`;
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");
    toast.textContent = message;
    container.appendChild(toast);

    if (!persistent) {
      window.setTimeout(() => toast.remove(), UI_TIMING.TOAST_DISMISS_MS);
    }
    return () => toast.remove();
  };
}
