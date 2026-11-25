import { PageController } from "../../core/PageController.js";
import { button } from "../../components/atoms/button.js";
import { profileSummary } from "../../components/molecules/profileSummary.js";
import { ProfileForm } from "../../components/organisms/ProfileForm.js";
import { profileService } from "../../services/profile.service.js";
import { ROLES, ROUTES } from "../../utils/constants.js";
import { buildHash } from "../../utils/helpers.js";

/** Campos del perfil del asesor (usuarios + perfiles_asesores). */
const ADVISOR_PROFILE_FIELDS = [
  { name: "fullName", label: "Nombre completo", required: true, width: "half", inputAttrs: { maxlength: 120, autocomplete: "name" } },
  { name: "email", label: "Email", type: "email", readonly: true, width: "half", hint: "Es el email de acceso a la cuenta." },
  { name: "specialty", label: "Especialidad", required: true, width: "half" },
  { name: "licenseNumber", label: "Matricula", required: true, width: "half" },
  { name: "description", label: "Descripcion profesional", type: "textarea", inputAttrs: { rows: 3 } },
];

/**
 * Perfil profesional del asesor. GET /auth/me y PUT /auth/profile.
 */
export class AsesorPerfilPage extends PageController {
  static template = "./pages/asesor/perfil.html";

  render() {
    this.form = this.mountChild(ProfileForm, "#profileForm", {
      idPrefix: "advisorProfile",
      fields: ADVISOR_PROFILE_FIELDS,
      extraActions: button({ label: "Volver al panel", variant: "ghost", icon: "fa-arrow-left", href: buildHash(ROUTES.ADVISOR_DASHBOARD) }),
    });

    this._loadData(async () => {
      const user = await profileService.getMine();
      if (this._isAlive()) {
        this._show(user);
      }
    });
  }

  attachEvents() {
    this.listen(this.element, "profile-submit", (event) => this._save(event.detail.values));
    this.listen(this.element, "profile-reset", () => this.options.showToast?.("Se descartaron los cambios sin guardar.", "warning"));
  }

  _show(user) {
    const advisor = user.advisor || {};
    this.user = user;
    this.form.update({
      values: {
        fullName: user.fullName,
        email: user.email,
        specialty: advisor.specialty,
        licenseNumber: advisor.licenseNumber,
        description: advisor.description,
      },
    });

    this.element.querySelector("#profileSummary").innerHTML = profileSummary({
      fullName: user.fullName,
      email: user.email,
      items: [
        { label: "Especialidad", value: advisor.specialty },
        { label: "Matricula", value: advisor.licenseNumber },
        { label: "Clientes asignados", value: String(advisor.assignedClients ?? 0) },
        { label: "Miembro desde", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "-" },
      ],
      footer: button({ label: "Gestionar clientes", variant: "ghost", size: "sm", icon: "fa-users", href: buildHash(ROUTES.ADVISOR_CLIENTES) }),
    });
  }

  async _save(values) {
    this.form.setBusy(true);
    const user = await this._runAction(() => profileService.update({ ...values, bio: this.user?.bio || "" }, ROLES.ADVISOR), {
      successMessage: "Perfil profesional actualizado.",
    });
    this.form.setBusy(false);

    if (user && this._isAlive()) {
      this._show(user);
    }
  }
}
