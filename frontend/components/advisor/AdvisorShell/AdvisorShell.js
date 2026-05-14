/**
 * AdvisorShell.js
 * Componente de shell para el panel de asesores.
 * Gestiona topbar, sidebar y footer del dashboards de asesor.
 *
 * Estructura:
 * - TopBar con logo y nombre del asesor
 * - Sidebar offcanvas con navegación
 * - Footer
 *
 * @module AdvisorShell
 */

import { ROUTES } from "../../../utils/constants.js";
import { getInitials } from "../../../utils/helpers.js";
import { loadTemplate, renderTemplate } from "../../core/templateLoader.js";

// Rutas a los templates de componentes
const ADVISOR_TOPBAR_TEMPLATE = "./components/advisor/AdvisorTopbar/advisor-topbar.html";
const ADVISOR_SIDEBAR_TEMPLATE = "./components/advisor/AdvisorShell/advisor-shell.html";
const FOOTER_TEMPLATE = "./components/shared/AppFooter/app-footer.html";

/**
 * Construye un link de navegación con clases y atributos
 * @private
 */
function buildLink({ href, icon, label, classes = "" }) {
  const className = ["sidebar-link", classes].filter(Boolean).join(" ");
  return `<a class="${className}" href="${href}"><i class="fa-solid ${icon}"></i>${label}</a>`;
}

/**
 * Construye los links de navegación principal del asesor
 * @private
 * @param {string} activeRoute - Ruta actualmente seleccionada
 * @returns {string} HTML de los links de navegación
 */
function buildNavigationLinks(activeRoute) {
  const links = [
    {
      href: "#/asesor/dashboard",
      icon: "fa-house",
      label: "Dashboard",
      classes: activeRoute === ROUTES.ADVISOR_DASHBOARD ? "active" : "",
    },
    {
      href: "#/asesor/clientes",
      icon: "fa-users",
      label: "Mis Clientes",
      classes: activeRoute === ROUTES.ADVISOR_CLIENTES ? "active" : "",
    },
    {
      href: "#/asesor/inbox",
      icon: "fa-inbox",
      label: "Bandeja de Entrada",
      classes: activeRoute === ROUTES.ADVISOR_INBOX ? "active" : "",
    },
    {
      href: "#/asesor/reportes",
      icon: "fa-chart-column",
      label: "Reportes",
      classes: activeRoute === ROUTES.ADVISOR_REPORTES ? "active" : "",
    },
  ];

  return links.map((link) => buildLink(link)).join("\n");
}

/**
 * Construye los links de acciones adicionales (perfil, comisiones, etc.)
 * @private
 * @param {string} activeRoute - Ruta actualmente seleccionada
 * @param {string} activeSection - Sección activa dentro de reportes
 * @returns {string} HTML de los links de acciones
 */
function buildActionLinks(activeRoute, activeSection) {
  const links = [
    {
      href: "#/asesor/perfil",
      icon: "fa-user-pen",
      label: "Perfil del Asesor",
      classes: activeRoute === ROUTES.ADVISOR_PERFIL ? "active" : "",
    },
    {
      href: "#/asesor/reportes?section=comisiones",
      icon: "fa-file-invoice-dollar",
      label: "Mis Comisiones",
      classes:
        activeRoute === ROUTES.ADVISOR_REPORTES && activeSection === "comisiones"
          ? "active"
          : "",
    },
    {
      href: "#/asesor/reportes?section=tareas",
      icon: "fa-list-check",
      label: "Tareas Pendientes",
      classes:
        activeRoute === ROUTES.ADVISOR_REPORTES && activeSection === "tareas"
          ? "active"
          : "",
    },
    {
      href: "#/asesor/reportes?section=descargas",
      icon: "fa-download",
      label: "Descargar Reportes",
      classes:
        activeRoute === ROUTES.ADVISOR_REPORTES && activeSection === "descargas"
          ? "active"
          : "",
    },
  ];

  return links.map((link) => buildLink(link)).join("\n");
}

/**
 * Monta la topbar del asesor en el contenedor especificado
 * @private
 */
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

/**
 * Monta la sidebar del asesor en el contenedor especificado
 * @private
 */
async function mountSidebar(root, { advisorName, activeRoute, activeSection }) {
  const slot = root.querySelector("#advisorSidebarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(ADVISOR_SIDEBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    advisorName,
    advisorInitials: getInitials(advisorName) || "MR",
    navigationLinks: buildNavigationLinks(activeRoute),
    actionLinks: buildActionLinks(activeRoute, activeSection),
  });
}

/**
 * Monta el footer de la aplicación
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
 * Monta el shell completo para panel de asesor.
 * Incluye topbar, sidebar y footer.
 *
 * @param {HTMLElement} root - Elemento raiz donde montar el shell
 * @param {object} options - Opciones de configuración
 * @param {string} options.advisorName - Nombre del asesor a mostrar
 * @param {string} options.activeRoute - Ruta actualmente activa
 * @param {string} options.activeSection - Sección activa (ej: 'comisiones')
 * @param {string} options.footerText - Texto a mostrar en el footer
 *
 * @example
 * await mountAdvisorShell(document.getElementById('app'), {
 *   advisorName: 'Maria Rodriguez',
 *   activeRoute: ROUTES.ADVISOR_DASHBOARD,
 *   footerText: 'FinTrack 2026 · Panel asesor'
 * });
 */
export async function mountAdvisorShell(root, options = {}) {
  const advisorName = options.advisorName || "Maria Rodriguez";
  const activeRoute = options.activeRoute || ROUTES.ADVISOR_DASHBOARD;
  const activeSection = options.activeSection || "";
  const footerText = options.footerText || "FinTrack 2026 · Panel asesor";

  // Carga todos los componentes en paralelo para mejor performance
  await Promise.all([
    mountTopbar(root, advisorName),
    mountSidebar(root, { advisorName, activeRoute, activeSection }),
    mountFooter(root, footerText),
  ]);
}
