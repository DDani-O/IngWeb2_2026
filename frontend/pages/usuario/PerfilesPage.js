import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { getInitials } from "../../utils/helpers.js";

export class PerfilesPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.data = { profiles: [], user: { name: "", activeProfile: "" } };
    this.activeProfileName = null;
    this.activeProfileSource = null;
    this.loadError = null;
  }

  async render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || this.data.user.name || "Cliente";

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "JP");

    await this._loadProfiles();
    this._renderProfiles();
    this._renderComparison();
  }

  attachEvents() {
    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  async _loadProfiles() {
    try {
      this.loadError = null;

      const [profilesResult, userResult] = await Promise.allSettled([
        apiClient.get("/users/spending-profiles"),
        apiClient.get("/users/me"),
      ]);

      const profilesResponse =
        profilesResult.status === "fulfilled" ? profilesResult.value : null;
      const userResponse = userResult.status === "fulfilled" ? userResult.value : null;

      if (!profilesResponse) {
        throw new Error("No se pudieron cargar los perfiles de gasto.");
      }

      const rawProfiles = Array.isArray(profilesResponse?.profiles)
        ? profilesResponse.profiles
        : [];

      const colorClasses = [
        "profile-card--dracula",
        "profile-card--equilibrista",
        "profile-card--espiritu-libre",
      ];

      this.data.profiles = rawProfiles.map((profile, index) => {
        const rule = profile.rule || {};
        return {
          id: profile.id,
          name: profile.name,
          emoji: rule.emoji || "✨",
          tagline: rule.tagline || "Perfil financiero",
          colorClass: colorClasses[index % colorClasses.length],
          description: profile.description || "",
          characteristics: Array.isArray(rule.characteristics) ? rule.characteristics : [],
          tips: Array.isArray(rule.tips) ? rule.tips : [],
          comparison: rule.comparison || {},
        };
      });

      this.activeProfileName =
        userResponse?.spendingProfile || userResponse?.profile || null;
      this.activeProfileSource = userResponse?.spendingProfileSource || null;
      this.data.user = {
        name: userResponse?.fullName || "",
        activeProfile: this.activeProfileName || "",
      };
    } catch (error) {
      this.loadError = error?.message || "No se pudieron cargar los perfiles.";
      this.data.profiles = [];
      this.activeProfileName = null;
      this.activeProfileSource = null;
      this.options.showToast?.(this.loadError, "warning");
    }
  }

  _renderProfiles() {
    const container = this.element.querySelector("#profilesGrid");
    if (!container) {
      return;
    }

    if (!this.data.profiles.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-exclamation empty-state__icon"></i>
          <p class="empty-state__title">${this.loadError ? "No se pudieron cargar los perfiles" : "Sin perfiles disponibles"}</p>
          <p class="empty-state__sub text-muted">${this.loadError || "Tu asesor aun no ha configurado perfiles de gasto."}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.data.profiles
      .map((profile) => {
        const isActive =
          this.activeProfileName && profile.name === this.activeProfileName;
        const guideTitle = "Guia de habitos";
        const activeBadge = isActive
          ? this.activeProfileSource === "asesor"
            ? "Asignado por tu asesor"
            : "Sugerido por analitica"
          : null;

        return `
          <article class="profile-showcase profile-card ${profile.colorClass} ${
            isActive ? "profile-card--active" : ""
          }">
            <div class="profile-card__emoji">${profile.emoji}</div>
            <h3 class="profile-card__name">${profile.name}</h3>
            <p class="profile-card__tagline">${profile.tagline}</p>
            <p class="profile-card__description">${profile.description}</p>

            <h4 class="profile-card__section-title">Caracteristicas:</h4>
            <ul class="profile-card__list">
              ${profile.characteristics.map((item) => `<li>${item}</li>`).join("")}
            </ul>

            <article class="profile-tip-box">
              <h5>${guideTitle}</h5>
              <ul>
                ${profile.tips.map((tip) => `<li>${tip}</li>`).join("")}
              </ul>
            </article>

            ${
              activeBadge
                ? `<span class="profile-active-badge"><i class="fa-solid fa-circle-check"></i>${activeBadge}</span>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  _renderComparison() {
    const body = this.element.querySelector("#profilesComparisonBody");
    const head = this.element.querySelector("#profilesComparisonHead");
    if (!body) {
      return;
    }

    if (!head) {
      return;
    }

    const rows = [
      ["Ratio de Ahorro", "savingsRange"],
      ["Control de Gastos", "controlLevel"],
      ["Flexibilidad", "flexibility"],
      ["Riesgo Financiero", "riskLevel"],
      ["Diversion/Disfrute", "funLevel"],
    ];

    const profilesToCompare = this.data.profiles.slice(0, 3);

    head.innerHTML = `
      <tr>
        <th>Metrica</th>
        ${profilesToCompare.map((profile) => `<th>${profile.name}</th>`).join("")}
      </tr>
    `;

    body.innerHTML = rows
      .map(([label, key]) => {
        return `
          <tr>
            <td>${label}</td>
            ${profilesToCompare
              .map((profile) => `<td>${profile.comparison?.[key] || "-"}</td>`)
              .join("")}
          </tr>
        `;
      })
      .join("");
  }
}
