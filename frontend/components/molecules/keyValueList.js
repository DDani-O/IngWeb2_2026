import { html } from "../../utils/html.js";

/**
 * Molécula KeyValueList: pares etiqueta/valor como lista de definición.
 * @param {{items: {label: string, value: *}[], variant?: "rows"|"boxed"}} props
 *   `value` puede ser texto o SafeHtml (por ejemplo, un badge).
 */
export function keyValueList({ items = [], variant = "rows" } = {}) {
  return html`
    <dl class="kv-list kv-list--${variant}">
      ${items.map(
        ({ label, value }) => html`
          <div class="kv-list__item">
            <dt>${label}</dt>
            <dd>${value === null || value === undefined || value === "" ? "-" : value}</dd>
          </div>
        `
      )}
    </dl>
  `;
}
