import { Component } from "../../core/Component.js";
import { MOCK_ADVISOR_REPORTS, ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";

const VALID_SECTIONS = ["comisiones", "tareas", "descargas"];

export class AsesorReportesPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_ADVISOR_REPORTS));
    this.activeSection = this._resolveInitialSection();
  }

  render() {
    this._resetViewPosition();

    const currentAdvisor = this.options.authManager?.getCurrentUser();
    const advisorName = currentAdvisor?.fullName || "Maria Rodriguez";
    this._setText("#advisorTopbarName", advisorName);

    this._renderSummary();
    this._renderCommissions();
    this._renderTasks();
    this._renderDownloads();
    this._syncSectionUi();
  }

  attachEvents() {
    this.element.querySelectorAll(".report-tab-btn").forEach((button) => {
      this.listen(button, "click", () => {
        const section = button.dataset.section;
        this._setSection(section, true);
      });
    });

    const taskList = this.element.querySelector("#advisorTaskList");
    const downloadList = this.element.querySelector("#advisorDownloadList");
    const backButton = this.element.querySelector("#backToAdvisorDashboardFromReports");

    this.listen(taskList, "click", (event) => this._handleTaskAction(event));
    this.listen(downloadList, "click", (event) => this._handleDownloadAction(event));

    this.listen(backButton, "click", () => {
      this.options.router?.navigate(ROUTES.ADVISOR_DASHBOARD);
    });

    ["#advisorLogoutButton", "#advisorLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderSummary() {
    const container = this.element.querySelector("#advisorReportsSummary");
    if (!container) {
      return;
    }

    const summary = this.data.summary;

    container.innerHTML = `
      <article class="kpi-card">
        <div class="kpi-card__head"><p class="kpi-card__label">Clientes activos</p><span>👥</span></div>
        <p class="kpi-card__value">${summary.activeClients}</p>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__head"><p class="kpi-card__label">Comisiones del mes</p><span>💰</span></div>
        <p class="kpi-card__value">${formatCurrency(summary.monthlyCommissions)}</p>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__head"><p class="kpi-card__label">Tareas pendientes</p><span>✅</span></div>
        <p class="kpi-card__value">${summary.pendingTasks}</p>
      </article>
      <article class="kpi-card">
        <div class="kpi-card__head"><p class="kpi-card__label">Descargas listas</p><span>📦</span></div>
        <p class="kpi-card__value">${summary.reportsReady}</p>
      </article>
    `;
  }

  _renderCommissions() {
    const body = this.element.querySelector("#advisorCommissionsBody");
    if (!body) {
      return;
    }

    body.innerHTML = this.data.commissions
      .map((item) => {
        return `
          <tr>
            <td>${item.month}</td>
            <td>${item.clientsServed}</td>
            <td>${item.recommendationsSent}</td>
            <td>${formatCurrency(item.commissionAmount)}</td>
            <td>
              <span class="badge-soft ${
                item.status === "Pagado" ? "badge-soft--success" : "badge-soft--warning"
              }">${item.status}</span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  _renderTasks() {
    const container = this.element.querySelector("#advisorTaskList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.tasks
      .map((task) => {
        return `
          <article class="advisor-task-item ${
            task.status === "Completada" ? "advisor-task-item--done" : ""
          }">
            <div>
              <p class="advisor-task-item__title">${task.title}</p>
              <p class="advisor-task-item__meta">Cliente: ${task.clientName} · Vence: ${task.dueDate}</p>
              <span class="badge-soft ${
                task.priority === "Alta" ? "badge-soft--danger" : "badge-soft--warning"
              }">${task.priority}</span>
              <span class="badge-soft ${
                task.status === "Completada" ? "badge-soft--success" : "badge-soft--warning"
              }">${task.status}</span>
            </div>
            <button class="action-btn action-btn--ghost" data-task-action="toggle" data-task-id="${
              task.id
            }" type="button">
              ${task.status === "Completada" ? "Reabrir" : "Marcar completada"}
            </button>
          </article>
        `;
      })
      .join("");
  }

  _renderDownloads() {
    const container = this.element.querySelector("#advisorDownloadList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.downloads
      .map((item) => {
        return `
          <article class="advisor-download-item">
            <div>
              <p class="advisor-download-item__title">${item.title}</p>
              <p class="advisor-download-item__meta">${item.description}</p>
              <p class="advisor-download-item__meta">Actualizado: ${item.updatedAt} · ${item.size}</p>
            </div>
            <button class="action-btn action-btn--primary" data-download-id="${item.id}" type="button">
              Descargar ${item.format}
            </button>
          </article>
        `;
      })
      .join("");
  }

  _setSection(section, updateHash) {
    if (!VALID_SECTIONS.includes(section)) {
      return;
    }

    this.activeSection = section;
    this._syncSectionUi();

    if (updateHash) {
      this.options.router?.navigate(ROUTES.ADVISOR_REPORTES, { section }, { replace: true });
    }
  }

  _syncSectionUi() {
    this.element.querySelectorAll(".report-tab-btn").forEach((button) => {
      const isActive = button.dataset.section === this.activeSection;
      button.classList.toggle("report-tab-btn--active", isActive);
      button.classList.toggle("action-btn--primary", isActive);
      button.classList.toggle("action-btn--ghost", !isActive);
    });

    this._toggleSection("#reportSectionComisiones", this.activeSection === "comisiones");
    this._toggleSection("#reportSectionTareas", this.activeSection === "tareas");
    this._toggleSection("#reportSectionDescargas", this.activeSection === "descargas");
  }

  _toggleSection(selector, visible) {
    const section = this.element.querySelector(selector);
    if (!section) {
      return;
    }

    section.classList.toggle("app-hidden", !visible);
  }

  _handleTaskAction(event) {
    const button = event.target.closest("[data-task-action]");
    if (!button) {
      return;
    }

    const taskId = button.dataset.taskId;
    const task = this.data.tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    task.status = task.status === "Completada" ? "Pendiente" : "Completada";
    this._renderTasks();
    this.options.showToast?.("Estado de tarea actualizado.", "success");
  }

  _handleDownloadAction(event) {
    const button = event.target.closest("[data-download-id]");
    if (!button) {
      return;
    }

    const reportId = button.dataset.downloadId;
    const report = this.data.downloads.find((item) => item.id === reportId);

    if (!report) {
      return;
    }

    this.options.showToast?.(`Descarga iniciada: ${report.title}.`, "success");
  }

  _resolveInitialSection() {
    const sectionFromQuery = this.options.query?.section;
    if (VALID_SECTIONS.includes(sectionFromQuery)) {
      return sectionFromQuery;
    }

    return "comisiones";
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion de asesor finalizada.", "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  _resetViewPosition() {
    window.scrollTo(0, 0);

    const routeContainer = document.querySelector("#appRouteContainer");
    if (routeContainer) {
      routeContainer.scrollTop = 0;
    }
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }
}
