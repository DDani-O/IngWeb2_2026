import { PageController } from "../../core/PageController.js";
import { findSpendingProfileContent } from "../../content/spendingProfiles.js";
import { analysisService } from "../../services/analysis.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { RECOMMENDATION_PRIORITIES, ROUTES } from "../../utils/constants.js";
import { formatCurrency, formatMonth, formatTrendLabel } from "../../utils/formatters.js";
import { buildHash, getChartPalette, getChartThemeColors } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

const ALERT_ICONS = { danger: "⚠️", warning: "📈", success: "✅", info: "💡" };

/**
 * Dashboard del cliente: resumen del mes, alertas, perfil asignado, gráficos y ranking de comercios.
 */
export class DashboardPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.charts = [];
  }

  render() {
    const userName = this.options.authManager?.getCurrentUser()?.fullName || "";
    const shortName = userName.split(" ")[0] || userName;

    this._setText("#userWelcomeTitle", shortName ? `Hola, ${shortName}!` : "Hola!");
    this._setText("#userTopbarName", userName);
    this._setText(
      "#userWelcomeSubtitle",
      "Tu resumen financiero esta listo. Explora tus patrones de gasto y descubre como mejorar tu economia personal."
    );
    this._renderCalendar();

    this._loadData(async () => {
      const [analysis, recent, recommendations] = await Promise.all([
        analysisService.getMine(),
        expensesService.list({ limit: 3 }),
        recommendationsService.listMine(),
      ]);

      if (!this._isAlive()) {
        return;
      }

      this._renderAlerts(analysis.alerts);
      this._renderStats(analysis);
      this._renderProfileCard(analysis);
      this._renderSummaryCards(analysis, recent.items, recommendations);
      this._renderMerchants(analysis.merchantRanking);
      this._initCharts(analysis);
    });
  }

  attachEvents() {
    this._bindLogoutButtons();
  }

  _renderCalendar() {
    const today = new Date();
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    this._setText("#userCalendarDay", String(today.getDate()));
    this._setText("#userCalendarMonth", capitalize(today.toLocaleDateString("es-AR", { month: "long" })));
    this._setText("#userCalendarYear", String(today.getFullYear()));
    this._setText("#userCalendarDayName", capitalize(today.toLocaleDateString("es-AR", { weekday: "long" })));
  }

  _renderAlerts(alerts) {
    const container = this.element.querySelector("#userAlertsList");
    if (!container) {
      return;
    }

    container.innerHTML = html`${alerts.map(
      (alert) => html`
        <article class="alert-card alert-card--${alert.level}">
          <div>${ALERT_ICONS[alert.level] || "💡"}</div>
          <div>
            <h3 class="alert-card__title">${alert.title}</h3>
            <p class="alert-card__description">${alert.description}</p>
          </div>
        </article>
      `
    )}`;
  }

  _renderStats(analysis) {
    const container = this.element.querySelector("#userStatsGrid");
    if (!container) {
      return;
    }

    const change = analysis.changeVsPreviousMonth;
    const stats = [
      {
        label: "Gasto del mes",
        emoji: "💸",
        value: formatCurrency(analysis.totalThisMonth),
        subtitle: "Mes en curso",
        // Gastar más que el mes anterior es una tendencia negativa.
        trend: change === null ? null : { direction: change > 0 ? "up" : "down", value: Math.abs(change), label: "vs. mismo periodo del mes anterior", good: change <= 0 },
      },
      { label: "Promedio mensual", emoji: "📊", value: formatCurrency(analysis.monthlyAverage), subtitle: "Ultimos 6 meses" },
      {
        label: "Categoria principal",
        emoji: "🏷️",
        value: analysis.dominantCategory?.name || "--",
        subtitle: analysis.dominantCategory ? `${analysis.dominantCategory.percentage}% de tus gastos` : "Sin gastos registrados",
      },
      { label: "Gastos inusuales", emoji: "🔎", value: String(analysis.unusualExpenses.length), subtitle: "Ultimos 30 dias" },
    ];

    container.innerHTML = html`${stats.map(
      (stat) => html`
        <article class="kpi-card">
          <div class="kpi-card__head">
            <p class="kpi-card__label">${stat.label}</p>
            <span>${stat.emoji}</span>
          </div>
          <p class="kpi-card__value">${stat.value}</p>
          <p class="kpi-card__sub">${stat.subtitle}</p>
          ${stat.trend
            ? html`<p class="kpi-card__trend ${stat.trend.good ? "kpi-card__trend--up" : "kpi-card__trend--down"}">${formatTrendLabel(stat.trend.direction, stat.trend.value, stat.trend.label)}</p>`
            : ""}
        </article>
      `
    )}`;
  }

  _renderProfileCard(analysis) {
    const container = this.element.querySelector("#userProfileCard");
    if (!container) {
      return;
    }

    const profile = analysis.spendingProfile;
    const content = profile ? findSpendingProfileContent(profile.name) : null;
    const topCategories = analysis.byCategory.slice(0, 4).map((item) => item.category);

    container.innerHTML = html`
      <div>
        <h2 class="section-title mb-1">
          <i class="fa-solid fa-user-shield accent"></i>
          ${profile ? `Perfil Activo: ${profile.name}` : "Todavia no tenes un perfil asignado"}
        </h2>
        <p class="text-muted">${content?.description || profile?.description || "El sistema te asigna un perfil cuando registras tus primeros gastos."}</p>
        <div class="profile-highlight__tags">
          ${topCategories.map((category) => html`<span class="profile-tag">${category}</span>`)}
        </div>
      </div>
      <a class="action-btn action-btn--ghost" href="${buildHash(ROUTES.CLIENT_PERFILES)}" target="_blank">
        <i class="fa-solid fa-user-tag"></i>
        Ver perfiles de gasto
      </a>
    `;
  }

  _renderSummaryCards(analysis, recentExpenses, recommendations) {
    const container = this.element.querySelector("#userSummaryGrid");
    if (!container) {
      return;
    }

    const unread = recommendations.filter((item) => !item.read);
    const priorityLabel = (value) => RECOMMENDATION_PRIORITIES.find((item) => item.value === value)?.label || value;

    const cards = [
      {
        title: "Patrones de Consumo",
        subtitle: "Donde se va tu dinero",
        icon: "fa-chart-pie",
        items: analysis.byCategory.slice(0, 3).map((item) => ({ label: item.category, value: `${item.percentage}%` })),
        route: ROUTES.CLIENT_PATRONES,
      },
      {
        title: "Recomendaciones",
        subtitle: unread.length ? `${unread.length} sin leer` : "Estas al dia",
        icon: "fa-lightbulb",
        items: unread.slice(0, 3).map((item) => ({ label: item.title, value: priorityLabel(item.priority) })),
        route: ROUTES.CLIENT_RECOMENDACIONES,
      },
      {
        title: "Ultimos Gastos",
        subtitle: "Movimientos recientes",
        icon: "fa-clock-rotate-left",
        items: recentExpenses.map((item) => ({ label: item.merchant, value: formatCurrency(item.amount) })),
        route: ROUTES.CLIENT_HISTORIAL,
      },
    ];

    container.innerHTML = html`${cards.map(
      (card) => html`
        <article class="summary-card">
          <h3 class="summary-card__title">
            <i class="fa-solid ${card.icon} accent"></i>
            ${card.title}
          </h3>
          <p class="text-muted mb-2">${card.subtitle}</p>
          <div class="summary-card__list">
            ${card.items.length
              ? card.items.map((item) => html`<div class="summary-card__row"><span>${item.label}</span><strong>${item.value}</strong></div>`)
              : html`<p class="text-muted">Sin datos todavia.</p>`}
          </div>
          <a class="action-btn action-btn--ghost mt-2" href="${buildHash(card.route)}" target="_blank">Ver detalle</a>
        </article>
      `
    )}`;
  }

  _renderMerchants(ranking) {
    const container = this.element.querySelector("#userMerchantsList");
    if (!container) {
      return;
    }

    container.innerHTML = ranking.length
      ? html`${ranking.map(
          (merchant, index) => html`
            <div class="merchant-item">
              <div class="merchant-item__left">
                <span>${index + 1}.</span>
                <div>
                  <p>${merchant.merchant}</p>
                  <p class="text-muted">${merchant.count} compras</p>
                </div>
              </div>
              <strong>${formatCurrency(merchant.amount)}</strong>
            </div>
          `
        )}`
      : html`<p class="text-muted">Cuando registres gastos vas a ver aca tus comercios mas frecuentes.</p>`;
  }

  _initCharts(analysis) {
    if (!window.Chart) {
      return;
    }

    this._destroyCharts();
    const colors = getChartThemeColors();
    const palette = getChartPalette();
    const axis = { ticks: { color: colors.label }, grid: { color: colors.grid } };
    const legend = { labels: { color: colors.label } };

    const categoryCanvas = this.element.querySelector("#userCategoryChart");
    if (categoryCanvas) {
      this.charts.push(
        new window.Chart(categoryCanvas, {
          type: "doughnut",
          data: {
            labels: analysis.byCategory.map((item) => item.category),
            datasets: [
              {
                data: analysis.byCategory.map((item) => item.amount),
                backgroundColor: analysis.byCategory.map((_, index) => palette[index % palette.length]),
                borderColor: colors.border,
                borderWidth: 2,
              },
            ],
          },
          options: { plugins: { legend } },
        })
      );
    }

    const monthlyCanvas = this.element.querySelector("#userMonthlyChart");
    if (monthlyCanvas) {
      this.charts.push(
        new window.Chart(monthlyCanvas, {
          type: "bar",
          data: {
            labels: analysis.byMonth.map((item) => formatMonth(item.month)),
            datasets: [
              {
                label: "Gasto Mensual",
                data: analysis.byMonth.map((item) => item.amount),
                backgroundColor: palette[0],
                borderColor: palette[0],
                borderWidth: 1,
              },
            ],
          },
          options: { scales: { x: axis, y: axis }, plugins: { legend } },
        })
      );
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
