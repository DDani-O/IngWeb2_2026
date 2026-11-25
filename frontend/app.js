import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { stateManager } from "./core/StateManager.js";
import { tabRegistry } from "./core/TabRegistry.js";
import { themeManager } from "./core/ThemeManager.js";
import { ADVISOR_LAYOUT, AppLayout, CLIENT_LAYOUT } from "./components/layout/AppLayout.js";
import { PublicLayout } from "./components/layout/PublicLayout.js";
import { notFoundRoute, routes } from "./routes.js";
import { EVENTS, ROUTES, UI_TIMING } from "./utils/constants.js";

const toastContainer = document.querySelector("#globalToastContainer");

const router = new Router({
  routes,
  notFound: notFoundRoute,
  outlet: "#route-view",
  layouts: {
    public: () => new PublicLayout(),
    client: () => createAppLayout(CLIENT_LAYOUT),
    advisor: () => createAppLayout(ADVISOR_LAYOUT),
  },
  pageOptions: () => ({ router, authManager, showToast, tabRegistry }),
});

initializeApplication();

function initializeApplication() {
  themeManager.init();
  // La sesión se restaura antes del primer guard: si no, se expulsaría a quien sí tenía sesión.
  authManager.init();

  stateManager.patch({
    theme: themeManager.getTheme(),
  });

  router.beforeEach(requireRoleGuard);
  tabRegistry.start(router);

  // La API respondió 401 con un token enviado: la sesión ya no es válida.
  eventBus.on(EVENTS.AUTH.SESSION_EXPIRED, () => {
    if (!authManager.isAuthenticated()) {
      return;
    }

    authManager.logout();
    showToast("Tu sesion expiro. Volve a iniciar sesion.", "warning");
    router.navigate(ROUTES.HOME, { modal: "login" });
  });

  eventBus.on(EVENTS.PROFILE.UPDATED, ({ user }) => {
    authManager.updateCurrentUser(user);
  });

  router.start();
}

/**
 * Guard global: las rutas con meta.role requieren sesión y ese rol.
 * Sin sesión, se manda al login recordando a dónde quería ir (`next`).
 */
function requireRoleGuard(to) {
  if (!to.meta.role) {
    return true;
  }

  if (!authManager.isAuthenticated()) {
    return { path: ROUTES.HOME, query: { modal: "login", next: to.fullPath } };
  }

  if (!authManager.hasRole(to.meta.role)) {
    return authManager.getDefaultRouteForRole(authManager.getCurrentRole());
  }

  return true;
}

function createAppLayout(config) {
  return new AppLayout(null, {
    config,
    user: authManager.getCurrentUser(),
    onLogout: () => {
      authManager.logout();
      showToast("Sesion finalizada correctamente.", "success");
      router.navigate(ROUTES.HOME, { modal: "login" });
    },
    onReturnHome: (path) => tabRegistry.returnTo(path, (target) => router.navigate(target)),
  });
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
