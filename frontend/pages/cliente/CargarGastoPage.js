import { PageController } from "../../core/PageController.js";
import {
  EXPENSE_ORIGINS,
  MOCK_USER_EXPENSE_FORM,
  MOCK_USER_EXPENSE_HISTORY,
  STORAGE_KEYS,
} from "../../utils/constants.js";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

export class CargarGastoPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.formData = JSON.parse(JSON.stringify(MOCK_USER_EXPENSE_FORM));
    this.recentExpenses = JSON.parse(
      JSON.stringify(MOCK_USER_EXPENSE_HISTORY.expenses.slice(0, 6))
    );
    // Archivo analizado por OCR: si existe al guardar, el gasto queda con origen "ticket".
    this.analyzedFileName = null;
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.draftStorageKey = `${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}`;
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._renderSelectOptions();
    this._renderMerchantSuggestions();
    this._renderRecentExpenses();
    this._restoreDraft();
    this._setDateIfEmpty();
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
    this.listen(analyzeButton, "click", () => this._analyzeTicket());

    this.listen(fileInput, "change", () => {
      const selectedFile = fileInput?.files?.[0];
      this._setText(
        "#ticketFileName",
        selectedFile
          ? `Archivo seleccionado: ${selectedFile.name}`
          : "Selecciona una imagen del ticket"
      );
    });

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderSelectOptions() {
    const categorySelect = this.element.querySelector("#expenseCategory");

    if (categorySelect) {
      categorySelect.innerHTML = [
        html`<option value="">Seleccionar categoria</option>`,
        ...this.formData.categories.map(
          (category) => html`<option value="${category}">${category}</option>`
        ),
      ].join("");
    }
  }

  _renderMerchantSuggestions() {
    const datalist = this.element.querySelector("#merchantSuggestions");
    if (!datalist) {
      return;
    }

    datalist.innerHTML = this.formData.suggestedMerchants
      .map((merchant) => html`<option value="${merchant}"></option>`)
      .join("");
  }

  _renderRecentExpenses() {
    const container = this.element.querySelector("#recentExpenseList");
    if (!container) {
      return;
    }

    container.innerHTML = this.recentExpenses
      .map((expense) => {
        return html`
          <article class="recent-expense-item">
            <div>
              <p class="recent-expense-item__title">${expense.merchant}</p>
              <p class="recent-expense-item__meta">${formatDate(expense.date)} · ${expense.category}</p>
            </div>
            <div class="text-end">
              <p class="recent-expense-item__amount">${formatCurrency(expense.amount)}</p>
              <span class="badge-soft ${
                expense.origin === "ticket" ? "badge-soft--success" : "badge-soft--warning"
              }">${EXPENSE_ORIGINS[expense.origin] || expense.origin}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _handleFormSubmit(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userExpenseForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const payload = this._readFormValues();
    this.recentExpenses.unshift({
      id: `exp-${Date.now()}`,
      ...payload,
      origin: this.analyzedFileName ? "ticket" : "manual",
    });

    if (this.recentExpenses.length > 6) {
      this.recentExpenses.pop();
    }

    this._renderRecentExpenses();
    this._showOcrResult(null);
    this._clearForm();
    this.options.showToast?.("Gasto registrado correctamente.", "success");
  }

  _analyzeTicket() {
    const fileInput = this.element.querySelector("#expenseTicketFile");
    const selectedFile = fileInput?.files?.[0];

    if (!selectedFile) {
      this.options.showToast?.("Selecciona una imagen de ticket para analizar.", "warning");
      return;
    }

    const sample = this.formData.ocrSample;
    this._setInputValue("#expenseMerchant", sample.merchant);
    this._setInputValue("#expenseAmount", String(sample.amount));
    this._setInputValue("#expenseCategory", sample.category);
    this._setInputValue("#expenseDate", sample.date);
    this._setInputValue(
      "#expenseDescription",
      `${sample.description} · Archivo: ${selectedFile.name}`
    );

    this.analyzedFileName = selectedFile.name;
    this._showOcrResult(sample, selectedFile.name);
    this._persistDraft();

    this.options.showToast?.("Ticket analizado. Verifica los datos antes de guardar.", "success");
  }

  _showOcrResult(data, fileName = "") {
    const card = this.element.querySelector("#ocrResultCard");
    const rows = this.element.querySelector("#ocrResultRows");

    if (!card || !rows) {
      return;
    }

    if (!data) {
      card.classList.add("app-hidden");
      rows.innerHTML = "";
      return;
    }

    rows.innerHTML = html`
      <div class="ocr-result__row"><span>Archivo</span><strong>${fileName}</strong></div>
      <div class="ocr-result__row"><span>Comercio</span><strong>${data.merchant}</strong></div>
      <div class="ocr-result__row"><span>Monto</span><strong>${formatCurrency(data.amount)}</strong></div>
      <div class="ocr-result__row"><span>Categoria</span><strong>${data.category}</strong></div>
      <div class="ocr-result__row"><span>Fecha</span><strong>${formatDate(data.date)}</strong></div>
    `;

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
      this._setInputValue("#expenseCategory", draft.category || "");
      this._setInputValue("#expenseDate", draft.date || "");
      this._setInputValue("#expenseDescription", draft.description || "");
    } catch {
      localStorage.removeItem(this.draftStorageKey);
    }
  }

  _clearForm() {
    const form = this.element.querySelector("#userExpenseForm");
    form?.reset();
    localStorage.removeItem(this.draftStorageKey);
    this.analyzedFileName = null;
    this._setText("#ticketFileName", "Selecciona una imagen del ticket");
    this._showOcrResult(null);
    this._setDateIfEmpty();
  }

  _setDateIfEmpty() {
    const input = this.element.querySelector("#expenseDate");
    if (!input || input.value) {
      return;
    }

    input.value = new Date().toISOString().slice(0, 10);
  }

  _readFormValues() {
    const amountRaw = this.element.querySelector("#expenseAmount")?.value || "0";

    return {
      merchant: this.element.querySelector("#expenseMerchant")?.value.trim() || "",
      amount: Number(amountRaw),
      category: this.element.querySelector("#expenseCategory")?.value || "",
      date: this.element.querySelector("#expenseDate")?.value || "",
      description:
        this.element.querySelector("#expenseDescription")?.value.trim() || "",
    };
  }
}
