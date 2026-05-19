import { API_CONFIG, STORAGE_KEYS } from "../utils/constants.js";
import { parseQueryString } from "../utils/helpers.js";

export class APIClient {
  /**
   * Inicializa cliente HTTP con URL base y timeout global.
   * Puede reutilizarse para apuntar a distintos entornos (dev/prod/mock).
   */
  constructor(baseUrl = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
    this.timeoutMs = API_CONFIG.TIMEOUT_MS;
  }

  /**
   * Realiza solicitudes GET.
   */
  async get(endpoint, options = {}) {
    return this._request("GET", endpoint, options);
  }

  /**
   * Realiza solicitudes POST enviando payload JSON.
   */
  async post(endpoint, data = {}, options = {}) {
    return this._request("POST", endpoint, { ...options, data });
  }

  /**
   * Realiza solicitudes PUT para actualizar recursos.
   */
  async put(endpoint, data = {}, options = {}) {
    return this._request("PUT", endpoint, { ...options, data });
  }

  /**
   * Realiza solicitudes PATCH para actualizaciones parciales.
   */
  async patch(endpoint, data = {}, options = {}) {
    return this._request("PATCH", endpoint, { ...options, data });
  }

  /**
   * Realiza solicitudes DELETE.
   */
  async delete(endpoint, options = {}) {
    return this._request("DELETE", endpoint, options);
  }

  /**
   * Envia un FormData (multipart/form-data) al servidor.
   * No setea Content-Type para que el browser incluya el boundary correcto.
   */
  async postFile(endpoint, formData) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });

      const text = await response.text();
      let payload = {};
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { message: text };
        }
      }

      if (!response.ok) {
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;
        throw new Error(message || "Error de comunicacion con el backend.");
      }

      return payload;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Metodo central de red: arma URL, headers, timeout y manejo de errores.
   * Tambien puede servir como punto unico para agregar retries o telemetry.
   */
  async _request(method, endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const queryParams = options.query || {};

    const queryString = new URLSearchParams(queryParams).toString();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}${
      queryString ? `?${queryString}` : ""
    }`;

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body:
          method === "GET" || method === "DELETE"
            ? null
            : JSON.stringify(options.data || {}),
        signal: controller.signal,
      });

      const text = await response.text();
      let payload = {};

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { message: text };
        }
      }

      if (!response.ok) {
        const message = Array.isArray(payload?.message)
          ? payload.message[0]
          : payload?.message;
        throw new Error(message || "Error de comunicacion con el backend.");
      }

      return payload;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Extrae parametros query desde un hash para reutilizarlos en rutas.
   */
  static parseHashQuery(hash) {
    const [, query = ""] = String(hash).split("?");
    return parseQueryString(query);
  }
}

export const apiClient = new APIClient();
