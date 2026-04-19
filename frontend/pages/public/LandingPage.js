import { Component } from "../../core/Component.js";
import {
  LANDING_CONTENT,
  TESTIMONIAL_AUTO_MS,
  UI_LAYOUT,
} from "../../utils/constants.js";
import { renderStars } from "../../utils/helpers.js";
import { validateLoginForm, validateRegisterForm } from "../../utils/validators.js";

export class LandingPage extends Component {
  constructor(element, options = {}) {
    super(element, options);
    this.activeTestimonialIndex = 0;
    this.testimonialAutoplayId = null;
    this.loginModal = null;
    this.registerModal = null;
  }

  render() {
    this._renderLandingNavLinks();
    this._renderLandingBrands();
    this._renderLandingFeatures();
    this._renderLandingAdvantages();
    this._renderLandingTestimonials();
    this._renderLandingPlans();

    const yearElement = this.element.querySelector("#landingYear");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }

  attachEvents() {
    this._wireModals();
    this._wireLandingInteractions();
    this._wireAuthFlows();
    this._startTestimonialsAutoplay();

    this.listen(document, "visibilitychange", () => {
      if (document.hidden) {
        this._stopTestimonialsAutoplay();
        return;
      }

      this._startTestimonialsAutoplay();
    });
  }

  openAuthModal(mode = "login") {
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

  destroy() {
    this._stopTestimonialsAutoplay();
    this.loginModal?.hide();
    this.registerModal?.hide();
    this.loginModal = null;
    this.registerModal = null;
    super.destroy();
  }

  _wireModals() {
    const loginModalElement = this.element.querySelector("#loginModal");
    const registerModalElement = this.element.querySelector("#registerModal");

    this.loginModal =
      window.bootstrap && loginModalElement
        ? window.bootstrap.Modal.getOrCreateInstance(loginModalElement)
        : null;

    this.registerModal =
      window.bootstrap && registerModalElement
        ? window.bootstrap.Modal.getOrCreateInstance(registerModalElement)
        : null;
  }

  _wireLandingInteractions() {
    this.element.querySelectorAll("[data-scroll-target]").forEach((node) => {
      this.listen(node, "click", (event) => {
        if (event.currentTarget instanceof HTMLAnchorElement) {
          event.preventDefault();
        }

        const targetId = node.dataset.scrollTarget;
        if (targetId) {
          this._scrollToLandingSection(targetId);
        }
      });
    });

    this.element.querySelectorAll("[data-auth-open]").forEach((node) => {
      this.listen(node, "click", () => {
        this.openAuthModal(node.dataset.authOpen);
      });
    });

    this.listen(this.element, "click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const navButton = event.target.closest("[data-testimonial-nav]");
      if (!navButton) {
        return;
      }

      const direction = navButton.dataset.testimonialNav === "prev" ? -1 : 1;
      this._cycleTestimonials(direction);
    });
  }

