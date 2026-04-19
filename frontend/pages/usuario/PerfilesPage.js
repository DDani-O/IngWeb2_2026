import { Component } from "../../core/Component.js";
import {
  MOCK_SPENDING_PROFILES,
  ROUTES,
  STORAGE_KEYS,
} from "../../utils/constants.js";
import { buildPlaceholderHashFromPreset, getInitials } from "../../utils/helpers.js";

export class PerfilesPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_SPENDING_PROFILES));
    this.activeProfileId = this._resolveActiveProfileId();
  }

  render() {
    this._resetViewPosition();

    const currentUser = this.options.authManager?.getCurrentUser();
    const userName = currentUser?.fullName || this.data.user.name;

    this._setText("#userTopbarName", userName);
    this._setText("#userSidebarName", userName);
    this._setText("#userSidebarInitials", getInitials(userName) || "JP");

    this._renderPlaceholderLinks();
    this._renderProfiles();
    this._renderComparison();
  }

  attachEvents() {
    this._bindProfileButtons();

    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => this._handleBackToDashboard(event));
    });

    ["#userLogoutButton", "#userLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderPlaceholderLinks() {
    this.element.querySelectorAll(".js-placeholder-link").forEach((anchor) => {
      const preset = anchor.dataset.preset;
      anchor.setAttribute("href", buildPlaceholderHashFromPreset(preset));
    });
  }

  _renderProfiles() {
    const container = this.element.querySelector("#profilesGrid");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.profiles
      .map((profile) => {
        const isActive = profile.id === this.activeProfileId;
        const guideTitle = this._getGuideTitle(profile.id);

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

            <button class="action-btn action-btn--${
              isActive ? "ghost" : "primary"
            }" data-select-profile="${profile.id}" type="button">
              ${isActive ? "Este es tu perfil actual" : "Seleccionar Este Perfil"}
            </button>

            ${
              isActive
                ? '<span class="profile-active-badge"><i class="fa-solid fa-circle-check"></i>Este es tu perfil actual</span>'
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  _bindProfileButtons() {
    this.element.querySelectorAll("[data-select-profile]").forEach((button) => {
      this.listen(button, "click", () => {
        this._selectProfile(button.dataset.selectProfile);
      });
    });
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

    const [dracula, equilibrista, espirituLibre] = this.data.profiles;

    body.innerHTML = rows
      .map(([label, key]) => {
        return `
          <tr>
            <td>${label}</td>
            <td>${dracula.comparison[key]}</td>
            <td>${equilibrista.comparison[key]}</td>
            <td>${espirituLibre.comparison[key]}</td>
          </tr>
        `;
      })
      .join("");
  }

  _selectProfile(profileId) {
    this.activeProfileId = profileId;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileId);

    this._renderProfiles();
    this._bindProfileButtons();

    const selected = this.data.profiles.find((profile) => profile.id === profileId);
    this.options.showToast?.(`Perfil actualizado a ${selected?.name || "nuevo perfil"}.`, "success");
  }

  _resolveActiveProfileId() {
    const persisted = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
    if (persisted) {
      return persisted;
    }

    const byName = this.data.profiles.find((profile) => {
      return profile.name === this.data.user.activeProfile;
    });

    return byName?.id || this.data.profiles[0].id;
  }

  _getGuideTitle(profileId) {
    if (profileId === "dracula") {
      return "💡 Como llegar a ser Dracula Nocturno";
    }

    if (profileId === "equilibrista") {
      return "💡 Como mantener el Equilibrio";
    }

    return "⚠️ Como mejorar tu situacion financiera";
  }

  _handleBackToDashboard(event) {
    event.preventDefault();

    const isDashboardOpenInAnotherTab =
      this.options.hasRouteOpenInOtherTab?.(ROUTES.USER_DASHBOARD) ||
      (window.opener && !window.opener.closed);

    if (isDashboardOpenInAnotherTab) {
      window.close();

      window.setTimeout(() => {
        if (!window.closed) {
          this.options.router?.navigate(ROUTES.USER_DASHBOARD);
        }
      }, 120);
      return;
    }

    this.options.router?.navigate(ROUTES.USER_DASHBOARD);
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion finalizada correctamente.", "success");
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
