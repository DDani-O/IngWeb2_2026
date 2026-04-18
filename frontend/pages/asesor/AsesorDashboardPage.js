import { Component } from "../../core/Component.js";
import { MOCK_ADVISOR_DASHBOARD, ROUTES } from "../../utils/constants.js";
import {
  buildPlaceholderHashFromPreset,
  debounce,
  getInitials,
} from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";

export class AsesorDashboardPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_ADVISOR_DASHBOARD));
    this.filteredClients = [...this.data.clients];
    this.recommendationModal = null;
    this.charts = [];
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const name = currentUser?.fullName || this.data.advisor.name;

    this._setText("#advisorWelcomeTitle", `Hola, ${name.split(" ")[0]}`);
    this._renderPlaceholderLinks();
    this._renderCalendar();
    this._renderAlerts();
    this._renderStats();
    this._renderClients();
    this._renderInbox();
    this._renderRecommendations();
    this._renderRecommendationClientOptions();
    this._initCharts();
  }

  attachEvents() {
    const searchInput = this.element.querySelector("#advisorClientSearch");
    const statusFilter = this.element.querySelector("#advisorClientStatusFilter");

    this.listen(
      searchInput,
      "input",
      debounce(() => {
        this._applyClientFilters();
      }, 220)
    );

    this.listen(statusFilter, "change", () => {
      this._applyClientFilters();
    });

    const recommendationButton = this.element.querySelector("#openCreateRecommendationButton");
    this.listen(recommendationButton, "click", () => this._openRecommendationModal());

    const recommendationForm = this.element.querySelector("#advisorRecommendationForm");
    this.listen(recommendationForm, "submit", (event) => {
      event.preventDefault();
      this._handleCreateRecommendation();
    });

    const inboxButton = this.element.querySelector("#advisorInboxIconButton");
    this.listen(inboxButton, "click", () => {
      this.options.router?.navigate(ROUTES.PLACEHOLDER, {
        title: "Inbox de Asesor",
        description: "La bandeja completa estara disponible en la siguiente fase.",
        icon: "fa-inbox",
        ctaText: "Volver al Dashboard",
        ctaUrl: ROUTES.ADVISOR_DASHBOARD,
      });
    });

    const logoutButton = this.element.querySelector("#advisorLogoutButton");
    this.listen(logoutButton, "click", () => this._handleLogout());
  }

  _renderPlaceholderLinks() {
    this.element.querySelectorAll(".js-placeholder-link").forEach((anchor) => {
      const preset = anchor.dataset.preset;
      anchor.setAttribute("href", buildPlaceholderHashFromPreset(preset));
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
        const isPercentage = stat.suffix === "%";
        const isCurrency = String(stat.label).toLowerCase().includes("gasto");
        const value = isPercentage
          ? `${stat.value}${stat.suffix}`
          : isCurrency
            ? formatCurrency(stat.value)
            : String(stat.value);

        return `
          <article class="kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.label}</p>
              <span>${stat.emoji}</span>
            </div>
            <p class="kpi-card__value">${value}</p>
            <p class="kpi-card__trend ${
              stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down"
            }">${formatTrendLabel(stat.trendDirection, stat.trendValue, stat.trendLabel)}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderClients() {
    const container = this.element.querySelector("#advisorClientsList");
    if (!container) {
      return;
    }

    if (!this.filteredClients.length) {
      container.innerHTML =
        '<p class="text-muted">No hay clientes que coincidan con los filtros seleccionados.</p>';
      return;
    }

    container.innerHTML = this.filteredClients
      .map((client) => {
        return `
          <article class="advisor-client-card">
            <div class="advisor-client-head">
              <div class="d-flex gap-2">
                <span class="avatar-badge">${getInitials(client.name)}</span>
                <div>
                  <p class="advisor-client-name">${client.name}</p>
                  <p class="advisor-client-mail">${client.email}</p>
                </div>
              </div>
              <span class="status-pill status-pill--${client.status}">${client.status}</span>
            </div>
            <div class="advisor-client-meta">
              <span>${client.profile}</span>
              <strong>${formatCurrency(client.totalSpent)}</strong>
            </div>
            <div class="advisor-client-actions">
              <a class="action-btn action-btn--ghost" href="${buildPlaceholderHashFromPreset(
                "advisorClientes",
                { title: `Detalle de ${client.name}` }
              )}">Ver Detalle</a>
              <a class="action-btn action-btn--primary" href="${buildPlaceholderHashFromPreset(
                "advisorInbox"
              )}">Mensaje</a>
            </div>
          </article>
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
        return `
          <article class="inbox-item ${message.unread ? "inbox-item--unread" : ""}">
            <span class="avatar-badge">${getInitials(message.from)}</span>
            <div>
              <p class="inbox-title">${message.from}</p>
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
      .map((item) => {
        return `
          <article class="advisor-rec-card">
            <div class="advisor-rec-card__head">
              <span>${item.clientName}</span>
              <span class="badge-soft badge-soft--warning">${item.status}</span>
            </div>
            <p><strong>${item.type}</strong></p>
            <p class="text-muted">Ahorro estimado: ${formatCurrency(item.savingsAmount)}</p>
            <p class="text-muted">Enviado: ${item.dateSent}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderRecommendationClientOptions() {
    const select = this.element.querySelector("#advisorRecommendationClient");
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

  _applyClientFilters() {
    const search = this.element.querySelector("#advisorClientSearch")?.value?.trim().toLowerCase() || "";
    const status = this.element.querySelector("#advisorClientStatusFilter")?.value || "todos";

    this.filteredClients = this.data.clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search);

      const matchesStatus = status === "todos" ? true : client.status === status;

      return matchesSearch && matchesStatus;
    });

    this._renderClients();
  }

  _openRecommendationModal() {
    if (!window.bootstrap) {
      return;
    }

    const modalElement = this.element.querySelector("#advisorRecommendationModal");
    this.recommendationModal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    this.recommendationModal.show();
  }

  _handleCreateRecommendation() {
    const form = this.element.querySelector("#advisorRecommendationForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.options.showToast?.("Recomendacion creada y enviada al cliente.", "success");
    this.recommendationModal?.hide();
    form.reset();
  }

  _initCharts() {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();

    const profileCtx = this.element.querySelector("#advisorProfileDistributionChart");
    const spendCtx = this.element.querySelector("#advisorSpendByProfileChart");
    const activityCtx = this.element.querySelector("#advisorActivityChart");

    if (profileCtx) {
      this.charts.push(
        new window.Chart(profileCtx, {
          type: "doughnut",
          data: {
            labels: this.data.charts.profileDistribution.map((item) => item.label),
            datasets: [
              {
                data: this.data.charts.profileDistribution.map((item) => item.value),
                backgroundColor: this.data.charts.profileDistribution.map((item) => item.color),
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
              },
            },
          },
        })
      );
    }

    if (spendCtx) {
      this.charts.push(
        new window.Chart(spendCtx, {
          type: "bar",
          data: {
            labels: this.data.charts.spendByProfile.map((item) => item.label),
            datasets: [
              {
                label: "Gasto",
                data: this.data.charts.spendByProfile.map((item) => item.value),
                backgroundColor: "rgba(45, 212, 191, 0.4)",
                borderColor: "#2dd4bf",
              },
            ],
          },
          options: {
            scales: {
              x: { ticks: { color: "#94a3b8" } },
              y: { ticks: { color: "#94a3b8" } },
            },
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
              },
            },
          },
        })
      );
    }

    if (activityCtx) {
      this.charts.push(
        new window.Chart(activityCtx, {
          type: "line",
          data: {
            labels: this.data.charts.dailyActivityLabels,
            datasets: [
              {
                label: "Clientes Activos",
                data: this.data.charts.dailyActivityValues,
                borderColor: "#06b6d4",
                backgroundColor: "rgba(6, 182, 212, 0.2)",
                fill: true,
                tension: 0.3,
              },
            ],
          },
          options: {
            scales: {
              x: { ticks: { color: "#94a3b8" } },
              y: { ticks: { color: "#94a3b8" } },
            },
            plugins: {
              legend: {
                labels: { color: "#94a3b8" },
              },
            },
          },
        })
      );
    }
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion de asesor finalizada.", "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }

  _destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  destroy() {
    this._destroyCharts();
    super.destroy();
  }
}