  _wireAuthFlows() {
    const switchToRegister = this.element.querySelector("#switchToRegister");
    const switchToLogin = this.element.querySelector("#switchToLogin");
    const roleUser = this.element.querySelector("#registerRoleUser");
    const roleAdvisor = this.element.querySelector("#registerRoleAdvisor");
    const advisorFields = this.element.querySelector("#registerAdvisorFields");

    this.listen(switchToRegister, "click", () => {
      this.loginModal?.hide();
      this.registerModal?.show();
    });

    this.listen(switchToLogin, "click", () => {
      this.registerModal?.hide();
      this.loginModal?.show();
    });

    const updateAdvisorFields = () => {
      const advisorEnabled = roleAdvisor?.checked;
      advisorFields?.classList.toggle("app-hidden", !advisorEnabled);
    };

    this.listen(roleUser, "change", updateAdvisorFields);
    this.listen(roleAdvisor, "change", updateAdvisorFields);
    updateAdvisorFields();

    const loginForm = this.element.querySelector("#loginForm");
    this.listen(loginForm, "submit", async (event) => {
      event.preventDefault();
      this._hideError("#loginError");

      const payload = {
        email: this.element.querySelector("#loginEmail")?.value || "",
        password: this.element.querySelector("#loginPassword")?.value || "",
        remember: Boolean(this.element.querySelector("#loginRemember")?.checked),
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
        this._navigateByRole(user.role);
      } catch (error) {
        this._showError("#loginError", error.message || "No se pudo iniciar sesion.");
      }
    });

    const registerForm = this.element.querySelector("#registerForm");
    this.listen(registerForm, "submit", async (event) => {
      event.preventDefault();
      this._hideError("#registerError");

      const payload = {
        role: roleAdvisor?.checked ? "asesor" : "usuario",
        fullName: this.element.querySelector("#registerFullName")?.value || "",
        email: this.element.querySelector("#registerEmail")?.value || "",
        password: this.element.querySelector("#registerPassword")?.value || "",
        confirmPassword:
          this.element.querySelector("#registerConfirmPassword")?.value || "",
        licenseNumber:
          this.element.querySelector("#registerLicenseNumber")?.value || "",
        specialty: this.element.querySelector("#registerSpecialty")?.value || "",
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
        updateAdvisorFields();
        this._navigateByRole(user.role);
      } catch (error) {
        this._showError(
          "#registerError",
          error.message || "No se pudo registrar la cuenta."
        );
      }
    });
  }

  _navigateByRole(role) {
    const route = this.options.authManager.getDefaultRouteForRole(role);
    this.options.router?.navigate(route);
  }

  _scrollToLandingSection(targetId) {
    const target = this.element.querySelector(`#${targetId}`);
    if (!target) {
      return;
    }

    const navbar = this.element.querySelector(".landing-navbar");
    const navbarHeight = navbar?.getBoundingClientRect().height || 0;
    const extraOffset = UI_LAYOUT.LANDING_SCROLL_OFFSET;
    const targetTop = window.scrollY + target.getBoundingClientRect().top;

    window.scrollTo({
      top: Math.max(targetTop - navbarHeight - extraOffset, 0),
      behavior: "smooth",
    });
  }

  _renderLandingNavLinks() {
    const navContainer = this.element.querySelector("#landingNavLinks");
    if (!navContainer) {
      return;
    }

    navContainer.innerHTML = LANDING_CONTENT.nav
      .map((item) => {
        return `<button class="landing-nav-link" data-scroll-target="${item.id}" type="button">${item.label}</button>`;
      })
      .join("");
  }

  _renderLandingBrands() {
    const container = this.element.querySelector("#landingBrandsTrack");
    if (!container) {
      return;
    }

    container.innerHTML = LANDING_CONTENT.brands
      .map((brand) => {
        const iconClass = brand.icon || "fa-circle";
        return `
          <article class="landing-logo-item" aria-label="${brand.name}">
            <i class="fa-brands ${iconClass}" aria-hidden="true"></i>
            <span>${brand.name}</span>
          </article>
        `;
      })
      .join("");
  }

