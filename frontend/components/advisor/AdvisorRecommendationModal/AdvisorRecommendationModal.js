/**
 * AdvisorRecommendationModal.js
 * Modal para crear nuevas recomendaciones para clientes.
 * Permite seleccionar cliente, tipo, descripcion y ahorro estimado.
 *
 * @module AdvisorRecommendationModal
 */

import { loadTemplate, renderTemplate } from "../../core/templateLoader.js";

// Configuración por defecto para el modal
const DEFAULT_OPTIONS = {
  slotSelector: "#advisorRecommendationModalSlot",
  modalId: "advisorRecommendationModal",
  labelId: "advisorRecommendationModalLabel",
  title: "Crear Nueva Recomendacion",
  formId: "advisorRecommendationForm",
  clientSelectId: "advisorRecommendationClient",
  typeSelectId: "advisorRecommendationType",
  descriptionId: "advisorRecommendationDescription",
  savingsId: "advisorRecommendationSavings",
  submitText: "Guardar y Enviar",
};

const ADVISOR_RECOMMENDATION_MODAL_TEMPLATE =
  "./components/advisor/AdvisorRecommendationModal/advisor-recommendation-modal.html";

/**
 * Monta el modal de recomendaciones en el contenedor especificado.
 *
 * @param {HTMLElement} root - Elemento raiz donde montar el modal
 * @param {object} options - Opciones de configuración del modal
 * @param {string} options.slotSelector - CSS selector del contenedor
 * @param {string} options.modalId - ID del elemento modal
 * @param {string} options.title - Título del modal
 *
 * @example
 * await mountAdvisorRecommendationModal(document.getElementById('app'), {
 *   title: 'Enviar Recomendacion'
 * });
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
  slot.innerHTML = renderTemplate(template, config);
}
