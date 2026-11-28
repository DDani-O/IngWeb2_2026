/** Router de la SPA: ruteo por hash, layouts persistentes y guard de navegación. */
import { buildHash, parseQueryString } from "../utils/helpers.js";
import { loadTemplate } from "./templateLoader.js";

/**
 * Router SPA por hash.
 *
 * Responde una sola pregunta: según la URL, qué layout y qué página se muestran.
 * - Tabla de rutas declarativa (routes.js) con rutas anidadas, `meta` y parámetros `:id`.
 * - Un guard global (`beforeEach`) que decide con `to.meta` antes de entrar.
 * - Layouts persistentes: el layout se monta una vez y solo cambia la página del outlet.
 * - Ruta "no encontrada" mostrada en el lugar, sin redirect.
 */
export class Router {
  /**
   * @param {object} config
   * @param {object[]} config.routes tabla de rutas (ver routes.js)
   * @param {string} config.outlet selector del contenedor principal
   * @param {Object<string, () => object>} config.layouts fábricas de layout por clave
   * @param {object} config.notFound ruta a mostrar cuando ninguna coincide
   * @param {(to: object) => object} [config.pageOptions] opciones extra que recibe cada página
   */
  constructor({ routes = [], outlet = "#route-view", layouts = {}, notFound = null, pageOptions = () => ({}) } = {}) {
    this.records = this._flatten(routes);
    this.notFound = notFound ? this._normalize(notFound, { path: "", layout: "public", meta: {} }) : null;
    this.container = document.querySelector(outlet);
    this.layoutFactories = layouts;
    this.pageOptions = pageOptions;

    this.current = null;
    this.currentPage = null;
    this.layout = null;
    this.layoutKey = null;

    this._guards = [];
    this._listeners = new Set();
    this._navigationId = 0;
    this._handleHashChange = this._handleHashChange.bind(this);
  }

  /**
   * Registra un guard global. Devuelve true para entrar o un destino de redirección
   * (string o { path, query }).
   */
  beforeEach(guard) {
    this._guards.push(guard);
    return this;
  }

  /**
   * Suscribe una función a cada cambio de ruta completado. Devuelve la desuscripción.
   */
  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Empieza a escuchar `hashchange` y resuelve la ruta actual. */
  start() {
    window.addEventListener("hashchange", this._handleHashChange);
    this._handleHashChange();
  }

  /** Deja de escuchar los cambios de ruta. */
  stop() {
    window.removeEventListener("hashchange", this._handleHashChange);
  }

  /**
   * Navegación programática.
   * @param {string} path
   * @param {object} query
   * @param {{replace?: boolean}} options replace evita agregar una entrada al historial
   */
  navigate(path, query = {}, { replace = false } = {}) {
    const nextHash = buildHash(path, query);

    if (nextHash === window.location.hash) {
      return;
    }

    if (replace) {
      window.location.replace(nextHash);
      return;
    }

    window.location.hash = nextHash;
  }

  // ---------- Tabla de rutas ----------

  _normalize(route, parent) {
    const fullPath = route.path === "*" ? "*" : joinPaths(parent.path, route.path);
    return {
      ...route,
      path: fullPath,
      segments: fullPath === "*" ? [] : splitPath(fullPath),
      layout: route.layout || parent.layout || "public",
      meta: { ...parent.meta, ...(route.meta || {}) },
    };
  }

  _flatten(routes, parent = { path: "", layout: null, meta: {} }) {
    return routes.flatMap((route) => {
      const record = this._normalize(route, parent);
      return route.children ? this._flatten(route.children, record) : [record];
    });
  }

  _match(path) {
    const parts = splitPath(path);

    for (const record of this.records) {
      if (record.segments.length !== parts.length) {
        continue;
      }

      const params = {};
      const matches = record.segments.every((segment, index) => {
        if (segment.startsWith(":")) {
          params[segment.slice(1)] = decodeURIComponent(parts[index]);
          return true;
        }
        return segment === parts[index];
      });

      if (matches) {
        return { record, params };
      }
    }

    return this.notFound ? { record: this.notFound, params: {} } : null;
  }