  _renderLandingFeatures() {
    const container = this.element.querySelector("#landingFeaturesGrid");
    if (!container) {
      return;
    }

    container.innerHTML = LANDING_CONTENT.features
      .map((feature, index) => {
        return `
          <article class="landing-card landing-card--feature">
            <span class="landing-card__icon">
              <i class="fa-solid ${feature.icon}"></i>
              <span class="landing-step-index">${index + 1}</span>
            </span>
            <h3 class="landing-card__title">${feature.title}</h3>
            <p class="landing-card__text">${feature.description}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderLandingAdvantages() {
    const container = this.element.querySelector("#landingAdvantagesGrid");
    if (!container) {
      return;
    }

    container.innerHTML = LANDING_CONTENT.advantages
      .map((item) => {
        return `
          <article class="landing-adv">
            <h3 class="landing-card__title"><i class="fa-solid ${item.icon} accent"></i> ${item.title}</h3>
            <p class="landing-card__text">${item.text}</p>
          </article>
        `;
      })
      .join("");
  }

  _renderLandingTestimonials() {
    const container = this.element.querySelector("#landingTestimonialsGrid");
    if (!container) {
      return;
    }

    const testimonials = LANDING_CONTENT.testimonials || [];
    if (!testimonials.length) {
      container.innerHTML = "";
      return;
    }

    const total = testimonials.length;
    this.activeTestimonialIndex =
      ((this.activeTestimonialIndex % total) + total) % total;
    const featured = testimonials[this.activeTestimonialIndex];

    container.innerHTML = `
      <article class="landing-testimonial-carousel" aria-live="polite">
        <div class="landing-testimonial-carousel__controls">
          <button
            class="landing-testimonial-nav"
            type="button"
            data-testimonial-nav="prev"
            aria-label="Ver testimonio anterior"
          >
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <span class="landing-testimonial-counter">${this.activeTestimonialIndex + 1} / ${total}</span>
          <button
            class="landing-testimonial-nav"
            type="button"
            data-testimonial-nav="next"
            aria-label="Ver siguiente testimonio"
          >
            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
        <article class="landing-testimonial landing-testimonial--quote">
          <div class="landing-testimonial__stars">${renderStars(featured.rating)}</div>
          <p class="landing-testimonial__quote">"${featured.text}"</p>
          <p class="mt-2"><strong>${featured.name}</strong></p>
          <p class="landing-testimonial__role">${featured.role}</p>
        </article>
        <div class="landing-testimonial-dots" aria-hidden="true">
          ${testimonials
            .map((_, index) => {
              const activeClass =
                index === this.activeTestimonialIndex ? "is-active" : "";
              return `<span class="landing-testimonial-dot ${activeClass}"></span>`;
            })
            .join("")}
        </div>
      </article>
    `;
  }

  _cycleTestimonials(direction) {
    const total = LANDING_CONTENT.testimonials?.length || 0;
    if (total <= 1) {
      return;
    }

    this.activeTestimonialIndex =
      (this.activeTestimonialIndex + direction + total) % total;
    this._renderLandingTestimonials();
    this._startTestimonialsAutoplay();
  }

  _startTestimonialsAutoplay() {
    this._stopTestimonialsAutoplay();

    const total = LANDING_CONTENT.testimonials?.length || 0;
    if (total <= 1) {
      return;
    }

    this.testimonialAutoplayId = window.setInterval(() => {
      const nextIndex = (this.activeTestimonialIndex + 1) % total;
      this.activeTestimonialIndex = nextIndex;
      this._renderLandingTestimonials();
    }, TESTIMONIAL_AUTO_MS);
  }

  _stopTestimonialsAutoplay() {
    if (this.testimonialAutoplayId === null) {
      return;
    }

    window.clearInterval(this.testimonialAutoplayId);
    this.testimonialAutoplayId = null;
  }

  _renderLandingPlans() {
    const container = this.element.querySelector("#landingPlansGrid");
    if (!container) {
      return;
    }

    container.innerHTML = LANDING_CONTENT.plans
      .map((plan) => {
        return `
          <article class="landing-plan ${plan.highlighted ? "landing-plan--highlight" : ""}">
            ${
              plan.highlighted
                ? '<span class="landing-plan__badge">MAS POPULAR</span>'
                : ""
            }
            <h3 class="landing-card__title">${plan.name}</h3>
            <p class="landing-plan__price">${plan.price}<span>/mes</span></p>
            <p class="landing-card__text">${plan.subtitle}</p>
            <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
            <button class="action-btn action-btn--${
              plan.highlighted ? "primary" : "ghost"
            } mt-3 w-100 justify-content-center" type="button" data-auth-open="register">${plan.cta || "Empezar"}</button>
          </article>
        `;
      })
      .join("");
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
