import {
  EVENTS,
  MOCK_AUTH_USERS,
  ROUTES,
  STORAGE_KEYS,
  UI_TIMING,
} from "../utils/constants.js";
import { sleep } from "../utils/helpers.js";
import { stateManager } from "./StateManager.js";
import { eventBus } from "./EventBus.js";

export class AuthManager {
  constructor() {
    if (AuthManager.instance) {
      return AuthManager.instance;
    }

    this.currentUser = null;
    this.token = null;

    AuthManager.instance = this;
  }

  init() {
    const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!storedUser || !storedToken) {
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      this.currentUser = parsed;
      this.token = storedToken;

      stateManager.patch({
        user: parsed,
        role: parsed.role,
        isAuthenticated: true,
      });
    } catch {
      this.logout({ emitEvent: false });
    }
  }

  async login(credentials) {
    await sleep(UI_TIMING.AUTH_LOGIN_DELAY_MS);

    const match = MOCK_AUTH_USERS.find((user) => {
      return (
        user.email.toLowerCase() === String(credentials.email).toLowerCase() &&
        user.password === credentials.password
      );
    });

    if (!match) {
      throw new Error("Email o contrasena invalida.");
    }

    const user = {
      id: match.id,
      role: match.role,
      fullName: match.fullName,
      email: match.email,
      profile: match.profile,
    };

    const token = `mock-token-${user.id}-${Date.now()}`;
    this._persistSession(user, token);

    eventBus.emit(EVENTS.AUTH.LOGIN, { user });
    return user;
  }

  async register(payload) {
    await sleep(UI_TIMING.AUTH_REGISTER_DELAY_MS);

    const existing = MOCK_AUTH_USERS.find((user) => {
      return user.email.toLowerCase() === String(payload.email).toLowerCase();
    });

    if (existing) {
      throw new Error("El email ya se encuentra registrado.");
    }

    const role = payload.role === "asesor" ? "asesor" : "usuario";
    const user = {
      id: `new-${Date.now()}`,
      role,
      fullName: payload.fullName,
      email: payload.email,
      profile: role === "asesor" ? "Asesor" : "Equilibrista",
    };

    const token = `mock-token-${user.id}`;

    this._persistSession(user, token);
    eventBus.emit(EVENTS.AUTH.REGISTER, { user });
    return user;
  }

  logout({ emitEvent = true } = {}) {
    this.currentUser = null;
    this.token = null;

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);

    stateManager.patch({
      user: null,
      role: null,
      isAuthenticated: false,
    });

    if (emitEvent) {
      eventBus.emit(EVENTS.AUTH.LOGOUT, {});
    }
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.token);
  }

  hasRole(role) {
    return this.currentUser?.role === role;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentRole() {
    return this.currentUser?.role || null;
  }

  getDefaultRouteForRole(role) {
    return role === "asesor" ? ROUTES.ADVISOR_DASHBOARD : ROUTES.USER_DASHBOARD;
  }

  _persistSession(user, token) {
    this.currentUser = user;
    this.token = token;

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));

    stateManager.patch({
      user,
      role: user.role,
      isAuthenticated: true,
    });
  }

  static getInstance() {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }

    return AuthManager.instance;
  }
}

export const authManager = AuthManager.getInstance();