  _parseHash() {
    const raw = String(window.location.hash || "").replace(/^#/, "") || "/";
    const [pathPart, queryPart = ""] = raw.split("?");
    const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
    return { path, query: parseQueryString(queryPart), fullPath: raw.startsWith("/") ? raw : `/${raw}` };
  }

  // ---------- Activación ----------

  async _handleHashChange() {
    const navigationId = ++this._navigationId;
    const location = this._parseHash();
    const match = this._match(location.path);

    if (!match) {
      return;
    }

    const to = { ...location, params: match.params, route: match.record, meta: match.record.meta, title: match.record.title || "" };

    for (const guard of this._guards) {
      const redirect = normalizeGuardResult(await guard(to, this.current));
      if (redirect) {
        this.navigate(redirect.path, redirect.query, { replace: true });
        return;
      }
    }

    // Misma ruta y mismos parámetros: la página puede actualizarse sin remontarse.
    if (this._canReuse(to)) {
      this.current = to;
      this.layout?.setActive?.(to);
      await this.currentPage.onRouteUpdate(to);
      this._notify(to);
      return;
    }

    try {
      await this._ensureLayout(to.route.layout);
      const PageClass = await to.route.page();
      const template = await loadTemplate(PageClass.template);

      // Si mientras tanto se pidió otra ruta, esta activación se descarta.
      if (navigationId !== this._navigationId) {
        return;
      }

      this._destroyPage();
      this._cleanupModals();

      const outlet = this.layout.outlet;
      outlet.innerHTML = template;
      this.layout.setActive?.(to);
      window.scrollTo(0, 0);

      this.currentPage = new PageClass(outlet, {
        ...this.pageOptions(to),
        params: to.params,
        query: to.query,
        ...(to.route.props || {}),
      });
      this.currentPage.mount();
      this.current = to;
      this._notify(to);
    } catch (error) {
      if (navigationId === this._navigationId) {
        this._renderActivationError(error);
      }
    }
  }

  _canReuse(to) {
    return Boolean(
      this.current &&
        this.currentPage &&
        to.route === this.current.route &&
        to.route.reuseOnQueryChange &&
        typeof this.currentPage.onRouteUpdate === "function" &&
        JSON.stringify(to.params) === JSON.stringify(this.current.params)
    );
  }

  async _ensureLayout(layoutKey) {
    if (this.layout && this.layoutKey === layoutKey) {
      return;
    }

    this._destroyPage();
    this.layout?.destroy();
    this._cleanupOverlayArtifacts();

    const factory = this.layoutFactories[layoutKey];
    if (!factory) {
      throw new Error(`No hay un layout registrado para "${layoutKey}".`);
    }

    this.layout = factory();
    this.layoutKey = layoutKey;
    await this.layout.mount(this.container);
  }

  _destroyPage() {
    this.currentPage?.destroy();
    this.currentPage = null;
  }

  _notify(to) {
    if (to.title) {
      document.title = `${to.title} · FinTrack`;
    }

    this._listeners.forEach((listener) => listener(to));
  }

  /**
   * Bootstrap deja el backdrop y bloquea el scroll si se navega con un modal abierto.
   */
  _cleanupModals() {
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }

  /**
   * Al cambiar de layout (p. ej. logout desde el menú móvil) también puede quedar el offcanvas abierto.
   */
  _cleanupOverlayArtifacts() {
    this._cleanupModals();
    document.querySelectorAll(".offcanvas-backdrop").forEach((backdrop) => backdrop.remove());
  }

  _renderActivationError(error) {
    const target = this.layout?.outlet || this.container;
    if (!target) {
      return;
    }

    const container = document.createElement("main");
    container.className = "placeholder-main";
    const card = document.createElement("article");
    card.className = "placeholder-card";
    card.setAttribute("role", "alert");

    const title = document.createElement("h1");
    title.className = "placeholder-title";
    title.textContent = "No pudimos cargar esta seccion";

    const description = document.createElement("p");
    description.className = "placeholder-description";
    description.textContent = `${error?.message || "Error desconocido"}. Recarga la pagina para reintentar.`;

    card.append(title, description);
    container.append(card);
    target.replaceChildren(container);
  }
}

function splitPath(path) {
  return String(path).split("/").filter(Boolean);
}

function joinPaths(base, path) {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${[...splitPath(base), ...splitPath(path)].join("/")}`;
}

function normalizeGuardResult(result) {
  if (result === true || result === undefined || result === null) {
    return null;
  }

  if (typeof result === "string") {
    return { path: result, query: {} };
  }

  if (typeof result === "object" && result.path) {
    return { path: result.path, query: result.query || {} };
  }

  return { path: "/", query: {} };
}
