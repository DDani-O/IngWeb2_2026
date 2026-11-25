import { PageController } from "../../core/PageController.js";
import { themeManager } from "../../core/ThemeManager.js";
import { MOCK_USER_PROFILE_DETAILS, STORAGE_KEYS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Perfil de cuenta del cliente. Campos de usuarios (nombre_completo, biografia) y
 * perfiles_usuarios (ocupacion, ingreso_estimado, objetivo_financiero); el tema es preferencia local.
 */
export class PerfilPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.storageKey = `${STORAGE_KEYS.CLIENT_PROFILE}.${userId}`;
    this.baseProfile = this._buildBaseProfile();
    this.profile = this._loadPersistedProfile();
  }

  render() {
    this._resetViewPosition();
    this._renderSummary();
    this._fillFormValues();
    this._syncShellUser(this.profile.fullName);
  }

  attachEvents() {
    const form = this.element.querySelector("#userProfileForm");
    const resetButton = this.element.querySelector("#resetUserProfileButton");

    this.listen(form, "submit", (event) => this._handleSave(event));
    this.listen(resetButton, "click", () => this._handleReset());

    this._bindDashboardBackButtons();
    this._bindLogoutButtons();
  }

  _renderSummary() {
    this._setText("#profileAvatarInitials", getInitials(this.profile.fullName));
    this._setText("#profileSummaryName", this.profile.fullName);
    this._setText("#profileSummaryEmail", this.profile.email);

    const metaList = this.element.querySelector("#profileMetaList");
    if (!metaList) {
      return;
    }

    const items = [
      ["Perfil de gasto", this.profile.spendingProfile],
      ["Ocupacion", this.profile.occupation || "-"],
      ["Ingreso estimado", this.profile.estimatedIncome ? formatCurrency(this.profile.estimatedIncome) : "-"],
      ["Asesor asignado", this.profile.advisorName || "Sin asignar"],
      ["Miembro desde", this.profile.memberSince],
    ];

    metaList.innerHTML = html`${items.map(
      ([label, value]) => html`
        <article class="profile-meta-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )}`;
  }

  _fillFormValues() {
    this._setInputValue("#profileFullName", this.profile.fullName);
    this._setInputValue("#profileEmail", this.profile.email);
    this._setInputValue("#profileOccupation", this.profile.occupation);
    this._setInputValue("#profileEstimatedIncome", this.profile.estimatedIncome ? String(this.profile.estimatedIncome) : "");
    this._setInputValue("#profileFinancialGoal", this.profile.financialGoal);
    this._setInputValue("#profileBio", this.profile.bio);
    this._setInputValue("#profileTheme", this.profile.theme);
  }

  _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.profile = {
      ...this.profile,
      ...this._readFormValues(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
    themeManager.setTheme(this.profile.theme);

    this._renderSummary();
    this._syncShellUser(this.profile.fullName);

    this.options.showToast?.("Perfil actualizado correctamente.", "success");
  }

  _handleReset() {
    this.profile = JSON.parse(JSON.stringify(this.baseProfile));
    localStorage.removeItem(this.storageKey);
    themeManager.setTheme(this.profile.theme);

    this._renderSummary();
    this._fillFormValues();
    this._syncShellUser(this.profile.fullName);

    this.options.showToast?.("Perfil restaurado a valores base.", "warning");
  }

  _buildBaseProfile() {
    const currentUser = this.options.authManager?.getCurrentUser();

    return {
      ...MOCK_USER_PROFILE_DETAILS,
      fullName: currentUser?.fullName || MOCK_USER_PROFILE_DETAILS.fullName,
      email: currentUser?.email || MOCK_USER_PROFILE_DETAILS.email,
      theme: themeManager.getTheme(),
    };
  }

  _loadPersistedProfile() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return JSON.parse(JSON.stringify(this.baseProfile));
    }

    try {
      return {
        ...this.baseProfile,
        ...JSON.parse(raw),
        // El email es la credencial de la cuenta: no se edita desde el perfil.
        email: this.baseProfile.email,
      };
    } catch {
      return JSON.parse(JSON.stringify(this.baseProfile));
    }
  }

  _readFormValues() {
    return {
      fullName: this._getValue("#profileFullName"),
      occupation: this._getValue("#profileOccupation"),
      estimatedIncome: Number(this._getValue("#profileEstimatedIncome") || 0),
      financialGoal: this._getValue("#profileFinancialGoal"),
      bio: this._getValue("#profileBio"),
      theme: this._getValue("#profileTheme") || "dark",
    };
  }

  _syncShellUser(fullName) {
    this._setText("#userTopbarName", fullName);
    this._setText("#userSidebarName", fullName);
    this._setText("#userSidebarInitials", getInitials(fullName));
  }
}
