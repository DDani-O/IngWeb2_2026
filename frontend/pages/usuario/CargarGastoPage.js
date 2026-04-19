import { PageController } from "../../core/PageController.js";
import {
  MOCK_USER_EXPENSE_FORM,
  MOCK_USER_EXPENSE_HISTORY,
} from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

const DRAFT_STORAGE_KEY = "fintrack.userExpenseDraft.v1";

export class CargarGastoPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.formData = JSON.parse(JSON.stringify(MOCK_USER_EXPENSE_FORM));
    this.recentExpenses = JSON.parse(
      JSON.stringify(MOCK_USER_EXPENSE_HISTORY.expenses.slice(0, 6))
    );
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "Juan Perez";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "JP");

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
          : "Arrastra una imagen o selecciona un archivo"
      );
    });

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderSelectOptions() {
    const categorySelect = this.element.querySelector("#expenseCategory");
    const paymentSelect = this.element.querySelector("#expensePaymentMethod");

    if (categorySelect) {
      categorySelect.innerHTML = [
        '<option value="">Seleccionar categoria</option>',
        ...this.formData.categories.map(
          (category) => `<option value="${category}">${category}</option>`
        ),
      ].join("");
    }

    if (paymentSelect) {
      paymentSelect.innerHTML = [
        '<option value="">Seleccionar metodo</option>',
        ...this.formData.paymentMethods.map(
          (method) => `<option value="${method}">${method}</option>`
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
      .map((merchant) => `<option value="${merchant}"></option>`)
      .join("");
  }

  _renderRecentExpenses() {
    const container = this.element.querySelector("#recentExpenseList");
    if (!container) {
      return;
    }

    container.innerHTML = this.recentExpenses
      .map((expense) => {
        return `
          <article class="recent-expense-item">
            <div>
              <p class="recent-expense-item__title">${expense.merchant}</p>
              <p class="recent-expense-item__meta">${expense.date} · ${expense.category}</p>
            </div>
            <div class="text-end">
              <p class="recent-expense-item__amount">${formatCurrency(expense.amount)}</p>
              <span class="badge-soft ${
                expense.status === "Validado"
                  ? "badge-soft--success"
                  : "badge-soft--warning"
              }">${expense.status}</span>
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
      status: "Pendiente",
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
    this._setInputValue("#expensePaymentMethod", sample.paymentMethod);
    this._setInputValue("#expenseDate", sample.date);
    this._setInputValue(
      "#expenseDescription",
      `${sample.description} · Archivo: ${selectedFile.name}`
    );

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

    rows.innerHTML = `
      <div class="ocr-result__row"><span>Archivo</span><strong>${fileName}</strong></div>
      <div class="ocr-result__row"><span>Comercio</span><strong>${data.merchant}</strong></div>
      <div class="ocr-result__row"><span>Monto</span><strong>${formatCurrency(data.amount)}</strong></div>
      <div class="ocr-result__row"><span>Categoria</span><strong>${data.category}</strong></div>
      <div class="ocr-result__row"><span>Metodo</span><strong>${data.paymentMethod}</strong></div>
      <div class="ocr-result__row"><span>Fecha</span><strong>${data.date}</strong></div>
    `;

    card.classList.remove("app-hidden");
  }

  _persistDraft() {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(this._readFormValues()));
  }

  _restoreDraft() {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft);
      this._setInputValue("#expenseMerchant", draft.merchant || "");
      this._setInputValue("#expenseAmount", draft.amount ? String(draft.amount) : "");
      this._setInputValue("#expenseCategory", draft.category || "");
      this._setInputValue("#expensePaymentMethod", draft.paymentMethod || "");
      this._setInputValue("#expenseDate", draft.date || "");
      this._setInputValue("#expenseReference", draft.reference || "");
      this._setInputValue("#expenseDescription", draft.description || "");
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }

  _clearForm() {
    const form = this.element.querySelector("#userExpenseForm");
    form?.reset();
    localStorage.removeItem(DRAFT_STORAGE_KEY);
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
      paymentMethod:
        this.element.querySelector("#expensePaymentMethod")?.value || "",
      date: this.element.querySelector("#expenseDate")?.value || "",
      reference: this.element.querySelector("#expenseReference")?.value.trim() || "",
      description:
        this.element.querySelector("#expenseDescription")?.value.trim() || "",
      note: this.element.querySelector("#expenseDescription")?.value.trim() || "",
    };
  }
}
