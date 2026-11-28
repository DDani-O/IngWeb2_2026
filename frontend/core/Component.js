import { eventBus } from "./EventBus.js";

/**
 * Base de ciclo de vida de componentes y páginas.
 *
 * Comunicación (frontend/README.md §4):
 * - Props hacia abajo: opciones del constructor (`this.options`, con `static DEFAULTS`). Son de
 *   solo lectura para el componente; el padre las cambia con `update(nextOptions)`.
 * - Avisos hacia arriba: `dispatch(nombre, detalle)` emite un CustomEvent que burbujea desde el
 *   elemento raíz; el padre lo escucha con `listen(elemento, nombre, handler)`.
 * - EventBus (`on`/`emit`): solo para hechos de aplicación entre módulos (sesión vencida, tema, perfil,
 *   servidor despertando).
 * - Composición: `mountChild(Clase, elemento, opciones)` monta un hijo que se destruye con el padre.
 */
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
   * Reemplaza las props (el padre es el dueño del dato) y vuelve a renderizar.
   * @param {object} nextOptions
   */
  update(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
    if (this._mounted) {
      this.render();
    }
    return this;
  }

  /**
   * Avisa al padre que pasó algo: CustomEvent que burbujea desde el elemento raíz.
   * @param {string} eventName
   * @param {object} detail
   */
  dispatch(eventName, detail = {}) {
    this.element?.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail }));
  }

  /**
   * Monta un componente hijo sobre `element` y lo registra para destruirlo en cascada.
   * @template T
   * @param {new (element: HTMLElement, options: object) => T} ComponentClass
   * @param {HTMLElement|string} element nodo o selector relativo a este componente
   * @param {object} options props del hijo
   * @returns {T}
   */
  mountChild(ComponentClass, element, options = {}) {
    const target = typeof element === "string" ? this.element.querySelector(element) : element;
    if (!target) {
      throw new Error(`${this.constructor.name}: no existe el punto de montaje ${element}.`);
    }

    const child = new ComponentClass(target, options);
    child.mount();
    this.registerChild(child);
    return child;
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
