import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

const DRAFT_STORAGE_KEY = "fintrack.userExpenseDraft.v1";
const DEFAULT_PAYMENT_METHODS = ["Debito", "Credito", "Efectivo", "Transferencia"];

export class CargarGastoPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.categories = [];
    this.categoryMap = new Map();
    this.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
    this.suggestedMerchants = [];
    this.recentExpenses = [];
    this.currentTicketId = null;
    this.ocrAnalysis = null;
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
    const dropzone = this.element.querySelector("#ticketDropzone");

    this.listen(form, "submit", (event) => this._handleFormSubmit(event));
    this.listen(form, "input", () => this._persistDraft());
    this.listen(form, "change", () => this._persistDraft());

    this.listen(clearButton, "click", () => this._clearForm());
    this.listen(analyzeButton, "click", () => this._analyzeTicket());

    this.listen(fileInput, "change", () => {
      const selectedFile = fileInput?.files?.[0];
      if (selectedFile) {
        this._updateFileSelection(selectedFile);
      }
    });

    this.listen(dropzone, "dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("ticket-dropzone--active");
    });
    this.listen(dropzone, "dragleave", () => {
      dropzone.classList.remove("ticket-dropzone--active");
    });
    this.listen(dropzone, "drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("ticket-dropzone--active");
      const droppedFile = event.dataTransfer?.files?.[0];
      if (droppedFile && fileInput) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        fileInput.files = dt.files;
        this._updateFileSelection(droppedFile);
      }
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
        ...this.paymentMethods.map(
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

    datalist.innerHTML = this.suggestedMerchants
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
      let response;

      if (this.currentTicketId) {
        response = await apiClient.post(
          `/tickets/${this.currentTicketId}/confirm`,
          {
            comercio: payload.merchant,
            fecha: payload.date,
            monto: payload.amount,
            categoryId: payload.categoryId,
            descripcion: notes || undefined,
          },
        );
        this.currentTicketId = null;
        this.ocrAnalysis = null;
      } else {
        response = await apiClient.post("/expenses", {
          amount: payload.amount,
          merchant: payload.merchant,
          categoryId: payload.categoryId,
          date: payload.date,
          notes,
        });
      }

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
        "warning",
      );
    }
  }

  async _analyzeTicket() {
    const fileInput = this.element.querySelector("#expenseTicketFile");
    const selectedFile = fileInput?.files?.[0];

    if (!selectedFile) {
      this.options.showToast?.(
        "Seleccioná una imagen o PDF del ticket para analizar.",
        "warning",
      );
      return;
    }

    this._setOcrLoading(true);
    this._showOcrResult(null);
    this._showOcrError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await apiClient.postFile("/tickets/upload", formData);

      this.currentTicketId = response.ticketId;
      this.ocrAnalysis = response.analysis;

      const analysis = response.analysis;
      const categoryId =
        analysis.categoriaSugeridaId ||
        this._findCategoryIdByName(analysis.categoriaSugeridaNombre);

      if (analysis.comercioDetectado) {
        this._setInputValue("#expenseMerchant", analysis.comercioDetectado);
      }
      if (analysis.montoDetectado != null) {
        this._setInputValue("#expenseAmount", String(analysis.montoDetectado));
      }
      if (categoryId) {
        this._setInputValue("#expenseCategory", categoryId);
      }
      if (analysis.fechaDetectada) {
        this._setInputValue("#expenseDate", analysis.fechaDetectada);
      }

      this._showOcrResult(analysis, selectedFile.name);
      this._persistDraft();
      this.options.showToast?.(
        "Ticket analizado correctamente. Revisá los datos antes de guardar.",
        "success",
      );
    } catch (error) {
      this.currentTicketId = null;
      this.ocrAnalysis = null;
      this._showOcrError(error.message || "No se pudo analizar el ticket.");
      this.options.showToast?.(
        error.message || "No se pudo analizar el ticket.",
        "danger",
      );
    } finally {
      this._setOcrLoading(false);
    }
  }

  _showOcrResult(analysis, fileName = "") {
    const card = this.element.querySelector("#ocrResultCard");
    const rows = this.element.querySelector("#ocrResultRows");
    const badge = this.element.querySelector("#ocrConfidenceBadge");

    if (!card || !rows) {
      return;
    }

    if (!analysis) {
      card.classList.add("app-hidden");
      rows.innerHTML = "";
      return;
    }

    const confianza = analysis.confianciaGeneral ?? 0;
    if (badge) {
      const level =
        confianza >= 75 ? "alta" : confianza >= 45 ? "media" : "baja";
      badge.textContent = `Confianza ${confianza}%`;
      badge.className = `ocr-confidence ocr-confidence--${level}`;
    }

    const rowData = [
      { label: "Archivo", value: fileName || "—" },
      {
        label: "Comercio",
        value: analysis.comercioDetectado || "No detectado",
      },
      {
        label: "Monto",
        value:
          analysis.montoDetectado != null
            ? formatCurrency(analysis.montoDetectado)
            : "No detectado",
      },
      {
        label: "Categoria sugerida",
        value: analysis.categoriaSugeridaNombre || "No detectada",
      },
      { label: "Fecha", value: analysis.fechaDetectada || "No detectada" },
    ];

    rows.innerHTML = rowData
      .map(
        (row) =>
          `<div class="ocr-result__row"><span>${row.label}</span><strong>${row.value}</strong></div>`,
      )
      .join("");

    card.classList.remove("app-hidden");
  }

  _updateFileSelection(file) {
    this._setText("#ticketFileName", `Archivo: ${file.name}`);

    const previewContainer = this.element.querySelector(
      "#ticketPreviewContainer",
    );
    const imgPreview = this.element.querySelector("#ticketImagePreview");
    const pdfPreview = this.element.querySelector("#ticketPdfPreview");
    const pdfName = this.element.querySelector("#ticketPdfName");

    if (!previewContainer) return;

    previewContainer.classList.remove("app-hidden");

    if (file.type === "application/pdf") {
      imgPreview?.classList.add("app-hidden");
      pdfPreview?.classList.remove("app-hidden");
      if (pdfName) pdfName.textContent = file.name;
    } else {
      pdfPreview?.classList.add("app-hidden");
      imgPreview?.classList.remove("app-hidden");
      if (imgPreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imgPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  _setOcrLoading(loading) {
    const loadingEl = this.element.querySelector("#ocrLoadingState");
    const analyzeBtn = this.element.querySelector("#analyzeTicketButton");

    if (loadingEl) {
      loadingEl.classList.toggle("app-hidden", !loading);
    }
    if (analyzeBtn) {
      analyzeBtn.disabled = loading;
    }
  }

  _showOcrError(message) {
    const errorEl = this.element.querySelector("#ocrErrorState");
    const msgEl = this.element.querySelector("#ocrErrorMessage");

    if (!errorEl) return;

    if (!message) {
      errorEl.classList.add("app-hidden");
      return;
    }

    if (msgEl) msgEl.textContent = message;
    errorEl.classList.remove("app-hidden");
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

    this.currentTicketId = null;
    this.ocrAnalysis = null;

    this._showOcrResult(null);
    this._showOcrError(null);

    const previewContainer = this.element.querySelector("#ticketPreviewContainer");
    if (previewContainer) previewContainer.classList.add("app-hidden");
    this._setText("#ticketFileName", "Arrastra una imagen o PDF, o hace click para seleccionar");

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
    this.suggestedMerchants = Array.from(unique).slice(0, 8);
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
      status: expense.origin === "ticket" ? "OCR Confirmado" : "Validado",
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
