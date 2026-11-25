import { ROUTES } from "../utils/constants.js";
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
    // Se ubica después del primer bloque de la página (el encabezado).
    const anchor = this.element.querySelector(".app-page-content") || this.element;

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
      anchor.insertBefore(status, anchor.children[1] || null);
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
   * Vincula los botones .js-dashboard-back: vuelven al dashboard y, si ya está abierto
   * en otra pestaña, cierran esta (ver core/TabRegistry.js).
   */
  _bindDashboardBackButtons(route = ROUTES.CLIENT_DASHBOARD) {
    this.element.querySelectorAll(".js-dashboard-back").forEach((button) => {
      this.listen(button, "click", (event) => {
        event.preventDefault();
        const navigate = (target) => this.options.router?.navigate(target);
        if (this.options.tabRegistry) {
          this.options.tabRegistry.returnTo(route, navigate);
        } else {
          navigate(route);
        }
      });
    });
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
