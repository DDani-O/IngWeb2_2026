import { PageController } from "../../core/PageController.js";
import { ROUTES, MOCK_USER_DASHBOARD } from "../../utils/constants.js";
import {
  buildHash,
  getChartThemeColors,
} from "../../utils/helpers.js";
import { formatCurrency, formatTrendLabel } from "../../utils/formatters.js";
import { html } from "../../utils/html.js";

export class DashboardPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_USER_DASHBOARD));
    this.charts = [];
  }

  render() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || this.data.user.name;
    const shortName = userName.split(" ")[0] || userName;

    const titleElement = this.element.querySelector("#userWelcomeTitle");
    if (titleElement) {
      titleElement.textContent = `Hola, ${shortName}!`;
    }

    this._setText("#userTopbarName", userName);

    const subtitleElement = this.element.querySelector("#userWelcomeSubtitle");
    if (subtitleElement) {
      subtitleElement.textContent =
        "Tu resumen financiero esta listo. Explora tus patrones de gasto y descubre como mejorar tu economia personal.";
    }

    this._renderCalendar();
    this._renderAlerts();
    this._renderStats();
    this._renderProfileCard();
    this._renderSummaryCards();
    this._renderMerchants();
    this._initCharts();
  }

  attachEvents() {
    this._bindLogoutButtons();
  }

  _renderCalendar() {
    const { calendar } = this.data;

    this._setText("#userCalendarDay", calendar.day);
    this._setText("#userCalendarMonth", calendar.month);
    this._setText("#userCalendarYear", calendar.year);
    this._setText("#userCalendarDayName", calendar.dayName);
  }

  _renderAlerts() {
    const container = this.element.querySelector("#userAlertsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.alerts
      .map((alert) => {
        return html`
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
    const container = this.element.querySelector("#userStatsGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.stats
      .map((stat) => {
        const trendClass =
          stat.trendDirection === "up" ? "kpi-card__trend--up" : "kpi-card__trend--down";

        return html`
          <article class="kpi-card">
            <div class="kpi-card__head">
              <p class="kpi-card__label">${stat.label}</p>
              <span>${stat.emoji}</span>
            </div>
            <p class="kpi-card__value">${this._formatStatValue(stat)}</p>
            <p class="kpi-card__sub">${stat.subtitle}</p>
            <p class="kpi-card__trend ${trendClass}">${formatTrendLabel(
              stat.trendDirection,
              stat.trendValue,
              stat.trendLabel
            )}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderProfileCard() {
    const container = this.element.querySelector("#userProfileCard");
    if (!container) {
      return;
    }

    const { profileCard } = this.data;

    container.innerHTML = html`
      <div>
        <h2 class="section-title mb-1">
          <i class="fa-solid fa-user-shield accent"></i>
          Perfil Activo: ${profileCard.name}
        </h2>
        <p class="text-muted">${profileCard.description}</p>
        <div class="profile-highlight__tags">
          ${profileCard.categories
            .map((category) => html`<span class="profile-tag">${category}</span>`)}
        </div>
      </div>
      <a class="action-btn action-btn--ghost" href="${buildHash(
        ROUTES.CLIENT_PERFILES
      )}" target="_blank">
        <i class="fa-solid fa-user-tag"></i>
        Ver perfiles de gasto
      </a>
    `;
  }

  _renderSummaryCards() {
    const container = this.element.querySelector("#userSummaryGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.summaryCards
      .map((card) => {
        const link = buildHash(card.route);
        const openInNewTab = this._isSecondaryPageRoute(card.route);

        return html`
          <article class="summary-card">
            <h3 class="summary-card__title">
              <i class="fa-solid ${card.icon} accent"></i>
              ${card.title}
            </h3>
            <p class="text-muted mb-2">${card.subtitle}</p>
            <div class="summary-card__list">
              ${card.items
                .map((item) => {
                  return html`<div class="summary-card__row"><span>${item.label}</span><strong>${item.value}</strong></div>`;
                })}
            </div>
            <a class="action-btn action-btn--ghost mt-2" href="${link}" ${
              openInNewTab ? html`target="_blank"` : ""
            }>Ver detalle</a>
          </article>
        `;
      })
      .join("");
  }

  _isSecondaryPageRoute(route) {
    return [
      ROUTES.CLIENT_HISTORIAL,
      ROUTES.CLIENT_PATRONES,
      ROUTES.CLIENT_PERFIL,
      ROUTES.CLIENT_PERFILES,
      ROUTES.CLIENT_RECOMENDACIONES,
    ].includes(route);
  }

  _renderMerchants() {
    const container = this.element.querySelector("#userMerchantsList");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.charts.merchants
      .map((merchant) => {
        return html`
          <div class="merchant-item">
            <div class="merchant-item__left">
              <span>${merchant.icon}</span>
              <div>
                <p>${merchant.name}</p>
              </div>
            </div>
            <strong>${merchant.spending}</strong>
          </div>
        `;
      })
      .join("");
  }

  _initCharts() {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();
    const chartColors = getChartThemeColors();

    const categoryCtx = this.element.querySelector("#userCategoryChart");
    const monthlyCtx = this.element.querySelector("#userMonthlyChart");
    if (categoryCtx) {
      this.charts.push(
        new window.Chart(categoryCtx, {
          type: "doughnut",
          data: {
            labels: this.data.charts.categoryDistribution.map((item) => item.label),
            datasets: [
              {
                data: this.data.charts.categoryDistribution.map((item) => item.value),
                backgroundColor: this.data.charts.categoryDistribution.map(
                  (item) => item.color
                ),
                borderColor: chartColors.border,
                borderWidth: 2,
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                labels: { color: chartColors.label },
              },
            },
          },
        })
      );
    }

    if (monthlyCtx) {
      this.charts.push(
        new window.Chart(monthlyCtx, {
          type: "bar",
          data: {
            labels: this.data.charts.monthlyLabels,
            datasets: [
              {
                label: "Gasto Mensual",
                data: this.data.charts.monthlyExpenses,
                backgroundColor: "rgba(45, 212, 191, 0.4)",
                borderColor: "#2dd4bf",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              x: {
                ticks: { color: chartColors.label },
                grid: { color: chartColors.grid },
              },
              y: {
                ticks: { color: chartColors.label },
                grid: { color: chartColors.grid },
              },
            },
            plugins: {
              legend: {
                labels: { color: chartColors.label },
              },
            },
          },
        })
      );
    }
  }

  _destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  _formatStatValue(stat) {
    if (stat.format === "percent") {
      return `${stat.value}${stat.suffix || "%"}`;
    }

    if (stat.format === "text") {
      return `${stat.value}${stat.suffix ? ` ${stat.suffix}` : ""}`;
    }

    if (stat.format === "number") {
      return `${stat.value}${stat.suffix || ""}`;
    }

    return `${formatCurrency(stat.value)}${stat.suffix || ""}`;
  }

  destroy() {
    this._destroyCharts();
    super.destroy();
  }
}
