import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { getInitials } from "../../utils/helpers.js";

export class AsesorInboxPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.messages = [];
    this.filteredMessages = [];
    this.messageDetails = new Map();
    this.initialMessageId = options.query?.messageId || null;
    this.selectedMessageId = null;
  }

  render() {
    this._resetViewPosition();

    const currentAdvisor = this.options.authManager?.getCurrentUser();
    const advisorName = currentAdvisor?.fullName || "Maria Rodriguez";
    this._setText("#advisorTopbarName", advisorName);

    this._applyFilters();
    this._renderDetail();
    this._loadInbox();
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
      this.initialMessageId = this.selectedMessageId;
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

      this._sendReply(message, replyForm);
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

    const detail = this.messageDetails.get(message.id);

    this._setText("#advisorInboxDetailFrom", detail?.from || message.from || "-");
    this._setText("#advisorInboxDetailSubject", detail?.subject || message.subject || "-");
    this._setText("#advisorInboxDetailDate", detail?.date || message.date || "-");
    this._setText(
      "#advisorInboxDetailBody",
      detail?.body || "Cargando detalle del mensaje..."
    );

    if (!detail) {
      this._loadMessageDetail(message);
    }
  }

  async _markCurrentAsRead() {
    const message = this.messages.find((item) => item.id === this.selectedMessageId);
    if (!message || !message.unread) {
      return;
    }

    try {
      await apiClient.patch(`/advisor/messages/${message.id}/read`);
      message.unread = false;
      this.options.showToast?.("Conversacion marcada como leida.", "success");
      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo marcar el mensaje como leido.",
        "warning"
      );
    }
  }

  async _loadInbox() {
    try {
      const response = await apiClient.get("/advisor/messages");
      const messages = Array.isArray(response?.data) ? response.data : [];
      this.messages = messages.map((message) => this._mapPreviewMessage(message));

      if (this.initialMessageId) {
        this.selectedMessageId = this.messages.some(
          (item) => item.id === this.initialMessageId
        )
          ? this.initialMessageId
          : this.messages[0]?.id || null;
      } else {
        this.selectedMessageId = this.messages[0]?.id || null;
      }

      this._applyFilters();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudieron cargar los mensajes.",
        "warning"
      );
    }
  }

  _mapPreviewMessage(message) {
    return {
      id: message.id,
      clientId: message.clientId,
      from: message.from || "Cliente",
      subject: message.subject || "Mensaje del cliente",
      date: message.date || "-",
      type: message.type || "mensaje",
      unread: Boolean(message.unread),
    };
  }

  async _loadMessageDetail(message) {
    if (!message?.clientId) {
      return;
    }

    try {
      const response = await apiClient.get("/advisor/messages", {
        query: { clientId: message.clientId, page: 1, limit: 20 },
      });
      const rows = Array.isArray(response?.data) ? response.data : [];
      const selected =
        rows.find((row) => row.id === message.id) || rows[0] || null;

      if (!selected) {
        return;
      }

      this.messageDetails.set(message.id, {
        from: selected.from?.name || message.from,
        subject: selected.subject || message.subject,
        date: this._formatDetailDate(selected.dateSent),
        body: selected.body || "",
      });

      this._renderDetail();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo cargar el detalle del mensaje.",
        "warning"
      );
    }
  }

  async _sendReply(content, replyForm) {
    const message = this.messages.find((item) => item.id === this.selectedMessageId);
    if (!message?.clientId) {
      this.options.showToast?.("Selecciona una conversacion valida.", "warning");
      return;
    }

    const detail = this.messageDetails.get(message.id);
    const subject = detail?.subject || message.subject || "Mensaje del asesor";

    try {
      await apiClient.post("/advisor/messages", {
        clientId: message.clientId,
        content,
        subject,
        type: "mensaje",
      });

      this.options.showToast?.("Respuesta enviada al cliente.", "success");
      replyForm.reset();
      await this._loadInbox();
      this._markCurrentAsRead();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo enviar la respuesta.",
        "warning"
      );
    }
  }

  _formatDetailDate(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

}
