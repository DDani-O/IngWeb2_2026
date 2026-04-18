export class EventBus {
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }

    this.listeners = new Map();
    EventBus.instance = this;
  }

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

  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      callback(payload);
    });

    return unsubscribe;
  }

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

  emit(eventName, payload = {}) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const group = this.listeners.get(eventName);

    group.forEach((callback) => {
      callback(payload);
    });
  }

  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
      return;
    }

    this.listeners.clear();
  }

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }
}

export const eventBus = EventBus.getInstance();
