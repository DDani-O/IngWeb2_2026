/** Modales de login y registro de la landing: abrirlos, validarlos y crear la sesión. */
import { Component } from "../../core/Component.js";
import { ROLES } from "../../utils/constants.js";
import { validateLoginForm, validateRegisterForm } from "../../utils/validators.js";

/**
 * Organismo AuthModals. El markup de los dos modales viene en la plantilla de la landing
 * (`#loginModal` y `#registerModal` dentro del elemento raíz); este componente solo los
 * maneja. Al iniciar sesión o registrarse emite `auth-success` con `{ user }`: a dónde ir
 * después lo decide la página, que conoce la ruta pedida (`next`).
 *
 * Props: authManager, showToast.
 */
export class AuthModals extends Component {
  /** Sin render propio: el markup es estático y está en la plantilla. */
  render() {}

  attachEvents() {
    this.loginModal = this._modal("#loginModal");
    this.registerModal = this._modal("#registerModal");
    this._wireModalSwitch();
    this._wireLogin();
    this._wireRegister();
  }

  /**
   * Abre el modal de login o de registro (cierra el otro) con los errores limpios.
   * @param {"login"|"register"} mode
   */
  open(mode = "login") {
    this._hideError("#loginError");
    this._hideError("#registerError");

    if (mode === "register") {
      this.loginModal?.hide();
      this.registerModal?.show();
      return;
    }

    this.registerModal?.hide();
    this.loginModal?.show();
  }

  /** Cierra los modales al salir de la landing, para no dejar el backdrop de Bootstrap. */
  destroy() {
    this.loginModal?.hide();
    this.registerModal?.hide();
    this.loginModal = null;
    this.registerModal = null;
    super.destroy();
  }

  _modal(selector) {
    const element = this.element.querySelector(selector);
    return window.bootstrap && element ? window.bootstrap.Modal.getOrCreateInstance(element) : null;
  }

  /** Links "No tienes cuenta?" y "Ya tienes cuenta?" entre los dos modales. */
  _wireModalSwitch() {
    this.listen(this.element.querySelector("#switchToRegister"), "click", () => {
      this.loginModal?.hide();
      this.registerModal?.show();
    });
    this.listen(this.element.querySelector("#switchToLogin"), "click", () => {
      this.registerModal?.hide();
      this.loginModal?.show();
    });
  }

  _wireLogin() {
    this.listen(this.element.querySelector("#loginForm"), "submit", async (event) => {
      event.preventDefault();
      this._hideError("#loginError");

      const payload = {
        email: this._value("#loginEmail"),
        password: this._value("#loginPassword"),
      };
      const validation = validateLoginForm(payload);
      if (!validation.isValid) {
        this._showError("#loginError", validation.errors[0]);
        return;
      }

      try {
        const user = await this.options.authManager.login(payload);
        this.options.showToast?.(`Bienvenido ${user.fullName}.`, "success");
        this.loginModal?.hide();
        this.dispatch("auth-success", { user });
      } catch (error) {
        this._showError("#loginError", error.message || "No se pudo iniciar sesion.");
      }
    });
  }

  _wireRegister() {
    const registerForm = this.element.querySelector("#registerForm");
    const roleAdvisor = this.element.querySelector("#registerRoleAdvisor");

    this.listen(this.element.querySelector("#registerRoleClient"), "change", () => this._syncAdvisorFields());
    this.listen(roleAdvisor, "change", () => this._syncAdvisorFields());
    this._syncAdvisorFields();

    this.listen(registerForm, "submit", async (event) => {
      event.preventDefault();
      this._hideError("#registerError");

      const payload = {
        role: roleAdvisor?.checked ? ROLES.ADVISOR : ROLES.CLIENT,
        fullName: this._value("#registerFullName"),
        email: this._value("#registerEmail"),
        password: this._value("#registerPassword"),
        confirmPassword: this._value("#registerConfirmPassword"),
        licenseNumber: this._value("#registerLicenseNumber"),
        specialty: this._value("#registerSpecialty"),
        acceptTerms: Boolean(this.element.querySelector("#registerTerms")?.checked),
      };
      const validation = validateRegisterForm(payload);
      if (!validation.isValid) {
        this._showError("#registerError", validation.errors[0]);
        return;
      }

      try {
        const user = await this.options.authManager.register(payload);
        this.options.showToast?.(`Cuenta creada para ${user.fullName}.`, "success");
        this.registerModal?.hide();
        registerForm.reset();
        this._syncAdvisorFields();
        this.dispatch("auth-success", { user });
      } catch (error) {
        this._showError("#registerError", error.message || "No se pudo registrar la cuenta.");
      }
    });
  }

  /** Matrícula y especialidad solo se muestran con el rol asesor. */
  _syncAdvisorFields() {
    const advisorEnabled = this.element.querySelector("#registerRoleAdvisor")?.checked;
    this.element.querySelector("#registerAdvisorFields")?.classList.toggle("app-hidden", !advisorEnabled);
  }

  _value(selector) {
    return this.element.querySelector(selector)?.value || "";
  }

  _showError(selector, message) {
    const element = this.element.querySelector(selector);
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove("app-hidden");
  }

  _hideError(selector) {
    const element = this.element.querySelector(selector);
    if (!element) {
      return;
    }

    element.textContent = "";
    element.classList.add("app-hidden");
  }
}
