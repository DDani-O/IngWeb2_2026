/**
 * UserShell.js
 * Componente de shell para el panel de usuarios.
 * Gestiona topbar, sidebar y footer del dashboard de usuario.
 *
 * @module UserShell
 */

import { ROUTES } from "../../../utils/constants.js";
import { getInitials } from "../../../utils/helpers.js";
import { loadTemplate, renderTemplate } from "../../core/templateLoader.js";

const USER_TOPBAR_TEMPLATE = "./components/user/UserTopbar/user-topbar.html";
const USER_SIDEBAR_TEMPLATE = "./components/user/UserShell/user-shell.html";
const FOOTER_TEMPLATE = "./components/shared/AppFooter/app-footer.html";

/**
 * Construye un link de navegación con configuración
 * @private
 */
function buildLink({ href, icon, label, classes = "", targetBlank = false }) {
  const className = ["sidebar-link", classes].filter(Boolean).join(" ");
  const targetAttr = targetBlank ? ' target="_blank"' : "";

  return `<a class="${className}" href="${href}"${targetAttr}><i class="fa-solid ${icon}"></i>${label}</a>`;
}

/**
 * Construye los links de navegación principal del usuario
 * @private
 */
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

/**
 * Construye los links de acciones del usuario (perfil, perfiles de gasto)
 * @private
 */
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
      label: "Perfiles financieros",
      classes: activeRoute === ROUTES.USER_PERFILES ? "active" : "",
    },
  ];

  return links.map((link) => buildLink(link)).join("\n");
}

/**
 * Monta la topbar del usuario
 * @private
 */
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

/**
 * Monta la sidebar del usuario
 * @private
 */
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

/**
 * Monta el footer
 * @private
 */
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
 * Monta el shell completo para panel de usuario.
 * Incluye topbar, sidebar y footer.
 *
 * @param {HTMLElement} root - Elemento raiz donde montar el shell
 * @param {object} options - Opciones de configuración
 * @param {string} options.userName - Nombre del usuario a mostrar
 * @param {string} options.activeRoute - Ruta actualmente activa
 * @param {string} options.footerText - Texto a mostrar en el footer
 */
export async function mountUserShell(root, options = {}) {
  const userName = options.userName || "Juan Perez";
  const activeRoute = options.activeRoute || ROUTES.USER_DASHBOARD;
  const footerText = options.footerText || "FinTrack 2026";

  // Carga todos los componentes en paralelo
  await Promise.all([
    mountTopbar(root, userName),
    mountSidebar(root, { userName, activeRoute }),
    mountFooter(root, footerText),
  ]);
}
