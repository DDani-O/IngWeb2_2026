import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { formField, formGrid } from "../../components/molecules/formField.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { TicketUploader } from "../../components/organisms/TicketUploader.js";
import { categoriesService } from "../../services/categories.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { ticketsService } from "../../services/tickets.service.js";
import { EXPENSE_ORIGINS, STORAGE_KEYS } from "../../utils/constants.js";
import { formatCurrency, formatDate, todayIsoDate } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

const RECENT_LIMIT = 6;
const DRAFT_FIELDS = ["merchant", "amount", "categoryId", "date", "description"];

/**
 * Carga de gastos (consigna §4.2): formulario manual con los campos de la consigna y carga por
 * imagen de ticket con OCR/IA, que precompleta el formulario para que el cliente lo revise.
 */
export class CargarGastoPage extends PageController {
  static template = "./pages/cliente/cargar-gasto.html";

  constructor(element, options = {}) {
    super(element, options);
    // Resultado del OCR: si existe al guardar, el gasto queda con origen "ticket".
    this.ticketAnalysis = null;
    this.categories = [];
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.draftStorageKey = `${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}`;
  }

  render() {
    this._renderFields();
    this.uploader = this.mountChild(TicketUploader, "#ticketUploader", { inputId: "expenseTicketFile" });

    this._loadData(async () => {
      const [categories, recent] = await Promise.all([categoriesService.list(), expensesService.list({ limit: RECENT_LIMIT })]);
      if (!this._isAlive()) {
        return;
      }

      this.categories = categories;
      this._renderFields(this._readDraft());
      this._renderRecent(recent.items);
    });
  }

  attachEvents() {
    const form = this.element.querySelector("#expenseForm");
    this.listen(form, "submit", (event) => this._handleSubmit(event));
    this.listen(form, "input", () => this._persistDraft());
    this.listen(form, "change", () => this._persistDraft());
    this.listen(this.element.querySelector('[data-action="clear"]'), "click", () => this._clearForm());
    this.listen(this.element, "ticket-analyze", (event) => this._analyzeTicket(event.detail.file));
    this._bindDashboardBackButtons();
  }

  /**
   * Dibuja los campos del formulario con los valores indicados.
   * @param {{merchant?, amount?, categoryId?, date?, description?}} values
   */
  _renderFields(values = {}) {
    const container = this.element.querySelector("#expenseFields");
    container.innerHTML = formGrid(html`
      ${formField({ id: "expenseMerchant", name: "merchant", label: "Comercio", required: true, width: "half", value: values.merchant, inputAttrs: { list: "merchantSuggestions", autocomplete: "off", maxlength: 120 } })}
      ${formField({ id: "expenseAmount", name: "amount", label: "Monto", type: "number", required: true, width: "half", value: values.amount, inputAttrs: { min: "0.01", step: "0.01", inputmode: "decimal" } })}
      ${formField({ id: "expenseCategory", name: "categoryId", label: "Categoria", type: "select", required: true, width: "half", value: values.categoryId, placeholderOption: "Seleccionar categoria", options: this.categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` })) })}
      ${formField({ id: "expenseDate", name: "date", label: "Fecha", type: "date", required: true, width: "half", value: values.date || todayIsoDate(), inputAttrs: { max: todayIsoDate() } })}
      ${formField({ id: "expenseDescription", name: "description", label: "Descripcion", type: "textarea", value: values.description, inputAttrs: { placeholder: "Ej: compra semanal, combustible, etc.", maxlength: 300 } })}
    `);
  }

  _renderRecent(expenses) {
    const merchants = [...new Set(expenses.map((expense) => expense.merchant))];
    this.element.querySelector("#merchantSuggestions").innerHTML = html`${merchants.map((merchant) => html`<option value="${merchant}"></option>`)}`;

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

  async _handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const values = this._readValues();
    const created = await this._runAction(
      () =>
        expensesService.create({
          ...values,
          amount: Number(values.amount),
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
    this._renderFields({
      merchant: analysis.merchant,
      amount: analysis.amount ?? "",
      categoryId: analysis.categoryId,
      date: analysis.date,
      description: `Ticket: ${analysis.fileName}`,
    });
    this._showOcrResult(analysis);
    this._persistDraft();
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

  _readValues() {
    const form = this.element.querySelector("#expenseForm");
    const values = Object.fromEntries(new FormData(form).entries());
    return {
      merchant: (values.merchant || "").trim(),
      amount: values.amount || "",
      categoryId: values.categoryId || "",
      date: values.date || "",
      description: (values.description || "").trim(),
    };
  }

  _persistDraft() {
    localStorage.setItem(this.draftStorageKey, JSON.stringify(this._readValues()));
  }

  _readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(this.draftStorageKey) || "{}");
      return Object.fromEntries(DRAFT_FIELDS.map((field) => [field, draft[field] || ""]));
    } catch {
      localStorage.removeItem(this.draftStorageKey);
      return {};
    }
  }

  _clearForm() {
    localStorage.removeItem(this.draftStorageKey);
    this.ticketAnalysis = null;
    this._renderFields();
    this._showOcrResult(null);
    this.uploader.reset();
  }
}
