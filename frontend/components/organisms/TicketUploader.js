import { Component } from "../../core/Component.js";
import { html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { icon } from "../atoms/icon.js";

/**
 * Organismo TicketUploader: selección de la imagen del ticket por click, teclado o
 * arrastrar y soltar, con validación de tipo y tamaño. Emite `ticket-analyze` { file }.
 *
 * Props: accept (por defecto "image/*"), maxSizeMb (por defecto 5), inputId.
 */
export class TicketUploader extends Component {
  static DEFAULTS = { accept: "image/*", maxSizeMb: 5, inputId: "ticketFile" };

  render() {
    const { accept, maxSizeMb, inputId } = this.options;
    this.file = null;

    this.element.innerHTML = html`
      <div class="ticket-uploader">
        <input class="visually-hidden" type="file" id="${inputId}" accept="${accept}" tabindex="-1" aria-hidden="true" />
        <button class="ticket-uploader__dropzone" type="button" data-role="dropzone" aria-describedby="${inputId}Help">
          ${icon({ name: "fa-cloud-arrow-up" })}
          <span data-role="file-name">Arrastra la imagen del ticket o toca para elegirla</span>
        </button>
        <small class="ticket-uploader__help" id="${inputId}Help">Imagen JPG, PNG o WEBP de hasta ${maxSizeMb} MB.</small>
        <p class="ticket-uploader__error" data-role="error" role="alert" hidden></p>
        ${button({ label: "Analizar ticket", icon: "fa-wand-magic-sparkles", action: "analyze", block: true })}
      </div>
    `;
  }

  attachEvents() {
    // Delegación en el elemento raíz: sigue funcionando después de reset() (que vuelve a renderizar).
    const dropzoneOf = (event) => event.target.closest('[data-role="dropzone"]');

    this.listen(this.element, "change", (event) => {
      if (event.target.matches('input[type="file"]')) {
        this._select(event.target.files?.[0] || null);
      }
    });

    this.listen(this.element, "dragover", (event) => {
      const dropzone = dropzoneOf(event);
      if (dropzone) {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
      }
    });
    this.listen(this.element, "dragleave", (event) => dropzoneOf(event)?.classList.remove("is-dragging"));
    this.listen(this.element, "drop", (event) => {
      const dropzone = dropzoneOf(event);
      if (dropzone) {
        event.preventDefault();
        dropzone.classList.remove("is-dragging");
        this._select(event.dataTransfer?.files?.[0] || null);
      }
    });

    this.listen(this.element, "click", (event) => {
      if (dropzoneOf(event)) {
        this.element.querySelector('input[type="file"]').click();
        return;
      }

      if (!event.target.closest('[data-action="analyze"]')) {
        return;
      }

      if (!this.file) {
        this._showError("Selecciona una imagen del ticket para analizar.");
        return;
      }

      this.dispatch("ticket-analyze", { file: this.file });
    });
  }

  /** Indica que el análisis está en curso (deshabilita el botón). */
  setBusy(busy) {
    const analyze = this.element.querySelector('[data-action="analyze"]');
    if (analyze) {
      analyze.disabled = busy;
      analyze.querySelector("span").textContent = busy ? "Analizando..." : "Analizar ticket";
    }
  }

  /** Vuelve al estado inicial (sin archivo). */
  reset() {
    this.render();
  }

  _select(file) {
    this._showError("");
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      this._showError("El archivo tiene que ser una imagen.");
      return;
    }

    if (file.size > this.options.maxSizeMb * 1024 * 1024) {
      this._showError(`La imagen supera los ${this.options.maxSizeMb} MB.`);
      return;
    }

    this.file = file;
    this.element.querySelector('[data-role="file-name"]').textContent = `Archivo seleccionado: ${file.name}`;
  }

  _showError(message) {
    const node = this.element.querySelector('[data-role="error"]');
    node.textContent = message;
    node.hidden = !message;
  }
}
