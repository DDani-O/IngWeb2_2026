import { Component } from "../../core/Component.js";
import { Modal } from "./Modal.js";
import { RecommendationForm } from "./RecommendationForm.js";

/**
 * Organismo RecommendationDialog: compone Modal + RecommendationForm.
 * Lo usan el dashboard y la gestión de clientes del asesor.
 *
 * Props: recipients [{ id, fullName }], title.
 * Eventos: `recommendation-submit` { recommendation } (burbujea desde el formulario).
 * Métodos: open(clientId?), close(), setRecipients(list), setBusy(bool).
 */
export class RecommendationDialog extends Component {
  static DEFAULTS = { recipients: [], title: "Nueva recomendacion", idPrefix: "recommendationDialog" };

  render() {
    this.element.replaceChildren();
    this.modal = this.mountChild(Modal, this.element, { title: this.options.title });
    this.form = this.mountChild(RecommendationForm, this.modal.bodyElement, {
      recipients: this.options.recipients,
      idPrefix: this.options.idPrefix,
    });
  }

  /**
   * Abre el diálogo con el formulario limpio y, opcionalmente, un cliente preseleccionado.
   * @param {string} clientId
   */
  open(clientId = "") {
    this.form.setRecipients(this.options.recipients, clientId);
    this.modal.open();
  }

  close() {
    this.modal.close();
  }

  setRecipients(recipients) {
    this.options.recipients = recipients;
    this.form.setRecipients(recipients);
  }

  setBusy(busy) {
    this.form.setBusy(busy);
  }
}
