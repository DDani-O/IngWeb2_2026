export class EventBus {
  /**
   * Crea el bus de eventos como singleton para compartir mensajeria global.
   */
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }

    this.listeners = new Map();
    EventBus.instance = this;
  }

  /**
   * Registra un listener para un evento y devuelve funcion de desuscripcion.
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const group = this.listeners.get(eventName);
    group.add(callback);

    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Registra un listener de una sola ejecucion.
   */
  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      callback(payload);
    });

    return unsubscribe;
  }

  /**
   * Elimina un listener especifico de un evento.
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const group = this.listeners.get(eventName);
    group.delete(callback);

    if (group.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Publica un evento con payload a todos los listeners registrados.
   */
  emit(eventName, payload = {}) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const group = this.listeners.get(eventName);

    group.forEach((callback) => {
      callback(payload);
    });
  }

  /**
   * Limpia listeners de un evento puntual o de todo el bus.
   * Util para pruebas o para resetear estado de la app.
   */
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
      return;
    }

    this.listeners.clear();
  }

  /**
   * Devuelve la instancia unica global del EventBus.
   */
  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }
}

export const eventBus = EventBus.getInstance();
