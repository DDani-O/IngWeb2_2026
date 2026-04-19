import { ROUTES } from "../utils/constants.js";
import { Component } from "./Component.js";

export class PageController extends Component {
  /**
   * Restaura la posicion de scroll global y del contenedor principal de rutas.
   */
  _resetViewPosition() {
    window.scrollTo(0, 0);

    const routeContainer = document.querySelector("#appRouteContainer");
    if (routeContainer) {
      routeContainer.scrollTop = 0;
    }
  }

  /**
   * Actualiza texto de un nodo si existe en el arbol del componente.
   */
  _setText(selector, value) {
    const target = this.element.querySelector(selector);
    if (target) {
      target.textContent = value;
    }
  }

  /**
   * Lee el valor de un input/select del componente.
   */
  _getValue(selector) {
    return this.element.querySelector(selector)?.value?.trim() || "";
  }

  /**
   * Escribe el valor de un input/select si existe.
   */
  _setInputValue(selector, value) {
    const input = this.element.querySelector(selector);
    if (input) {
      input.value = value;
    }
  }

  /**
   * Vincula listeners para los botones comunes de cierre de sesion por rol.
   */
  _bindLogoutButtons({ role = "usuario", toastMessage } = {}) {
    const selectors =
      role === "asesor"
        ? ["#advisorLogoutButton", "#advisorLogoutButtonMobile"]
        : ["#userLogoutButton", "#userLogoutButtonMobile"];

    selectors.forEach((selector) => {
      const button = this.element.querySelector(selector);
      this.listen(button, "click", () => {
        this._handleLogout({ toastMessage });
      });
    });
  }

  /**
   * Cierra sesion y redirige al home con modal login.
   */
  _handleLogout({ toastMessage = "Sesion finalizada correctamente." } = {}) {
    this.options.authManager?.logout();
    this.options.showToast?.(toastMessage, "success");
    this.options.router?.navigate(ROUTES.HOME, { modal: "login" });
  }

  /**
   * Vincula botones comunes de retorno al dashboard del usuario.
   */
  _bindDashboardBackButtons(route = ROUTES.USER_DASHBOARD) {
    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => this._handleBackToRoute(event, route));
    });
  }

  /**
   * Mantiene el flujo existente: cerrar pestana secundaria o navegar en la actual.
   */
  _handleBackToRoute(event, route) {
    event.preventDefault();

    const isRouteOpenInAnotherTab =
      this.options.hasRouteOpenInOtherTab?.(route) ||
      (window.opener && !window.opener.closed);

    if (isRouteOpenInAnotherTab) {
      window.close();

      window.setTimeout(() => {
        if (!window.closed) {
          this.options.router?.navigate(route);
        }
      }, 120);

      return;
    }

    this.options.router?.navigate(route);
  }

  /**
   * Mantiene compatibilidad con controladores existentes.
   */
  _handleBackToDashboard(event) {
    this._handleBackToRoute(event, ROUTES.USER_DASHBOARD);
  }

  /**
   * Retorna (o crea) una instancia Bootstrap Modal para el selector indicado.
   */
  _getModalInstance(selector) {
    if (!window.bootstrap) {
      return null;
    }

    const modalElement = this.element.querySelector(selector);
    if (!modalElement) {
      return null;
    }

    return window.bootstrap.Modal.getOrCreateInstance(modalElement);
  }

  /**
   * Abre un modal Bootstrap si existe.
   */
  _showModal(selector) {
    const modal = this._getModalInstance(selector);
    modal?.show();
    return modal;
  }
}
