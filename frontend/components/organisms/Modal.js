import { Component } from "../../core/Component.js";
import { html } from "../../utils/html.js";

let modalCounter = 0;

/**
 * Organismo Modal: envuelve el modal de Bootstrap. El contenido se inyecta en el slot del
 * cuerpo con `setContent()` (SafeHtml) o `bodyElement` (para montar otro componente adentro).
 * Emite `modal-close` cuando termina de cerrarse.
 *
 * Props: title, size ("sm" | "md" | "lg"), body (SafeHtml inicial), footer (SafeHtml opcional).
 */
export class Modal extends Component {
  static DEFAULTS = { title: "", size: "md", body: null, footer: null };

  constructor(element, options) {
    super(element, options);
    modalCounter += 1;
    this.modalId = `appModal${modalCounter}`;
  }

  render() {
    const { title, size, body, footer } = this.options;
    const sizeClass = size === "lg" ? "modal-lg" : size === "sm" ? "modal-sm" : "";

    this.element.innerHTML = html`
      <div class="modal fade app-modal" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass}">
          <div class="modal-content app-modal-surface">
            <div class="modal-header">
              <h2 class="modal-title" id="${this.modalId}Title" data-modal-title>${title}</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body" data-modal-body>${body || ""}</div>
            ${footer ? html`<div class="modal-footer" data-modal-footer>${footer}</div>` : ""}
          </div>
        </div>
      </div>
    `;
    this._root = this.element.querySelector(".modal");
  }

  attachEvents() {
    this.listen(this._root, "hidden.bs.modal", () => this.dispatch("modal-close"));
  }

  /** Nodo del cuerpo, para montar un componente hijo adentro. */
  get bodyElement() {
    return this.element.querySelector("[data-modal-body]");
  }

  setTitle(title) {
    const node = this.element.querySelector("[data-modal-title]");
    if (node) {
      node.textContent = title;
    }
  }

  /** @param {*} content SafeHtml */
  setContent(content) {
    this.bodyElement.innerHTML = html`${content}`;
  }

  open() {
    this._instance()?.show();
  }

  close() {
    this._instance()?.hide();
  }

  /**
   * Libera el modal. Si está abierto o cerrándose (p. ej. se navega justo después de
   * enviar un formulario), espera a que Bootstrap termine el cierre: liberarlo en medio
   * de la transición tira un error y puede dejar el fondo oscuro sobre la página.
   */
  destroy() {
    const instance = window.bootstrap && this._root ? window.bootstrap.Modal.getInstance(this._root) : null;
    const visible = this._root && (this._root.classList.contains("show") || this._root.style.display === "block");

    if (instance && visible) {
      this._root.addEventListener("hidden.bs.modal", () => instance.dispose(), { once: true });
      instance.hide();
    } else {
      instance?.dispose();
    }
    super.destroy();
  }

  _instance() {
    return window.bootstrap && this._root ? window.bootstrap.Modal.getOrCreateInstance(this._root) : null;
  }
}

/**
 * Diálogo de confirmación (reemplaza window.confirm).
 * @param {{title?: string, message: string, confirmLabel?: string, cancelLabel?: string, tone?: "danger"|"primary"}} props
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title = "Confirmar", message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "danger" } = {}) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.append(host);

    let answered = false;
    const modal = new Modal(host, {
      title,
      size: "sm",
      body: html`<p>${message}</p>`,
      footer: html`
        <button class="action-btn action-btn--ghost action-btn--sm" type="button" data-confirm="no">${cancelLabel}</button>
        <button class="action-btn action-btn--${tone === "danger" ? "danger" : "primary"} action-btn--sm" type="button" data-confirm="yes">${confirmLabel}</button>
      `,
    });
    modal.mount();

    const finish = (value) => {
      if (!answered) {
        answered = true;
        resolve(value);
      }
    };

    host.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-confirm]")?.dataset.confirm;
      if (choice) {
        finish(choice === "yes");
        modal.close();
      }
    });
    host.addEventListener("modal-close", () => {
      finish(false);
      modal.destroy();
      host.remove();
    });

    modal.open();
  });
}
