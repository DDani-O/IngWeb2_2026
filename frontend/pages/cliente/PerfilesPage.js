import { PageController } from "../../core/PageController.js";
import { MOCK_SPENDING_PROFILES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Página informativa de perfiles de gasto. El perfil del cliente lo asigna
 * el sistema a partir de sus gastos: acá solo se muestra, no se elige.
 */
export class PerfilesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_SPENDING_PROFILES));
    this.assignedProfileId = this._resolveAssignedProfileId();
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || "";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName));

    this._renderProfiles();
    this._renderComparison();
  }

  attachEvents() {
    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderProfiles() {
    const container = this.element.querySelector("#profilesGrid");
    if (!container) {
      return;
    }

    container.innerHTML = html`${this.data.profiles.map((profile) => {
      const isAssigned = profile.id === this.assignedProfileId;

      return html`
        <article class="profile-showcase profile-card ${profile.colorClass} ${isAssigned ? "profile-card--active" : ""}">
          <div class="profile-card__emoji">${profile.emoji}</div>
          <h3 class="profile-card__name">${profile.name}</h3>
          <p class="profile-card__tagline">${profile.tagline}</p>
          <p class="profile-card__description">${profile.description}</p>

          <h4 class="profile-card__section-title">Caracteristicas:</h4>
          <ul class="profile-card__list">
            ${profile.characteristics.map((item) => html`<li>${item}</li>`)}
          </ul>

          ${isAssigned
            ? html`<span class="profile-active-badge"><i class="fa-solid fa-circle-check"></i>Tu perfil actual, asignado automaticamente</span>`
            : ""}
        </article>
      `;
    })}`;
  }

  _renderComparison() {
    const body = this.element.querySelector("#profilesComparisonBody");
    if (!body) {
      return;
    }

    const rows = [
      ["Ratio de Ahorro", "savingsRange"],
      ["Control de Gastos", "controlLevel"],
      ["Flexibilidad", "flexibility"],
      ["Riesgo Financiero", "riskLevel"],
      ["Diversion/Disfrute", "funLevel"],
    ];

    body.innerHTML = html`${rows.map(
      ([label, key]) => html`
        <tr>
          <td>${label}</td>
          ${this.data.profiles.map((profile) => html`<td>${profile.comparison[key]}</td>`)}
        </tr>
      `
    )}`;
  }

  /**
   * Perfil asignado por el sistema (hoy viene del mock; con backend, de clasificacion_de_perfil).
   */
  _resolveAssignedProfileId() {
    const byName = this.data.profiles.find((profile) => {
      return profile.name.startsWith(this.data.user.activeProfile);
    });

    return byName?.id || null;
  }
}
