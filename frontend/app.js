import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { themeManager } from "./core/ThemeManager.js";
import {
  EVENTS,
  LANDING_CONTENT,
  ROUTES,
} from "./utils/constants.js";
import {
  renderStars,
} from "./utils/helpers.js";
import { validateLoginForm, validateRegisterForm } from "./utils/validators.js";

const landingPage = document.querySelector("#landingPage");
const routeContainer = document.querySelector("#appRouteContainer");
const toastContainer = document.querySelector("#globalToastContainer");

const loginModalElement = document.querySelector("#loginModal");
const registerModalElement = document.querySelector("#registerModal");

const loginModal = window.bootstrap
  ? window.bootstrap.Modal.getOrCreateInstance(loginModalElement)
  : null;

const registerModal = window.bootstrap
  ? window.bootstrap.Modal.getOrCreateInstance(registerModalElement)
  : null;

const router = new Router({ viewSelector: "#route-view" });

initializeApplication();

function initializeApplication() {
  themeManager.init();
  authManager.init();

  stateManager.patch({
    theme: themeManager.getTheme(),
  });

  renderLandingContent();
  wireLandingInteractions();
  wireAuthFlows();
  configureRouter();
  router.start();

  eventBus.on(EVENTS.ROUTER.NAVIGATE, ({ path, query }) => {
    router.navigate(path, query);
  });
}

function renderLandingContent() {
  renderLandingNavLinks();
  renderLandingBrands();
  renderLandingFeatures();
  renderLandingAdvantages();
  renderLandingTestimonials();
  renderLandingPlans();

  const yearElement = document.querySelector("#landingYear");
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

function renderLandingNavLinks() {
  const navContainer = document.querySelector("#landingNavLinks");
  if (!navContainer) {
    return;
  }

  navContainer.innerHTML = LANDING_CONTENT.nav
    .map((item) => {
      return `<button class="landing-nav-link" data-scroll-target="${item.id}" type="button">${item.label}</button>`;
    })
    .join("");
}

function renderLandingBrands() {
  const container = document.querySelector("#landingBrandsTrack");
  if (!container) {
    return;
  }

  container.innerHTML = LANDING_CONTENT.brands
    .map((brand) => `<article class="landing-logo-item">${brand.name}</article>`)
    .join("");
}

function renderLandingFeatures() {
  const container = document.querySelector("#landingFeaturesGrid");
  if (!container) {
    return;
  }

  container.innerHTML = LANDING_CONTENT.features
    .map((feature) => {
      return `
        <article class="landing-card">
          <span class="landing-card__icon"><i class="fa-solid ${feature.icon}"></i></span>
          <h3 class="landing-card__title">${feature.title}</h3>
          <p class="landing-card__text">${feature.description}</p>
        </article>
      `;
    })
    .join("");
}

function renderLandingAdvantages() {
  const container = document.querySelector("#landingAdvantagesGrid");
  if (!container) {
    return;
  }

  container.innerHTML = LANDING_CONTENT.advantages
    .map((item) => {
      return `
        <article class="landing-adv">
          <h3 class="landing-card__title"><i class="fa-solid ${item.icon} accent"></i> ${item.title}</h3>
          <p class="landing-card__text">${item.text}</p>
          <ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
        </article>
      `;
    })
    .join("");
}

function renderLandingTestimonials() {
  const container = document.querySelector("#landingTestimonialsGrid");
  if (!container) {
    return;
  }

  container.innerHTML = LANDING_CONTENT.testimonials
    .map((testimonial) => {
      return `
        <article class="landing-testimonial">
          <div class="landing-testimonial__stars">${renderStars(testimonial.rating)}</div>
          <p class="landing-card__text">"${testimonial.text}"</p>
          <p class="mt-2"><strong>${testimonial.name}</strong></p>
          <p class="text-muted">${testimonial.role}</p>
        </article>
      `;
    })
    .join("");
}

function renderLandingPlans() {
  const container = document.querySelector("#landingPlansGrid");
  if (!container) {
    return;
  }

  container.innerHTML = LANDING_CONTENT.plans
    .map((plan) => {
      return `
        <article class="landing-plan ${plan.highlighted ? "landing-plan--highlight" : ""}">
          <h3 class="landing-card__title">${plan.name}</h3>
          <p class="landing-plan__price">${plan.price}</p>
          <p class="landing-card__text">${plan.subtitle}</p>
          <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
          <button class="action-btn action-btn--${
            plan.highlighted ? "primary" : "ghost"
          } mt-3 w-100" type="button" data-auth-open="register">Elegir plan</button>
        </article>
      `;
    })
    .join("");
}

function wireLandingInteractions() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll("[data-auth-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openAuthModal(button.dataset.authOpen);
    });
  });
}

