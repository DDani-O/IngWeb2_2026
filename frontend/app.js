import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { themeManager } from "./core/ThemeManager.js";
import { mountAdvisorRecommendationModal } from "./components/modals/AdvisorRecommendationModal.js";
import { mountAdvisorShell } from "./components/navigation/AdvisorShell.js";
import { mountUserShell } from "./components/navigation/UserShell.js";
import { EVENTS, ROLES, ROUTES, STORAGE_KEYS, UI_TIMING } from "./utils/constants.js";

const toastContainer = document.querySelector("#globalToastContainer");

const router = new Router({ viewSelector: "#route-view" });
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

  const getClientName = () => authManager.getCurrentUser()?.fullName || "";
  const getAdvisorName = () => authManager.getCurrentUser()?.fullName || "";

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

  const createClientRoute = ({ path, templateUrl, pageModulePath, pageExportName, footerText }) => {
    return createProtectedRoute({
      path,
      templateUrl,
      role: ROLES.CLIENT,
      shellMount: mountUserShell,
      shellOptions: () => ({
        userName: getClientName(),
        activeRoute: path,
        footerText,
      }),
      pageModulePath,
      pageExportName,
      pageOptions: () => ({
        hasRouteOpenInOtherTab,
      }),
    });
  };

  const createAdvisorRoute = ({
    path,
    templateUrl,
    pageModulePath,
    pageExportName,
    footerText,
    beforePageMount,
  }) => {
    return createProtectedRoute({
      path,
      templateUrl,
      role: ROLES.ADVISOR,
      shellMount: mountAdvisorShell,
      shellOptions: () => ({
        advisorName: getAdvisorName(),
        activeRoute: path,
        footerText,
      }),
      pageModulePath,
      pageExportName,
      beforePageMount,
    });
  };

  const mountDashboardRecommendationModal = async (context) => {
    await mountAdvisorRecommendationModal(context.mountNode, {
      slotSelector: "#advisorRecommendationModalSlot",
      idPrefix: "advisorRecommendation",
    });
  };

  const mountClientsRecommendationModal = async (context) => {
    await mountAdvisorRecommendationModal(context.mountNode, {
      slotSelector: "#advisorClientRecommendationModalSlot",
      idPrefix: "advisorClientRecommendation",
    });
  };

  const placeholderRoute = (path, fixedQuery = null) => ({
    path,
    templateUrl: "./pages/public/placeholder.html",
    onEnter: async (context) => {
      const module = await import("./pages/public/PlaceholderPage.js");
      const page = new module.PlaceholderPage(context.mountNode, {
        router,
        query: fixedQuery || context.query,
      });
      page.mount();
      return () => page.destroy();
    },
  });

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

        const modal = context.query.modal;
        if (modal === "login" || modal === "register") {
          page.openAuthModal(modal);
        }

        return () => page.destroy();
      },
    },
    createClientRoute({
      path: ROUTES.CLIENT_DASHBOARD,
      templateUrl: "./pages/cliente/dashboard.html",
      pageModulePath: "./pages/cliente/DashboardPage.js",
      pageExportName: "DashboardPage",
      footerText: "FinTrack 2026 · Dashboard del cliente",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_CARGAR_GASTO,
      templateUrl: "./pages/cliente/cargar-gasto.html",
      pageModulePath: "./pages/cliente/CargarGastoPage.js",
      pageExportName: "CargarGastoPage",
      footerText: "FinTrack 2026 · Carga de gastos",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_HISTORIAL,
      templateUrl: "./pages/cliente/historial.html",
      pageModulePath: "./pages/cliente/HistorialPage.js",
      pageExportName: "HistorialPage",
      footerText: "FinTrack 2026 · Historial de gastos",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_PERFIL,
      templateUrl: "./pages/cliente/perfil.html",
      pageModulePath: "./pages/cliente/PerfilPage.js",
      pageExportName: "PerfilPage",
      footerText: "FinTrack 2026 · Perfil del cliente",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_PATRONES,
      templateUrl: "./pages/cliente/patrones.html",
      pageModulePath: "./pages/cliente/PatronesPage.js",
      pageExportName: "PatronesPage",
      footerText: "FinTrack 2026 · Patrones de consumo",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_PERFILES,
      templateUrl: "./pages/cliente/perfiles.html",
      pageModulePath: "./pages/cliente/PerfilesPage.js",
      pageExportName: "PerfilesPage",
      footerText: "FinTrack 2026 · Perfiles de gasto",
    }),
    createClientRoute({
      path: ROUTES.CLIENT_RECOMENDACIONES,
      templateUrl: "./pages/cliente/recomendaciones.html",
      pageModulePath: "./pages/cliente/RecomendacionesPage.js",
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
      path: ROUTES.ADVISOR_PERFIL,
      templateUrl: "./pages/asesor/perfil.html",
      pageModulePath: "./pages/asesor/AsesorPerfilPage.js",
      pageExportName: "AsesorPerfilPage",
      footerText: "FinTrack 2026 · Perfil del asesor",
    }),
    placeholderRoute(ROUTES.PLACEHOLDER),
  ]);

  // La ruta inexistente se muestra en el lugar (sin redirect), así "Volver" no deja atrapado al usuario.
  router.setNotFoundRoute(
    placeholderRoute("*", {
      title: "Ruta no encontrada",
      description: "La ruta solicitada no existe. Podes volver a la pagina anterior o ir al inicio.",
      icon: "fa-route",
      ctaText: "Ir al Inicio",
      ctaUrl: ROUTES.HOME,
    })
  );
}

/**
 * Muestra un aviso breve en el contenedor global de toasts.
 * @param {string} message
 * @param {"success"|"warning"|"danger"} variant
 */
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

function getOrCreateTabId() {
  const existing = sessionStorage.getItem(STORAGE_KEYS.TAB_ID);
  if (existing) {
    return existing;
  }

  const generated = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(STORAGE_KEYS.TAB_ID, generated);
  return generated;
}

function readTabRegistry() {
  const raw = localStorage.getItem(STORAGE_KEYS.TAB_REGISTRY);
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
  localStorage.setItem(STORAGE_KEYS.TAB_REGISTRY, JSON.stringify(registry));
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
