import { Component } from "../../core/Component.js";
import { attrs, html } from "../../utils/html.js";
import { icon } from "../atoms/icon.js";

/**
 * Organismo ViewToggle: selector de vista (botones segmentados con aria-pressed).
 * Emite `view-change` { value }. El padre decide qué mostrar.
 * Props: modes [{ value, label, icon }], value, label (nombre accesible del grupo).
 */
export class ViewToggle extends Component {
  static DEFAULTS = { modes: [], value: "", label: "Vista" };

  render() {
    const { modes, value, label } = this.options;
    this.element.innerHTML = html`
      <div class="view-toggle" role="group" aria-label="${label}">
        ${modes.map(
          (mode) => html`<button ${attrs({ type: "button", class: "view-toggle__option", "data-value": mode.value, "aria-pressed": String(mode.value === value) })}>${icon({ name: mode.icon })}<span>${mode.label}</span></button>`
        )}
      </div>
    `;
  }

  attachEvents() {
    this.listen(this.element, "click", (event) => {
      const option = event.target.closest("[data-value]");
      if (option && option.dataset.value !== this.options.value) {
        this.update({ value: option.dataset.value });
        this.dispatch("view-change", { value: option.dataset.value });
      }
    });
  }
}
