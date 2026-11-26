import { Component } from "../../core/Component.js";
import { UI_TIMING } from "../../utils/constants.js";
import { debounce } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";
import { formField } from "../molecules/formField.js";

/**
 * Organismo FilterBar: búsqueda y selects. Emite `filters-change` { values } (la búsqueda
 * con debounce). El filtrado lo hace el padre o la API.
 *
 * Props:
 * - fields: [{ type: "search"|"select", name, label, placeholder?, options?: [{value,label}] }]
 * - values: valores iniciales por name
 * - idPrefix: prefijo de ids (para tener dos barras en la misma página)
 */
export class FilterBar extends Component {
  static DEFAULTS = {
    fields: [],
    values: {},
    idPrefix: "filter",
    debounceMs: UI_TIMING.SEARCH_DEBOUNCE_MS,
    ariaLabel: "Filtros",
  };

  constructor(element, options) {
    super(element, options);
    this._emitDebounced = debounce(() => this._emit(), this.options.debounceMs);
  }

  render() {
    const { fields, values, idPrefix, ariaLabel } = this.options;

    this.element.innerHTML = html`
      <form class="filter-bar" role="search" aria-label="${ariaLabel}" novalidate>
        ${fields.map((field) =>
          formField({
            id: `${idPrefix}-${field.name}`,
            name: field.name,
            label: field.label,
            type: field.type === "search" ? "search" : "select",
            value: values[field.name] ?? "",
            options: field.options || [],
            inputAttrs: field.type === "search" ? { placeholder: field.placeholder || "", autocomplete: "off" } : {},
          })
        )}
      </form>
    `;
  }

  attachEvents() {
    this.listen(this.element, "input", (event) => {
      if (event.target.type === "search") {
        this._emitDebounced();
      }
    });
    this.listen(this.element, "change", (event) => {
      if (event.target.tagName === "SELECT") {
        this._emit();
      }
    });
    this.listen(this.element, "submit", (event) => {
      event.preventDefault();
      this._emit();
    });
  }

  /** Valores actuales por name. */
  getValues() {
    const form = this.element.querySelector("form");
    return form ? Object.fromEntries(new FormData(form).entries()) : {};
  }

  /**
   * Reemplaza las opciones de un select manteniendo los demás valores (p. ej. categorías de la API).
   */
  setOptions(name, options) {
    const values = this.getValues();
    const fields = this.options.fields.map((field) => (field.name === name ? { ...field, options } : field));
    this.update({ fields, values });
  }

  _emit() {
    this.dispatch("filters-change", { values: this.getValues() });
  }
}
