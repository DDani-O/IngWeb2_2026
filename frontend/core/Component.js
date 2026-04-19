import { eventBus } from "./EventBus.js";

export class Component {
  static DEFAULTS = {};

  /**
   * Inicializa componente base resolviendo nodo raiz y opciones.
   */
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

  /**
   * Punto de extension obligatorio: debe renderizar el contenido del componente.
   */
  render() {
    throw new Error(
      `${this.constructor.name} debe implementar el metodo render().`
    );
  }

  /**
   * Punto de extension opcional para registrar eventos DOM.
   */
  attachEvents() {
    // Metodo opcional para subclases.
  }

  /**
   * Monta el componente ejecutando render y luego el binding de eventos.
   */
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

  /**
   * Reemplaza el HTML del nodo raiz del componente.
   */
  setHTML(html = "") {
    if (!this.element) {
      return;
    }

    this.element.innerHTML = html;
  }

  /**
   * Registra listener DOM y lo guarda para cleanup automatico.
   */
  listen(target, eventName, handler, options) {
    if (!target) {
      return;
    }

    target.addEventListener(eventName, handler, options);
    this._domListeners.push({ target, eventName, handler, options });
  }

  /**
   * Suscribe el componente al EventBus y guarda la desuscripcion.
   */
  on(eventName, callback) {
    const unsubscribe = eventBus.on(eventName, callback);
    this._busListeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Emite un evento global desde el componente actual.
   */
  emit(eventName, payload = {}) {
    eventBus.emit(eventName, payload);
  }

  /**
   * Registra un componente hijo para destruirlo en cascada.
   */
  registerChild(component) {
    if (component) {
      this._children.push(component);
    }
  }

  /**
   * Libera listeners y destruye hijos para evitar fugas de memoria.
   */
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
