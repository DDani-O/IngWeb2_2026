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
  /**
   * Inicializa el gestor de autenticacion como singleton.
   */
  constructor() {
    if (AuthManager.instance) {
      return AuthManager.instance;
    }

    this.currentUser = null;
    this.token = null;

    AuthManager.instance = this;
  }

  /**
   * Carga sesion persistida desde localStorage al arrancar la app.
   */
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

  /**
   * Valida credenciales contra datos mock y crea sesion activa.
   * Puede reemplazarse por llamada real a backend sin cambiar consumidores.
   */
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

  /**
   * Registra un usuario nuevo en flujo mock y lo autentica automaticamente.
   */
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

  /**
   * Cierra sesion, limpia almacenamiento y opcionalmente emite evento.
   */
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

  /**
   * Indica si existe una sesion activa valida en memoria.
   */
  isAuthenticated() {
    return Boolean(this.currentUser && this.token);
  }

  /**
   * Verifica si el usuario actual coincide con un rol esperado.
   */
  hasRole(role) {
    return this.currentUser?.role === role;
  }

  /**
   * Retorna el usuario actual autenticado.
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Retorna el rol actual o null si no hay sesion.
   */
  getCurrentRole() {
    return this.currentUser?.role || null;
  }

  /**
   * Devuelve ruta inicial recomendada segun rol.
   */
  getDefaultRouteForRole(role) {
    return role === "asesor" ? ROUTES.ADVISOR_DASHBOARD : ROUTES.USER_DASHBOARD;
  }

  /**
   * Persiste token/usuario y sincroniza estado global autenticado.
   */
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

  /**
   * Devuelve la instancia unica global del AuthManager.
   */
  static getInstance() {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }

    return AuthManager.instance;
  }
}

export const authManager = AuthManager.getInstance();
