import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

const DRAFT_STORAGE_KEY = "fintrack.userExpenseDraft.v1";
const DEFAULT_PAYMENT_METHODS = ["Debito", "Credito", "Efectivo", "Transferencia"];
const DEFAULT_OCR_SAMPLE = {
  merchant: "Supermercado Central",
  amount: 18500,
  category: "Alimentacion",
  paymentMethod: "Debito",
  date: "2026-04-16",
  description: "Compra semanal con ticket OCR",
};

export class CargarGastoPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.categories = [];
    this.categoryMap = new Map();
    this.formData = {
      categories: [],
      paymentMethods: [...DEFAULT_PAYMENT_METHODS],
      suggestedMerchants: [],
      ocrSample: { ...DEFAULT_OCR_SAMPLE },
    };
    this.recentExpenses = [];
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
    this._loadCategories();
    this._loadRecentExpenses();
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
      const currentValue = categorySelect.value;
      const placeholder = this.categories.length
        ? "Seleccionar categoria"
        : "Cargando categorias...";
      categorySelect.innerHTML = [
        `<option value="">${placeholder}</option>`,
        ...this.categories.map(
          (category) => `<option value="${category.id}">${category.nombre}</option>`
        ),
      ].join("");

      if (currentValue) {
        categorySelect.value = currentValue;
      }
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

  async _handleFormSubmit(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userExpenseForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    try {
      const payload = this._readFormValues();
      const notes = this._buildNotes(payload);

      const response = await apiClient.post("/expenses", {
        amount: payload.amount,
        merchant: payload.merchant,
        categoryId: payload.categoryId,
        date: payload.date,
        notes,
      });

      const formatted = this._mapExpenseToUi(response);
      this.recentExpenses.unshift(formatted);

      if (this.recentExpenses.length > 6) {
        this.recentExpenses.pop();
      }

      this._updateMerchantSuggestions();
      this._renderRecentExpenses();
      this._showOcrResult(null);
      this._clearForm();
      this.options.showToast?.("Gasto registrado correctamente.", "success");
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo registrar el gasto.",
        "warning"
      );
    }
  }

  _analyzeTicket() {
    const fileInput = this.element.querySelector("#expenseTicketFile");
    const selectedFile = fileInput?.files?.[0];

    if (!selectedFile) {
      this.options.showToast?.("Selecciona una imagen de ticket para analizar.", "warning");
      return;
    }

    const sample = this.formData.ocrSample;
    const categoryId = this._findCategoryIdByName(sample.category);

    this._setInputValue("#expenseMerchant", sample.merchant);
    this._setInputValue("#expenseAmount", String(sample.amount));
    this._setInputValue("#expenseCategory", categoryId || "");
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
      this._setInputValue("#expenseCategory", draft.categoryId || "");
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
      categoryId: this.element.querySelector("#expenseCategory")?.value || "",
      paymentMethod:
        this.element.querySelector("#expensePaymentMethod")?.value || "",
      date: this.element.querySelector("#expenseDate")?.value || "",
      reference: this.element.querySelector("#expenseReference")?.value.trim() || "",
      description:
        this.element.querySelector("#expenseDescription")?.value.trim() || "",
    };
  }

  async _loadCategories() {
    try {
      const categories = await apiClient.get("/categories");
      this.categories = Array.isArray(categories) ? categories : [];
      this.categoryMap = new Map(
        this.categories.map((category) => [category.id, category.nombre])
      );
      this._renderSelectOptions();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar categorias.",
        "warning"
      );
    }
  }

  async _loadRecentExpenses() {
    try {
      const response = await apiClient.get("/expenses", {
        query: { page: 1, limit: 6 },
      });

      const expenses = Array.isArray(response?.data) ? response.data : [];
      this.recentExpenses = expenses.map((expense) => this._mapExpenseToUi(expense));
      this._updateMerchantSuggestions();
      this._renderRecentExpenses();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar los gastos recientes.",
        "warning"
      );
    }
  }

  _updateMerchantSuggestions() {
    const unique = new Set(
      this.recentExpenses
        .map((expense) => expense.merchant)
        .filter((value) => value && value.length > 0)
    );
    this.formData.suggestedMerchants = Array.from(unique).slice(0, 8);
    this._renderMerchantSuggestions();
  }

  _mapExpenseToUi(expense) {
    return {
      id: expense.id,
      merchant: expense.merchant,
      amount: Number(expense.amount) || 0,
      category:
        expense.categoryName ||
        this.categoryMap.get(expense.categoryId) ||
        "Sin categoria",
      paymentMethod: this._extractPaymentMethod(expense.notes),
      date: expense.date,
      status: expense.ticketImageUrl ? "Pendiente" : "Validado",
      note: expense.notes || "",
    };
  }

  _buildNotes(payload) {
    const notes = [];

    if (payload.description) {
      notes.push(payload.description);
    }

    if (payload.reference) {
      notes.push(`Referencia: ${payload.reference}`);
    }

    if (payload.paymentMethod) {
      notes.push(`Metodo de pago: ${payload.paymentMethod}`);
    }

    return notes.length ? notes.join(" | ") : undefined;
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

  _findCategoryIdByName(name) {
    if (!name) {
      return "";
    }

    const lower = name.toLowerCase();
    const match = this.categories.find(
      (category) => category.nombre.toLowerCase() === lower
    );

    return match?.id || "";
  }
}
