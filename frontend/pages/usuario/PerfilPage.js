import { Component } from "../../core/Component.js";
import {
  MOCK_USER_PROFILE_DETAILS,
  ROUTES,
  STORAGE_KEYS,
} from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getInitials } from "../../utils/helpers.js";

const PROFILE_STORAGE_KEY = "fintrack.userProfileDetails.v1";

export class PerfilPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
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

    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => this._handleBackToDashboard(event));
    });

    ["#userLogoutButton", "#userLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderSummary() {
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
        <strong>${this.profile.advisorName}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Miembro desde</span>
        <strong>${this.profile.memberSince}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Ultimo acceso</span>
        <strong>${this.profile.lastLogin}</strong>
      </article>
    `;
  }

  _fillFormValues() {
    this._setInputValue("#profileFullName", this.profile.fullName);
    this._setInputValue("#profileEmail", this.profile.email);
    this._setInputValue("#profilePhone", this.profile.phone);
    this._setInputValue("#profileCity", this.profile.city);
    this._setInputValue("#profileOccupation", this.profile.occupation);
    this._setInputValue("#profileCurrency", this.profile.currency);
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
      lastLogin: `${new Date().toLocaleDateString("es-AR")} · ${new Date().toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));
    localStorage.setItem(STORAGE_KEYS.APP_THEME, this.profile.theme);
    document.documentElement.setAttribute("data-theme", this.profile.theme);

    this._renderSummary();
    this._syncShellUser(this.profile.fullName);

    this.options.showToast?.("Perfil actualizado correctamente.", "success");
  }

  _handleReset() {
    this.profile = JSON.parse(JSON.stringify(this.baseProfile));
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));

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
      theme:
        localStorage.getItem(STORAGE_KEYS.APP_THEME) || MOCK_USER_PROFILE_DETAILS.theme,
    };
  }

  _loadPersistedProfile() {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return JSON.parse(JSON.stringify(this.baseProfile));
    }

    try {
      return {
        ...this.baseProfile,
        ...JSON.parse(raw),
      };
    } catch {
      return JSON.parse(JSON.stringify(this.baseProfile));
    }
  }

  _readFormValues() {
    return {
      fullName: this._getValue("#profileFullName"),
      email: this._getValue("#profileEmail"),
      phone: this._getValue("#profilePhone"),
      city: this._getValue("#profileCity"),
      occupation: this._getValue("#profileOccupation"),
      currency: this._getValue("#profileCurrency"),
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

  _setInputValue(selector, value) {
    const input = this.element.querySelector(selector);
    if (input) {
      input.value = value;
    }
  }

  _getValue(selector) {
    return this.element.querySelector(selector)?.value?.trim() || "";
  }

  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }
}
