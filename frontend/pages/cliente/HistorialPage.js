import { PageController } from "../../core/PageController.js";
import { EXPENSE_ORIGINS, MOCK_USER_EXPENSE_HISTORY } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

export class HistorialPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.expenses = JSON.parse(JSON.stringify(MOCK_USER_EXPENSE_HISTORY.expenses));
    this.filteredExpenses = [...this.expenses];
    this.detailModal = null;
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._renderCategoryOptions();
    this._applyFilters();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#historySearchInput");
    const categoryFilter = this.element.querySelector("#historyCategoryFilter");
    const originFilter = this.element.querySelector("#historyOriginFilter");
    const sortFilter = this.element.querySelector("#historySortFilter");
    const tableBody = this.element.querySelector("#historyTableBody");

    this.listen(searchInput, "input", () => this._applyFilters());
    this.listen(categoryFilter, "change", () => this._applyFilters());
    this.listen(originFilter, "change", () => this._applyFilters());
    this.listen(sortFilter, "change", () => this._applyFilters());

    this.listen(tableBody, "click", (event) => this._handleTableAction(event));

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderCategoryOptions() {
    const categoryFilter = this.element.querySelector("#historyCategoryFilter");
    if (!categoryFilter) {
      return;
    }

    const categories = [...new Set(this.expenses.map((expense) => expense.category))];
    categoryFilter.innerHTML = [
      html`<option value="Todas">Todas</option>`,
      ...categories.map((category) => html`<option value="${category}">${category}</option>`),
    ].join("");
  }

  _applyFilters() {
    const search = this._getValue("#historySearchInput").toLowerCase();
    const category = this._getValue("#historyCategoryFilter") || "Todas";
    const origin = this._getValue("#historyOriginFilter") || "Todos";
    const sort = this._getValue("#historySortFilter") || "reciente";

    let result = [...this.expenses];

    if (search) {
      result = result.filter((expense) => {
        return (
          expense.merchant.toLowerCase().includes(search) ||
          (expense.description || "").toLowerCase().includes(search)
        );
      });
    }

    if (category !== "Todas") {
      result = result.filter((expense) => expense.category === category);
    }

    if (origin !== "Todos") {
      result = result.filter((expense) => expense.origin === origin);
    }

    if (sort === "monto-desc") {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sort === "monto-asc") {
      result.sort((a, b) => a.amount - b.amount);
    } else {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    this.filteredExpenses = result;
    this._renderTable();
  }

  _renderTable() {
    const tableBody = this.element.querySelector("#historyTableBody");
    const emptyState = this.element.querySelector("#historyEmptyState");
    const countLabel = this.element.querySelector("#historyCountLabel");

    if (!tableBody || !emptyState || !countLabel) {
      return;
    }

    countLabel.textContent = `${this.filteredExpenses.length} movimientos`; 

    if (!this.filteredExpenses.length) {
      tableBody.innerHTML = "";
      emptyState.classList.remove("app-hidden");
      return;
    }

    emptyState.classList.add("app-hidden");

    tableBody.innerHTML = this.filteredExpenses
      .map((expense) => {
        return html`
          <tr>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.merchant}</td>
            <td>${expense.category}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
              <span class="badge-soft ${
                expense.origin === "ticket" ? "badge-soft--success" : "badge-soft--warning"
              }">${EXPENSE_ORIGINS[expense.origin] || expense.origin}</span>
            </td>
            <td>
              <div class="history-row-actions">
                <button class="action-btn action-btn--ghost" data-action="detail" data-id="${expense.id}" type="button">Detalle</button>
                <button class="action-btn action-btn--ghost" data-action="delete" data-id="${expense.id}" type="button">Eliminar</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  _handleTableAction(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    const expenseId = actionButton.dataset.id;
    const expense = this.expenses.find((item) => item.id === expenseId);

    if (!expense) {
      return;
    }

    if (action === "detail") {
      this._openDetailModal(expense);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `Se eliminara el gasto de ${expense.merchant}. Quieres continuar?`
      );
      if (!confirmed) {
        return;
      }

      this.expenses = this.expenses.filter((item) => item.id !== expenseId);
      this.options.showToast?.("Gasto eliminado del historial.", "warning");
      this._applyFilters();
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

    this.detailModal = this._showModal("#historyDetailModal");
  }
}
