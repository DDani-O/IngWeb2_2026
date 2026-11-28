import { Component } from "../../core/Component.js";
import { RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../../utils/constants.js";
import { html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { formField, formGrid } from "../molecules/formField.js";

/**
 * Organismo RecommendationForm: alta de recomendación del asesor (tabla recomendaciones_financieras).
 * Emite `recommendation-submit` { recommendation: { clientId, title, type, priority, message } }.
 *
 * Props: recipients [{ id, fullName }], selectedId, idPrefix, busy.
 */
export class RecommendationForm extends Component {
  static DEFAULTS = { recipients: [], selectedId: "", idPrefix: "recommendation", busy: false };

  render() {
    const { recipients, selectedId, idPrefix, busy } = this.options;
    const id = (name) => `${idPrefix}-${name}`;

    this.element.innerHTML = html`
      <form class="recommendation-form" novalidate>
        ${formGrid(html`
          ${formField({ id: id("client"), name: "clientId", label: "Cliente", type: "select", required: true, value: selectedId, placeholderOption: "Seleccionar cliente", options: recipients.map((client) => ({ value: client.id, label: client.fullName })) })}
          ${formField({ id: id("title"), name: "title", label: "Titulo", required: true, inputAttrs: { maxlength: 120 } })}
          ${formField({ id: id("type"), name: "type", label: "Tipo", type: "select", required: true, width: "half", placeholderOption: "Seleccionar tipo", options: RECOMMENDATION_TYPES })}
          ${formField({ id: id("priority"), name: "priority", label: "Prioridad", type: "select", required: true, width: "half", value: "media", options: RECOMMENDATION_PRIORITIES })}
          ${formField({ id: id("message"), name: "message", label: "Mensaje", type: "textarea", required: true, inputAttrs: { rows: 4, maxlength: 2000 } })}
        `)}
        <div class="recommendation-form__actions">
          ${button({ label: busy ? "Enviando..." : "Guardar y enviar", type: "submit", icon: "fa-paper-plane", disabled: busy })}
        </div>
      </form>
    `;
  }

  attachEvents() {
    this.listen(this.element, "submit", (event) => {
      event.preventDefault();
      const form = event.target;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const values = Object.fromEntries(new FormData(form).entries());
      this.dispatch("recommendation-submit", {
        recommendation: {
          clientId: values.clientId,
          title: values.title.trim(),
          type: values.type,
          priority: values.priority,
          message: values.message.trim(),
        },
      });
    });
  }

  /** Cambia el cliente preseleccionado y la lista de destinatarios. */
  /** Opciones de destinatario y el elegido. */
  setRecipients(recipients, selectedId = "") {
    this.update({ recipients, selectedId });
  }

  /** Bloquea el envío y muestra "Enviando...". */
  setBusy(busy) {
    const submit = this.element.querySelector('[type="submit"]');
    if (submit) {
      submit.disabled = busy;
      submit.querySelector("span").textContent = busy ? "Enviando..." : "Guardar y enviar";
    }
  }

  /** Vuelve al formulario vacío, sin destinatario elegido. */
  reset() {
    this.update({ selectedId: "" });
  }
}
