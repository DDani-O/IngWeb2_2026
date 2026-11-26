import { PageController } from "../../core/PageController.js";
import { themeManager } from "../../core/ThemeManager.js";
import { button } from "../../components/atoms/button.js";
import { profileSummary } from "../../components/molecules/profileSummary.js";
import { ProfileForm } from "../../components/organisms/ProfileForm.js";
import { profileService } from "../../services/profile.service.js";
import { ROLES, ROUTES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { buildHash } from "../../utils/helpers.js";

/** Campos del perfil del cliente (usuarios + perfiles_usuarios) más el tema, que es local. */
const CLIENT_PROFILE_FIELDS = [
  { name: "fullName", label: "Nombre completo", required: true, width: "half", inputAttrs: { maxlength: 120, autocomplete: "name" } },
  { name: "email", label: "Email", type: "email", readonly: true, width: "half", hint: "Es el email de acceso a la cuenta." },
  { name: "occupation", label: "Ocupacion", width: "half", inputAttrs: { maxlength: 120 } },
  { name: "estimatedIncome", label: "Ingreso mensual estimado", type: "number", width: "half", inputAttrs: { min: 0, inputmode: "numeric" } },
  { name: "financialGoal", label: "Objetivo financiero", inputAttrs: { placeholder: "Ej: juntar un fondo de emergencia", maxlength: 300 } },
  { name: "bio", label: "Sobre mi", type: "textarea", inputAttrs: { rows: 2, maxlength: 500 } },
  { name: "theme", label: "Tema visual", type: "select", width: "half", options: [{ value: "dark", label: "Oscuro" }, { value: "light", label: "Claro" }] },
];

/**
 * Perfil de cuenta del cliente (consigna §4.1, edición de perfil). GET /auth/me y PUT /auth/profile.
 */
export class PerfilPage extends PageController {
  static template = "./pages/cliente/perfil.html";

  render() {
    this.form = this.mountChild(ProfileForm, "#profileForm", {
      idPrefix: "clientProfile",
      fields: CLIENT_PROFILE_FIELDS,
      values: { theme: themeManager.getTheme() },
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
    const client = user.client || {};
    this.form.update({
      values: {
        fullName: user.fullName,
        email: user.email,
        occupation: client.occupation,
        estimatedIncome: client.estimatedIncome ?? "",
        financialGoal: client.financialGoal,
        bio: user.bio,
        theme: themeManager.getTheme(),
      },
    });

    this.element.querySelector("#profileSummary").innerHTML = profileSummary({
      fullName: user.fullName,
      email: user.email,
      items: [
        { label: "Perfil de gasto", value: client.spendingProfile?.name || "Sin asignar todavia" },
        { label: "Ingreso estimado", value: client.estimatedIncome ? formatCurrency(client.estimatedIncome) : "-" },
        { label: "Asesor asignado", value: client.advisor?.fullName || "Sin asignar" },
        { label: "Miembro desde", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "-" },
      ],
      footer: button({ label: "Ver perfiles de gasto", variant: "ghost", size: "sm", icon: "fa-user-tag", href: buildHash(ROUTES.CLIENT_PERFILES) }),
    });
  }

  async _save(values) {
    themeManager.setTheme(values.theme);
    this.form.setBusy(true);
    const user = await this._runAction(() => profileService.update(values, ROLES.CLIENT), { successMessage: "Perfil actualizado correctamente." });
    this.form.setBusy(false);

    if (user && this._isAlive()) {
      this._show(user);
    }
  }
}
