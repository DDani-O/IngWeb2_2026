/** Layout autenticado (cliente y asesor) y la configuración de navegación de cada rol. */
import { Component } from "../../core/Component.js";
import { EVENTS, ROUTES } from "../../utils/constants.js";
import { buildHash, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/** Navegación del cliente. */
export const CLIENT_LAYOUT = {
  panelTitle: "Panel",
  userMeta: { label: "Editar Perfil", route: ROUTES.CLIENT_PERFIL },
  homeRoute: ROUTES.CLIENT_DASHBOARD,
  navigation: [
    { route: ROUTES.CLIENT_DASHBOARD, icon: "fa-house", label: "Dashboard" },
    { route: ROUTES.CLIENT_CARGAR_GASTO, icon: "fa-circle-plus", label: "Cargar Gasto" },
    { route: ROUTES.CLIENT_HISTORIAL, icon: "fa-clock-rotate-left", label: "Historial de Gastos" },
    { route: ROUTES.CLIENT_PATRONES, icon: "fa-chart-line", label: "Patrones de Consumo" },
    { route: ROUTES.CLIENT_RECOMENDACIONES, icon: "fa-lightbulb", label: "Recomendaciones" },
  ],
  actions: [
    { route: ROUTES.CLIENT_PERFIL, icon: "fa-id-card", label: "Perfil de Cuenta" },
    { route: ROUTES.CLIENT_PERFILES, icon: "fa-user-tag", label: "Perfiles de Gasto" },
  ],
};

/** Navegación del asesor. */
export const ADVISOR_LAYOUT = {
  panelTitle: "Asesor",
  userMeta: { label: "Panel profesional", route: ROUTES.ADVISOR_PERFIL },
  homeRoute: ROUTES.ADVISOR_DASHBOARD,
  navigation: [
    { route: ROUTES.ADVISOR_DASHBOARD, icon: "fa-house", label: "Dashboard" },
    { route: ROUTES.ADVISOR_CLIENTES, icon: "fa-users", label: "Mis Clientes" },
  ],
  actions: [{ route: ROUTES.ADVISOR_PERFIL, icon: "fa-user-pen", label: "Perfil del Asesor" }],
};

const OFFCANVAS_ID = "appSidebarOffcanvas";

/**
 * Layout de las páginas autenticadas: topbar, sidebar (offcanvas) y footer.
 * Se monta una sola vez por rol; el router solo reemplaza el contenido de `outlet`.
 *
 * Props: `config` (CLIENT_LAYOUT o ADVISOR_LAYOUT), `user` ({ fullName }),
 * `onLogout()` y `onReturnHome(path)` (volver al inicio respetando las pestañas abiertas).
 */
export class AppLayout extends Component {
  static DEFAULTS = {
    config: CLIENT_LAYOUT,
    user: null,
    onLogout: () => {},
    onReturnHome: null,
  };

  /**
   * Monta el layout en el contenedor principal y expone `outlet` para las páginas.
   * @param {HTMLElement} container
   */
  mount(container) {
    this.element = container;
    super.mount();
    this.outlet = this.element.querySelector("[data-layout-outlet]");
    return this;
  }

  render() {
    const { config, user } = this.options;
    const fullName = user?.fullName || "";

    this.element.innerHTML = html`
      <div class="app-page">
        ${this._topbar(fullName)}

        <main class="app-main app-main--wide">
          <div class="app-outlet" data-layout-outlet></div>
          <footer class="app-footer" data-layout-footer>FinTrack 2026</footer>
        </main>

        ${this._sidebar(config, fullName)}
      </div>
    `;
  }

  attachEvents() {
    this.listen(this.element, "click", (event) => {
      if (event.target.closest('[data-action="logout"]')) {
        this._hideSidebar();
        this.options.onLogout();
        return;
      }

      const homeLink = event.target.closest("[data-home-link]");
      if (homeLink && this.options.onReturnHome && !homeLink.classList.contains("active")) {
        event.preventDefault();
        this.options.onReturnHome(this.options.config.homeRoute);
      }
    });

    this.on(EVENTS.PROFILE.UPDATED, ({ user }) => this.setUser(user));
  }

  /**
   * Marca el link de la ruta activa, actualiza el footer y cierra el menú móvil.
   * @param {{path: string, title: string}} to
   */
  setActive(to) {
    const activePath = to.route?.activeNav || to.path;
    this.element.querySelectorAll("[data-route]").forEach((link) => {
      const isActive = link.dataset.route === activePath;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const footer = this.element.querySelector("[data-layout-footer]");
    if (footer) {
      footer.textContent = to.title ? `FinTrack 2026 · ${to.title}` : "FinTrack 2026";
    }

    this._hideSidebar();
  }

  /**
   * Actualiza el nombre e iniciales mostrados (por ejemplo, después de editar el perfil).
   * @param {{fullName: string}} user
   */
  setUser(user) {
    const fullName = user?.fullName || "";
    this.element.querySelectorAll("[data-user-name]").forEach((node) => {
      node.textContent = fullName;
    });
    this.element.querySelectorAll("[data-user-initials]").forEach((node) => {
      node.textContent = getInitials(fullName);
    });
  }

  destroy() {
    this._hideSidebar();
    super.destroy();
    this.element?.replaceChildren();
  }

  /** Barra superior: marca, nombre del usuario, "Salir" (escritorio) y botón del menú. */
  _topbar(fullName) {
    return html`
      <header class="app-navbar">
        <div class="app-navbar__content">
          <a class="app-brand" href="${buildHash(ROUTES.HOME)}">
            <i class="fa-solid fa-chart-pie"></i>
            <span>FinTrack</span>
          </a>

          <div class="dashboard-topbar-user">
            <span class="dashboard-topbar-user__name" data-user-name>${fullName}</span>
            <button class="action-btn action-btn--ghost d-none d-md-inline-flex" data-action="logout" type="button">
              <i class="fa-solid fa-right-from-bracket"></i>
              Salir
            </button>
            <button class="navbar-icon-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#${OFFCANVAS_ID}" aria-controls="${OFFCANVAS_ID}" aria-label="Abrir navegacion">
              <i class="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  /** Menú lateral (offcanvas de Bootstrap): usuario, navegación del rol, acciones y "Salir". */
  _sidebar(config, fullName) {
    return html`
      <aside class="offcanvas offcanvas-start app-offcanvas" tabindex="-1" id="${OFFCANVAS_ID}" aria-labelledby="${OFFCANVAS_ID}Label">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="${OFFCANVAS_ID}Label">${config.panelTitle}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column gap-2">
          ${this._userCard(config, fullName)}

          <p class="sidebar-section-title mt-2">Navegacion</p>
          <nav aria-label="Navegacion principal">${this._links(config.navigation)}</nav>

          <p class="sidebar-section-title mt-2">Acciones</p>
          <nav aria-label="Acciones de cuenta">${this._links(config.actions)}</nav>

          <div class="sidebar-spacer"></div>
          <button class="sidebar-link sidebar-logout" data-action="logout" type="button">
            <i class="fa-solid fa-right-from-bracket"></i>Salir
          </button>
        </div>
      </aside>
    `;
  }

  /** Tarjeta del usuario en el menú: iniciales, nombre y link a su perfil. */
  _userCard(config, fullName) {
    return html`
      <div class="sidebar-user-card">
        <span class="sidebar-user-card__avatar" data-user-initials>${getInitials(fullName)}</span>
        <div>
          <p class="sidebar-user-card__name" data-user-name>${fullName}</p>
          <a class="sidebar-user-card__meta" href="${buildHash(config.userMeta.route)}">${config.userMeta.label}</a>
        </div>
      </div>
    `;
  }

  _links(links) {
    const homeRoute = this.options.config.homeRoute;
    return links.map(
      ({ route, icon, label }) =>
        html`<a class="sidebar-link" href="${buildHash(route)}" data-route="${route}" ${route === homeRoute ? html`data-home-link` : ""}><i class="fa-solid ${icon}"></i>${label}</a>`
    );
  }

  _hideSidebar() {
    const offcanvas = this.element?.querySelector(`#${OFFCANVAS_ID}`);
    if (offcanvas && window.bootstrap) {
      window.bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
    }
  }
}
