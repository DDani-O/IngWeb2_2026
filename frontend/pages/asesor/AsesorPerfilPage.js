import { PageController } from "../../core/PageController.js";
import {
  MOCK_ADVISOR_PROFILE_DETAILS,
  ROLES,
  ROUTES,
  STORAGE_KEYS,
} from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Perfil profesional del asesor. Campos de usuarios (nombre_completo) y
 * perfiles_asesores (matricula, especialidad, descripcion).
 */
export class AsesorPerfilPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    const userId = this.options.authManager?.getCurrentUser()?.id || "anonimo";
    this.storageKey = `${STORAGE_KEYS.ADVISOR_PROFILE}.${userId}`;
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

    this._bindLogoutButtons({
      role: ROLES.ADVISOR,
      toastMessage: "Sesion de asesor finalizada.",
    });
  }

  _renderSummary() {
    this._setText("#advisorProfileAvatarInitials", getInitials(this.profile.fullName));
    this._setText("#advisorProfileSummaryName", this.profile.fullName);
    this._setText("#advisorProfileSummaryEmail", this.profile.email);

    const meta = this.element.querySelector("#advisorProfileMetaList");
    if (!meta) {
      return;
    }

    const items = [
      ["Especialidad", this.profile.specialty || "-"],
      ["Matricula", this.profile.licenseNumber || "-"],
      ["Clientes asignados", this.profile.assignedClients],
      ["Miembro desde", this.profile.memberSince],
    ];

    meta.innerHTML = html`${items.map(
      ([label, value]) => html`
        <article class="profile-meta-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )}`;
  }

  _fillFormValues() {
    this._setInputValue("#advisorProfileFullName", this.profile.fullName);
    this._setInputValue("#advisorProfileEmail", this.profile.email);
    this._setInputValue("#advisorProfileSpecialty", this.profile.specialty);
    this._setInputValue("#advisorProfileLicense", this.profile.licenseNumber);
    this._setInputValue("#advisorProfileDescription", this.profile.description);
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
    };

    localStorage.setItem(this.storageKey, JSON.stringify(this.profile));

    this._renderSummary();
    this._setText("#advisorTopbarName", this.profile.fullName);
    this.options.showToast?.("Perfil profesional actualizado.", "success");
  }

  _handleReset() {
    this.profile = JSON.parse(JSON.stringify(this.baseProfile));
    localStorage.removeItem(this.storageKey);

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
      fullName: this._getValue("#advisorProfileFullName"),
      specialty: this._getValue("#advisorProfileSpecialty"),
      licenseNumber: this._getValue("#advisorProfileLicense"),
      description: this._getValue("#advisorProfileDescription"),
    };
  }
}
