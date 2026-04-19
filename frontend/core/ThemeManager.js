import { APP_CONFIG, EVENTS, STORAGE_KEYS } from "../utils/constants.js";
import { eventBus } from "./EventBus.js";

export class ThemeManager {
  /**
   * Crea el gestor de tema global como singleton.
   */
  constructor() {
    if (ThemeManager.instance) {
      return ThemeManager.instance;
    }

    this.theme = APP_CONFIG.DEFAULT_THEME;
    ThemeManager.instance = this;
  }

  /**
   * Inicializa el tema desde almacenamiento local o valor por defecto.
   */
  init() {
    const savedTheme =
      localStorage.getItem(STORAGE_KEYS.APP_THEME) || APP_CONFIG.DEFAULT_THEME;

    this.setTheme(savedTheme, { persist: false });
  }

  /**
   * Retorna el tema actualmente activo.
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Aplica tema en DOM, lo persiste opcionalmente y emite evento de cambio.
   */
  setTheme(theme, { persist = true } = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";
    this.theme = nextTheme;

    document.documentElement.setAttribute("data-theme", nextTheme);

    if (persist) {
      localStorage.setItem(STORAGE_KEYS.APP_THEME, nextTheme);
    }

    eventBus.emit(EVENTS.THEME.CHANGED, { theme: nextTheme });
  }

  /**
   * Alterna entre tema oscuro y claro.
   */
  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }

  /**
   * Devuelve la instancia unica global del ThemeManager.
   */
  static getInstance() {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }

    return ThemeManager.instance;
  }
}

export const themeManager = ThemeManager.getInstance();
