import { PageController } from "../../core/PageController.js";
import { badge } from "../../components/atoms/badge.js";
import { DataTable } from "../../components/organisms/DataTable.js";
import { findSpendingProfileContent } from "../../content/spendingProfiles.js";
import { profileService } from "../../services/profile.service.js";
import { html } from "../../utils/html.js";

const COMPARISON_ROWS = [
  ["Ratio de Ahorro", "savingsRange"],
  ["Control de Gastos", "controlLevel"],
  ["Flexibilidad", "flexibility"],
  ["Riesgo Financiero", "riskLevel"],
  ["Diversion/Disfrute", "funLevel"],
];

/**
 * Página informativa de perfiles de gasto. El perfil del cliente lo asigna
 * el sistema a partir de sus gastos: acá solo se muestra, no se elige.
 */
export class PerfilesPage extends PageController {
  static template = "./pages/cliente/perfiles.html";

  render() {
    this.comparison = this.mountChild(DataTable, "#profilesComparison", { caption: "Comparativa de perfiles de gasto", rowKey: "key" });

    this._loadData(async () => {
      const [catalog, user] = await Promise.all([profileService.listSpendingProfiles(), profileService.getMine()]);
      if (!this._isAlive()) {
        return;
      }

      const profiles = catalog
        .map((profile) => ({ ...profile, content: findSpendingProfileContent(profile.name) }))
        .filter((profile) => profile.content);

      this._renderProfiles(profiles, user.client?.spendingProfile?.id || null);
      this._renderComparison(profiles);
    });
  }

  attachEvents() {
    this._bindDashboardBackButtons();
  }

  _renderProfiles(profiles, assignedId) {
    this.element.querySelector("#profilesGrid").innerHTML = html`
      ${assignedId ? "" : html`<p class="text-muted">Todavia no tenes un perfil asignado: el sistema lo calcula cuando registras tus primeros gastos.</p>`}
      ${profiles.map(({ id, content }) => {
        const isAssigned = id === assignedId;
        return html`
          <article class="profile-showcase profile-card ${content.colorClass} ${isAssigned ? "profile-card--active" : ""}" ${isAssigned ? html`aria-current="true"` : ""}>
            <div class="profile-card__emoji" aria-hidden="true">${content.emoji}</div>
            <h3 class="profile-card__name">${content.name}</h3>
            <p class="profile-card__tagline">${content.tagline}</p>
            <p class="profile-card__description">${content.description}</p>
            <h4 class="profile-card__section-title">Caracteristicas:</h4>
            <ul class="profile-card__list">
              ${content.characteristics.map((item) => html`<li>${item}</li>`)}
            </ul>
            ${isAssigned ? badge({ text: "Tu perfil actual, asignado automaticamente", tone: "success", icon: "fa-circle-check" }) : ""}
          </article>
        `;
      })}
    `;
  }

  _renderComparison(profiles) {
    this.comparison.update({
      columns: [{ key: "label", label: "Metrica" }, ...profiles.map(({ content }) => ({ key: content.id, label: content.name }))],
      rows: COMPARISON_ROWS.map(([label, key]) => ({
        key,
        label,
        ...Object.fromEntries(profiles.map(({ content }) => [content.id, content.comparison[key]])),
      })),
    });
  }
}
