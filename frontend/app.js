import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { themeManager } from "./core/ThemeManager.js";
import { EVENTS, ROUTES, UI_TIMING } from "./utils/constants.js";

const toastContainer = document.querySelector("#globalToastContainer");

const router = new Router({ viewSelector: "#route-view" });
let activeLandingPage = null;

initializeApplication();

function initializeApplication() {
  themeManager.init();
  authManager.init();

  stateManager.patch({
    theme: themeManager.getTheme(),
  });

  configureRouter();
  router.start();

  eventBus.on(EVENTS.ROUTER.NAVIGATE, ({ path, query }) => {
    router.navigate(path, query);
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
      templateUrl: "./pages/public/landing.html",
      onEnter: async (context) => {
        const module = await import("./pages/public/LandingPage.js");
        const page = new module.LandingPage(context.mountNode, {
          router,
          authManager,
          showToast,
        });

        page.mount();
        activeLandingPage = page;

        const modal = context.query.modal;
        if (modal === "login" || modal === "register") {
          page.openAuthModal(modal);
        }

        return () => {
          if (activeLandingPage === page) {
            activeLandingPage = null;
          }

          page.destroy();
        };
      },
    },
    {
      path: ROUTES.USER_DASHBOARD,
      templateUrl: "./pages/usuario/dashboard.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
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
      path: ROUTES.USER_PATRONES,
      templateUrl: "./pages/usuario/patrones.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        const module = await import("./pages/usuario/PatronesPage.js");
        const page = new module.PatronesPage(context.mountNode, {
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
  }, UI_TIMING.TOAST_DISMISS_MS);
}

window.fintrackRouter = router;
window.fintrackNavigate = (path, query = {}) => {
  router.navigate(path, query);
};

window.fintrackOpenModal = (mode = "login") => {
  const normalizedMode = mode === "register" ? "register" : "login";

  if (activeLandingPage) {
    activeLandingPage.openAuthModal(normalizedMode);
    return;
  }

  router.navigate(ROUTES.HOME, { modal: normalizedMode });
};
