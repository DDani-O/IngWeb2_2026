/** Base de las páginas con datos: carga con estado, acciones con aviso y helpers de DOM. */
import { ROUTES } from "../utils/constants.js";
import { errorState, loadingState } from "../components/molecules/stateBlock.js";
import { ChartCard } from "../components/organisms/ChartCard.js";
import { Component } from "./Component.js";

/**
 * Las páginas que piden datos a la API extienden esta clase: `_loadData` y `_runAction`
 * unifican "Cargando…", errores, reintento y toasts, y descartan respuestas que llegan
 * después de salir de la página.
 */
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

      // Reintentar solo tiene sentido en errores transitorios (sin conexión, tiempo agotado, 5xx).
      const transient = !error?.status || error.status >= 500;
      this._showStatus("error", error?.message || "No pudimos cargar los datos.", transient ? () => this._loadData(task) : null);
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
    if (!this._statusElement) {
      this._statusElement = document.createElement("div");
      this._statusElement.className = "app-status";
    }

    const status = this._statusElement;
    status.innerHTML = kind === "error" ? errorState({ message, retryLabel: onRetry ? "Reintentar" : null }) : loadingState({ message });
    status.querySelector('[data-action="retry"]')?.addEventListener("click", onRetry, { once: true });

    if (!status.isConnected) {
      // Se ubica después del primer bloque de la página (el encabezado).
      const anchor = this.element.querySelector(".app-page-content") || this.element;
      anchor.insertBefore(status, anchor.children[1] || null);
    }
  }

  _clearStatus() {
    this._statusElement?.remove();
  }

  /**
   * Monta cada gráfico la primera vez y después solo le pasa las props nuevas, sin
   * recrear el componente (al recargar los datos de la página).
   * @param {Record<string, object>} charts selector del contenedor → props de `ChartCard`
   */
  _showCharts(charts) {
    this.charts = this.charts || {};
    Object.entries(charts).forEach(([selector, props]) => {
      this.charts[selector] = this.charts[selector] ? this.charts[selector].update(props) : this.mountChild(ChartCard, selector, props);
    });
  }

  /** Marca la página como destruida para que las respuestas tardías no toquen el DOM. */
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
}
