import { EVENTS } from "../utils/constants.js";
import { eventBus } from "./EventBus.js";
import { buildHash, parseQueryString } from "../utils/helpers.js";

export class Router {
  /**
   * Inicializa el router hash-based con contenedor de render y caches.
   */
  constructor({ viewSelector = "#route-view" } = {}) {
    this.routes = new Map();
    this.notFoundRoute = null;
    this.templateCache = new Map();
    this.viewSelector = viewSelector;
    this.viewElement = document.querySelector(this.viewSelector);
    this.currentRoute = null;
    this.currentCleanup = null;
    this.started = false;

    this._handleHashChange = this._handleHashChange.bind(this);
  }

  /**
   * Registra una ruta individual en el mapa interno.
   */
  register(route) {
    this.routes.set(route.path, route);
    return this;
  }

  /**
   * Registra multiples rutas de una sola vez.
   */
  registerMany(routes = []) {
    routes.forEach((route) => this.register(route));
    return this;
  }

  /**
   * Define la ruta fallback para paths no reconocidos.
   */
  setNotFoundRoute(route) {
    this.notFoundRoute = route;
    return this;
  }

  /**
   * Inicia escucha de cambios de hash y activa ruta actual.
   */
  start() {
    if (this.started) {
      return;
    }

    this.started = true;
    window.addEventListener("hashchange", this._handleHashChange);
    this._handleHashChange();
  }

  /**
   * Detiene la escucha de eventos de navegacion por hash.
   */
  stop() {
    window.removeEventListener("hashchange", this._handleHashChange);
    this.started = false;
  }

  /**
   * Parsea el hash actual y devuelve path, query y ruta completa.
   */
  parseHash(hashValue = window.location.hash) {
    const hash = String(hashValue || "").replace(/^#/, "");
    const normalized = hash || "/";

    const [pathPart, queryPart = ""] = normalized.split("?");
    const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;

    return {
      path,
      query: parseQueryString(queryPart),
      fullPath: normalized,
    };
  }

  /**
   * Navega hacia una ruta hash, con opcion de reemplazar historial.
   */
  navigate(path, query = {}, { replace = false } = {}) {
    const nextHash = buildHash(path, query);

    if (replace) {
      window.location.replace(nextHash);
      return;
    }

    window.location.hash = nextHash;
  }

  /**
   * Handler principal de cambio de hash que dispara activacion de ruta.
   */
  async _handleHashChange() {
    const payload = this.parseHash();
    await this._activate(payload);
  }

  /**
   * Activa una ruta: valida permisos, limpia vista previa y renderiza.
   */
  async _activate(payload) {
    const route = this.routes.get(payload.path) || this.notFoundRoute;

    if (!route) {
      return;
    }

    const context = {
      ...payload,
      route,
      router: this,
      mountNode: this.viewElement,
      state: {},
    };

    const canEnter = await this._canEnter(route, context);
    if (!canEnter.allowed) {
      this.navigate(canEnter.redirectPath, canEnter.redirectQuery || {});
      return;
    }

    await this._cleanupCurrent();
    this._cleanupOverlayArtifacts();

    if (typeof route.render === "function") {
      await route.render(context);
    } else if (route.templateUrl && this.viewElement) {
      const template = await this._loadTemplate(route.templateUrl);
      this.viewElement.innerHTML = template;
    }

    if (typeof route.onEnter === "function") {
      this.currentCleanup = await route.onEnter(context);
    }

    this.currentRoute = route;

    eventBus.emit(EVENTS.ROUTER.CHANGED, {
      path: payload.path,
      query: payload.query,
    });
  }

  /**
   * Limpia backdrops/overlays residuales para evitar bloqueos de scroll.
   */
  _cleanupOverlayArtifacts() {
    if (typeof document === "undefined") {
      return;
    }

    document
      .querySelectorAll(".offcanvas-backdrop, .modal-backdrop")
      .forEach((backdrop) => backdrop.remove());

    document.querySelectorAll(".offcanvas.show, .modal.show").forEach((overlay) => {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.removeProperty("display");
    });

    const body = document.body;
    if (body) {
      body.classList.remove("modal-open");
      body.style.removeProperty("overflow");
      body.style.removeProperty("padding-right");
      body.removeAttribute("data-bs-overflow");
      body.removeAttribute("data-bs-padding-right");
    }

    const html = document.documentElement;
    if (html) {
      html.style.removeProperty("overflow");
      html.style.removeProperty("padding-right");
    }
  }

  /**
   * Ejecuta guard de entrada de ruta y normaliza respuesta de autorizacion.
   */
  async _canEnter(route, context) {
    if (typeof route.beforeEnter !== "function") {
      return { allowed: true };
    }

    const result = await route.beforeEnter(context);

    if (result === true || result === undefined || result === null) {
      return { allowed: true };
    }

    if (result === false) {
      return { allowed: false, redirectPath: "/" };
    }

    if (typeof result === "string") {
      return { allowed: false, redirectPath: result };
    }

    if (typeof result === "object" && result.path) {
      return {
        allowed: false,
        redirectPath: result.path,
        redirectQuery: result.query || {},
      };
    }

    return { allowed: false, redirectPath: "/" };
  }

  /**
   * Ejecuta cleanup de la ruta anterior (si existe).
   */
  async _cleanupCurrent() {
    if (typeof this.currentCleanup === "function") {
      await this.currentCleanup();
    }

    this.currentCleanup = null;
  }

  /**
   * Carga plantilla remota y la cachea para navegacion mas rapida.
   */
  async _loadTemplate(templateUrl) {
    if (this.templateCache.has(templateUrl)) {
      return this.templateCache.get(templateUrl);
    }

    const response = await fetch(templateUrl, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla ${templateUrl}`);
    }

    const html = await response.text();
    this.templateCache.set(templateUrl, html);
    return html;
  }
}
