import { ROUTES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const ADVISOR_TOPBAR_TEMPLATE = "./components/layout/advisor-topbar.html";
const ADVISOR_SIDEBAR_TEMPLATE = "./components/navigation/advisor-sidebar.html";
const FOOTER_TEMPLATE = "./components/layout/app-footer-mini.html";

function buildLink({ href, icon, label, classes = "" }) {
  const className = ["sidebar-link", classes].filter(Boolean).join(" ");
  return `<a class="${className}" href="${href}"><i class="fa-solid ${icon}"></i>${label}</a>`;
}

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

export async function mountAdvisorShell(root, options = {}) {
  const advisorName = options.advisorName || "Maria Rodriguez";
  const activeRoute = options.activeRoute || ROUTES.ADVISOR_DASHBOARD;
  const activeSection = options.activeSection || "";
  const footerText = options.footerText || "FinTrack 2026 · Panel asesor";

  await Promise.all([
    mountTopbar(root, advisorName),
    mountSidebar(root, { advisorName, activeRoute, activeSection }),
    mountFooter(root, footerText),
  ]);
}
