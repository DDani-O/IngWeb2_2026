import { PageController } from "../../core/PageController.js";
import { profileService } from "../../services/profile.service.js";
import { ROLES, ROUTES } from "../../utils/constants.js";
import { getInitials } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/**
 * Perfil profesional del asesor. Lee GET /auth/me y guarda con PUT /auth/profile
 * (usuarios + perfiles_asesores: matricula, especialidad, descripcion).
 */
export class AsesorPerfilPage extends PageController {
  static template = "./pages/asesor/perfil.html";

  constructor(element, options = {}) {
    super(element, options);
    this.user = null;
  }

  render() {
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
    const form = this.element.querySelector("#advisorProfileForm");

    this.listen(form, "submit", (event) => this._handleSave(event));
    this.listen(this.element.querySelector("#resetAdvisorProfileButton"), "click", () => this._handleReset());
    this.listen(this.element.querySelector("#backToAdvisorDashboardFromProfile"), "click", () => {
      this.options.router?.navigate(ROUTES.ADVISOR_DASHBOARD);
    });
  }

  _renderSummary() {
    const { user } = this;
    const advisor = user.advisor || {};

    this._setText("#advisorProfileAvatarInitials", getInitials(user.fullName));
    this._setText("#advisorProfileSummaryName", user.fullName);
    this._setText("#advisorProfileSummaryEmail", user.email);

    const meta = this.element.querySelector("#advisorProfileMetaList");
    if (!meta) {
      return;
    }

    const items = [
      ["Especialidad", advisor.specialty || "-"],
      ["Matricula", advisor.licenseNumber || "-"],
      ["Clientes asignados", advisor.assignedClients ?? 0],
      ["Miembro desde", user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "-"],
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
    const { user } = this;
    const advisor = user.advisor || {};
    this._setInputValue("#advisorProfileFullName", user.fullName);
    this._setInputValue("#advisorProfileEmail", user.email);
    this._setInputValue("#advisorProfileSpecialty", advisor.specialty);
    this._setInputValue("#advisorProfileLicense", advisor.licenseNumber);
    this._setInputValue("#advisorProfileDescription", advisor.description);
  }

  async _handleSave(event) {
    event.preventDefault();

    const form = this.element.querySelector("#advisorProfileForm");
    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const user = await this._runAction(() => profileService.update(this._readFormValues(), ROLES.ADVISOR), {
      button: form.querySelector('[type="submit"]'),
      successMessage: "Perfil profesional actualizado.",
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
      fullName: this._getValue("#advisorProfileFullName"),
      bio: this.user?.bio || "",
      specialty: this._getValue("#advisorProfileSpecialty"),
      licenseNumber: this._getValue("#advisorProfileLicense"),
      description: this._getValue("#advisorProfileDescription"),
    };
  }
}
