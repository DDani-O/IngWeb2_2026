import { PageController } from "../../core/PageController.js";
import {
  ROUTES,
} from "../../utils/constants.js";
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
      // Cargar perfil desde API
      await this._loadProfileFromAPI();
      this._renderSummary();
      this._fillFormValues();
      this._setText("#advisorTopbarName", this.profile.fullName);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      this.options.showToast?.("Error al cargar el perfil", "error");
    } finally {
      this.isLoading = false;
    }
  }

  async _loadProfileFromAPI() {
    const apiClient = this.options.apiClient;
    if (!apiClient) {
      throw new Error("API Client no disponible");
    }

    try {
      const response = await apiClient.get("/advisor/profile");
      this.profile = response;
    } catch (error) {
      console.error("Error en API:", error);
      throw error;
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
      toastMessage: "Sesion de asesor finalizada.",
    });
  }

  _renderSummary() {
    if (!this.profile) return;

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
        <strong>${this.profile.specialty || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Matricula</span>
        <strong>${this.profile.licenseNumber || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Clientes activos</span>
        <strong>${this.profile.activeClientsCount || 0}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Capacidad maxima</span>
        <strong>${this.profile.maxCapacity || "-"}</strong>
      </article>
      <article class="profile-meta-item">
        <span>Pais</span>
        <strong>${this.profile.country || "-"}</strong>
      </article>
    `;
  }

  _fillFormValues() {
    if (!this.profile) return;

    this._setInputValue("#advisorProfileFullName", this.profile.fullName);
    this._setInputValue("#advisorProfileEmail", this.profile.email);
    this._setInputValue("#advisorProfilePhone", this.profile.phone || "");
    this._setInputValue("#advisorProfileCountry", this.profile.country || "");
    this._setInputValue("#advisorProfileSpecialty", this.profile.specialty || "");
    this._setInputValue("#advisorProfileDescription", this.profile.description || "");
    this._setInputValue("#advisorProfileActiveClients", String(this.profile.activeClientsCount || 0));
    this._setInputValue("#advisorProfileMaxClients", String(this.profile.maxCapacity || 5));
  }

  async _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#advisorProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const apiClient = this.options.apiClient;
    if (!apiClient) {
      this.options.showToast?.("Error: API Client no disponible", "error");
      return;
    }

    const updateData = this._readFormValues();

    try {
      const response = await apiClient.patch("/advisor/profile", updateData);
      this.profile = response;
      
      this._renderSummary();
      this._setText("#advisorTopbarName", this.profile.fullName);
      this.options.showToast?.("Perfil actualizado exitosamente", "success");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      this.options.showToast?.(error?.message || "Error al guardar el perfil", "error");
    }
  }

  async _handleReset() {
    try {
      // Recargar desde API
      await this._loadProfileFromAPI();
      this._renderSummary();
      this._fillFormValues();
      this._setText("#advisorTopbarName", this.profile.fullName);
      this.options.showToast?.("Perfil restaurado a valores guardados", "warning");
    } catch (error) {
      console.error("Error al restaurar perfil:", error);
      this.options.showToast?.("Error al restaurar el perfil", "error");
    }
  }

  _readFormValues() {
    return {
      specialty: this._getValue("#advisorProfileSpecialty"),
      description: this._getValue("#advisorProfileDescription"),
      maxCapacity: Number(this._getValue("#advisorProfileMaxClients") || 5),
      phone: this._getValue("#advisorProfilePhone"),
      country: this._getValue("#advisorProfileCountry"),
    };
  }
}
