/** Página #/cliente/historial (cliente): listado de gastos con filtros, detalle, edición y baja. */
import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { FilterBar } from "../../components/organisms/FilterBar.js";
import { confirmExpenseDeletion } from "../../components/feedback/confirmExpenseDeletion.js";
import { Modal } from "../../components/organisms/Modal.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { EXPENSE_ORIGINS, ROUTES } from "../../utils/constants.js";
import { fillRoute } from "../../utils/helpers.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

const originBadge = (expense) => badge({ text: EXPENSE_ORIGINS[expense.origin] || expense.origin, tone: expense.origin === "ticket" ? "success" : "neutral" });

const SORT_OPTIONS = [
  { value: "fecha", label: "Mas reciente" },
  { value: "monto_desc", label: "Monto mayor" },
  { value: "monto_asc", label: "Monto menor" },
];

/**
 * Historial de gastos (consigna §4.4): listado con búsqueda, filtros, orden, detalle, edición y borrado.
 * El filtrado lo resuelve la API (GET /expenses con query).
 */
export class HistorialPage extends PageController {
  static template = "./pages/cliente/historial.html";

  render() {
    this.filters = this.mountChild(FilterBar, "#historyFilters", {
      idPrefix: "history",
      ariaLabel: "Filtrar gastos",
      fields: [
        { type: "search", name: "search", label: "Buscar", placeholder: "Comercio o descripcion" },
        { type: "select", name: "categoryId", label: "Categoria", options: [{ value: "", label: "Todas" }] },
        { type: "select", name: "origin", label: "Origen", options: [{ value: "", label: "Todos" }, ...Object.entries(EXPENSE_ORIGINS).map(([value, label]) => ({ value, label }))] },
        { type: "select", name: "sort", label: "Orden", options: SORT_OPTIONS },
      ],
    });
    this.table = this.mountChild(DataTable, "#historyTable", {
      caption: "Gastos registrados",
      columns: [
        { key: "date", label: "Fecha", render: (expense) => formatDate(expense.date) },
        { key: "merchant", label: "Comercio" },
        { key: "category", label: "Categoria" },
        { key: "amount", label: "Monto", align: "end", render: (expense) => formatCurrency(expense.amount) },
        { key: "origin", label: "Origen", render: originBadge },
      ],
      actions: [
        { action: "detail", label: "Detalle" },
        { action: "edit", label: "Editar" },
        { action: "delete", label: "Eliminar", variant: "danger" },
      ],
      empty: { icon: "fa-magnifying-glass", title: "No encontramos gastos para esos filtros", message: "Proba con otra categoria o borra la busqueda." },
    });
    this.detailModal = this.mountChild(Modal, "#historyDetailModal", { title: "Detalle del gasto" });

    this._loadData(async () => {
      const categories = await categoriesService.list();
      if (!this._isAlive()) {
        return;
      }

      this.filters.setOptions("categoryId", [{ value: "", label: "Todas" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]);
      await this._fetchExpenses();
    });
  }

  attachEvents() {
    this.listen(this.element, "filters-change", () => this._loadData(() => this._fetchExpenses()));
    this.listen(this.element, "row-action", (event) => this._handleRowAction(event.detail));
    this._bindDashboardBackButtons();
  }

  async _fetchExpenses() {
    const { items, total } = await expensesService.list(this.filters.getValues());
    if (!this._isAlive()) {
      return;
    }

    this._setText("#historyCount", `${total} movimientos`);
    this.table.update({ rows: items });
  }

  /** Acciones de cada fila de la tabla (delegadas por `DataTable`). */
  async _handleRowAction({ action, row: expense, trigger }) {
    if (!expense) {
      return;
    }
    const handlers = {
      detail: () => this._showDetail(expense),
      edit: () => this.options.router?.navigate(fillRoute(ROUTES.CLIENT_EDITAR_GASTO, { id: expense.id })),
      delete: () => this._deleteExpense(expense, trigger),
    };
    await handlers[action]?.();
  }

  _showDetail(expense) {
    this.detailModal.setContent(
      keyValueList({
        items: [
          { label: "Comercio", value: expense.merchant },
          { label: "Fecha", value: formatDate(expense.date) },
          { label: "Categoria", value: expense.category },
          { label: "Monto", value: formatCurrency(expense.amount) },
          { label: "Origen", value: originBadge(expense) },
          { label: "Descripcion", value: expense.description },
        ],
      })
    );
    this.detailModal.open();
  }

  /** Pide confirmación, borra y recarga la tabla con los mismos filtros. */
  async _deleteExpense(expense, trigger) {
    const confirmed = await confirmExpenseDeletion(expense);
    if (!confirmed || !this._isAlive()) {
      return;
    }

    const removed = await this._runAction(() => expensesService.remove(expense.id).then(() => true), {
      button: trigger,
      successMessage: "Gasto eliminado del historial.",
    });
    if (removed && this._isAlive()) {
      this._loadData(() => this._fetchExpenses());
    }
  }
}
