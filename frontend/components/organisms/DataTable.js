/** Organismo `DataTable` de la biblioteca de componentes; estilos en DataTable.css. */
import { Component } from "../../core/Component.js";
import { attrs, html } from "../../utils/html.js";
import { button } from "../atoms/button.js";
import { emptyState } from "../molecules/stateBlock.js";

/**
 * Organismo DataTable. En mobile cada fila se muestra como tarjeta (etiqueta: valor);
 * desde 768px es una tabla. Emite `row-action` { action, id, row } al tocar una acción.
 *
 * Props:
 * - columns: [{ key, label, render?(row) → texto|SafeHtml, align?: "start"|"end" }]
 * - rows: objetos con `rowKey` único
 * - actions: [{ action, label, variant? }] — botones por fila
 * - empty: { icon, title, message } — se muestra si no hay filas
 * - caption: descripción accesible de la tabla
 */
export class DataTable extends Component {
  static DEFAULTS = {
    columns: [],
    rows: [],
    rowKey: "id",
    actions: [],
    empty: { icon: "fa-magnifying-glass", title: "No hay datos para mostrar" },
    caption: "",
  };

  render() {
    const { columns, rows, rowKey, actions, empty, caption } = this.options;

    if (!rows.length) {
      this.element.innerHTML = emptyState(empty);
      return;
    }

    this.element.innerHTML = html`
      <div class="data-table-wrap">
        <table class="data-table">
          ${caption ? html`<caption class="visually-hidden">${caption}</caption>` : ""}
          <thead>
            <tr>
              ${columns.map((column) => html`<th ${attrs({ scope: "col", class: column.align === "end" ? "data-table__cell--end" : null })}>${column.label}</th>`)}
              ${actions.length ? html`<th scope="col"><span class="visually-hidden">Acciones</span></th>` : ""}
            </tr>
          </thead>
          <tbody>
            ${rows.map(
              (row) => html`
                <tr>
                  ${columns.map(
                    (column) => html`<td ${attrs({ "data-label": column.label, class: column.align === "end" ? "data-table__cell--end" : null })}>${column.render ? column.render(row) : row[column.key]}</td>`
                  )}
                  ${actions.length
                    ? html`<td class="data-table__actions">${actions.map((item) =>
                        button({ size: "sm", variant: item.variant || "ghost", label: item.label, action: item.action, id: row[rowKey] })
                      )}</td>`
                    : ""}
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  attachEvents() {
    this.listen(this.element, "click", (event) => {
      const trigger = event.target.closest("[data-action]");
      if (!trigger || !this.element.contains(trigger)) {
        return;
      }

      const id = trigger.dataset.id;
      const row = this.options.rows.find((item) => String(item[this.options.rowKey]) === id) || null;
      this.dispatch("row-action", { action: trigger.dataset.action, id, row, trigger });
    });
  }
}
