import { Component } from "../../core/Component.js";
import { MOCK_USER_EXPENSE_HISTORY, ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class HistorialPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.expenses = JSON.parse(JSON.stringify(MOCK_USER_EXPENSE_HISTORY.expenses));
    this.filteredExpenses = [...this.expenses];
    this.detailModal = null;
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "Juan Perez";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "JP");

    this._renderCategoryOptions();
    this._applyFilters();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#historySearchInput");
    const categoryFilter = this.element.querySelector("#historyCategoryFilter");
    const statusFilter = this.element.querySelector("#historyStatusFilter");
    const sortFilter = this.element.querySelector("#historySortFilter");
    const tableBody = this.element.querySelector("#historyTableBody");

    this.listen(searchInput, "input", () => this._applyFilters());
    this.listen(categoryFilter, "change", () => this._applyFilters());
    this.listen(statusFilter, "change", () => this._applyFilters());
    this.listen(sortFilter, "change", () => this._applyFilters());

    this.listen(tableBody, "click", (event) => this._handleTableAction(event));

    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => this._handleBackToDashboard(event));
    });

    ["#userLogoutButton", "#userLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderCategoryOptions() {
    const categoryFilter = this.element.querySelector("#historyCategoryFilter");
    if (!categoryFilter) {
      return;
    }

    const categories = [...new Set(this.expenses.map((expense) => expense.category))];
    categoryFilter.innerHTML = [
      '<option value="Todas">Todas</option>',
      ...categories.map((category) => `<option value="${category}">${category}</option>`),
    ].join("");
  }

  _applyFilters() {
    const search = this._getValue("#historySearchInput").toLowerCase();
    const category = this._getValue("#historyCategoryFilter") || "Todas";
    const status = this._getValue("#historyStatusFilter") || "Todas";
    const sort = this._getValue("#historySortFilter") || "reciente";

    let result = [...this.expenses];

    if (search) {
      result = result.filter((expense) => {
        return (
          expense.merchant.toLowerCase().includes(search) ||
          expense.note.toLowerCase().includes(search)
        );
      });
    }

    if (category !== "Todas") {
      result = result.filter((expense) => expense.category === category);
    }

    if (status !== "Todas") {
      result = result.filter((expense) => expense.status === status);
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
        return `
          <tr>
            <td>${expense.date}</td>
            <td>${expense.merchant}</td>
            <td>${expense.category}</td>
            <td>${expense.paymentMethod}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
              <span class="badge-soft ${
                expense.status === "Validado"
                  ? "badge-soft--success"
                  : "badge-soft--warning"
              }">${expense.status}</span>
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
    if (!window.bootstrap) {
      return;
    }

    const content = this.element.querySelector("#historyDetailContent");
    const modalElement = this.element.querySelector("#historyDetailModal");

    if (!content || !modalElement) {
      return;
    }

    content.innerHTML = `
      <article class="history-detail-card">
        <p><strong>Comercio:</strong> ${expense.merchant}</p>
        <p><strong>Fecha:</strong> ${expense.date}</p>
        <p><strong>Categoria:</strong> ${expense.category}</p>
        <p><strong>Metodo:</strong> ${expense.paymentMethod}</p>
        <p><strong>Monto:</strong> ${formatCurrency(expense.amount)}</p>
        <p><strong>Estado:</strong> ${expense.status}</p>
        <p><strong>Nota:</strong> ${expense.note}</p>
      </article>
    `;

    this.detailModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    this.detailModal.show();
  }

  _handleBackToDashboard(event) {
    event.preventDefault();

    const isDashboardOpenInAnotherTab =
      this.options.hasRouteOpenInOtherTab?.(ROUTES.USER_DASHBOARD) ||
      (window.opener && !window.opener.closed);

    if (isDashboardOpenInAnotherTab) {
      window.close();

      window.setTimeout(() => {
        if (!window.closed) {
          this.options.router?.navigate(ROUTES.USER_DASHBOARD);
        }
      }, 120);
      return;
    }

    this.options.router?.navigate(ROUTES.USER_DASHBOARD);
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion finalizada correctamente.", "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  _resetViewPosition() {
    window.scrollTo(0, 0);

    const routeContainer = document.querySelector("#appRouteContainer");
    if (routeContainer) {
      routeContainer.scrollTop = 0;
    }
  }

  _getValue(selector) {
    return this.element.querySelector(selector)?.value?.trim() || "";
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }
}
