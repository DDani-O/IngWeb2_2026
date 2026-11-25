import { PageController } from "../../core/PageController.js";
import { themeManager } from "../../core/ThemeManager.js";
import { profileService } from "../../services/profile.service.js";
import { ROLES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Perfil de cuenta del cliente (consigna §4.1, edición de perfil). Lee GET /auth/me y guarda con
 * PUT /auth/profile. El tema visual es una preferencia local (ThemeManager).
 */
export class PerfilPage extends PageController {
  static template = "./pages/cliente/perfil.html";

  constructor(element, options = {}) {
    super(element, options);
    this.user = null;
  }

  render() {
    this._setInputValue("#profileTheme", themeManager.getTheme());

    this._loadData(async () => {
      const user = await profileService.getMine();
      if (!this._isAlive()) {
        return;
      }

      this.user = user;
      this._renderSummary();
      this._fillFormValues();
    });
  }

  attachEvents() {
    const form = this.element.querySelector("#userProfileForm");
    const resetButton = this.element.querySelector("#resetUserProfileButton");

    this.listen(form, "submit", (event) => this._handleSave(event));
    this.listen(resetButton, "click", () => this._handleReset());

    this._bindDashboardBackButtons();
  }

  _renderSummary() {
    const { user } = this;
    this._setText("#profileAvatarInitials", getInitials(user.fullName));
    this._setText("#profileSummaryName", user.fullName);
    this._setText("#profileSummaryEmail", user.email);

    const metaList = this.element.querySelector("#profileMetaList");
    if (!metaList) {
      return;
    }

    const client = user.client || {};
    const items = [
      ["Perfil de gasto", client.spendingProfile?.name || "Sin asignar todavia"],
      ["Ocupacion", client.occupation || "-"],
      ["Ingreso estimado", client.estimatedIncome ? formatCurrency(client.estimatedIncome) : "-"],
      ["Asesor asignado", client.advisor?.fullName || "Sin asignar"],
      ["Miembro desde", user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "-"],
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
    const { user } = this;
    const client = user.client || {};
    this._setInputValue("#profileFullName", user.fullName);
    this._setInputValue("#profileEmail", user.email);
    this._setInputValue("#profileOccupation", client.occupation);
    this._setInputValue("#profileEstimatedIncome", client.estimatedIncome ? String(client.estimatedIncome) : "");
    this._setInputValue("#profileFinancialGoal", client.financialGoal);
    this._setInputValue("#profileBio", user.bio);
    this._setInputValue("#profileTheme", themeManager.getTheme());
  }

  async _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const values = this._readFormValues();
    themeManager.setTheme(values.theme);

    const user = await this._runAction(() => profileService.update(values, ROLES.CLIENT), {
      button: form.querySelector('[type="submit"]'),
      successMessage: "Perfil actualizado correctamente.",
    });

    if (user && this._isAlive()) {
      this.user = user;
      this._renderSummary();
    }
  }

  _handleReset() {
    if (!this.user) {
      return;
    }

    this._fillFormValues();
    this.options.showToast?.("Se descartaron los cambios sin guardar.", "warning");
  }

  _readFormValues() {
    return {
      fullName: this._getValue("#profileFullName"),
      occupation: this._getValue("#profileOccupation"),
      estimatedIncome: this._getValue("#profileEstimatedIncome"),
      financialGoal: this._getValue("#profileFinancialGoal"),
      bio: this._getValue("#profileBio"),
      theme: this._getValue("#profileTheme") || "dark",
    };
  }

}
