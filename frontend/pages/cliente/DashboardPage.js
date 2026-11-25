import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { button } from "../../components/atoms/button.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { dateCard } from "../../components/molecules/dateCard.js";
import { emptyState } from "../../components/molecules/stateBlock.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { mediaItem } from "../../components/molecules/mediaItem.js";
import { recommendationLabels } from "../../components/molecules/recommendationCard.js";
import { statCard } from "../../components/molecules/statCard.js";
import { ChartCard } from "../../components/organisms/ChartCard.js";
import { findSpendingProfileContent } from "../../content/spendingProfiles.js";
import { analysisService } from "../../services/analysis.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { PRIORITY_TONES, ROUTES } from "../../utils/constants.js";
import { formatCurrency, formatMonth, formatShortDate } from "../../utils/formatters.js";
import { buildHash } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Dashboard del cliente: resumen del mes, alertas, perfil asignado, resúmenes, gráficos y
 * ranking de comercios (consigna §4.4). Compone átomos, moléculas y ChartCard.
 */
export class DashboardPage extends PageController {
  static template = "./pages/cliente/dashboard.html";

  render() {
    const fullName = this.options.authManager?.getCurrentUser()?.fullName || "";
    const firstName = fullName.split(" ")[0];
    this._setText("#dashboardWelcome", firstName ? `Hola, ${firstName}!` : "Hola!");
    this.element.querySelector("#dashboardDate").innerHTML = dateCard();

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
      this._renderProfile(analysis);
      this._renderSummaries(analysis, recent.items, recommendations);
      this._renderMerchants(analysis.merchantRanking);
      this._renderCharts(analysis);
    });
  }

  _renderAlerts(alerts) {
    this.element.querySelector("#dashboardAlerts").innerHTML = html`${alerts.map((alert) => alertItem({ title: alert.title, description: alert.description, tone: alert.level }))}`;
  }

  _renderStats(analysis) {
    this.element.querySelector("#dashboardStats").innerHTML = html`
      ${statCard({ label: "Gasto del mes", emoji: "💸", value: analysis.totalThisMonth, format: "currency", subtitle: "Mes en curso", trend: { value: analysis.changeVsPreviousMonth, label: "vs. mismo periodo del mes anterior" } })}
      ${statCard({ label: "Promedio mensual", emoji: "📊", value: analysis.monthlyAverage, format: "currency", subtitle: "Ultimos 6 meses" })}
      ${statCard({ label: "Categoria principal", emoji: "🏷️", value: analysis.dominantCategory?.name || "--", format: "text", subtitle: analysis.dominantCategory ? `${analysis.dominantCategory.percentage}% de tus gastos` : "Sin gastos registrados" })}
      ${statCard({ label: "Gastos inusuales", emoji: "🔎", value: analysis.unusualExpenses.length, subtitle: "Ultimos 30 dias" })}
    `;
  }

  _renderProfile(analysis) {
    const profile = analysis.spendingProfile;
    const content = profile ? findSpendingProfileContent(profile.name) : null;

    this.element.querySelector("#dashboardProfile").innerHTML = infoCard({
      highlight: true,
      icon: "fa-user-shield",
      title: profile ? `Perfil activo: ${profile.name}` : "Todavia no tenes un perfil asignado",
      subtitle: content?.description || profile?.description || "El sistema te asigna un perfil cuando registras tus primeros gastos.",
      body: html`<div class="tag-list">${analysis.byCategory.slice(0, 4).map((item) => badge({ text: item.category }))}</div>`,
      footer: button({ label: "Ver perfiles de gasto", variant: "ghost", icon: "fa-user-tag", href: buildHash(ROUTES.CLIENT_PERFILES), newTab: true }),
    });
  }

  _renderSummaries(analysis, recentExpenses, recommendations) {
    const unread = recommendations.filter((item) => !item.read);
    const summary = ({ title, icon, subtitle, items, route }) =>
      infoCard({
        title,
        icon,
        subtitle,
        body: items.length ? keyValueList({ items }) : html`<p class="text-muted">Sin datos todavia.</p>`,
        // Detalle o análisis desde el dashboard: pestaña nueva (ver core/TabRegistry.js).
        footer: button({ label: "Ver detalle", variant: "ghost", size: "sm", href: buildHash(route), newTab: true }),
      });

    this.element.querySelector("#dashboardSummaries").innerHTML = html`
      ${summary({
        title: "Patrones de Consumo",
        icon: "fa-chart-pie",
        subtitle: "Donde se va tu dinero",
        items: analysis.byCategory.slice(0, 3).map((item) => ({ label: item.category, value: `${item.percentage}%` })),
        route: ROUTES.CLIENT_PATRONES,
      })}
      ${summary({
        title: "Recomendaciones",
        icon: "fa-lightbulb",
        subtitle: unread.length ? `${unread.length} sin leer` : "Estas al dia",
        items: unread.slice(0, 3).map((item) => ({ label: item.title, value: badge({ text: recommendationLabels.priority(item.priority), tone: PRIORITY_TONES[item.priority] }) })),
        route: ROUTES.CLIENT_RECOMENDACIONES,
      })}
      ${summary({
        title: "Ultimos Gastos",
        icon: "fa-clock-rotate-left",
        subtitle: "Movimientos recientes",
        items: recentExpenses.map((item) => ({ label: item.merchant, value: formatCurrency(item.amount) })),
        route: ROUTES.CLIENT_HISTORIAL,
      })}
    `;
  }

  _renderMerchants(ranking) {
    this.element.querySelector("#dashboardMerchants").innerHTML = ranking.length
      ? html`${ranking.map((merchant, index) =>
          mediaItem({
            variant: "accent",
            leading: html`${index + 1}.`,
            title: merchant.merchant,
            subtitle: `${merchant.count} compras`,
            trailing: formatCurrency(merchant.amount),
          })
        )}`
      : emptyState({ icon: "fa-store", title: "Sin comercios todavia", message: "Cuando registres gastos vas a ver aca tus comercios mas frecuentes." });
  }

  _renderCharts(analysis) {
    const average = analysis.byMonth.length
      ? analysis.byMonth.reduce((sum, item) => sum + item.amount, 0) / analysis.byMonth.length
      : 0;

    const charts = {
      daily: {
        title: "Gastos por dia (ultimas 2 semanas)",
        icon: "fa-chart-line",
        type: "line",
        valueFormat: "currency",
        labels: analysis.byDay.map((item) => formatShortDate(item.date)),
        datasets: [{ label: "Gasto diario", data: analysis.byDay.map((item) => item.amount) }],
      },
      category: {
        title: "Gastos por categoria",
        icon: "fa-chart-pie",
        type: "doughnut",
        valueFormat: "currency",
        labels: analysis.byCategory.map((item) => item.category),
        datasets: [{ label: "Gasto", data: analysis.byCategory.map((item) => item.amount) }],
        link: { href: buildHash(ROUTES.CLIENT_PATRONES), label: "Ver mas detalles en Patrones de Consumo", newTab: true },
      },
      monthly: {
        title: "Gasto mensual",
        icon: "fa-chart-column",
        type: "bar",
        valueFormat: "currency",
        caption: "Ultimos 7 meses. La linea punteada es el promedio.",
        labels: analysis.byMonth.map((item) => formatMonth(item.month)),
        datasets: [
          { label: "Gasto mensual", data: analysis.byMonth.map((item) => item.amount) },
          { label: "Promedio", kind: "line", dashed: true, data: analysis.byMonth.map(() => Math.round(average)) },
        ],
      },
    };

    this.charts = this.charts || {};
    [
      ["daily", "#dashboardDailyChart"],
      ["category", "#dashboardCategoryChart"],
      ["monthly", "#dashboardMonthlyChart"],
    ].forEach(([key, selector]) => {
      if (this.charts[key]) {
        this.charts[key].update(charts[key]);
      } else {
        this.charts[key] = this.mountChild(ChartCard, selector, charts[key]);
      }
    });
  }
}
