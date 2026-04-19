import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { themeManager } from "./core/ThemeManager.js";
import { mountAdvisorShell } from "./components/navigation/AdvisorShell.js";
import { mountUserShell } from "./components/navigation/UserShell.js";
import { EVENTS, ROUTES, UI_TIMING } from "./utils/constants.js";

const toastContainer = document.querySelector("#globalToastContainer");
const TAB_REGISTRY_STORAGE_KEY = "fintrack.openTabs.v1";
const TAB_ID_STORAGE_KEY = "fintrack.tabId";

const router = new Router({ viewSelector: "#route-view" });
let activeLandingPage = null;
const currentTabId = getOrCreateTabId();

initializeApplication();

function initializeApplication() {
  themeManager.init();
  authManager.init();

  stateManager.patch({
    theme: themeManager.getTheme(),
  });

  configureRouter();
  router.start();

  window.addEventListener("beforeunload", unregisterCurrentTab);

  eventBus.on(EVENTS.ROUTER.NAVIGATE, ({ path, query }) => {
    router.navigate(path, query);
  });

  eventBus.on(EVENTS.ROUTER.CHANGED, ({ path }) => {
    registerCurrentTabRoute(path);
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
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_DASHBOARD,
          footerText: "FinTrack 2026 · Dashboard usuario",
        });

        const module = await import("./pages/usuario/DashboardPage.js");
        const page = new module.DashboardPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.USER_CARGAR_GASTO,
      templateUrl: "./pages/usuario/cargar-gasto.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_CARGAR_GASTO,
          footerText: "FinTrack 2026 · Carga de gastos",
        });

        const module = await import("./pages/usuario/CargarGastoPage.js");
        const page = new module.CargarGastoPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.USER_HISTORIAL,
      templateUrl: "./pages/usuario/historial.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_HISTORIAL,
          footerText: "FinTrack 2026 · Historial de gastos",
        });

        const module = await import("./pages/usuario/HistorialPage.js");
        const page = new module.HistorialPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.USER_PERFIL,
      templateUrl: "./pages/usuario/perfil.html",
      beforeEnter: requireRole("usuario"),
      onEnter: async (context) => {
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_PERFIL,
          footerText: "FinTrack 2026 · Perfil de usuario",
        });

        const module = await import("./pages/usuario/PerfilPage.js");
        const page = new module.PerfilPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
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
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_PATRONES,
          footerText: "FinTrack 2026 · Patrones de consumo",
        });

        const module = await import("./pages/usuario/PatronesPage.js");
        const page = new module.PatronesPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
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
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_PERFILES,
          footerText: "FinTrack 2026 · Perfiles de gasto",
        });

        const module = await import("./pages/usuario/PerfilesPage.js");
        const page = new module.PerfilesPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
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
        await mountUserShell(context.mountNode, {
          userName: authManager.getCurrentUser()?.fullName || "Juan Perez",
          activeRoute: ROUTES.USER_RECOMENDACIONES,
          footerText: "FinTrack 2026 · Recomendaciones financieras",
        });

        const module = await import("./pages/usuario/RecomendacionesPage.js");
        const page = new module.RecomendacionesPage(context.mountNode, {
          router,
          authManager,
          showToast,
          hasRouteOpenInOtherTab,
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
        await mountAdvisorShell(context.mountNode, {
          advisorName: authManager.getCurrentUser()?.fullName || "Maria Rodriguez",
          activeRoute: ROUTES.ADVISOR_DASHBOARD,
          footerText: "FinTrack 2026 · Panel asesor",
        });

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
      path: ROUTES.ADVISOR_CLIENTES,
      templateUrl: "./pages/asesor/clientes.html",
      beforeEnter: requireRole("asesor"),
      onEnter: async (context) => {
        await mountAdvisorShell(context.mountNode, {
          advisorName: authManager.getCurrentUser()?.fullName || "Maria Rodriguez",
          activeRoute: ROUTES.ADVISOR_CLIENTES,
          footerText: "FinTrack 2026 · Gestion de clientes",
        });

        const module = await import("./pages/asesor/AsesorClientesPage.js");
        const page = new module.AsesorClientesPage(context.mountNode, {
          router,
          authManager,
          showToast,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.ADVISOR_INBOX,
      templateUrl: "./pages/asesor/inbox.html",
      beforeEnter: requireRole("asesor"),
      onEnter: async (context) => {
        await mountAdvisorShell(context.mountNode, {
          advisorName: authManager.getCurrentUser()?.fullName || "Maria Rodriguez",
          activeRoute: ROUTES.ADVISOR_INBOX,
          footerText: "FinTrack 2026 · Bandeja del asesor",
        });

        const module = await import("./pages/asesor/AsesorInboxPage.js");
        const page = new module.AsesorInboxPage(context.mountNode, {
          router,
          authManager,
          showToast,
          query: context.query,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.ADVISOR_REPORTES,
      templateUrl: "./pages/asesor/reportes.html",
      beforeEnter: requireRole("asesor"),
      onEnter: async (context) => {
        await mountAdvisorShell(context.mountNode, {
          advisorName: authManager.getCurrentUser()?.fullName || "Maria Rodriguez",
          activeRoute: ROUTES.ADVISOR_REPORTES,
          activeSection: context.query.section || "comisiones",
          footerText: "FinTrack 2026 · Reportes del asesor",
        });

        const module = await import("./pages/asesor/AsesorReportesPage.js");
        const page = new module.AsesorReportesPage(context.mountNode, {
          router,
          authManager,
          showToast,
          query: context.query,
        });
        page.mount();
        return () => page.destroy();
      },
    },
    {
      path: ROUTES.ADVISOR_PERFIL,
      templateUrl: "./pages/asesor/perfil.html",
      beforeEnter: requireRole("asesor"),
      onEnter: async (context) => {
        await mountAdvisorShell(context.mountNode, {
          advisorName: authManager.getCurrentUser()?.fullName || "Maria Rodriguez",
          activeRoute: ROUTES.ADVISOR_PERFIL,
          footerText: "FinTrack 2026 · Perfil del asesor",
        });

        const module = await import("./pages/asesor/AsesorPerfilPage.js");
        const page = new module.AsesorPerfilPage(context.mountNode, {
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

function getOrCreateTabId() {
  const existing = sessionStorage.getItem(TAB_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(TAB_ID_STORAGE_KEY, generated);
  return generated;
}

function readTabRegistry() {
  const raw = localStorage.getItem(TAB_REGISTRY_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writeTabRegistry(registry) {
  localStorage.setItem(TAB_REGISTRY_STORAGE_KEY, JSON.stringify(registry));
}

function registerCurrentTabRoute(path = "/") {
  const registry = readTabRegistry();
  registry[currentTabId] = {
    path,
    updatedAt: Date.now(),
  };
  writeTabRegistry(registry);
}

function unregisterCurrentTab() {
  const registry = readTabRegistry();
  delete registry[currentTabId];
  writeTabRegistry(registry);
}

function hasRouteOpenInOtherTab(routePath) {
  const registry = readTabRegistry();
  return Object.entries(registry).some(([tabId, tabData]) => {
    if (tabId === currentTabId) {
      return false;
    }

    return tabData?.path === routePath;
  });
}
