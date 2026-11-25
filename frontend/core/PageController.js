import { ROLES, ROUTES, UI_TIMING } from "../utils/constants.js";
import { Component } from "./Component.js";

export class PageController extends Component {
  /**
   * Ejecuta una carga de datos mostrando "Cargando…" y, si falla, un aviso con "Reintentar".
   * Si la página se destruyó mientras esperaba, no toca el DOM.
   * @param {() => Promise<void>} task
   */
  async _loadData(task) {
    this._showStatus("loading", "Cargando datos...");

    try {
      await task();
      if (this._isAlive()) {
        this._clearStatus();
      }
    } catch (error) {
      if (!this._isAlive() || error?.status === 401) {
        // 401: la app ya redirige al login (auth:sessionExpired).
        return;
      }

      this._showStatus("error", error?.message || "No pudimos cargar los datos.", () => this._loadData(task));
    }
  }

  /**
   * Ejecuta una acción del usuario (guardar, borrar…) con manejo de errores uniforme.
   * Mientras corre, deshabilita el botón indicado para evitar doble envío.
   * @returns {Promise<*>} resultado de la tarea o null si falló
   */
  async _runAction(task, { button = null, successMessage = "", errorMessage = "No pudimos completar la accion." } = {}) {
    if (button) {
      button.disabled = true;
    }

    try {
      const result = await task();
      if (successMessage) {
        this.options.showToast?.(successMessage, "success");
      }
      return result;
    } catch (error) {
      if (error?.status !== 401) {
        this.options.showToast?.(error?.message || errorMessage, "danger");
      }
      return null;
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  /**
   * Indica si la página sigue montada (no se navegó a otra mientras se esperaba la API).
   */
  _isAlive() {
    return Boolean(this.element?.isConnected) && !this._destroyed;
  }

  _showStatus(kind, message, onRetry = null) {
    const main = this.element.querySelector(".app-main");
    if (!main) {
      return;
    }

    if (!this._statusElement) {
      this._statusElement = document.createElement("div");
    }

    const status = this._statusElement;
    status.className = `app-status app-status--${kind}`;
    status.setAttribute("role", kind === "error" ? "alert" : "status");
    status.replaceChildren();

    const text = document.createElement("span");
    text.textContent = message;
    status.append(text);

    if (onRetry) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "action-btn action-btn--ghost";
      retry.textContent = "Reintentar";
      retry.addEventListener("click", onRetry, { once: true });
      status.append(retry);
    }

    if (!status.isConnected) {
      main.insertBefore(status, main.children[1] || null);
    }
  }

  _clearStatus() {
    this._statusElement?.remove();
  }

  destroy() {
    this._destroyed = true;
    super.destroy();
  }


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
  _bindLogoutButtons({ role = ROLES.CLIENT, toastMessage } = {}) {
    const selectors =
      role === ROLES.ADVISOR
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
   * Vincula botones comunes de retorno al dashboard del cliente.
   */
  _bindDashboardBackButtons(route = ROUTES.CLIENT_DASHBOARD) {
    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => this._handleBackToRoute(event, route));
    });
  }

  /**
   * Mantiene el flujo existente: cerrar pestana secundaria o navegar en la actual.
   */
  _handleBackToRoute(event, route) {
    event.preventDefault();

    // Si el destino ya está abierto en otra pestaña, esta pestaña secundaria se cierra.
    // window.close() puede fallar (pestaña con historial); en ese caso se navega en el lugar.
    if (this.options.hasRouteOpenInOtherTab?.(route)) {
      window.close();

      window.setTimeout(() => {
        if (!window.closed) {
          this.options.router?.navigate(route);
        }
      }, UI_TIMING.TAB_CLOSE_FALLBACK_MS);

      return;
    }

    this.options.router?.navigate(route);
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
