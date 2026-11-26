import { API_CONFIG, EVENTS, STORAGE_KEYS, UI_TIMING } from "../utils/constants.js";
import { sleep } from "../utils/helpers.js";
import { eventBus } from "./EventBus.js";

/**
 * Error normalizado de la API. El backend responde { error, mensaje, codigo, detalles }.
 */
export class ApiError extends Error {
  constructor({ status = 0, code = "ERROR", message = "Error de comunicacion con el servidor.", details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isLocalHost = () => ["localhost", "127.0.0.1"].includes(window.location.hostname);

/**
 * Resuelve el driver activo según el entorno (API_CONFIG.DRIVERS). En local se puede pisar
 * con localStorage ("fintrack.apiDriver" = "http" | "mock"); en producción siempre es "http".
 */
function resolveDriver() {
  if (!isLocalHost()) {
    return API_CONFIG.DRIVERS.production;
  }
  const override = localStorage.getItem(STORAGE_KEYS.API_DRIVER);
  return override === "http" || override === "mock" ? override : API_CONFIG.DRIVERS.local;
}

function resolveBaseUrl() {
  return isLocalHost() ? API_CONFIG.BASE_URLS.local : API_CONFIG.BASE_URLS.production;
}

export class APIClient {
  /**
   * Cliente HTTP único de la app. Con driver "mock" atiende los pedidos con el backend
   * simulado (mocks/mockServer.js) usando el mismo contrato que la API real.
   */
  constructor() {
    this.driver = resolveDriver();
    this.baseUrl = resolveBaseUrl();
    this.timeoutMs = API_CONFIG.TIMEOUT_MS;
    this._tokenProvider = () => null;
    this._mockHandler = null;
  }

  /**
   * Define de dónde se lee el token (lo inyecta AuthManager para evitar dependencias circulares).
   * @param {() => string|null} provider
   */
  setTokenProvider(provider) {
    this._tokenProvider = provider;
  }

  async get(endpoint, { query } = {}) {
    return this._request("GET", endpoint, { query });
  }

  /**
   * @param {object} [options] - `timeoutMs` para pedidos que tardan más (carga de tickets).
   */
  async post(endpoint, data = {}, { timeoutMs } = {}) {
    return this._request("POST", endpoint, { data, timeoutMs });
  }

  async put(endpoint, data = {}) {
    return this._request("PUT", endpoint, { data });
  }

  async delete(endpoint) {
    return this._request("DELETE", endpoint, {});
  }

  /**
   * Punto único de red: arma el pedido, aplica el driver y normaliza respuestas y errores.
   */
  async _request(method, endpoint, { query = {}, data = null, timeoutMs = this.timeoutMs } = {}) {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const cleanQuery = Object.fromEntries(
      Object.entries(query || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
    const token = this._tokenProvider();

    const { status, body } =
      this.driver === "mock"
        ? await this._mockRequest(method, path, cleanQuery, data, token)
        : await this._httpRequest(method, path, cleanQuery, data, token, timeoutMs);

    if (status >= 200 && status < 300) {
      return body;
    }

    const error = new ApiError({
      status,
      code: body?.codigo || `HTTP_${status}`,
      message: body?.mensaje || "Error de comunicacion con el servidor.",
      details: body?.detalles || null,
    });

    // Solo es "sesión expirada" si se mandó un token; un 401 en el login es credencial inválida.
    if (status === 401 && token) {
      eventBus.emit(EVENTS.AUTH.SESSION_EXPIRED, { message: error.message });
    }

    throw error;
  }

  async _mockRequest(method, path, query, data, token) {
    if (!this._mockHandler) {
      const module = await import("../mocks/mockServer.js");
      this._mockHandler = module.handleMockRequest;
    }

    await sleep(UI_TIMING.MOCK_LATENCY_MS);
    return this._mockHandler({ method, path, query, body: data, token });
  }

  async _httpRequest(method, path, query, data, token, timeoutMs = this.timeoutMs) {
    if (!this.baseUrl) {
      throw new ApiError({ code: "SIN_CONFIGURAR", message: "Falta configurar la URL del backend (API_CONFIG.BASE_URLS)." });
    }

    const queryString = new URLSearchParams(query).toString();
    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
    const isFormData = data instanceof FormData;
    const headers = {};

    if (!isFormData && data !== null && method !== "GET" && method !== "DELETE") {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === "GET" || method === "DELETE" || data === null ? null : isFormData ? data : JSON.stringify(data),
        signal: controller.signal,
      });

      const text = await response.text();
      let body = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = { mensaje: "Respuesta invalida del servidor.", codigo: "RESPUESTA_INVALIDA" };
        }
      }

      return { status: response.status, body };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new ApiError({ code: "TIEMPO_AGOTADO", message: "El servidor tardo demasiado en responder." });
      }
      throw new ApiError({ code: "SIN_CONEXION", message: "No se pudo conectar con el servidor." });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

export const apiClient = new APIClient();