function wireAuthFlows() {
  const switchToRegister = document.querySelector("#switchToRegister");
  const switchToLogin = document.querySelector("#switchToLogin");
  const roleUser = document.querySelector("#registerRoleUser");
  const roleAdvisor = document.querySelector("#registerRoleAdvisor");
  const advisorFields = document.querySelector("#registerAdvisorFields");

  switchToRegister?.addEventListener("click", () => {
    loginModal?.hide();
    registerModal?.show();
  });

  switchToLogin?.addEventListener("click", () => {
    registerModal?.hide();
    loginModal?.show();
  });

  const updateAdvisorFields = () => {
    const advisorEnabled = roleAdvisor?.checked;
    advisorFields?.classList.toggle("app-hidden", !advisorEnabled);
  };

  roleUser?.addEventListener("change", updateAdvisorFields);
  roleAdvisor?.addEventListener("change", updateAdvisorFields);
  updateAdvisorFields();

  const loginForm = document.querySelector("#loginForm");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError("#loginError");

    const payload = {
      email: document.querySelector("#loginEmail")?.value || "",
      password: document.querySelector("#loginPassword")?.value || "",
      remember: Boolean(document.querySelector("#loginRemember")?.checked),
    };

    const validation = validateLoginForm(payload);
    if (!validation.isValid) {
      showError("#loginError", validation.errors[0]);
      return;
    }

    try {
      const user = await authManager.login(payload);
      showToast(`Bienvenido ${user.fullName}.`, "success");
      loginModal?.hide();
      navigateByRole(user.role);
    } catch (error) {
      showError("#loginError", error.message || "No se pudo iniciar sesion.");
    }
  });

  const registerForm = document.querySelector("#registerForm");
  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError("#registerError");

    const payload = {
      role: roleAdvisor?.checked ? "asesor" : "usuario",
      fullName: document.querySelector("#registerFullName")?.value || "",
      email: document.querySelector("#registerEmail")?.value || "",
      password: document.querySelector("#registerPassword")?.value || "",
      confirmPassword:
        document.querySelector("#registerConfirmPassword")?.value || "",
      licenseNumber: document.querySelector("#registerLicenseNumber")?.value || "",
      specialty: document.querySelector("#registerSpecialty")?.value || "",
      acceptTerms: Boolean(document.querySelector("#registerTerms")?.checked),
    };

    const validation = validateRegisterForm(payload);
    if (!validation.isValid) {
      showError("#registerError", validation.errors[0]);
      return;
    }

    try {
      const user = await authManager.register(payload);
      showToast(`Cuenta creada para ${user.fullName}.`, "success");
      registerModal?.hide();
      registerForm.reset();
      updateAdvisorFields();
      navigateByRole(user.role);
    } catch (error) {
      showError("#registerError", error.message || "No se pudo registrar la cuenta.");
    }
  });
}

function configureRouter() {
  const requireRole = (role) => {
    return () => {
      if (!authManager.isAuthenticated()) {
        return { path: ROUTES.HOME, query: { modal: "login" } };
      }

      if (!authManager.hasRole(role)) {
        return authManager.getDefaultRouteForRole(authManager.getCurrentRole());
      }

      return true;
    };
  };

  router.registerMany([
    {
      path: ROUTES.HOME,
      render: (context) => {
        showLandingPage();

        const modal = context.query.modal;
        if (modal === "login" || modal === "register") {
          openAuthModal(modal);
        }
      },
      onEnter: () => null,
    },
    {
      path: ROUTES.USER_DASHBOARD,
      templateUrl: "./pages/usuario/dashboard.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        showRoutedPage();
        const module = await import("./pages/usuario/DashboardPage.js");
        const page = new module.DashboardPage(context.mountNode, {
          router,
          authManager,
          showToast,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.USER_PERFILES,
      templateUrl: "./pages/usuario/perfiles.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        showRoutedPage();
        const module = await import("./pages/usuario/PerfilesPage.js");
        const page = new module.PerfilesPage(context.mountNode, {
          router,
          showToast,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.USER_RECOMENDACIONES,
      templateUrl: "./pages/usuario/recomendaciones.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        showRoutedPage();
        const module = await import("./pages/usuario/RecomendacionesPage.js");
        const page = new module.RecomendacionesPage(context.mountNode, {
          router,
          showToast,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.ADVISOR_DASHBOARD,
      templateUrl: "./pages/asesor/dashboard.html",
      beforeEnter: requireRole("asesor"),
      onEnter: async (context) => {
        showRoutedPage();
        const module = await import("./pages/asesor/AsesorDashboardPage.js");
        const page = new module.AsesorDashboardPage(context.mountNode, {
          router,
          authManager,
          showToast,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.PLACEHOLDER,
      templateUrl: "./pages/public/placeholder.html",
      onEnter: async (context) => {
        showRoutedPage();
        const module = await import("./pages/public/PlaceholderPage.js");
        const page = new module.PlaceholderPage(context.mountNode, {
          router,
          query: context.query,
        });
        page.mount();
        return () => page.destroy();
      },
    },
  ]);

  router.setNotFoundRoute({
    path: "*",
    render: () => {
      router.navigate(ROUTES.PLACEHOLDER, {
        title: "Ruta no encontrada",
        description:
          "La ruta solicitada no existe en esta fase. Puedes volver al inicio o dashboard.",
        icon: "fa-route",
        ctaText: "Ir al Inicio",
        ctaUrl: ROUTES.HOME,
      });
    },
  });
}

function showLandingPage() {
  landingPage?.classList.remove("app-hidden");
  routeContainer?.classList.add("app-hidden");
}

function showRoutedPage() {
  landingPage?.classList.add("app-hidden");
  routeContainer?.classList.remove("app-hidden");
}

function navigateByRole(role) {
  const route = authManager.getDefaultRouteForRole(role);
  router.navigate(route);
}

function openAuthModal(mode) {
  hideError("#loginError");
  hideError("#registerError");

  if (mode === "register") {
    loginModal?.hide();
    registerModal?.show();
    return;
  }

  registerModal?.hide();
  loginModal?.show();
}

function showToast(message, variant = "success") {
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement("article");
  toast.className = `app-toast app-toast--${variant}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function showError(selector, message) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("app-hidden");
}

function hideError(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.add("app-hidden");
}

window.fintrackRouter = router;
window.fintrackNavigate = (path, query = {}) => {
  router.navigate(path, query);
};

window.fintrackOpenModal = openAuthModal;
