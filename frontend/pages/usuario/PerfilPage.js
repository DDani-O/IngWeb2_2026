import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { STORAGE_KEYS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

export class PerfilPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.baseProfile = this._buildBaseProfile();
    this.profile = { ...this.baseProfile };
  }

  render() {
    this._resetViewPosition();
    this._syncShellUser(this.profile.fullName);
    this._loadProfile();
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
    const advisorName = this.profile.advisorName || "Sin asignar";
    const memberSince = this.profile.memberSince || "-";
    const lastLogin = this.profile.lastLogin || "-";

    this._setText("#profileAvatarInitials", getInitials(this.profile.fullName) || "JP");
    this._setText("#profileSummaryName", this.profile.fullName);
    this._setText("#profileSummaryEmail", this.profile.email);

    const metaList = this.element.querySelector("#profileMetaList");
    if (!metaList) {
      return;
    }

    metaList.innerHTML = `
      <article class="profile-meta-item">
        <span>Ingreso mensual</span>
        <strong>${formatCurrency(this.profile.monthlyIncome)}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Meta de ahorro</span>
        <strong>${formatCurrency(this.profile.savingsGoal)}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Alerta de presupuesto</span>
        <strong>${this.profile.alertThreshold}%</strong>
      </article>
      <article class="profile-meta-item">
        <span>Asesor asignado</span>
        <strong>${advisorName}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Miembro desde</span>
        <strong>${memberSince}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Ultimo acceso</span>
        <strong>${lastLogin}</strong>
      </article>
    `;
  }

  _fillFormValues() {
    this._setInputValue("#profileFullName", this.profile.fullName);
    this._setInputValue("#profileEmail", this.profile.email);
    this._setInputValue("#profilePhone", this.profile.phone);
    this._setInputValue("#profileCountry", this.profile.country);
    this._setInputValue("#profileOccupation", this.profile.occupation);
    this._setInputValue("#profileCurrency", this.profile.currency || "ARS");
    this._setInputValue("#profileMonthlyIncome", String(this.profile.monthlyIncome));
    this._setInputValue("#profileSavingsGoal", String(this.profile.savingsGoal));
    this._setInputValue("#profileAlertThreshold", String(this.profile.alertThreshold));
    this._setInputValue("#profileTheme", this.profile.theme);

    const notifyEmail = this.element.querySelector("#profileNotifyEmail");
    const notifyPush = this.element.querySelector("#profileNotifyPush");

    if (notifyEmail) {
      notifyEmail.checked = Boolean(this.profile.notifyEmail);
    }

    if (notifyPush) {
      notifyPush.checked = Boolean(this.profile.notifyPush);
    }
  }

  async _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#userProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    try {
      const payload = this._readFormValues();
      const response = await apiClient.patch("/users/me", payload);
      this._applyProfile(this._mapProfile(response));
      this.options.showToast?.("Perfil actualizado correctamente.", "success");
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo actualizar el perfil.",
        "warning"
      );
    }
  }

  async _handleReset() {
    await this._loadProfile();
    this.options.showToast?.("Perfil sincronizado con el servidor.", "warning");
  }

  _buildBaseProfile() {
    const currentUser = this.options.authManager?.getCurrentUser();
    const fallbackTheme = localStorage.getItem(STORAGE_KEYS.APP_THEME) || "dark";

    return {
      id: currentUser?.id || null,
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      phone: "",
      country: "",
      occupation: "",
      monthlyIncome: 0,
      savingsGoal: 0,
      alertThreshold: 0,
      currency: "ARS",
      theme: fallbackTheme,
      notifyEmail: true,
      notifyPush: false,
      memberSince: "-",
      lastLogin: "-",
      advisorName: "",
    };
  }

  async _loadProfile() {
    try {
      const response = await apiClient.get("/users/me");
      this._applyProfile(this._mapProfile(response));
    } catch (error) {
      this.options.showToast?.(
        error.message || "No se pudo cargar el perfil.",
        "warning"
      );
    }
  }

  _applyProfile(profile) {
    this.profile = profile;
    localStorage.setItem(STORAGE_KEYS.APP_THEME, this.profile.theme);
    document.documentElement.setAttribute("data-theme", this.profile.theme);

    this._renderSummary();
    this._fillFormValues();
    this._syncShellUser(this.profile.fullName);
  }

  _mapProfile(payload) {
    return {
      id: payload?.id || null,
      fullName: payload?.fullName || "",
      email: payload?.email || "",
      phone: payload?.phone || "",
      country: payload?.country || "",
      occupation: payload?.occupation || "",
      monthlyIncome: Number(payload?.monthlyIncome) || 0,
      savingsGoal: Number(payload?.savingsGoal) || 0,
      alertThreshold: Number(payload?.alertThreshold) || 0,
      currency: (payload?.currency || "ARS").toUpperCase(),
      theme: payload?.theme || (localStorage.getItem(STORAGE_KEYS.APP_THEME) || "dark"),
      notifyEmail: payload?.notifyEmail ?? true,
      notifyPush: payload?.notifyPush ?? false,
      memberSince: this._formatMonthYear(payload?.createdAt),
      lastLogin: this._formatDateTime(payload?.lastLogin),
      advisorName: payload?.advisorName || "",
    };
  }

  _formatMonthYear(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const label = date.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  _formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const dateLabel = date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeLabel = date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dateLabel} · ${timeLabel}`;
  }

  _readFormValues() {
    return {
      fullName: this._getValue("#profileFullName"),
      phone: this._getValue("#profilePhone"),
      country: this._getValue("#profileCountry"),
      occupation: this._getValue("#profileOccupation"),
      currency: this._getValue("#profileCurrency").toUpperCase(),
      monthlyIncome: Number(this._getValue("#profileMonthlyIncome") || 0),
      savingsGoal: Number(this._getValue("#profileSavingsGoal") || 0),
      alertThreshold: Number(this._getValue("#profileAlertThreshold") || 0),
      theme: this._getValue("#profileTheme") || "dark",
      notifyEmail: Boolean(this.element.querySelector("#profileNotifyEmail")?.checked),
      notifyPush: Boolean(this.element.querySelector("#profileNotifyPush")?.checked),
    };
  }

  _syncShellUser(fullName) {
    this._setText("#userTopbarName", fullName);
    this._setText("#userSidebarName", fullName);
    this._setText("#userSidebarInitials", getInitials(fullName) || "JP");
  }
}
