import { EVENTS } from "../utils/constants.js";
import { eventBus } from "./EventBus.js";

export class StateManager {
  /**
   * Inicializa el estado global de la app bajo patron singleton.
   */
  constructor() {
    if (StateManager.instance) {
      return StateManager.instance;
    }

    this.state = {
      user: null,
      role: null,
      isAuthenticated: false,
      theme: "dark",
      route: "/",
    };

    StateManager.instance = this;
  }

  /**
   * Obtiene el valor de una clave del estado.
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Devuelve una copia superficial del estado completo.
   */
  getAll() {
    return { ...this.state };
  }

  /**
   * Actualiza una clave y emite evento si el valor realmente cambia.
   */
  set(key, value) {
    const oldValue = this.state[key];

    if (oldValue === value) {
      return;
    }

    this.state[key] = value;

    eventBus.emit(EVENTS.STATE.CHANGED, {
      key,
      oldValue,
      newValue: value,
      state: this.getAll(),
    });
  }

  /**
   * Aplica multiples cambios de estado en lote.
   */
  patch(partialState = {}) {
    Object.entries(partialState).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Restaura estado base (o personalizado) y notifica cambio global.
   * Puede usarse al cerrar sesion o reiniciar una demo.
   */
  reset(nextState = {}) {
    this.state = {
      user: null,
      role: null,
      isAuthenticated: false,
      theme: "dark",
      route: "/",
      ...nextState,
    };

    eventBus.emit(EVENTS.STATE.CHANGED, {
      key: "*",
      oldValue: null,
      newValue: this.getAll(),
      state: this.getAll(),
    });
  }

  /**
   * Devuelve la instancia unica global del StateManager.
   */
  static getInstance() {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }

    return StateManager.instance;
  }
}

export const stateManager = StateManager.getInstance();
