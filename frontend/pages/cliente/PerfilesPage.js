import { PageController } from "../../core/PageController.js";
import { findSpendingProfileContent } from "../../content/spendingProfiles.js";
import { profileService } from "../../services/profile.service.js";
import { getInitials } from "../../utils/helpers.js";
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
  render() {
    this._resetViewPosition();

    const userName = this.options.authManager?.getCurrentUser()?.fullName || "";
    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._loadData(async () => {
      const [catalog, user] = await Promise.all([profileService.listSpendingProfiles(), profileService.getMine()]);
      if (!this._isAlive()) {
        return;
      }

      const profiles = catalog
        .map((profile) => ({ ...profile, content: findSpendingProfileContent(profile.name) }))
        .filter((profile) => profile.content);
      const assignedId = user.client?.spendingProfile?.id || null;

      this._renderProfiles(profiles, assignedId);
      this._renderComparison(profiles);
    });
  }

  attachEvents() {
    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderProfiles(profiles, assignedId) {
    const container = this.element.querySelector("#profilesGrid");
    if (!container) {
      return;
    }

    container.innerHTML = html`${profiles.map(({ id, content }) => {
      const isAssigned = id === assignedId;

      return html`
        <article class="profile-showcase profile-card ${content.colorClass} ${isAssigned ? "profile-card--active" : ""}">
          <div class="profile-card__emoji">${content.emoji}</div>
          <h3 class="profile-card__name">${content.name}</h3>
          <p class="profile-card__tagline">${content.tagline}</p>
          <p class="profile-card__description">${content.description}</p>

          <h4 class="profile-card__section-title">Caracteristicas:</h4>
          <ul class="profile-card__list">
            ${content.characteristics.map((item) => html`<li>${item}</li>`)}
          </ul>

          ${isAssigned
            ? html`<span class="profile-active-badge"><i class="fa-solid fa-circle-check"></i>Tu perfil actual, asignado automaticamente</span>`
            : ""}
        </article>
      `;
    })}`;

    if (!assignedId) {
      container.insertAdjacentHTML(
        "afterbegin",
        String(html`<p class="text-muted">Todavia no tenes un perfil asignado: el sistema lo calcula cuando registras tus primeros gastos.</p>`)
      );
    }
  }

  _renderComparison(profiles) {
    const head = this.element.querySelector("#profilesComparisonHead");
    const body = this.element.querySelector("#profilesComparisonBody");
    if (!head || !body) {
      return;
    }

    head.innerHTML = html`<tr><th>Metrica</th>${profiles.map(({ content }) => html`<th>${content.name}</th>`)}</tr>`;
    body.innerHTML = html`${COMPARISON_ROWS.map(
      ([label, key]) => html`
        <tr>
          <td>${label}</td>
          ${profiles.map(({ content }) => html`<td>${content.comparison[key]}</td>`)}
        </tr>
      `
    )}`;
  }
}
