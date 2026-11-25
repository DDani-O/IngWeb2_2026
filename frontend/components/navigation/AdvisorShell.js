import { ROUTES } from "../../utils/constants.js";
import { buildHash, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const ADVISOR_TOPBAR_TEMPLATE = "./components/layout/advisor-topbar.html";
const ADVISOR_SIDEBAR_TEMPLATE = "./components/navigation/advisor-sidebar.html";
const FOOTER_TEMPLATE = "./components/layout/app-footer-mini.html";

const NAVIGATION_LINKS = [
  { route: ROUTES.ADVISOR_DASHBOARD, icon: "fa-house", label: "Dashboard" },
  { route: ROUTES.ADVISOR_CLIENTES, icon: "fa-users", label: "Mis Clientes" },
];

const ACTION_LINKS = [
  { route: ROUTES.ADVISOR_PERFIL, icon: "fa-user-pen", label: "Perfil del Asesor" },
];

function buildLinks(links, activeRoute) {
  return links.map(({ route, icon, label }) => {
    const activeClass = route === activeRoute ? "active" : "";
    return html`<a class="sidebar-link ${activeClass}" href="${buildHash(route)}"><i class="fa-solid ${icon}"></i>${label}</a>`;
  });
}

async function mountTopbar(root, advisorName) {
  const slot = root.querySelector("#advisorTopbarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(ADVISOR_TOPBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    advisorName,
  });
}

async function mountSidebar(root, { advisorName, activeRoute }) {
  const slot = root.querySelector("#advisorSidebarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(ADVISOR_SIDEBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    advisorName,
    advisorInitials: getInitials(advisorName),
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
 * Monta topbar, sidebar y footer del asesor en los slots del template de la página.
 */
export async function mountAdvisorShell(root, options = {}) {
  const advisorName = options.advisorName || "";
  const activeRoute = options.activeRoute || ROUTES.ADVISOR_DASHBOARD;
  const footerText = options.footerText || "FinTrack 2026 · Panel asesor";

  await Promise.all([
    mountTopbar(root, advisorName),
    mountSidebar(root, { advisorName, activeRoute }),
    mountFooter(root, footerText),
  ]);
}
