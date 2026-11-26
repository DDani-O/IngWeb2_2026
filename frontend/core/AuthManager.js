import { EVENTS, ROLES, ROUTES, STORAGE_KEYS } from "../utils/constants.js";
import { authService } from "../services/auth.service.js";
import { apiClient } from "./APIClient.js";
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
    apiClient.setTokenProvider(() => this.token);

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

      // Sesiones guardadas con un rol que ya no existe (p. ej. el antiguo "usuario") se descartan.
      if (!Object.values(ROLES).includes(parsed?.role)) {
        this.logout({ emitEvent: false });
        return;
      }

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
   * Inicia sesión contra la API (POST /auth/login) y persiste la sesión.
   * @param {{email: string, password: string}} credentials
   * @returns {Promise<object>} usuario autenticado (modelo UI)
   */
  async login(credentials) {
    const { token, user } = await authService.login(credentials);
    this._persistSession(user, token);
    eventBus.emit(EVENTS.AUTH.LOGIN, { user });
    return user;
  }

  /**
   * Registra una cuenta (POST /auth/register) y deja la sesión iniciada.
   * @param {object} form datos del formulario de registro (modelo UI)
   */
  async register(form) {
    const { token, user } = await authService.register(form);
    this._persistSession(user, token);
    eventBus.emit(EVENTS.AUTH.REGISTER, { user });
    return user;
  }

  /**
   * Reemplaza los datos del usuario en sesión (por ejemplo, después de editar el perfil).
   * @param {object} user
   */
  updateCurrentUser(user) {
    if (!user || !this.token) {
      return;
    }

    this._persistSession(user, this.token);
  }

  /**
   * Cierra sesion, limpia almacenamiento y opcionalmente emite evento.
   */
  logout({ emitEvent = true } = {}) {
    const userId = this.currentUser?.id;
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}`);
    }

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
    return role === ROLES.ADVISOR ? ROUTES.ADVISOR_DASHBOARD : ROUTES.CLIENT_DASHBOARD;
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
