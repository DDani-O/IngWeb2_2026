import { PageController } from "../../core/PageController.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { EXPENSE_ORIGINS, UI_TIMING } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { debounce, getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Historial de gastos (consigna §4.4): listado con búsqueda, filtros, orden, detalle y borrado.
 * El filtrado lo resuelve la API (GET /expenses con query).
 */
export class HistorialPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.expenses = [];
    this._debouncedReload = debounce(() => this._reload(), UI_TIMING.SEARCH_DEBOUNCE_MS);
  }

  render() {
    this._resetViewPosition();

    const userName = this.options.authManager?.getCurrentUser()?.fullName || "";
    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._loadData(async () => {
      const categories = await categoriesService.list();
      if (!this._isAlive()) {
        return;
      }

      this._renderCategoryOptions(categories);
      await this._fetchExpenses();
    });
  }

  attachEvents() {
    this.listen(this.element.querySelector("#historySearchInput"), "input", () => this._debouncedReload());
    ["#historyCategoryFilter", "#historyOriginFilter", "#historySortFilter"].forEach((selector) => {
      this.listen(this.element.querySelector(selector), "change", () => this._reload());
    });

    this.listen(this.element.querySelector("#historyTableBody"), "click", (event) => this._handleTableAction(event));

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderCategoryOptions(categories) {
    const select = this.element.querySelector("#historyCategoryFilter");
    if (!select) {
      return;
    }

    select.innerHTML = html`
      <option value="">Todas</option>
      ${categories.map((category) => html`<option value="${category.id}">${category.name}</option>`)}
    `;
  }

  _currentFilters() {
    return {
      search: this._getValue("#historySearchInput"),
      categoryId: this._getValue("#historyCategoryFilter"),
      origin: this._getValue("#historyOriginFilter"),
      sort: this._getValue("#historySortFilter") || "fecha",
    };
  }

  async _fetchExpenses() {
    const { items, total } = await expensesService.list(this._currentFilters());
    if (!this._isAlive()) {
      return;
    }

    this.expenses = items;
    this._renderTable(total);
  }

  _reload() {
    return this._loadData(() => this._fetchExpenses());
  }

  _renderTable(total) {
    const tableBody = this.element.querySelector("#historyTableBody");
    const emptyState = this.element.querySelector("#historyEmptyState");

    if (!tableBody || !emptyState) {
      return;
    }

    this._setText("#historyCountLabel", `${total} movimientos`);
    emptyState.classList.toggle("app-hidden", this.expenses.length > 0);

    tableBody.innerHTML = html`${this.expenses.map(
      (expense) => html`
        <tr>
          <td>${formatDate(expense.date)}</td>
          <td>${expense.merchant}</td>
          <td>${expense.category}</td>
          <td>${formatCurrency(expense.amount)}</td>
          <td>
            <span class="badge-soft ${expense.origin === "ticket" ? "badge-soft--success" : "badge-soft--warning"}">${EXPENSE_ORIGINS[expense.origin] || expense.origin}</span>
          </td>
          <td>
            <div class="history-row-actions">
              <button class="action-btn action-btn--ghost" data-action="detail" data-id="${expense.id}" type="button">Detalle</button>
              <button class="action-btn action-btn--ghost" data-action="delete" data-id="${expense.id}" type="button">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )}`;
  }

  async _handleTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const expense = this.expenses.find((item) => item.id === actionButton.dataset.id);
    if (!expense) {
      return;
    }

    if (actionButton.dataset.action === "detail") {
      this._openDetailModal(expense);
      return;
    }

    if (actionButton.dataset.action === "delete") {
      const confirmed = window.confirm(`Se eliminara el gasto de ${expense.merchant}. Quieres continuar?`);
      if (!confirmed) {
        return;
      }

      const removed = await this._runAction(() => expensesService.remove(expense.id).then(() => true), {
        button: actionButton,
        successMessage: "Gasto eliminado del historial.",
      });

      if (removed && this._isAlive()) {
        this._reload();
      }
    }
  }

  _openDetailModal(expense) {
    const content = this.element.querySelector("#historyDetailContent");
    if (!content) {
      return;
    }

    content.innerHTML = html`
      <article class="history-detail-card">
        <p><strong>Comercio:</strong> ${expense.merchant}</p>
        <p><strong>Fecha:</strong> ${formatDate(expense.date)}</p>
        <p><strong>Categoria:</strong> ${expense.category}</p>
        <p><strong>Monto:</strong> ${formatCurrency(expense.amount)}</p>
        <p><strong>Origen:</strong> ${EXPENSE_ORIGINS[expense.origin] || expense.origin}</p>
        <p><strong>Descripcion:</strong> ${expense.description || "-"}</p>
      </article>
    `;

    this._showModal("#historyDetailModal");
  }
}
