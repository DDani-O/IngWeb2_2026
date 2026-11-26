import { attrs, html } from "../../utils/html.js";

/**
 * Molécula FormField: label + control + ayuda, con ids enlazados para accesibilidad.
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} [props.name] por defecto, igual que id
 * @param {"text"|"email"|"number"|"date"|"password"|"select"|"textarea"} [props.type="text"]
 * @param {*} [props.value]
 * @param {{value: string, label: string}[]} [props.options] para type="select"
 * @param {string} [props.placeholderOption] primera opción vacía de un select
 * @param {boolean} [props.required]
 * @param {boolean} [props.readonly]
 * @param {string} [props.hint]
 * @param {"full"|"half"|"third"} [props.width="full"] ancho en pantallas medianas o más grandes
 * @param {object} [props.inputAttrs] atributos extra del control (min, max, step, rows, list, placeholder…)
 */
export function formField({
  id,
  label,
  name = id,
  type = "text",
  value = "",
  options = [],
  placeholderOption = null,
  required = false,
  readonly = false,
  hint = "",
  width = "full",
  inputAttrs = {},
} = {}) {
  const hintId = hint ? `${id}Hint` : null;
  const common = { id, name, required, readonly, "aria-describedby": hintId, ...inputAttrs };

  let control;
  if (type === "select") {
    control = html`
      <select ${attrs({ ...common, class: "form-select" })}>
        ${placeholderOption !== null ? html`<option value="">${placeholderOption}</option>` : ""}
        ${options.map((option) => html`<option ${attrs({ value: option.value, selected: String(option.value) === String(value) })}>${option.label}</option>`)}
      </select>
    `;
  } else if (type === "textarea") {
    control = html`<textarea ${attrs({ rows: 3, ...common, class: "form-control" })}>${value ?? ""}</textarea>`;
  } else {
    control = html`<input ${attrs({ ...common, type, value: value ?? "", class: "form-control" })} />`;
  }

  return html`
    <div class="form-field form-field--${width}">
      <label class="form-label" for="${id}">${label}</label>
      ${control}
      ${hint ? html`<small class="form-field__hint" id="${hintId}">${hint}</small>` : ""}
    </div>
  `;
}

/**
 * Contenedor de campos: una columna en mobile, grilla en pantallas medianas.
 * @param {*} fields SafeHtml de varios formField
 */
export function formGrid(fields) {
  return html`<div class="form-grid">${fields}</div>`;
}
