import { UI_TIMING } from "../../utils/constants.js";

/**
 * Servicio Toast: avisos breves en un contenedor con aria-live.
 * @param {HTMLElement|null} container
 * @returns {(message: string, tone?: "success"|"warning"|"danger") => void}
 */
export function createToaster(container) {
  return function showToast(message, tone = "success") {
    if (!container) {
      return;
    }

    const toast = document.createElement("article");
    toast.className = `app-toast app-toast--${tone}`;
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");
    toast.textContent = message;
    container.appendChild(toast);

    window.setTimeout(() => toast.remove(), UI_TIMING.TOAST_DISMISS_MS);
  };
}
