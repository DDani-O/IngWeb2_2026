import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { themeManager } from "./core/ThemeManager.js";
import { mountAdvisorRecommendationModal } from "./components/modals/AdvisorRecommendationModal.js";
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

  const getUserName = () => authManager.getCurrentUser()?.fullName || "Juan Perez";
  const getAdvisorName = () =>
    authManager.getCurrentUser()?.fullName || "Maria Rodriguez";

  const createProtectedRoute = ({
    path,
    templateUrl,
    role,
    shellMount,
    shellOptions,
    pageModulePath,
    pageExportName,
    pageOptions,
    beforePageMount,
  }) => {
    return {
      path,
      templateUrl,
      beforeEnter: requireRole(role),
      onEnter: async (context) => {
        await shellMount(context.mountNode, shellOptions(context));

        if (beforePageMount) {
          await beforePageMount(context);
        }

        const module = await import(pageModulePath);
        const PageClass = module[pageExportName];
        const page = new PageClass(context.mountNode, {
          router,
          authManager,
          showToast,
          ...(pageOptions ? pageOptions(context) : {}),
        });
        page.mount();
        return () => page.destroy();
      },
    };
  };

  const createUserRoute = ({
    path,
    templateUrl,
    pageModulePath,
    pageExportName,
    footerText,
    pageOptions,
    beforePageMount,
  }) => {
    return createProtectedRoute({
      path,
      templateUrl,
      role: "usuario",
      shellMount: mountUserShell,
      shellOptions: () => ({
        userName: getUserName(),
        activeRoute: path,
        footerText,
      }),
      pageModulePath,
      pageExportName,
      beforePageMount,
      pageOptions: (context) => ({
        hasRouteOpenInOtherTab,
        ...(pageOptions ? pageOptions(context) : {}),
      }),
    });
  };

  const createAdvisorRoute = ({
    path,
    templateUrl,
    pageModulePath,
    pageExportName,
    footerText,
    shellOptionsExtra,
    pageOptions,
    beforePageMount,
  }) => {
    return createProtectedRoute({
      path,
      templateUrl,
      role: "asesor",
      shellMount: mountAdvisorShell,
      shellOptions: (context) => ({
        advisorName: getAdvisorName(),
        activeRoute: path,
        footerText,
        ...(shellOptionsExtra ? shellOptionsExtra(context) : {}),
      }),
      pageModulePath,
      pageExportName,
      beforePageMount,
      pageOptions,
    });
  };

  const mountDashboardRecommendationModal = async (context) => {
    await mountAdvisorRecommendationModal(context.mountNode, {
      slotSelector: "#advisorRecommendationModalSlot",
      modalId: "advisorRecommendationModal",
      labelId: "advisorRecommendationModalLabel",
      formId: "advisorRecommendationForm",
      clientSelectId: "advisorRecommendationClient",
      typeSelectId: "advisorRecommendationType",
      descriptionId: "advisorRecommendationDescription",
      savingsId: "advisorRecommendationSavings",
    });
  };

  const mountClientsRecommendationModal = async (context) => {
    await mountAdvisorRecommendationModal(context.mountNode, {
      slotSelector: "#advisorClientRecommendationModalSlot",
      modalId: "advisorClientRecommendationModal",
      labelId: "advisorClientRecommendationModalLabel",
      formId: "advisorClientRecommendationForm",
      clientSelectId: "advisorClientRecommendationClient",
      typeSelectId: "advisorClientRecommendationType",
      descriptionId: "advisorClientRecommendationDescription",
      savingsId: "advisorClientRecommendationSavings",
    });
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
    createUserRoute({
      path: ROUTES.USER_DASHBOARD,
      templateUrl: "./pages/usuario/dashboard.html",
      pageModulePath: "./pages/usuario/DashboardPage.js",
      pageExportName: "DashboardPage",
      footerText: "FinTrack 2026 · Dashboard usuario",
    }),
    createUserRoute({
      path: ROUTES.USER_CARGAR_GASTO,
      templateUrl: "./pages/usuario/cargar-gasto.html",
      pageModulePath: "./pages/usuario/CargarGastoPage.js",
      pageExportName: "CargarGastoPage",
      footerText: "FinTrack 2026 · Carga de gastos",
    }),
    createUserRoute({
      path: ROUTES.USER_HISTORIAL,
      templateUrl: "./pages/usuario/historial.html",
      pageModulePath: "./pages/usuario/HistorialPage.js",
      pageExportName: "HistorialPage",
      footerText: "FinTrack 2026 · Historial de gastos",
    }),
    createUserRoute({
      path: ROUTES.USER_PERFIL,
      templateUrl: "./pages/usuario/perfil.html",
      pageModulePath: "./pages/usuario/PerfilPage.js",
      pageExportName: "PerfilPage",
      footerText: "FinTrack 2026 · Perfil de usuario",
    }),
    createUserRoute({
      path: ROUTES.USER_PATRONES,
      templateUrl: "./pages/usuario/patrones.html",
      pageModulePath: "./pages/usuario/PatronesPage.js",
      pageExportName: "PatronesPage",
      footerText: "FinTrack 2026 · Patrones de consumo",
    }),
    createUserRoute({
      path: ROUTES.USER_PERFILES,
      templateUrl: "./pages/usuario/perfiles.html",
      pageModulePath: "./pages/usuario/PerfilesPage.js",
      pageExportName: "PerfilesPage",
      footerText: "FinTrack 2026 · Perfiles de gasto",
    }),
    createUserRoute({
      path: ROUTES.USER_RECOMENDACIONES,
      templateUrl: "./pages/usuario/recomendaciones.html",
      pageModulePath: "./pages/usuario/RecomendacionesPage.js",
      pageExportName: "RecomendacionesPage",
      footerText: "FinTrack 2026 · Recomendaciones financieras",
    }),
    createAdvisorRoute({
      path: ROUTES.ADVISOR_DASHBOARD,
      templateUrl: "./pages/asesor/dashboard.html",
      pageModulePath: "./pages/asesor/AsesorDashboardPage.js",
      pageExportName: "AsesorDashboardPage",
      footerText: "FinTrack 2026 · Panel asesor",
      beforePageMount: mountDashboardRecommendationModal,
    }),
    createAdvisorRoute({
      path: ROUTES.ADVISOR_CLIENTES,
      templateUrl: "./pages/asesor/clientes.html",
      pageModulePath: "./pages/asesor/AsesorClientesPage.js",
      pageExportName: "AsesorClientesPage",
      footerText: "FinTrack 2026 · Gestion de clientes",
      beforePageMount: mountClientsRecommendationModal,
    }),
    createAdvisorRoute({
      path: ROUTES.ADVISOR_INBOX,
      templateUrl: "./pages/asesor/inbox.html",
      pageModulePath: "./pages/asesor/AsesorInboxPage.js",
      pageExportName: "AsesorInboxPage",
      footerText: "FinTrack 2026 · Bandeja del asesor",
      pageOptions: (context) => ({
        query: context.query,
      }),
    }),
    createAdvisorRoute({
      path: ROUTES.ADVISOR_REPORTES,
      templateUrl: "./pages/asesor/reportes.html",
      pageModulePath: "./pages/asesor/AsesorReportesPage.js",
      pageExportName: "AsesorReportesPage",
      footerText: "FinTrack 2026 · Reportes del asesor",
      shellOptionsExtra: (context) => ({
        activeSection: context.query.section || "comisiones",
      }),
      pageOptions: (context) => ({
        query: context.query,
      }),
    }),
    createAdvisorRoute({
      path: ROUTES.ADVISOR_PERFIL,
      templateUrl: "./pages/asesor/perfil.html",
      pageModulePath: "./pages/asesor/AsesorPerfilPage.js",
      pageExportName: "AsesorPerfilPage",
      footerText: "FinTrack 2026 · Perfil del asesor",
    }),
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
