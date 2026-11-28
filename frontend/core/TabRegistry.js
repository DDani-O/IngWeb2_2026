import { STORAGE_KEYS, UI_TIMING } from "../utils/constants.js";

/**
 * TabRegistry - Registro de pestañas abiertas de la app (frontend/README.md §2).
 *
 * Criterio de uso: desde el dashboard, los links a secciones de detalle o análisis
 * (patrones, historial, recomendaciones, perfiles) abren en pestaña nueva
 * (target="_blank"); la navegación principal (sidebar, botones de acción) queda en la misma.
 * Cuando el usuario quiere "volver al dashboard" desde una pestaña secundaria y el
 * dashboard ya está abierto en otra, esta pestaña se cierra en lugar de duplicarlo.
 *
 * Cada pestaña guarda su ruta actual en localStorage; el id de la pestaña vive en sessionStorage.
 */
export class TabRegistry {
  constructor() {
    this.tabId = this._getOrCreateTabId();
    this._unregister = this._unregister.bind(this);
  }

  /**
   * Empieza a registrar la pestaña actual y la da de baja al cerrarse.
   * @param {{onChange: (listener: (to: {path: string}) => void) => void}} router
   */
  start(router) {
    window.addEventListener("beforeunload", this._unregister);
    router.onChange((to) => this._register(to.path));
  }

  /**
   * Indica si la ruta está abierta en otra pestaña de la app.
   * @param {string} path
   */
  isOpenInOtherTab(path) {
    return Object.entries(this._read()).some(([tabId, tab]) => tabId !== this.tabId && tab?.path === path);
  }

  /**
   * Vuelve a `path`: si ya está abierta en otra pestaña cierra esta; si no (o si el
   * navegador no permite cerrarla), navega en el lugar.
   * @param {string} path
   * @param {(path: string) => void} navigate
   */
  returnTo(path, navigate) {
    if (!this.isOpenInOtherTab(path)) {
      navigate(path);
      return;
    }

    window.close();
    // window.close() solo funciona si la pestaña la abrió un link y no tiene historial propio.
    window.setTimeout(() => {
      if (!window.closed) {
        navigate(path);
      }
    }, UI_TIMING.TAB_CLOSE_FALLBACK_MS);
  }

  _register(path) {
    const registry = this._read();
    registry[this.tabId] = { path, updatedAt: Date.now() };
    this._write(registry);
  }

  _unregister() {
    const registry = this._read();
    delete registry[this.tabId];
    this._write(registry);
  }

  _read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAB_REGISTRY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  _write(registry) {
    localStorage.setItem(STORAGE_KEYS.TAB_REGISTRY, JSON.stringify(registry));
  }

  _getOrCreateTabId() {
    const existing = sessionStorage.getItem(STORAGE_KEYS.TAB_ID);
    if (existing) {
      return existing;
    }

    const generated = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEYS.TAB_ID, generated);
    return generated;
  }
}

export const tabRegistry = new TabRegistry();
