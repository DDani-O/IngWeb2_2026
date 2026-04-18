import { Component } from "../../core/Component.js";
import { MOCK_SPENDING_PROFILES, STORAGE_KEYS } from "../../utils/constants.js";

export class PerfilesPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.data = JSON.parse(JSON.stringify(MOCK_SPENDING_PROFILES));
    this.activeProfileId = this._resolveActiveProfileId();
  }

  render() {
    this._renderPlaceholderLinks();
    this._renderProfiles();
    this._renderTips();
    this._renderComparison();
  }

  attachEvents() {
    this._bindProfileButtons();

    this.element.querySelectorAll(".tip-panel__button").forEach((button) => {
      this.listen(button, "click", () => {
        const panelId = button.dataset.panel;
        this._toggleTipPanel(panelId);
      });
    });
  }

  _renderPlaceholderLinks() {
    this.element.querySelectorAll(".js-placeholder-link").forEach((anchor) => {
      const preset = anchor.dataset.preset;
      if (preset === "cargarGasto") {
        anchor.setAttribute(
          "href",
          "#/utils/placeholder?title=Cargar%20Gasto&description=Estamos%20preparando%20esta%20seccion&icon=fa-receipt"
        );
      }

      if (preset === "historial") {
        anchor.setAttribute(
          "href",
          "#/utils/placeholder?title=Historial%20de%20Gastos&description=Pronto%20podras%20filtrar%20y%20editar%20movimientos&icon=fa-clock-rotate-left"
        );
      }
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

        return `
          <article class="profile-card ${profile.colorClass} ${
          isActive ? "profile-card--active" : ""
        }">
            ${
              isActive
                ? '<span class="profile-active-badge"><i class="fa-solid fa-circle-check"></i>Perfil Actual</span>'
                : ""
            }
            <div class="profile-card__emoji">${profile.emoji}</div>
            <h3 class="profile-card__name">${profile.name}</h3>
            <p class="profile-card__tagline">${profile.tagline}</p>
            <p class="profile-card__description">${profile.description}</p>
            <ul class="profile-card__list">
              ${profile.characteristics.map((item) => `<li>${item}</li>`).join("")}
            </ul>
            <button class="action-btn action-btn--${
              isActive ? "ghost" : "primary"
            } w-100" data-select-profile="${profile.id}" type="button">
              ${isActive ? "Perfil Seleccionado" : "Seleccionar Este Perfil"}
            </button>
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

  _renderTips() {
    const container = this.element.querySelector("#profilesTipsAccordion");
    if (!container) {
      return;
    }

    container.innerHTML = this.data.profiles
      .map((profile, index) => {
        const openClass = index === 0 ? "" : "app-hidden";
        const icon = index === 0 ? "fa-chevron-up" : "fa-chevron-down";

        return `
          <article class="tip-panel" data-tip-panel="${profile.id}">
            <button class="tip-panel__button" data-panel="${profile.id}" type="button">
              <span>${profile.emoji} Tips para ${profile.name}</span>
              <i class="fa-solid ${icon}" data-panel-icon="${profile.id}"></i>
            </button>
            <div class="tip-panel__body ${openClass}" data-panel-body="${profile.id}">
              <ul>
                ${profile.tips.map((tip) => `<li>${tip}</li>`).join("")}
              </ul>
            </div>
          </article>
        `;
      })
      .join("");
  }

  _renderComparison() {
    const body = this.element.querySelector("#profilesComparisonBody");
    if (!body) {
      return;
    }

    const rows = [
      ["Frecuencia de registro", "registryFrequency"],
      ["Tolerancia a gasto impulsivo", "impulseTolerance"],
      ["Porcentaje de ahorro", "savingsPercentage"],
      ["Objetivo principal", "mainGoal"],
      ["Riesgo financiero", "financialRisk"],
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

  _toggleTipPanel(panelId) {
    this.element.querySelectorAll("[data-panel-body]").forEach((body) => {
      const currentId = body.dataset.panelBody;
      const icon = this.element.querySelector(`[data-panel-icon="${currentId}"]`);

      if (currentId === panelId) {
        const isHidden = body.classList.contains("app-hidden");
        body.classList.toggle("app-hidden", !isHidden);
        if (icon) {
          icon.classList.toggle("fa-chevron-down", !isHidden);
          icon.classList.toggle("fa-chevron-up", isHidden);
        }
      } else {
        body.classList.add("app-hidden");
        if (icon) {
          icon.classList.add("fa-chevron-down");
          icon.classList.remove("fa-chevron-up");
        }
      }
    });
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
}
