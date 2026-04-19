import { PageController } from "../../core/PageController.js";
import { MOCK_ADVISOR_DASHBOARD } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";

export class AsesorInboxPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.messages = JSON.parse(JSON.stringify(MOCK_ADVISOR_DASHBOARD.inbox)).map(
      (message) => ({
        ...message,
        body:
          message.type === "ticket"
            ? "Adjuntamos informacion adicional para ayudarte con el seguimiento del cliente."
            : "Necesito tu orientacion para ajustar mi plan financiero en esta semana.",
      })
    );
    this.filteredMessages = [...this.messages];
    const initialMessageId = options.query?.messageId || null;
    this.selectedMessageId = this.messages.some((message) => message.id === initialMessageId)
      ? initialMessageId
      : this.messages[0]?.id || null;
  }

  render() {
    this._resetViewPosition();

    const currentAdvisor = this.options.authManager?.getCurrentUser();
    const advisorName = currentAdvisor?.fullName || "Maria Rodriguez";
    this._setText("#advisorTopbarName", advisorName);

    this._applyFilters();
    this._renderDetail();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#advisorInboxSearch");
    const filterSelect = this.element.querySelector("#advisorInboxFilter");
    const list = this.element.querySelector("#advisorInboxListPage");
    const markReadButton = this.element.querySelector("#markInboxReadButton");
    const replyForm = this.element.querySelector("#advisorInboxReplyForm");

    this.listen(searchInput, "input", () => this._applyFilters());
    this.listen(filterSelect, "change", () => this._applyFilters());

    this.listen(list, "click", (event) => {
      const item = event.target.closest("[data-message-id]");
      if (!item) {
        return;
      }

      this.selectedMessageId = item.dataset.messageId;
      this._renderList();
      this._renderDetail();
    });

    this.listen(markReadButton, "click", () => this._markCurrentAsRead());

    this.listen(replyForm, "submit", (event) => {
      event.preventDefault();
      const message = this.element.querySelector("#advisorInboxReplyMessage")?.value.trim();

      if (!message) {
        this.options.showToast?.("Escribe una respuesta antes de enviar.", "warning");
        return;
      }

      this.options.showToast?.("Respuesta enviada al cliente.", "success");
      replyForm.reset();
      this._markCurrentAsRead();
    });

    this._bindLogoutButtons({
      role: "asesor",
      toastMessage: "Sesion de asesor finalizada.",
    });
  }

  _applyFilters() {
    const search = this._getValue("#advisorInboxSearch").toLowerCase();
    const filter = this._getValue("#advisorInboxFilter") || "Todos";

    let result = [...this.messages];

    if (search) {
      result = result.filter((message) => {
        return (
          message.from.toLowerCase().includes(search) ||
          message.subject.toLowerCase().includes(search)
        );
      });
    }

    if (filter === "No leidos") {
      result = result.filter((message) => message.unread);
    }

    if (filter === "Tickets") {
      result = result.filter((message) => message.type === "ticket");
    }

    if (filter === "Mensajes") {
      result = result.filter((message) => message.type === "mensaje");
    }

    this.filteredMessages = result;

    if (!this.filteredMessages.some((message) => message.id === this.selectedMessageId)) {
      this.selectedMessageId = this.filteredMessages[0]?.id || null;
    }

    this._renderList();
    this._renderDetail();
  }

  _renderList() {
    const container = this.element.querySelector("#advisorInboxListPage");
    const count = this.element.querySelector("#advisorInboxCount");

    if (!container || !count) {
      return;
    }

    count.textContent = `${this.filteredMessages.length} conversaciones`;

    if (!this.filteredMessages.length) {
      container.innerHTML = `
        <article class="history-empty">
          <i class="fa-solid fa-inbox"></i>
          <h3>No hay mensajes para este filtro</h3>
        </article>
      `;
      return;
    }

    container.innerHTML = this.filteredMessages
      .map((message) => {
        const isActive = message.id === this.selectedMessageId;
        return `
          <article class="advisor-inbox-item-page ${
            isActive ? "advisor-inbox-item-page--active" : ""
          } ${message.unread ? "advisor-inbox-item-page--unread" : ""}" data-message-id="${
            message.id
          }">
            <span class="avatar-badge">${getInitials(message.from)}</span>
            <div>
              <p class="advisor-inbox-item-page__title">${message.from}</p>
              <p class="advisor-inbox-item-page__subject">${message.subject}</p>
            </div>
            <div class="text-end">
              <p class="advisor-inbox-item-page__date">${message.date}</p>
              <span class="badge-soft ${
                message.unread ? "badge-soft--warning" : "badge-soft--success"
              }">${message.unread ? "No leido" : "Leido"}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderDetail() {
    const message = this.messages.find((item) => item.id === this.selectedMessageId);

    if (!message) {
      this._setText("#advisorInboxDetailFrom", "-");
      this._setText("#advisorInboxDetailSubject", "-");
      this._setText("#advisorInboxDetailDate", "-");
      this._setText("#advisorInboxDetailBody", "Selecciona un mensaje para ver el detalle.");
      return;
    }

    this._setText("#advisorInboxDetailFrom", message.from);
    this._setText("#advisorInboxDetailSubject", message.subject);
    this._setText("#advisorInboxDetailDate", message.date);
    this._setText("#advisorInboxDetailBody", message.body);
  }

  _markCurrentAsRead() {
    const message = this.messages.find((item) => item.id === this.selectedMessageId);
    if (!message || !message.unread) {
      return;
    }

    message.unread = false;
    this.options.showToast?.("Conversacion marcada como leida.", "success");
    this._applyFilters();
  }

}
