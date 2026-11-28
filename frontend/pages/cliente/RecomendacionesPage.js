/** Página #/cliente/recomendaciones (cliente): recomendaciones recibidas, con filtros y marca de leída. */
import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { recommendationCard, recommendationLabels } from "../../components/molecules/recommendationCard.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { FilterBar } from "../../components/organisms/FilterBar.js";
import { Modal } from "../../components/organisms/Modal.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { PRIORITY_TONES, RECOMMENDATION_PRIORITIES, RECOMMENDATION_TYPES } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

const PRIORITY_WEIGHT = { alta: 3, media: 2, baja: 1 };
const ALL = [{ value: "", label: "Todas" }];

/**
 * Recomendaciones recibidas por el cliente (del sistema o de su asesor).
 * Modelo alineado con recomendaciones_financieras: titulo, mensaje, tipo, prioridad, origen, leida.
 */
export class RecomendacionesPage extends PageController {
  static template = "./pages/cliente/recomendaciones.html";

  constructor(element, options = {}) {
    super(element, options);
    this.recommendations = [];
  }

  render() {
    this.filters = this.mountChild(FilterBar, "#recommendationFilters", {
      idPrefix: "recommendations",
      ariaLabel: "Filtrar recomendaciones",
      fields: [
        { type: "select", name: "priority", label: "Prioridad", options: [...ALL, ...RECOMMENDATION_PRIORITIES] },
        { type: "select", name: "type", label: "Tipo", options: [{ value: "", label: "Todos" }, ...RECOMMENDATION_TYPES] },
        { type: "select", name: "read", label: "Estado", options: [...ALL, { value: "no", label: "Sin leer" }, { value: "si", label: "Leidas" }] },
        { type: "select", name: "sort", label: "Ordenar", options: [{ value: "fecha", label: "Mas reciente" }, { value: "prioridad", label: "Por prioridad" }] },
      ],
    });
    this.detailModal = this.mountChild(Modal, "#recommendationDetailModal", { title: "Detalle de la recomendacion", size: "lg" });

    this._loadData(async () => {
      const recommendations = await recommendationsService.listMine();
      if (!this._isAlive()) {
        return;
      }

      this.recommendations = recommendations;
      this._renderGroups();
    });
  }

  attachEvents() {
    this.listen(this.element, "filters-change", () => this._renderGroups());
    this.listen(this.element.querySelector("#recommendationGroups"), "click", (event) => this._handleAction(event));
    this._bindDashboardBackButtons();
  }

  _filtered() {
    const { priority = "", type = "", read = "", sort = "fecha" } = this.filters.getValues();

    const result = this.recommendations.filter(
      (item) => (!priority || item.priority === priority) && (!type || item.type === type) && (!read || item.read === (read === "si"))
    );

    return sort === "prioridad"
      ? result.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
      : result.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  _renderGroups() {
    const visible = this._filtered();
    const unread = visible.filter((item) => !item.read);
    const unreadTotal = this.recommendations.filter((item) => !item.read).length;
    this._setText("#recommendationCount", `${visible.length} recomendaciones · ${unreadTotal} sin leer`);

    const renderGroup = (selector, items, emptyTitle) => {
      this.element.querySelector(selector).innerHTML = items.length
        ? html`${items.map((item) =>
            recommendationCard({
              recommendation: item,
              actions: [
                ...(item.read ? [] : [{ action: "read", label: "Marcar como leida", variant: "primary" }]),
                { action: "detail", label: "Ver detalle" },
              ],
            })
          )}`
        : emptyState({ icon: "fa-lightbulb", title: emptyTitle });
    };

    renderGroup("#recommendationsHigh", unread.filter((item) => item.priority === "alta"), "No hay recomendaciones de prioridad alta sin leer.");
    renderGroup("#recommendationsOther", unread.filter((item) => item.priority !== "alta"), "No hay otras recomendaciones sin leer.");
    renderGroup("#recommendationsRead", visible.filter((item) => item.read), "Todavia no leiste recomendaciones de este filtro.");
  }

  async _handleAction(event) {
    const trigger = event.target.closest("[data-action]");
    const recommendation = trigger && this.recommendations.find((item) => item.id === trigger.dataset.id);
    if (!recommendation) {
      return;
    }

    if (trigger.dataset.action === "detail") {
      this.detailModal.setTitle(recommendation.title);
      this.detailModal.setContent(html`
        <p class="mb-3">${recommendation.message}</p>
        ${keyValueList({
          items: [
            { label: "Tipo", value: recommendationLabels.type(recommendation.type) },
            { label: "Prioridad", value: badge({ text: recommendationLabels.priority(recommendation.priority), tone: PRIORITY_TONES[recommendation.priority] }) },
            { label: "Origen", value: recommendationLabels.origin(recommendation) },
            { label: "Fecha", value: formatDate(recommendation.date) },
          ],
        })}
      `);
      this.detailModal.open();
      return;
    }

    if (trigger.dataset.action === "read") {
      const updated = await this._runAction(() => recommendationsService.markAsRead(recommendation.id), {
        button: trigger,
        successMessage: "Recomendacion marcada como leida.",
      });

      if (updated && this._isAlive()) {
        this.recommendations = this.recommendations.map((item) => (item.id === updated.id ? updated : item));
        this._renderGroups();
      }
    }
  }
}
