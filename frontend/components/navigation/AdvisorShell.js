import { getInitials } from "../../utils/helpers.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const ADVISOR_TOPBAR_TEMPLATE = "./components/layout/advisor-topbar.html";
const ADVISOR_SIDEBAR_TEMPLATE = "./components/navigation/advisor-sidebar.html";
const FOOTER_TEMPLATE = "./components/layout/app-footer-mini.html";

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

async function mountSidebar(root, advisorName) {
  const slot = root.querySelector("#advisorSidebarSlot");
  if (!slot) {
    return;
  }

  const template = await loadTemplate(ADVISOR_SIDEBAR_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    advisorName,
    advisorInitials: getInitials(advisorName) || "MR",
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
  const footerText = options.footerText || "FinTrack 2026 · Panel asesor";

  await Promise.all([
    mountTopbar(root, advisorName),
    mountSidebar(root, advisorName),
    mountFooter(root, footerText),
  ]);
}
