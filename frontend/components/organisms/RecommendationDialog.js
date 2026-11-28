/** Organismo `RecommendationDialog` de la biblioteca de componentes (sin estilos propios). */
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
  /** Abre el formulario; con `clientId`, ese cliente queda elegido. */
  open(clientId = "") {
    this.form.setRecipients(this.options.recipients, clientId);
    this.modal.open();
  }

  /** Cierra el diálogo. */
  close() {
    this.modal.close();
  }

  /** Clientes que se pueden elegir como destinatarios. @param {{id: string, fullName: string}[]} recipients */
  setRecipients(recipients) {
    this.options.recipients = recipients;
    this.form.setRecipients(recipients);
  }

  /** Bloquea el envío mientras se guarda. */
  setBusy(busy) {
    this.form.setBusy(busy);
  }
}
