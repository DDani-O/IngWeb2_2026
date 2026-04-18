import { APP_CONFIG, EVENTS, STORAGE_KEYS } from "../utils/constants.js";
import { eventBus } from "./EventBus.js";

export class ThemeManager {
  constructor() {
    if (ThemeManager.instance) {
      return ThemeManager.instance;
    }

    this.theme = APP_CONFIG.DEFAULT_THEME;
    ThemeManager.instance = this;
  }

  init() {
    const savedTheme =
      localStorage.getItem(STORAGE_KEYS.APP_THEME) || APP_CONFIG.DEFAULT_THEME;

    this.setTheme(savedTheme, { persist: false });
  }

  getTheme() {
    return this.theme;
  }

  setTheme(theme, { persist = true } = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";
    this.theme = nextTheme;

    document.documentElement.setAttribute("data-theme", nextTheme);

    if (persist) {
      localStorage.setItem(STORAGE_KEYS.APP_THEME, nextTheme);
    }

    eventBus.emit(EVENTS.THEME.CHANGED, { theme: nextTheme });
  }

  toggleTheme() {
    this.setTheme(this.theme === "dark" ? "light" : "dark");
  }

  static getInstance() {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }

    return ThemeManager.instance;
  }
}

export const themeManager = ThemeManager.getInstance();
