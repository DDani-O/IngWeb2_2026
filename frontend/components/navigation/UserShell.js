import { ROUTES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const USER_TOPBAR_TEMPLATE = "./components/layout/user-topbar.html";
const USER_SIDEBAR_TEMPLATE = "./components/navigation/user-sidebar.html";
const FOOTER_TEMPLATE = "./components/layout/app-footer-mini.html";

function buildLink({ href, icon, label, classes = "", targetBlank = false }) {
  const className = ["sidebar-link", classes].filter(Boolean).join(" ");
  const targetAttr = targetBlank ? ' target="_blank"' : "";

  return `<a class="${className}" href="${href}"${targetAttr}><i class="fa-solid ${icon}"></i>${label}</a>`;
}

function buildNavigationLinks(activeRoute) {
  const links = [
    {
      href: "#/usuario/dashboard",
      icon: "fa-house",
      label: "Dashboard",
      classes: activeRoute === ROUTES.USER_DASHBOARD ? "active" : "js-dashboard-back",
    },
    {
      href: "#/usuario/cargar-gasto",
      icon: "fa-circle-plus",
      label: "Cargar Gasto",
      classes: activeRoute === ROUTES.USER_CARGAR_GASTO ? "active" : "",
    },
    {
      href: "#/usuario/historial",
      icon: "fa-clock-rotate-left",
      label: "Historial de Gastos",
      classes: activeRoute === ROUTES.USER_HISTORIAL ? "active" : "",
    },
    {
      href: "#/usuario/patrones",
      icon: "fa-chart-line",
      label: "Patrones de Consumo",
      classes: activeRoute === ROUTES.USER_PATRONES ? "active" : "",
    },
    {
      href: "#/usuario/recomendaciones",
      icon: "fa-lightbulb",
      label: "Recomendaciones",
      classes: activeRoute === ROUTES.USER_RECOMENDACIONES ? "active" : "",
    },
  ];

  return links.map((link) => buildLink(link)).join("\n");
}

function buildActionLinks(activeRoute) {
  const links = [
    {
      href: "#/usuario/perfil",
      icon: "fa-id-card",
      label: "Perfil de Cuenta",
      classes: activeRoute === ROUTES.USER_PERFIL ? "active" : "",
    },
    {
      href: "#/usuario/perfiles",
      icon: "fa-user-pen",
      label: "Perfiles de Gasto",
      classes: activeRoute === ROUTES.USER_PERFILES ? "active" : "",
    },
  ];

  return links.map((link) => buildLink(link)).join("\n");
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
    userInitials: getInitials(userName) || "JP",
    navigationLinks: buildNavigationLinks(activeRoute),
    actionLinks: buildActionLinks(activeRoute),
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

export async function mountUserShell(root, options = {}) {
  const userName = options.userName || "Juan Perez";
  const activeRoute = options.activeRoute || ROUTES.USER_DASHBOARD;
  const footerText = options.footerText || "FinTrack 2026";

  await Promise.all([
    mountTopbar(root, userName),
    mountSidebar(root, { userName, activeRoute }),
    mountFooter(root, footerText),
  ]);
}
