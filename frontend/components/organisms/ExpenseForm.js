import { Component } from "../../core/Component.js";
import { todayIsoDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { formField, formGrid } from "../molecules/formField.js";

/**
 * Organismo ExpenseForm: datos de un gasto (consigna §4.2: comercio, fecha, monto, categoría,
 * descripción). Lo usan la carga y la edición de gastos.
 *
 * Props: categories [{ id, name, icon }], values { merchant, amount, categoryId, date, description },
 *        suggestions (comercios para autocompletar), idPrefix, submitLabel,
 *        secondaryAction { label, icon } (botón secundario: limpiar o cancelar).
 * Eventos: `expense-submit` { values }, `expense-change` { values }, `expense-secondary`.
 */
export class ExpenseForm extends Component {
  static DEFAULTS = {
    categories: [],
    values: {},
    suggestions: [],
    idPrefix: "expense",
    submitLabel: "Guardar gasto",
    secondaryAction: null,
  };

  render() {
    const { categories, values, suggestions, idPrefix, submitLabel, secondaryAction } = this.options;
    const id = (name) => `${idPrefix}-${name}`;
    const listId = id("merchants");

    this.element.innerHTML = html`
      <form class="expense-form" novalidate>
        ${formGrid(html`
          ${formField({ id: id("merchant"), name: "merchant", label: "Comercio", required: true, width: "half", value: values.merchant, inputAttrs: { list: listId, autocomplete: "off", maxlength: 100 } })}
          ${formField({ id: id("amount"), name: "amount", label: "Monto", type: "number", required: true, width: "half", value: values.amount, inputAttrs: { min: "0.01", step: "0.01", inputmode: "decimal" } })}
          ${formField({ id: id("category"), name: "categoryId", label: "Categoria", type: "select", required: true, width: "half", value: values.categoryId, placeholderOption: "Seleccionar categoria", options: categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` })) })}
          ${formField({ id: id("date"), name: "date", label: "Fecha", type: "date", required: true, width: "half", value: values.date || todayIsoDate(), inputAttrs: { max: todayIsoDate() } })}
          ${formField({ id: id("description"), name: "description", label: "Descripcion", type: "textarea", value: values.description, inputAttrs: { placeholder: "Ej: compra semanal, combustible, etc.", maxlength: 300 } })}
        `)}
        <datalist id="${listId}">${suggestions.map((merchant) => html`<option value="${merchant}"></option>`)}</datalist>
        <div class="section-actions">
          ${button({ label: submitLabel, type: "submit", icon: "fa-floppy-disk" })}
          ${secondaryAction ? button({ label: secondaryAction.label, icon: secondaryAction.icon, variant: "ghost", action: "secondary" }) : ""}
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
      this.dispatch("expense-submit", { values: this.getValues() });
    });

    const emitChange = () => this.dispatch("expense-change", { values: this.getValues() });
    this.listen(this.element, "input", emitChange);
    this.listen(this.element, "change", emitChange);

    this.listen(this.element, "click", (event) => {
      if (event.target.closest('[data-action="secondary"]')) {
        this.dispatch("expense-secondary");
      }
    });
  }

  /** Valores actuales con el modelo de expensesService (monto como número). */
  getValues() {
    const form = this.element.querySelector("form");
    const values = form ? Object.fromEntries(new FormData(form).entries()) : {};
    return {
      merchant: (values.merchant || "").trim(),
      amount: values.amount === "" || values.amount === undefined ? "" : Number(values.amount),
      categoryId: values.categoryId || "",
      date: values.date || "",
      description: (values.description || "").trim(),
    };
  }

  setBusy(busy) {
    const submit = this.element.querySelector('[type="submit"]');
    if (submit) {
      submit.disabled = busy;
    }
  }
}
