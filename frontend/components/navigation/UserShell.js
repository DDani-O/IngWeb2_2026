import { ROUTES } from "../../utils/constants.js";
import { buildHash, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const USER_TOPBAR_TEMPLATE = "./components/layout/user-topbar.html";
const USER_SIDEBAR_TEMPLATE = "./components/navigation/user-sidebar.html";
const FOOTER_TEMPLATE = "./components/layout/app-footer-mini.html";

const NAVIGATION_LINKS = [
  { route: ROUTES.CLIENT_DASHBOARD, icon: "fa-house", label: "Dashboard" },
  { route: ROUTES.CLIENT_CARGAR_GASTO, icon: "fa-circle-plus", label: "Cargar Gasto" },
  { route: ROUTES.CLIENT_HISTORIAL, icon: "fa-clock-rotate-left", label: "Historial de Gastos" },
  { route: ROUTES.CLIENT_PATRONES, icon: "fa-chart-line", label: "Patrones de Consumo" },
  { route: ROUTES.CLIENT_RECOMENDACIONES, icon: "fa-lightbulb", label: "Recomendaciones" },
];

const ACTION_LINKS = [
  { route: ROUTES.CLIENT_PERFIL, icon: "fa-id-card", label: "Perfil de Cuenta" },
  { route: ROUTES.CLIENT_PERFILES, icon: "fa-user-tag", label: "Perfiles de Gasto" },
];

/**
 * Arma los links del sidebar marcando el activo. El link al dashboard lleva
 * la clase js-dashboard-back para cerrar la pestaña secundaria si corresponde.
 */
function buildLinks(links, activeRoute) {
  return links.map(({ route, icon, label }) => {
    const isActive = route === activeRoute;
    const extraClass = isActive ? "active" : route === ROUTES.CLIENT_DASHBOARD ? "js-dashboard-back" : "";

    return html`<a class="sidebar-link ${extraClass}" href="${buildHash(route)}"><i class="fa-solid ${icon}"></i>${label}</a>`;
  });
}

async function mountTopbar(root, userName) {
  const slot = root.querySelector("#userTopbarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(USER_TOPBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    userName,
  });
}

async function mountSidebar(root, { userName, activeRoute }) {
  const slot = root.querySelector("#userSidebarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(USER_SIDEBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    userName,
    userInitials: getInitials(userName),
    navigationLinks: html`${buildLinks(NAVIGATION_LINKS, activeRoute)}`,
    actionLinks: html`${buildLinks(ACTION_LINKS, activeRoute)}`,
  });
}

async function mountFooter(root, footerText) {
  const slot = root.querySelector("#appFooterSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(FOOTER_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    footerText,
  });
}

/**
 * Monta topbar, sidebar y footer del cliente en los slots del template de la página.
 */
export async function mountUserShell(root, options = {}) {
  const userName = options.userName || "";
  const activeRoute = options.activeRoute || ROUTES.CLIENT_DASHBOARD;
  const footerText = options.footerText || "FinTrack 2026";

  await Promise.all([
    mountTopbar(root, userName),
    mountSidebar(root, { userName, activeRoute }),
    mountFooter(root, footerText),
  ]);
}
