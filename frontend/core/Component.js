import { eventBus } from "./EventBus.js";

export class Component {
  static DEFAULTS = {};

  constructor(elementOrSelector, options = {}) {
    this.element =
      typeof elementOrSelector === "string"
        ? document.querySelector(elementOrSelector)
        : elementOrSelector;

    this.options = {
      ...this.constructor.DEFAULTS,
      ...options,
    };

    this._domListeners = [];
    this._busListeners = [];
    this._children = [];
    this._mounted = false;
  }

  render() {
    throw new Error(
      `${this.constructor.name} debe implementar el metodo render().`
    );
  }

  attachEvents() {
    // Metodo opcional para subclases.
  }

  mount() {
    if (!this.element) {
      throw new Error(
        `${this.constructor.name} no encontro un elemento valido para montar.`
      );
    }

    this.render();
    this.attachEvents();
    this._mounted = true;
    return this;
  }

  setHTML(html = "") {
    if (!this.element) {
      return;
    }

    this.element.innerHTML = html;
  }

  listen(target, eventName, handler, options) {
    if (!target) {
      return;
    }

    target.addEventListener(eventName, handler, options);
    this._domListeners.push({ target, eventName, handler, options });
  }

  on(eventName, callback) {
    const unsubscribe = eventBus.on(eventName, callback);
    this._busListeners.push(unsubscribe);
    return unsubscribe;
  }

  emit(eventName, payload = {}) {
    eventBus.emit(eventName, payload);
  }

  registerChild(component) {
    if (component) {
      this._children.push(component);
    }
  }

  destroy() {
    this._domListeners.forEach(({ target, eventName, handler, options }) => {
      target.removeEventListener(eventName, handler, options);
    });

    this._busListeners.forEach((unsubscribe) => unsubscribe());

    this._children.forEach((child) => {
      if (typeof child.destroy === "function") {
        child.destroy();
      }
    });

    this._domListeners = [];
    this._busListeners = [];
    this._children = [];
    this._mounted = false;
  }
}
