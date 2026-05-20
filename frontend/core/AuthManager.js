import { EVENTS, ROUTES, STORAGE_KEYS } from "../utils/constants.js";
import { stateManager } from "./StateManager.js";
import { eventBus } from "./EventBus.js";
import { apiClient } from "./APIClient.js";

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
      const normalizedRole = this._normalizeRole(parsed?.role);
      this.currentUser = {
        ...parsed,
        role: normalizedRole,
      };
      this.token = storedToken;

      stateManager.patch({
        user: this.currentUser,
        role: normalizedRole,
        isAuthenticated: true,
      });
    } catch {
      this.logout({ emitEvent: false });
    }
  }

  /**
    * Autentica contra el backend y crea sesion activa.
   */
  async login(credentials) {
    const response = await apiClient.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    if (!response?.access_token || !response?.user) {
      throw new Error("Respuesta invalida del servidor.");
    }

    const user = this._mapAuthUser(response.user);
    this._persistSession(user, response.access_token);

    eventBus.emit(EVENTS.AUTH.LOGIN, { user });
    return user;
  }

  /**
    * Registra un usuario nuevo en backend y lo autentica automaticamente.
   */
  async register(payload) {
    const normalizedRole = payload.role === "asesor" ? "asesor" : "cliente";
    const registerPayload = {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      role: normalizedRole,
    };

    if (normalizedRole === "asesor") {
      registerPayload.licenseNumber = payload.licenseNumber;
      registerPayload.specialty = payload.specialty;
      if (payload.description) {
        registerPayload.description = payload.description;
      }
    } else {
      if (payload.occupation) {
        registerPayload.occupation = payload.occupation;
      }
      if (payload.estimatedIncome !== undefined) {
        registerPayload.estimatedIncome = payload.estimatedIncome;
      }
      if (payload.financialGoal) {
        registerPayload.financialGoal = payload.financialGoal;
      }
      if (payload.preferredCurrency) {
        registerPayload.preferredCurrency = payload.preferredCurrency;
      }
    }

    const response = await apiClient.post("/auth/register", registerPayload);

    if (!response?.access_token || !response?.user) {
      throw new Error("Respuesta invalida del servidor.");
    }

    const user = this._mapAuthUser(response.user);
    this._persistSession(user, response.access_token);
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
    return this._normalizeRole(this.currentUser?.role) === this._normalizeRole(role);
  }

  /**
   * Retorna el usuario actual autenticado.
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Actualiza los datos del usuario actual en memoria y localStorage.
   * Usar después de editar el perfil para sincronizar en todas las páginas.
   */
  updateUserData(updatedFields) {
    if (!this.currentUser) {
      return;
    }

    const updatedUser = {
      ...this.currentUser,
      ...updatedFields,
    };

    this.currentUser = updatedUser;
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));

    stateManager.patch({
      user: updatedUser,
    });

    eventBus.emit(EVENTS.AUTH.USER_UPDATED, { user: updatedUser });
  }

  /**
   * Retorna el rol actual o null si no hay sesion.
   */
  getCurrentRole() {
    return this._normalizeRole(this.currentUser?.role) || null;
  }

  /**
   * Devuelve ruta inicial recomendada segun rol.
   */
  getDefaultRouteForRole(role) {
    const normalizedRole = this._normalizeRole(role);
    return normalizedRole === "asesor"
      ? ROUTES.ADVISOR_DASHBOARD
      : ROUTES.USER_DASHBOARD;
  }

  /**
   * Persiste token/usuario y sincroniza estado global autenticado.
   */
  _persistSession(user, token) {
    const normalizedRole = this._normalizeRole(user?.role);
    const normalizedUser = {
      ...user,
      role: normalizedRole,
    };

    this.currentUser = normalizedUser;
    this.token = token;

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(normalizedUser));

    stateManager.patch({
      user: normalizedUser,
      role: normalizedRole,
      isAuthenticated: true,
    });
  }

  _normalizeRole(role) {
    if (!role) {
      return role;
    }

    return role === "usuario" ? "cliente" : role;
  }

  _mapAuthUser(user) {
    return {
      id: user.id,
      role: this._normalizeRole(user.role),
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt ?? null,
    };
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
