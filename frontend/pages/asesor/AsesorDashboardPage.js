import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { ROUTES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class AsesorDashboardPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = this._buildEmptyData();
    this.clientsViewMode = "cards";
    this.recommendationModal = null;
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const fullName = currentUser?.fullName || this.data.advisor.name;
    const firstName = fullName.split(" ")[0] || fullName;

    this._setText("#advisorTopbarName", fullName);
    this._setText("#advisorWelcomeTitle", `Hola, ${firstName}!`);

    this._renderCalendar();
    this._renderAlerts();
    this._renderStats();
    this._renderClients();
    this._renderInbox();
    this._renderRecommendations();
    this._renderRecommendationClientOptions();
    this._syncClientsView();
    this._loadDashboard();
  }

  attachEvents() {
    const toggleViewButton = this.element.querySelector("#advisorClientsViewToggle");
    this.listen(toggleViewButton, "click", () => {
      this.clientsViewMode = this.clientsViewMode === "cards" ? "table" : "cards";
      this._syncClientsView();
    });

    const recommendationButton = this.element.querySelector("#openCreateRecommendationButton");
    this.listen(recommendationButton, "click", () => this._openRecommendationModal());

    const recommendationForm = this.element.querySelector("#advisorClientRecommendationForm");
    if (recommendationForm) {
      this.listen(recommendationForm, "submit", (event) => {
        event.preventDefault();
        this._handleCreateRecommendation();
      });
    }

    const inboxList = this.element.querySelector("#advisorInboxList");
    this.listen(inboxList, "click", (event) => this._handleInboxNavigation(event));
    this.listen(inboxList, "keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      this._handleInboxNavigation(event);
    });

    this._bindLogoutButtons({
      role: "asesor",
      toastMessage: "Sesion de asesor finalizada.",
    });
  }

  _renderCalendar() {
    this._setText("#advisorCalendarDay", this.data.calendar.day);
    this._setText("#advisorCalendarMonth", this.data.calendar.month);
    this._setText("#advisorCalendarYear", this.data.calendar.year);
    this._setText("#advisorCalendarDayName", this.data.calendar.dayName);
  }

  _renderAlerts() {
    const container = this.element.querySelector("#advisorAlertsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.alerts
      .map((alert) => {
        return `
          <article class="alert-card alert-card--${alert.level}">
            <div>${alert.icon}</div>
            <div>
              <h3 class="alert-card__title">${alert.title}</h3>
              <p class="alert-card__description">${alert.description}</p>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderStats() {
    const container = this.element.querySelector("#advisorStatsGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.stats
      .map((stat) => {
        return `
          <article class="kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.label}</p>
              <span>${stat.emoji}</span>
            </div>
            <p class="kpi-card__value">${this._formatStatValue(stat)}</p>
            <p class="kpi-card__trend ${
              stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down"
            }">${formatTrendLabel(stat.trendDirection, stat.trendValue, stat.trendLabel)}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderClients() {
    const cardsContainer = this.element.querySelector("#advisorClientsCards");
    const tableBody = this.element.querySelector("#advisorClientsTableBody");
    const count = this.element.querySelector("#advisorClientsCount");

    if (!cardsContainer || !tableBody) {
      return;
    }

    if (count) {
      count.textContent = String(this.data.clients.length);
    }

    cardsContainer.innerHTML = this.data.clients
      .map((client) => {
        return `
          <article class="advisor-client-card">
            <div class="advisor-client-head">
              <div class="d-flex gap-2 align-items-start">
                <span class="avatar-badge">${getInitials(client.name)}</span>
                <div>
                  <p class="advisor-client-name">${client.name}</p>
                  <p class="advisor-client-mail">${client.profile}</p>
                </div>
              </div>
              <span class="risk-pill risk-pill--${client.riskLevel}">${client.risk}</span>
            </div>

            ${
              client.unreadMessages
                ? `<p class="advisor-client-unread"><i class="fa-solid fa-envelope"></i> ${client.unreadMessages} mensaje(s) sin leer</p>`
                : ""
            }

            <div class="advisor-client-metrics">
              <div>
                <p>ULTIMO GASTO</p>
                <strong>${client.lastExpense}</strong>
              </div>
              <div>
                <p>GASTO PROMEDIO</p>
                <strong>${formatCurrency(client.averageSpend)}</strong>
              </div>
            </div>

            <p class="advisor-client-change advisor-client-change--${
              client.changePercent >= 0 ? "up" : "down"
            }">
              ${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%
            </p>
            <a class="action-btn action-btn--ghost mt-2" href="#/asesor/clientes">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Gestionar cliente
            </a>
          </article>
        `;
      })
      .join("");

    tableBody.innerHTML = this.data.clients
      .map((client) => {
        return `
          <tr>
            <td>
              <div class="advisor-table-client">
                <span class="avatar-badge">${getInitials(client.name)}</span>
                <strong>${client.name}</strong>
              </div>
            </td>
            <td>${client.profile}</td>
            <td>${client.lastExpense}</td>
            <td>${formatCurrency(client.averageSpend)}</td>
            <td class="advisor-client-change advisor-client-change--${
              client.changePercent >= 0 ? "up" : "down"
            }">${client.changePercent >= 0 ? "+" : ""}${client.changePercent}%</td>
            <td>${client.unreadMessages > 0 ? client.unreadMessages : "-"}</td>
            <td><span class="risk-pill risk-pill--${client.riskLevel}">${client.risk}</span></td>
            <td>
              <a class="action-btn action-btn--ghost" href="#/asesor/clientes">
                Gestionar
              </a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  _renderInbox() {
    const container = this.element.querySelector("#advisorInboxList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.inbox
      .map((message) => {
        const badge = message.type === "ticket" ? "TICKET" : "MENSAJE";
        return `
          <article
            class="inbox-item ${message.unread ? "inbox-item--unread" : ""}"
            data-message-id="${message.id}"
            tabindex="0"
            role="button"
            aria-label="Abrir mensaje de ${message.from}"
          >
            <span class="avatar-badge">${getInitials(message.from)}</span>
            <div>
              <p class="inbox-title">
                ${message.from}
                <span class="inbox-badge">${badge}</span>
              </p>
              <p class="inbox-sub">${message.subject}</p>
            </div>
            <div class="text-end">
              <p class="inbox-sub">${message.date}</p>
              ${message.unread ? '<span class="badge-soft badge-soft--success">Nuevo</span>' : ""}
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderRecommendations() {
    const container = this.element.querySelector("#advisorRecommendationsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.recommendations
      .map((column) => {
        return `
          <article class="advisor-rec-column">
            <div class="advisor-rec-column__head">
              <span>${column.icon}</span>
              <div>
                <h3>${column.title}</h3>
                <p>${column.count} recomendaciones</p>
              </div>
            </div>
            <div class="advisor-rec-column__list">
              ${column.items
                .map((item) => `<p><span>${item.clientName}</span><strong>${item.action}</strong></p>`)
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderRecommendationClientOptions() {
    const select = this.element.querySelector("#advisorClientRecommendationClient");
    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">Seleccionar cliente</option>
      ${this.data.clients
        .map((client) => `<option value="${client.id}">${client.name}</option>`)
        .join("")}
    `;
  }

  _syncClientsView() {
    const cards = this.element.querySelector("#advisorClientsCards");
    const tableWrap = this.element.querySelector("#advisorClientsTableWrap");
    const toggle = this.element.querySelector("#advisorClientsViewToggle");

    if (!cards || !tableWrap || !toggle) {
      return;
    }

    const showTable = this.clientsViewMode === "table";
    cards.classList.toggle("app-hidden", showTable);
    tableWrap.classList.toggle("app-hidden", !showTable);

    toggle.innerHTML = showTable
      ? '<i class="fa-solid fa-border-all"></i> Ver como Cards'
      : '<i class="fa-solid fa-table"></i> Ver como Tabla';
  }

  _openRecommendationModal() {
    this.recommendationModal = this._showModal("#advisorClientRecommendationModal");
  }

  async _handleCreateRecommendation() {
    const form = this.element.querySelector("#advisorClientRecommendationForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const payload = this._getRecommendationPayload({
      clientSelector: "#advisorClientRecommendationClient",
      typeSelector: "#advisorClientRecommendationType",
      contentSelector: "#advisorClientRecommendationDescription",
      savingsSelector: "#advisorClientRecommendationSavings",
      titleSelector: "#advisorClientRecommendationTitle",
      prioritySelector: "#advisorClientRecommendationPriority",
      problemSelector: "#advisorClientRecommendationProblem",
      solutionSelector: "#advisorClientRecommendationSolution",
      iconSelector: "#advisorClientRecommendationIcon",
      stepsSelector: "#advisorClientRecommendationSteps",
    });

    try {
      await apiClient.post("/advisor/recommendations", payload);
      this.options.showToast?.("Recomendacion creada y enviada al cliente.", "success");
      this.recommendationModal?.hide();
      form.reset();
      this._loadDashboard();
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo crear la recomendacion.",
        "warning"
      );
    }
  }

  _handleInboxNavigation(event) {
    const target = event.target.closest("[data-message-id]");
    if (!target) {
      return;
    }

    event.preventDefault();
    this.options.router?.navigate(ROUTES.ADVISOR_INBOX, {
      messageId: target.dataset.messageId,
    });
  }

  _formatStatValue(stat) {
    if (stat.format === "percent") {
      return `${stat.value}${stat.suffix || "%"}`;
    }

    if (String(stat.label).toLowerCase().includes("gasto")) {
      return formatCurrency(stat.value);
    }

    return String(stat.value);
  }

  async _loadDashboard() {
    try {
      // Cargar dashboard y evaluación de riesgo en paralelo
      const [dashboardData, riskData] = await Promise.all([
        apiClient.get("/advisor/dashboard"),
        apiClient.get("/advisor/risk-assessment"),
      ]);

      this.data = this._mapDashboardData(dashboardData, riskData);

      this._renderCalendar();
      this._renderAlerts();
      this._renderStats();
      this._renderClients();
      this._renderInbox();
      this._renderRecommendations();
      this._renderRecommendationClientOptions();
      this._syncClientsView();
    } catch (error) {
      // Si falla alguna petición, intentar al menos con dashboard
      try {
        const dashboardData = await apiClient.get("/advisor/dashboard");
        this.data = this._mapDashboardData(dashboardData, null);

        this._renderCalendar();
        this._renderAlerts();
        this._renderStats();
        this._renderClients();
        this._renderInbox();
        this._renderRecommendations();
        this._renderRecommendationClientOptions();
        this._syncClientsView();
      } catch (fallbackError) {
        this.options.showToast?.(
          fallbackError.message || "No se pudo cargar el dashboard del asesor.",
          "warning"
        );
      }
    }
  }

  _mapDashboardData(payload, riskPayload) {
    const advisor = payload?.advisor || {};
    const calendar = payload?.calendar || this._buildEmptyData().calendar;

    // Enriquecer clientes con datos de riesgo
    let clients = Array.isArray(payload?.clients) ? payload.clients : [];
    const riskClients = Array.isArray(riskPayload?.riskClients) ? riskPayload.riskClients : [];

    // Mapear riesgo por cliente
    const riskMap = new Map(riskClients.map((rc) => [rc.clientId, rc]));

    clients = clients.map((client) => {
      const riskData = riskMap.get(client.id);
      return {
        ...client,
        // Actualizar riesgo si hay datos nuevos
        changePercent: riskData?.changePercent ?? client.changePercent ?? 0,
        risk: riskData?.riskLevel?.label ?? client.risk ?? "Bajo",
        riskLevel: (riskData?.riskLevel?.level ?? client.riskLevel ?? "low").toLowerCase(),
      };
    });

    return {
      advisor: {
        name: advisor.name || "Asesor",
        email: advisor.email || "",
        role: advisor.role || "asesor",
      },
      calendar,
      alerts: Array.isArray(payload?.alerts) ? payload.alerts : [],
      stats: Array.isArray(payload?.stats) ? payload.stats : [],
      clients,
      inbox: Array.isArray(payload?.inbox) ? payload.inbox : [],
      recommendations: Array.isArray(payload?.recommendations) ? payload.recommendations : [],
      riskSummary: riskPayload?.summary || { highRisk: 0, mediumRisk: 0, lowRisk: 0 },
    };
  }

  _buildEmptyData() {
    const now = new Date();
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    return {
      advisor: {
        name: "Asesor",
        email: "",
        role: "asesor",
      },
      calendar: {
        day: String(now.getDate()),
        month: months[now.getMonth()],
        year: String(now.getFullYear()),
        dayName: days[now.getDay()],
      },
      alerts: [],
      stats: [],
      clients: [],
      inbox: [],
      recommendations: [],
    };
  }

  _getRecommendationPayload({
    clientSelector,
    typeSelector,
    contentSelector,
    savingsSelector,
    titleSelector,
    prioritySelector,
    problemSelector,
    solutionSelector,
    iconSelector,
    stepsSelector,
  }) {
    const clientId = this._getValue(clientSelector);
    const typeValue = this._getValue(typeSelector);
    const content = this._getValue(contentSelector);
    const savingsRaw = this._getValue(savingsSelector);
    const title = this._getValue(titleSelector);
    const priority = this._getValue(prioritySelector);
    const problem = this._getValue(problemSelector);
    const solution = this._getValue(solutionSelector);
    const icon = this._getValue(iconSelector);
    const stepsRaw = this._getValue(stepsSelector);

    return {
      clientId,
      type: this._mapRecommendationType(typeValue),
      title,
      content,
      priority: priority || "media",
      problem,
      solution,
      icon,
      savingsPotential: Number(savingsRaw || 0),
      implementationSteps: stepsRaw ? String(stepsRaw).split(/\r?\n/).filter(Boolean) : [],
    };
  }

  _mapRecommendationType(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("alerta") || normalized.includes("presupuesto")) {
      return "alerta";
    }
    if (normalized.includes("observacion")) {
      return "observacion";
    }
    return "sugerencia";
  }
}
