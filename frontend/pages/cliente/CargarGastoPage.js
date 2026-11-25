import { PageController } from "../../core/PageController.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { ticketsService } from "../../services/tickets.service.js";
import { EXPENSE_ORIGINS, STORAGE_KEYS } from "../../utils/constants.js";
import { formatCurrency, formatDate, todayIsoDate } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const RECENT_LIMIT = 6;
const EMPTY_FILE_TEXT = "Selecciona una imagen del ticket";

/**
 * Carga de gastos (consigna §4.2): formulario manual y carga por imagen de ticket con OCR/IA,
 * que precompleta el formulario para que el cliente lo revise antes de guardar.
 */
export class CargarGastoPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    // Resultado del OCR: si existe al guardar, el gasto queda con origen "ticket".
    this.ticketAnalysis = null;
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.draftStorageKey = `${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}`;
  }

  render() {
    this._resetViewPosition();

    const userName = this.options.authManager?.getCurrentUser()?.fullName || "";
    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._loadData(async () => {
      const [categories, recent] = await Promise.all([
        categoriesService.list(),
        expensesService.list({ limit: RECENT_LIMIT }),
      ]);
      if (!this._isAlive()) {
        return;
      }

      this._renderCategoryOptions(categories);
      this._renderMerchantSuggestions(recent.items);
      this._renderRecentExpenses(recent.items);
      this._restoreDraft();
      this._setDateIfEmpty();
    });
  }

  attachEvents() {
    const form = this.element.querySelector("#userExpenseForm");
    const clearButton = this.element.querySelector("#clearExpenseFormButton");
    const analyzeButton = this.element.querySelector("#analyzeTicketButton");
    const fileInput = this.element.querySelector("#expenseTicketFile");

    this.listen(form, "submit", (event) => this._handleFormSubmit(event));
    this.listen(form, "input", () => this._persistDraft());
    this.listen(form, "change", () => this._persistDraft());

    this.listen(clearButton, "click", () => this._clearForm());
    this.listen(analyzeButton, "click", () => this._analyzeTicket(analyzeButton));

    this.listen(fileInput, "change", () => {
      const selectedFile = fileInput?.files?.[0];
      this._setText("#ticketFileName", selectedFile ? `Archivo seleccionado: ${selectedFile.name}` : EMPTY_FILE_TEXT);
    });

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderCategoryOptions(categories) {
    const select = this.element.querySelector("#expenseCategory");
    if (!select) {
      return;
    }

    select.innerHTML = html`
      <option value="">Seleccionar categoria</option>
      ${categories.map((category) => html`<option value="${category.id}">${category.icon} ${category.name}</option>`)}
    `;
  }

  _renderMerchantSuggestions(expenses) {
    const datalist = this.element.querySelector("#merchantSuggestions");
    if (!datalist) {
      return;
    }

    const merchants = [...new Set(expenses.map((expense) => expense.merchant))];
    datalist.innerHTML = html`${merchants.map((merchant) => html`<option value="${merchant}"></option>`)}`;
  }

  _renderRecentExpenses(expenses) {
    const container = this.element.querySelector("#recentExpenseList");
    if (!container) {
      return;
    }

    container.innerHTML = expenses.length
      ? html`${expenses.map(
          (expense) => html`
            <article class="recent-expense-item">
              <div>
                <p class="recent-expense-item__title">${expense.merchant}</p>
                <p class="recent-expense-item__meta">${formatDate(expense.date)} · ${expense.category}</p>
              </div>
              <div class="text-end">
                <p class="recent-expense-item__amount">${formatCurrency(expense.amount)}</p>
                <span class="badge-soft ${expense.origin === "ticket" ? "badge-soft--success" : "badge-soft--warning"}">${EXPENSE_ORIGINS[expense.origin] || expense.origin}</span>
              </div>
            </article>
          `
        )}`
      : html`<p class="text-muted">Todavia no cargaste gastos.</p>`;
  }

  async _handleFormSubmit(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userExpenseForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const values = this._readFormValues();
    const created = await this._runAction(
      () =>
        expensesService.create({
          ...values,
          origin: this.ticketAnalysis ? "ticket" : "manual",
          ticketId: this.ticketAnalysis?.ticketId || null,
        }),
      { button: form.querySelector('[type="submit"]'), successMessage: "Gasto registrado correctamente." }
    );

    if (!created || !this._isAlive()) {
      return;
    }

    this._clearForm();
    const recent = await this._runAction(() => expensesService.list({ limit: RECENT_LIMIT }));
    if (recent && this._isAlive()) {
      this._renderRecentExpenses(recent.items);
      this._renderMerchantSuggestions(recent.items);
    }
  }

  async _analyzeTicket(button) {
    const selectedFile = this.element.querySelector("#expenseTicketFile")?.files?.[0];

    if (!selectedFile) {
      this.options.showToast?.("Selecciona una imagen de ticket para analizar.", "warning");
      return;
    }

    this._setText("#ticketFileName", `Analizando ${selectedFile.name}...`);
    const analysis = await this._runAction(() => ticketsService.upload(selectedFile), {
      button,
      successMessage: "Ticket analizado. Verifica los datos antes de guardar.",
    });
    this._setText("#ticketFileName", `Archivo seleccionado: ${selectedFile.name}`);

    if (!analysis || !this._isAlive()) {
      return;
    }

    this.ticketAnalysis = analysis;
    this._setInputValue("#expenseMerchant", analysis.merchant);
    this._setInputValue("#expenseAmount", analysis.amount === null ? "" : String(analysis.amount));
    this._setInputValue("#expenseCategory", analysis.categoryId);
    this._setInputValue("#expenseDate", analysis.date);
    this._setInputValue("#expenseDescription", `Ticket: ${analysis.fileName}`);

    this._showOcrResult(analysis);
    this._persistDraft();
  }

  _showOcrResult(analysis) {
    const card = this.element.querySelector("#ocrResultCard");
    const rows = this.element.querySelector("#ocrResultRows");

    if (!card || !rows) {
      return;
    }

    if (!analysis) {
      card.classList.add("app-hidden");
      rows.replaceChildren();
      return;
    }

    const items = [
      ["Archivo", analysis.fileName],
      ["Comercio", analysis.merchant || "-"],
      ["Monto", analysis.amount === null ? "-" : formatCurrency(analysis.amount)],
      ["Categoria sugerida", analysis.categoryName || "-"],
      ["Fecha", analysis.date ? formatDate(analysis.date) : "-"],
      ["Confianza", analysis.confidence === null ? "-" : `${analysis.confidence}%`],
    ];

    rows.innerHTML = html`${items.map(([label, value]) => html`<div class="ocr-result__row"><span>${label}</span><strong>${value}</strong></div>`)}`;
    card.classList.remove("app-hidden");
  }

  _persistDraft() {
    localStorage.setItem(this.draftStorageKey, JSON.stringify(this._readFormValues()));
  }

  _restoreDraft() {
    const rawDraft = localStorage.getItem(this.draftStorageKey);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft);
      this._setInputValue("#expenseMerchant", draft.merchant || "");
      this._setInputValue("#expenseAmount", draft.amount ? String(draft.amount) : "");
      this._setInputValue("#expenseCategory", draft.categoryId || "");
      this._setInputValue("#expenseDate", draft.date || "");
      this._setInputValue("#expenseDescription", draft.description || "");
    } catch {
      localStorage.removeItem(this.draftStorageKey);
    }
  }

  _clearForm() {
    this.element.querySelector("#userExpenseForm")?.reset();
    localStorage.removeItem(this.draftStorageKey);
    this.ticketAnalysis = null;
    this._setText("#ticketFileName", EMPTY_FILE_TEXT);
    this._showOcrResult(null);
    this._setDateIfEmpty();
  }

  _setDateIfEmpty() {
    const input = this.element.querySelector("#expenseDate");
    if (input && !input.value) {
      input.value = todayIsoDate();
    }
  }

  _readFormValues() {
    return {
      merchant: this._getValue("#expenseMerchant"),
      amount: Number(this._getValue("#expenseAmount") || 0),
      categoryId: this._getValue("#expenseCategory"),
      date: this._getValue("#expenseDate"),
      description: this._getValue("#expenseDescription"),
    };
  }
}
