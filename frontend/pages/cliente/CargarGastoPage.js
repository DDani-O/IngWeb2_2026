import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { ExpenseForm } from "../../components/organisms/ExpenseForm.js";
import { TicketUploader } from "../../components/organisms/TicketUploader.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { ticketsService } from "../../services/tickets.service.js";
import { EXPENSE_ORIGINS, STORAGE_KEYS } from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

const RECENT_LIMIT = 6;
const DRAFT_FIELDS = ["merchant", "amount", "categoryId", "date", "description"];

/**
 * Carga de gastos (consigna §4.2): formulario manual y carga por imagen de ticket con OCR/IA
 * (POST /tickets/upload), que precompleta el formulario para que el cliente lo revise antes de guardar.
 */
export class CargarGastoPage extends PageController {
  static template = "./pages/cliente/cargar-gasto.html";

  constructor(element, options = {}) {
    super(element, options);
    // Resultado del OCR: si existe al guardar, el gasto queda con origen "ticket".
    this.ticketAnalysis = null;
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.draftStorageKey = `${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}`;
  }

  render() {
    this.form = this.mountChild(ExpenseForm, "#expenseForm", {
      idPrefix: "newExpense",
      secondaryAction: { label: "Limpiar formulario", icon: "fa-eraser" },
    });
    this.uploader = this.mountChild(TicketUploader, "#ticketUploader", { inputId: "expenseTicketFile" });

    this._loadData(async () => {
      const [categories, recent] = await Promise.all([categoriesService.list(), expensesService.list({ limit: RECENT_LIMIT })]);
      if (!this._isAlive()) {
        return;
      }

      this.form.update({ categories, values: this._readDraft() });
      this._renderRecent(recent.items);
    });
  }

  attachEvents() {
    this.listen(this.element, "expense-submit", (event) => this._create(event.detail.values));
    this.listen(this.element, "expense-change", (event) => this._persistDraft(event.detail.values));
    this.listen(this.element, "expense-secondary", () => this._clearForm());
    this.listen(this.element, "ticket-analyze", (event) => this._analyzeTicket(event.detail.file));
    this._bindDashboardBackButtons();
  }

  _renderRecent(expenses) {
    this.form.update({ suggestions: [...new Set(expenses.map((expense) => expense.merchant))], values: this.form.getValues() });

    this.element.querySelector("#recentExpenses").innerHTML = expenses.length
      ? html`${expenses.map((expense) =>
          mediaItem({
            title: expense.merchant,
            subtitle: `${formatDate(expense.date)} · ${expense.category}`,
            trailing: html`${formatCurrency(expense.amount)}${badge({ text: EXPENSE_ORIGINS[expense.origin] || expense.origin, tone: expense.origin === "ticket" ? "success" : "neutral" })}`,
          })
        )}`
      : emptyState({ icon: "fa-receipt", title: "Todavia no cargaste gastos" });
  }

  async _create(values) {
    this.form.setBusy(true);
    const created = await this._runAction(
      () =>
        expensesService.create({
          ...values,
          origin: this.ticketAnalysis ? "ticket" : "manual",
          ticketId: this.ticketAnalysis?.ticketId || null,
        }),
      { successMessage: "Gasto registrado correctamente." }
    );
    this.form.setBusy(false);

    if (!created || !this._isAlive()) {
      return;
    }

    this._clearForm();
    const recent = await this._runAction(() => expensesService.list({ limit: RECENT_LIMIT }));
    if (recent && this._isAlive()) {
      this._renderRecent(recent.items);
    }
  }

  async _analyzeTicket(file) {
    this.uploader.setBusy(true);
    const analysis = await this._runAction(() => ticketsService.upload(file), {
      successMessage: "Ticket analizado. Revisa los datos antes de guardar.",
    });
    this.uploader.setBusy(false);

    if (!analysis || !this._isAlive()) {
      return;
    }

    this.ticketAnalysis = analysis;
    this.form.update({
      values: {
        merchant: analysis.merchant,
        amount: analysis.amount ?? "",
        categoryId: analysis.categoryId,
        date: analysis.date,
        description: `Ticket: ${analysis.fileName}`,
      },
    });
    this._showOcrResult(analysis);
    this._persistDraft(this.form.getValues());
  }

  _showOcrResult(analysis) {
    const container = this.element.querySelector("#ocrResult");
    if (!analysis) {
      container.replaceChildren();
      return;
    }

    container.innerHTML = infoCard({
      title: "Datos detectados",
      icon: "fa-circle-check",
      subtitle: "Ya los cargamos en el formulario: revisalos y corregi lo que haga falta.",
      body: keyValueList({
        items: [
          { label: "Archivo", value: analysis.fileName },
          { label: "Comercio", value: analysis.merchant },
          { label: "Monto", value: analysis.amount === null ? "-" : formatCurrency(analysis.amount) },
          { label: "Categoria sugerida", value: analysis.categoryName },
          { label: "Fecha", value: analysis.date ? formatDate(analysis.date) : "-" },
          { label: "Confianza", value: analysis.confidence === null ? "-" : `${analysis.confidence}%` },
        ],
      }),
    });
  }

  _persistDraft(values) {
    localStorage.setItem(this.draftStorageKey, JSON.stringify(values));
  }

  _readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(this.draftStorageKey) || "{}");
      return Object.fromEntries(DRAFT_FIELDS.map((field) => [field, draft[field] ?? ""]));
    } catch {
      localStorage.removeItem(this.draftStorageKey);
      return {};
    }
  }

  _clearForm() {
    localStorage.removeItem(this.draftStorageKey);
    this.ticketAnalysis = null;
    this.form.update({ values: {} });
    this._showOcrResult(null);
    this.uploader.reset();
  }
}
