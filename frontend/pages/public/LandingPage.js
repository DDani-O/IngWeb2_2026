/** Landing pública: secciones informativas y modales de login y registro. */
import { Component } from "../../core/Component.js";
import { AuthModals } from "../../components/organisms/AuthModals.js";
import { LANDING_CONTENT, UI_LAYOUT, UI_TIMING } from "../../utils/constants.js";
import { isSafeRelativeUrl, parseQueryString, renderStars } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";

/** Página `#/`. `?modal=login|register` abre el modal correspondiente al entrar. */
export class LandingPage extends Component {
  static template = "./pages/public/landing.html";

  constructor(element, options = {}) {
    super(element, options);
    this.activeTestimonialIndex = 0;
    this.testimonialAutoplayId = null;
    this.authModals = null;
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
    this.authModals = this.mountChild(AuthModals, "#landingAuthModals", {
      authManager: this.options.authManager,
      showToast: this.options.showToast,
    });
    this.listen(this.element, "auth-success", (event) => this._navigateByRole(event.detail.user.role));
    this._wireLandingInteractions();
    this._startTestimonialsAutoplay();
    this._playDemoVideo();
    this._openModalFromQuery(this.options.query);

    this.listen(document, "visibilitychange", () => {
      if (document.hidden) {
        this._stopTestimonialsAutoplay();
        return;
      }

      this._startTestimonialsAutoplay();
    });
  }

  /**
   * El router la llama cuando solo cambia la query (p. ej. #/?modal=login estando en la landing).
   */
  onRouteUpdate(to) {
    this.options.query = to.query;
    this._openModalFromQuery(to.query);
  }

  _openModalFromQuery(query = {}) {
    if (query.modal === "login" || query.modal === "register") {
      this.openAuthModal(query.modal);
    }
  }

  /** Abre el modal de login o de registro (cierra el otro). @param {"login"|"register"} mode */
  openAuthModal(mode = "login") {
    this.authModals?.open(mode);
  }

  /** Corta el carrusel; los modales los cierra `AuthModals` al destruirse con la página. */
  destroy() {
    this._stopTestimonialsAutoplay();
    this.authModals = null;
    super.destroy();
  }

  /**
   * Arranca el video de demo al entrar. Va desde acá y no con `autoplay` en el HTML para
   * respetar `prefers-reduced-motion`: con esa preferencia queda quieto, con su portada, y
   * solo se descarga si el usuario le da play. Está silenciado, así que el navegador lo deja
   * reproducirse solo; si igual lo bloquea, queda la portada con los controles.
   */
  _playDemoVideo() {
    const video = this.element.querySelector(".landing-video-card__player");
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    video.play().catch(() => {});
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

  /**
   * Después de entrar vuelve a la ruta que se había pedido (`next`) o al inicio del rol.
   * Si `next` es de otro rol, el guard del router lo redirige al inicio que corresponde.
   */
  _navigateByRole(role) {
    const next = this.options.query?.next;
    if (next && isSafeRelativeUrl(next)) {
      const [path, queryString = ""] = next.split("?");
      this.options.router?.navigate(path, parseQueryString(queryString));
      return;
    }

    this.options.router?.navigate(this.options.authManager.getDefaultRouteForRole(role));
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
        return html`<button class="landing-nav-link" data-scroll-target="${item.id}" type="button">${item.label}</button>`;
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
        return html`
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
        return html`
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
        return html`
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

    container.innerHTML = html`
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
              return html`<span class="landing-testimonial-dot ${activeClass}"></span>`;
            })}
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
    }, UI_TIMING.TESTIMONIAL_AUTOPLAY_MS);
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
        return html`
          <article class="landing-plan ${plan.highlighted ? "landing-plan--highlight" : ""}">
            ${
              plan.highlighted
                ? html`<span class="landing-plan__badge">MAS POPULAR</span>`
                : ""
            }
            <h3 class="landing-card__title">${plan.name}</h3>
            <p class="landing-plan__price">${plan.price}<span>/mes</span></p>
            <p class="landing-card__text">${plan.subtitle}</p>
            <ul>${plan.features.map((feature) => html`<li>${feature}</li>`)}</ul>
            <button class="action-btn action-btn--${
              plan.highlighted ? "primary" : "ghost"
            } mt-3 w-100 justify-content-center" type="button" data-auth-open="register">${plan.cta || "Empezar"}</button>
          </article>
        `;
      })
      .join("");
  }

}
