/** Controlador de la página `#/cliente/gastos/:id` (template editar-gasto.html). */
import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { ExpenseForm } from "../../components/organisms/ExpenseForm.js";
import { confirmExpenseDeletion } from "../../components/feedback/confirmExpenseDeletion.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { EXPENSE_ORIGINS, ROUTES } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

/**
 * Edición y recategorización de un gasto (consigna: PUT /expenses/:id y "categorizar gastos").
 * Ruta: #/cliente/gastos/:id (se llega desde el historial).
 */
export class EditarGastoPage extends PageController {
  static template = "./pages/cliente/editar-gasto.html";

  render() {
    this.expenseId = this.options.params?.id;
    this.form = this.mountChild(ExpenseForm, "#editExpenseForm", {
      idPrefix: "editExpense",
      submitLabel: "Guardar cambios",
      secondaryAction: { label: "Cancelar", icon: "fa-arrow-left" },
    });

    this._loadData(async () => {
      const [expense, categories] = await Promise.all([expensesService.get(this.expenseId), categoriesService.list()]);
      if (this._isAlive()) {
        this._show(expense, categories);
      }
    });
  }

  attachEvents() {
    this.listen(this.element, "expense-submit", (event) => this._save(event.detail.values));
    this.listen(this.element, "expense-secondary", () => this._backToHistory());
    this.listen(this.element.querySelector('[data-action="delete"]'), "click", (event) => this._delete(event.currentTarget));
  }

  _show(expense, categories = null) {
    this.expense = expense;
    this.form.update({
      ...(categories ? { categories } : {}),
      values: {
        merchant: expense.merchant,
        amount: expense.amount,
        categoryId: expense.categoryId,
        date: expense.date,
        description: expense.description,
      },
    });

    this.element.querySelector("#editExpenseInfo").innerHTML = keyValueList({
      items: [
        { label: "Origen", value: badge({ text: EXPENSE_ORIGINS[expense.origin] || expense.origin, tone: expense.origin === "ticket" ? "success" : "neutral" }) },
        { label: "Categoria actual", value: expense.category },
        { label: "Monto", value: formatCurrency(expense.amount) },
        { label: "Fecha", value: formatDate(expense.date) },
        { label: "Registrado", value: expense.createdAt ? formatDate(expense.createdAt) : "-" },
      ],
    });
  }

  async _save(values) {
    this.form.setBusy(true);
    const updated = await this._runAction(() => expensesService.update(this.expenseId, values), {
      successMessage: "Gasto actualizado.",
    });
    this.form.setBusy(false);

    if (updated && this._isAlive()) {
      this._show(updated);
    }
  }

  async _delete(button) {
    if (!this.expense) {
      return;
    }

    const confirmed = await confirmExpenseDeletion(this.expense);
    if (!confirmed || !this._isAlive()) {
      return;
    }

    const removed = await this._runAction(() => expensesService.remove(this.expenseId).then(() => true), {
      button,
      successMessage: "Gasto eliminado.",
    });
    if (removed && this._isAlive()) {
      this._backToHistory();
    }
  }

  _backToHistory() {
    this.options.router?.navigate(ROUTES.CLIENT_HISTORIAL);
  }
}
