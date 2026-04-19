import { Component } from "../../core/Component.js";
import {
  MOCK_ADVISOR_PROFILE_DETAILS,
  ROUTES,
} from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";

const ADVISOR_PROFILE_STORAGE_KEY = "fintrack.advisorProfileDetails.v1";

export class AsesorPerfilPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.baseProfile = this._buildBaseProfile();
    this.profile = this._loadPersistedProfile();
  }

  render() {
    this._resetViewPosition();
    this._renderSummary();
    this._fillFormValues();
    this._setText("#advisorTopbarName", this.profile.fullName);
  }

  attachEvents() {
    const form = this.element.querySelector("#advisorProfileForm");
    const resetButton = this.element.querySelector("#resetAdvisorProfileButton");
    const backButton = this.element.querySelector("#backToAdvisorDashboardFromProfile");

    this.listen(form, "submit", (event) => this._handleSave(event));
    this.listen(resetButton, "click", () => this._handleReset());
    this.listen(backButton, "click", () => {
      this.options.router?.navigate(ROUTES.ADVISOR_DASHBOARD);
    });

    ["#advisorLogoutButton", "#advisorLogoutButtonMobile"].forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => this._handleLogout());
    });
  }

  _renderSummary() {
    this._setText("#advisorProfileAvatarInitials", getInitials(this.profile.fullName) || "MR");
    this._setText("#advisorProfileSummaryName", this.profile.fullName);
    this._setText("#advisorProfileSummaryEmail", this.profile.email);

    const meta = this.element.querySelector("#advisorProfileMetaList");
    if (!meta) {
      return;
    }

    meta.innerHTML = `
      <article class="profile-meta-item">
        <span>Especialidad</span>
        <strong>${this.profile.specialty}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Matricula</span>
        <strong>${this.profile.licenseNumber}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Experiencia</span>
        <strong>${this.profile.yearsExperience} anos</strong>
      </article>
      <article class="profile-meta-item">
        <span>Clientes activos</span>
        <strong>${this.profile.activeClients}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Capacidad maxima</span>
        <strong>${this.profile.maxClientLoad}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Ultima revision</span>
        <strong>${this.profile.lastReview}</strong>
      </article>
    `;
  }

  _fillFormValues() {
    this._setInputValue("#advisorProfileFullName", this.profile.fullName);
    this._setInputValue("#advisorProfileEmail", this.profile.email);
    this._setInputValue("#advisorProfilePhone", this.profile.phone);
    this._setInputValue("#advisorProfileCity", this.profile.city);
    this._setInputValue("#advisorProfileSpecialty", this.profile.specialty);
    this._setInputValue("#advisorProfileLicense", this.profile.licenseNumber);
    this._setInputValue("#advisorProfileExperience", String(this.profile.yearsExperience));
    this._setInputValue("#advisorProfileActiveClients", String(this.profile.activeClients));
    this._setInputValue("#advisorProfileMaxClients", String(this.profile.maxClientLoad));

    const notifyEmail = this.element.querySelector("#advisorProfileNotifyEmail");
    const notifyPush = this.element.querySelector("#advisorProfileNotifyPush");

    if (notifyEmail) {
      notifyEmail.checked = Boolean(this.profile.notifyEmail);
    }

    if (notifyPush) {
      notifyPush.checked = Boolean(this.profile.notifyPush);
    }
  }

  _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#advisorProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.profile = {
      ...this.profile,
      ...this._readFormValues(),
      lastReview: `${new Date().toLocaleDateString("es-AR")} · ${new Date().toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    };

    localStorage.setItem(ADVISOR_PROFILE_STORAGE_KEY, JSON.stringify(this.profile));

    this._renderSummary();
    this._setText("#advisorTopbarName", this.profile.fullName);
    this.options.showToast?.("Perfil profesional actualizado.", "success");
  }

  _handleReset() {
    this.profile = JSON.parse(JSON.stringify(this.baseProfile));
    localStorage.setItem(ADVISOR_PROFILE_STORAGE_KEY, JSON.stringify(this.profile));

    this._renderSummary();
    this._fillFormValues();
    this._setText("#advisorTopbarName", this.profile.fullName);
    this.options.showToast?.("Perfil restaurado a valores base.", "warning");
  }

  _buildBaseProfile() {
    const currentAdvisor = this.options.authManager?.getCurrentUser();

    return {
      ...MOCK_ADVISOR_PROFILE_DETAILS,
      fullName: currentAdvisor?.fullName || MOCK_ADVISOR_PROFILE_DETAILS.fullName,
      email: currentAdvisor?.email || MOCK_ADVISOR_PROFILE_DETAILS.email,
    };
  }

  _loadPersistedProfile() {
    const raw = localStorage.getItem(ADVISOR_PROFILE_STORAGE_KEY);
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
      fullName: this._getValue("#advisorProfileFullName"),
      email: this._getValue("#advisorProfileEmail"),
      phone: this._getValue("#advisorProfilePhone"),
      city: this._getValue("#advisorProfileCity"),
      specialty: this._getValue("#advisorProfileSpecialty"),
      licenseNumber: this._getValue("#advisorProfileLicense"),
      yearsExperience: Number(this._getValue("#advisorProfileExperience") || 0),
      activeClients: Number(this._getValue("#advisorProfileActiveClients") || 0),
      maxClientLoad: Number(this._getValue("#advisorProfileMaxClients") || 0),
      notifyEmail: Boolean(this.element.querySelector("#advisorProfileNotifyEmail")?.checked),
      notifyPush: Boolean(this.element.querySelector("#advisorProfileNotifyPush")?.checked),
    };
  }

  _handleLogout() {
    this.options.authManager?.logout();
    this.options.showToast?.("Sesion de asesor finalizada.", "success");
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
