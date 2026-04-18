import { EVENTS } from "../utils/constants.js";
import { eventBus } from "./EventBus.js";

export class StateManager {
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

  get(key) {
    return this.state[key];
  }

  getAll() {
    return { ...this.state };
  }

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

  patch(partialState = {}) {
    Object.entries(partialState).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

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

  static getInstance() {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }

    return StateManager.instance;
  }
}

export const stateManager = StateManager.getInstance();
