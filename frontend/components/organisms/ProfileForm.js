import { Component } from "../../core/Component.js";
import { html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { formField, formGrid } from "../molecules/formField.js";

/**
 * Organismo ProfileForm: formulario de perfil definido por un esquema de campos.
 * Lo usan el perfil del cliente y el del asesor. Emite `profile-submit` { values }
 * (strings, tal como vienen del formulario) y `profile-reset`.
 *
 * Props:
 * - fields: props de formField + name (ver molecules/formField.js)
 * - values: valores actuales por name
 * - idPrefix, submitLabel, extraActions (SafeHtml, p. ej. "Volver al panel")
 */
export class ProfileForm extends Component {
  static DEFAULTS = { fields: [], values: {}, idPrefix: "profile", submitLabel: "Guardar cambios", extraActions: null };

  render() {
    const { fields, values, idPrefix, submitLabel, extraActions } = this.options;

    this.element.innerHTML = html`
      <form class="profile-form" novalidate>
        ${formGrid(fields.map((field) => formField({ ...field, id: `${idPrefix}-${field.name}`, value: values[field.name] ?? "" })))}
        <div class="profile-form__actions">
          ${button({ label: submitLabel, type: "submit", icon: "fa-floppy-disk" })}
          ${button({ label: "Descartar cambios", variant: "ghost", icon: "fa-rotate-left", action: "reset" })}
          ${extraActions || ""}
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

      this.dispatch("profile-submit", { values: Object.fromEntries(new FormData(form).entries()) });
    });

    this.listen(this.element, "click", (event) => {
      if (event.target.closest('[data-action="reset"]')) {
        this.render();
        this.dispatch("profile-reset");
      }
    });
  }

  setBusy(busy) {
    const submit = this.element.querySelector('[type="submit"]');
    if (submit) {
      submit.disabled = busy;
    }
  }
}
