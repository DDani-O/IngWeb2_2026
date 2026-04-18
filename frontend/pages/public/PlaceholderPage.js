import { Component } from "../../core/Component.js";
import { ROUTES } from "../../utils/constants.js";
import { isSafeRelativeUrl } from "../../utils/helpers.js";

export class PlaceholderPage extends Component {
  static DEFAULTS = {
    query: {},
  };

  render() {
    const config = this._buildConfig();

    this._renderIcon(config.icon);
    this._setText("#placeholderTitle", config.title);
    this._setText("#placeholderDescription", config.description);
    this._setText("#placeholderBackText", config.backText);

    const ctaButton = this.element.querySelector("#placeholderCtaButton");
    const ctaText = this.element.querySelector("#placeholderCtaText");

    if (ctaButton && ctaText) {
      if (config.ctaText && isSafeRelativeUrl(config.ctaUrl)) {
        ctaButton.classList.remove("app-hidden");
        ctaButton.setAttribute("href", `#${config.ctaUrl}`);
        ctaText.textContent = config.ctaText;
      } else {
        ctaButton.classList.add("app-hidden");
      }
    }
  }

  attachEvents() {
    const backButton = this.element.querySelector("#placeholderBackButton");
    this.listen(backButton, "click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.options.router?.navigate(ROUTES.HOME);
      }
    });
  }

  _buildConfig() {
    const query = this.options.query || {};

    return {
      title: query.title || "Pagina en Construccion",
      description:
        query.description ||
        "Estamos trabajando en esta seccion. Vuelve pronto.",
      icon: query.icon || "🚧",
      backText: query.backText || "Volver Atras",
      ctaText: query.ctaText || "",
      ctaUrl: query.ctaUrl || "",
    };
  }

  _renderIcon(iconValue) {
    const iconElement = this.element.querySelector("#placeholderIcon");
    if (!iconElement) {
      return;
    }

    const icon = String(iconValue || "").trim();
    const faClass = this._normalizeFaClass(icon);

    if (faClass) {
      iconElement.innerHTML = `<i class="fa-solid ${faClass}"></i>`;
      return;
    }

    iconElement.textContent = icon || "🚧";
  }

  _normalizeFaClass(icon) {
    const cleaned = icon
      .replace("fa-solid", "")
      .trim()
      .replace(/\s+/g, " ");

    if (/^fa-[a-z0-9-]+$/i.test(cleaned)) {
      return cleaned;
    }

    if (/^fa[a-z0-9-]+$/i.test(cleaned)) {
      return cleaned;
    }

    return "";
  }

  _setText(selector, value) {
    const element = this.element.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }
}
