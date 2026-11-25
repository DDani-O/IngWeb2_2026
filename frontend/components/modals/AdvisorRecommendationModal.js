import { RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../../utils/constants.js";
import { html } from "../../utils/html.js";
import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const ADVISOR_RECOMMENDATION_MODAL_TEMPLATE =
  "./components/modals/advisor-recommendation-modal.html";

const DEFAULT_OPTIONS = {
  slotSelector: "#advisorRecommendationModalSlot",
  // Prefijo de los ids internos: {prefijo}Modal, {prefijo}Form, {prefijo}Client, etc.
  idPrefix: "advisorRecommendation",
  title: "Crear Nueva Recomendacion",
  submitText: "Guardar y Enviar",
  defaultPriority: "media",
};

/**
 * Inyecta el modal de nueva recomendación en el slot indicado.
 * Los campos coinciden con la tabla recomendaciones_financieras (titulo, tipo, prioridad, mensaje).
 */
export async function mountAdvisorRecommendationModal(root, options = {}) {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const slot = root.querySelector(config.slotSelector);
  if (!slot) {
    return;
  }

  const template = await loadTemplate(ADVISOR_RECOMMENDATION_MODAL_TEMPLATE);
  slot.innerHTML = renderTemplate(template, {
    idPrefix: config.idPrefix,
    title: config.title,
    submitText: config.submitText,
    typeOptions: html`${RECOMMENDATION_TYPES.map(
      (type) => html`<option value="${type.value}">${type.label}</option>`
    )}`,
    priorityOptions: html`${RECOMMENDATION_PRIORITIES.map(
      (priority) =>
        html`<option value="${priority.value}" ${priority.value === config.defaultPriority ? html`selected` : ""}>${priority.label}</option>`
    )}`,
  });
}
