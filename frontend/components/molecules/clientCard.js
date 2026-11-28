/** Molécula `clientCard` y las columnas y vistas de la lista de clientes del asesor; estilos en clientCard.css. */
import { RISK_LEVELS } from "../../utils/constants.js";
import { formatCurrency, formatDaysAgo } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";
import { avatar } from "../atoms/avatar.js";
import { badge } from "../atoms/badge.js";
import { button } from "../atoms/button.js";
import { trend } from "../atoms/trend.js";
import { keyValueList } from "./keyValueList.js";

/**
 * Molécula ClientCard: resumen de un cliente para el asesor.
 * Las acciones son botones con data-action/data-id; el padre las atiende por delegación.
 * @param {{client: object, actions?: {action: string, label: string, variant?: string, href?: string}[]}} props
 *   `client`: modelo de clientsService (fullName, spendingProfile, riskLevel, lastExpenseDate, monthlyAverage, changePercent).
 */
export function clientCard({ client, actions = [] } = {}) {
  const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;

  return html`
    <article class="client-card">
      <header class="client-card__head">
        ${avatar({ name: client.fullName, size: "md" })}
        <div class="client-card__identity">
          <p class="client-card__name">${client.fullName}</p>
          <p class="client-card__profile">${client.spendingProfile?.name || "Sin perfil"}</p>
        </div>
        ${badge({ text: `Riesgo ${risk.label.toLowerCase()}`, tone: risk.tone })}
      </header>

      ${keyValueList({
        variant: "boxed",
        items: [
          { label: "Ultimo gasto", value: formatDaysAgo(client.lastExpenseDate) },
          { label: "Promedio mensual", value: formatCurrency(client.monthlyAverage) },
          { label: "Vs. mes anterior", value: trend({ value: client.changePercent }) },
        ],
      })}

      ${actions.length
        ? html`<div class="client-card__actions">${actions.map((item) =>
            button({ size: "sm", variant: item.variant || "ghost", label: item.label, action: item.action, id: client.id, href: item.href || null })
          )}</div>`
        : ""}
    </article>
  `;
}

/** Columnas de la tabla de clientes (dashboard y gestión de clientes del asesor; para el organismo DataTable). */
export const CLIENT_TABLE_COLUMNS = [
  { key: "fullName", label: "Cliente", render: (client) => html`<span class="d-inline-flex align-items-center gap-2">${avatar({ name: client.fullName, size: "sm" })}${client.fullName}</span>` },
  { key: "profile", label: "Perfil", render: (client) => client.spendingProfile?.name || "Sin perfil" },
  { key: "lastExpenseDate", label: "Ultimo gasto", render: (client) => formatDaysAgo(client.lastExpenseDate) },
  { key: "monthlyAverage", label: "Promedio", align: "end", render: (client) => formatCurrency(client.monthlyAverage) },
  { key: "changePercent", label: "Vs. mes anterior", render: (client) => trend({ value: client.changePercent }) },
  {
    key: "riskLevel",
    label: "Riesgo",
    render: (client) => {
      const risk = RISK_LEVELS[client.riskLevel] || RISK_LEVELS.bajo;
      return badge({ text: risk.label, tone: risk.tone });
    },
  },
];

/** Opciones del selector de vista de clientes. */
export const CLIENT_VIEW_MODES = [
  { value: "cards", label: "Tarjetas", icon: "fa-border-all" },
  { value: "table", label: "Tabla", icon: "fa-table" },
];

