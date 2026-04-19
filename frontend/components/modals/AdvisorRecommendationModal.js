import { loadTemplate, renderTemplate } from "../core/templateLoader.js";

const ADVISOR_RECOMMENDATION_MODAL_TEMPLATE =
  "./components/modals/advisor-recommendation-modal.html";

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
