import { apiClient } from "../../core/APIClient.js";
import { PageController } from "../../core/PageController.js";
import { ROUTES } from "../../utils/constants.js";
import { STORAGE_KEYS } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";

export class AsesorPerfilPage extends PageController {
  constructor(element, options = {}) {
    super(element, options);
    this.profile = null;
    this.isLoading = false;
  }

  async render() {
    this._resetViewPosition();
    this.isLoading = true;
    
    try {
      await this._loadProfile();
    } catch (error) {
      console.error("Error cargando perfil:", error);
      this.options.showToast?.("Error al cargar el perfil", "error");
    } finally {
      this.isLoading = false;
    }
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
      role: "asesor",
      toastMessage: "Sesión de asesor finalizada.",
    });
  }

  async _loadProfile() {
    try {
      const response = await apiClient.get("/advisor/profile");
      this._applyProfile(response);
    } catch (error) {
      throw error;
    }
  }

  _applyProfile(profile) {
    this.profile = profile;
    this._renderSummary();
    this._fillFormValues();
    this._syncShellUser(this.profile.fullName);
  }

  _renderSummary() {
    if (!this.profile) return;

    this._setText("#advisorProfileAvatarInitials", getInitials(this.profile.fullName) || "MR");
    this._setText("#advisorProfileSummaryName", this.profile.fullName);
    this._setText("#advisorProfileSummaryEmail", this.profile.email);

    const meta = this.element.querySelector("#advisorProfileMetaList");
    if (!meta) return;

    meta.innerHTML = `
      <article class="profile-meta-item">
        <span>Especialidad</span>
        <strong>${this.profile.specialty || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Matrícula</span>
        <strong>${this.profile.licenseNumber || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Clientes activos</span>
        <strong>${this.profile.activeClientsCount || 0}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Capacidad máxima</span>
        <strong>${this.profile.maxCapacity || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Miembro desde</span>
        <strong>${this._formatMonthYear(this.profile.createdAt)}</strong>
      </article>
    `;
  }

  _fillFormValues() {
    if (!this.profile) return;

    this._setInputValue("#advisorProfileFullName", this.profile.fullName || "");
    this._setInputValue("#advisorProfileEmail", this.profile.email || "");
    this._setInputValue("#advisorProfilePhone", this.profile.phone || "");
    this._setInputValue("#advisorProfileCountry", this.profile.country || "");
    this._setInputValue("#advisorProfileSpecialty", this.profile.specialty || "");
    this._setInputValue("#advisorProfileLicense", this.profile.licenseNumber || "");
    this._setInputValue("#advisorProfileDescription", this.profile.description || "");
    this._setInputValue("#advisorProfileActiveClients", String(this.profile.activeClientsCount || 0));
    this._setInputValue("#advisorProfileMaxClients", String(this.profile.maxCapacity || 5));

    const notifyEmail = this.element.querySelector("#advisorProfileNotifyEmail");
    if (notifyEmail) notifyEmail.checked = Boolean(this.profile.notifyEmail);

    const notifyPush = this.element.querySelector("#advisorProfileNotifyPush");
    if (notifyPush) notifyPush.checked = Boolean(this.profile.notifyPush);
  }

  async _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#advisorProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    try {
      const payload = this._readFormValues();
      const response = await apiClient.patch("/advisor/profile", payload);
      this._applyProfile(response);
      this.options.showToast?.("Perfil actualizado exitosamente", "success");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      this.options.showToast?.(error?.message || "Error al guardar el perfil", "error");
    }
  }

  async _handleReset() {
    try {
      await this._loadProfile();
      this.options.showToast?.("Perfil sincronizado con el servidor.", "warning");
    } catch (error) {
      console.error("Error al restaurar perfil:", error);
      this.options.showToast?.("Error al restaurar el perfil", "error");
    }
  }

  _readFormValues() {
    return {
      fullName: this._getValue("#advisorProfileFullName"),
      specialty: this._getValue("#advisorProfileSpecialty"),
      description: this._getValue("#advisorProfileDescription"),
      maxCapacity: Number(this._getValue("#advisorProfileMaxClients") || 5),
      phone: this._getValue("#advisorProfilePhone"),
      country: this._getValue("#advisorProfileCountry"),
      notifyEmail: Boolean(this.element.querySelector("#advisorProfileNotifyEmail")?.checked),
      notifyPush: Boolean(this.element.querySelector("#advisorProfileNotifyPush")?.checked),
      // Nota: email y licenseNumber son readonly en el formulario
    };
  }

  _syncShellUser(fullName) {
    this._setText("#advisorTopbarName", fullName);
    this._setText("#advisorSidebarName", fullName);
    this._setText("#advisorSidebarInitials", getInitials(fullName) || "MR");
  }

  _formatMonthYear(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const label = date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
