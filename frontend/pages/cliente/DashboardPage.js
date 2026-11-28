/** Controlador de la página `#/cliente/dashboard` (template dashboard.html). */
import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { button } from "../../components/atoms/button.js";
import { alertItem } from "../../components/molecules/alertItem.js";
import { dateCard } from "../../components/molecules/dateCard.js";
import { infoCard } from "../../components/molecules/infoCard.js";
import { keyValueList } from "../../components/molecules/keyValueList.js";
import { analysisCharts, analysisStats, merchantRanking } from "../../components/molecules/spendingAnalysis.js";
import { recommendationLabels } from "../../components/molecules/recommendationCard.js";
import { findSpendingProfileContent } from "../../content/spendingProfiles.js";
import { analysisService } from "../../services/analysis.service.js";
import { expensesService } from "../../services/expenses.service.js";
import { recommendationsService } from "../../services/recommendations.service.js";
import { PRIORITY_TONES, ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { buildHash } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/** Filas de cada tarjeta resumen del dashboard (gastos, categorías, recomendaciones). */
const SUMMARY_ITEMS = 3;
/** Categorías principales que se muestran como etiquetas junto al perfil. */
const PROFILE_TAGS = 4;

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
        expensesService.list({ limit: SUMMARY_ITEMS }),
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
    this.element.querySelector("#dashboardStats").innerHTML = analysisStats(analysis);
  }

  _renderProfile(analysis) {
    const profile = analysis.spendingProfile;
    const content = profile ? findSpendingProfileContent(profile.name) : null;

    this.element.querySelector("#dashboardProfile").innerHTML = infoCard({
      highlight: true,
      icon: "fa-user-shield",
      title: profile ? `Perfil activo: ${profile.name}` : "Todavia no tenes un perfil asignado",
      subtitle: content?.description || profile?.description || "El sistema te asigna un perfil cuando registras tus primeros gastos.",
      body: html`<div class="tag-list">
        ${profile?.origin === "asesor" ? badge({ text: "Asignado por tu asesor", tone: "info", icon: "fa-user-tie", title: profile.reason || null }) : ""}
        ${analysis.byCategory.slice(0, PROFILE_TAGS).map((item) => badge({ text: item.category }))}
      </div>`,
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
        items: analysis.byCategory.slice(0, SUMMARY_ITEMS).map((item) => ({ label: item.category, value: `${item.percentage}%` })),
        route: ROUTES.CLIENT_PATRONES,
      })}
      ${summary({
        title: "Recomendaciones",
        icon: "fa-lightbulb",
        subtitle: unread.length ? `${unread.length} sin leer` : "Estas al dia",
        items: unread.slice(0, SUMMARY_ITEMS).map((item) => ({ label: item.title, value: badge({ text: recommendationLabels.priority(item.priority), tone: PRIORITY_TONES[item.priority] }) })),
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
    this.element.querySelector("#dashboardMerchants").innerHTML = merchantRanking(ranking);
  }

  _renderCharts(analysis) {
    const charts = analysisCharts(analysis, {
      categoryLink: { href: buildHash(ROUTES.CLIENT_PATRONES), label: "Ver mas detalles en Patrones de Consumo", newTab: true },
    });

    this._showCharts({
      "#dashboardDailyChart": charts.daily,
      "#dashboardCategoryChart": charts.category,
      "#dashboardMonthlyChart": charts.monthly,
    });
  }
}
