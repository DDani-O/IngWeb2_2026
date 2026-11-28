/** Molécula `alertItem` de la biblioteca de componentes; estilos en alertItem.css. */
import { attrs, html } from "../../utils/html.js";

const DEFAULT_EMOJI = { danger: "⚠️", warning: "📈", success: "✅", info: "💡" };

/**
 * Molécula AlertItem: aviso con tono (alertas del análisis, insights, gastos inusuales).
 * @param {{title: string, description?: string, tone?: "info"|"success"|"warning"|"danger", emoji?: string, extra?: *}} props
 *   `extra`: contenido adicional (SafeHtml) debajo de la descripción.
 */
export function alertItem({ title, description = "", tone = "info", emoji = null, extra = null } = {}) {
  return html`
    <article ${attrs({ class: `alert-item alert-item--${tone}`, role: tone === "danger" ? "alert" : null })}>
      <span class="alert-item__emoji" aria-hidden="true">${emoji ?? DEFAULT_EMOJI[tone] ?? "💡"}</span>
      <div>
        <h3 class="alert-item__title">${title}</h3>
        ${description ? html`<p class="alert-item__description">${description}</p>` : ""}
        ${extra || ""}
      </div>
    </article>
  `;
}
