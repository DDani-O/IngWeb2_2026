import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class HistorialPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.expenses = [];
    this.filteredExpenses = [];
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
    this._loadExpenses();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#historySearchInput");
    const categoryFilter = this.element.querySelector("#historyCategoryFilter");
    const statusFilter = this.element.querySelector("#historyStatusFilter");
    const dateFilter = this.element.querySelector("#historyDateFilter");
    const sortFilter = this.element.querySelector("#historySortFilter");
    const tableBody = this.element.querySelector("#historyTableBody");

    this.listen(searchInput, "input", () => this._applyFilters());
    this.listen(categoryFilter, "change", () => this._applyFilters());
    this.listen(statusFilter, "change", () => this._applyFilters());
    this.listen(dateFilter, "change", () => this._applyFilters());
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
      '<option value="Todas">Todas</option>',
      ...categories.map((category) => `<option value="${category}">${category}</option>`),
    ].join("");
  }

  _applyFilters() {
    const search = this._getValue("#historySearchInput").toLowerCase();
    const category = this._getValue("#historyCategoryFilter") || "Todas";
    const status = this._getValue("#historyStatusFilter") || "Todas";
    const dateFilter = this._getValue("#historyDateFilter") || "todas";
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

    // Filtro por período de fecha
    if (dateFilter !== "todas") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((expense) => {
        // Parsear la fecha del gasto (formato YYYY-MM-DD)
        const [year, month, day] = expense.date.split("-").map(Number);
        const expenseDate = new Date(year, month - 1, day); // month es 0-indexed

        if (dateFilter === "semana") {
          // Esta semana (lunes a domingo)
          // Calcular el lunes de esta semana
          const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(today);
          monday.setDate(today.getDate() - daysFromMonday);

          // Calcular el domingo de esta semana
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);

          return expenseDate >= monday && expenseDate <= sunday;
        } else if (dateFilter === "mes") {
          // Este mes
          return expenseDate.getMonth() === today.getMonth() &&
                 expenseDate.getFullYear() === today.getFullYear();
        } else if (dateFilter === "anio") {
          // Este año
          return expenseDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
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

  async _handleTableAction(event) {
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

      try {
        await apiClient.delete(`/expenses/${expenseId}`);
        this.expenses = this.expenses.filter((item) => item.id !== expenseId);
        this.options.showToast?.("Gasto eliminado del historial.", "warning");
        this._renderCategoryOptions();
        this._applyFilters();
      } catch (error) {
        this.options.showToast?.(
          error.message || "No se pudo eliminar el gasto.",
          "warning"
        );
      }
    }
  }

  _openDetailModal(expense) {
    const content = this.element.querySelector("#historyDetailContent");
    if (!content) {
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

    this.detailModal = this._showModal("#historyDetailModal");
  }

  async _loadExpenses() {
    try {
      const response = await apiClient.get("/expenses", {
        query: { page: 1, limit: 100 },
      });
      const expenses = Array.isArray(response?.data) ? response.data : [];
      this.expenses = expenses.map((expense) => this._mapExpenseToUi(expense));
      this._renderCategoryOptions();
      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar los gastos.",
        "warning"
      );
    }
  }

  _mapExpenseToUi(expense) {
    return {
      id: expense.id,
      date: expense.date,
      merchant: expense.merchant,
      category: expense.categoryName || "Sin categoria",
      amount: Number(expense.amount) || 0,
      paymentMethod: this._extractPaymentMethod(expense.notes),
      status: expense.ticketImageUrl ? "Pendiente" : "Validado",
      note: expense.notes || "",
    };
  }

  _extractPaymentMethod(notes) {
    if (!notes) {
      return "Sin definir";
    }

    const match = String(notes).match(/Metodo de pago:\s*([^|]+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    return "Sin definir";
  }
}
