import { apiClient } from "./core/APIClient.js";
import { authManager } from "./core/AuthManager.js";
import { eventBus } from "./core/EventBus.js";
import { Router } from "./core/Router.js";
import { tabRegistry } from "./core/TabRegistry.js";
import { themeManager } from "./core/ThemeManager.js";
import { ADVISOR_LAYOUT, AppLayout, CLIENT_LAYOUT } from "./components/layout/AppLayout.js";
import { PublicLayout } from "./components/layout/PublicLayout.js";
import { createToaster } from "./components/feedback/toast.js";
import { notFoundRoute, routes } from "./routes.js";
import { EVENTS, ROUTES } from "./utils/constants.js";

const showToast = createToaster(document.querySelector("#globalToastContainer"));

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

  watchServerWakeUp();

  router.start();
}

/**
 * Con el driver http, despierta el backend apenas abre la app (mientras se completa el login)
 * y avisa si tarda: el plan gratuito de Render duerme el servidor tras 15 minutos sin uso.
 */
function watchServerWakeUp() {
  let closeNotice = null;
  eventBus.on(EVENTS.API.WAKING, () => {
    closeNotice = showToast("Despertando el servidor... La primera carga puede tardar hasta un minuto.", "warning", { persistent: true });
  });
  eventBus.on(EVENTS.API.AWAKE, ({ noticed }) => {
    closeNotice?.();
    closeNotice = null;
    if (noticed) {
      showToast("Servidor listo.", "success");
    }
  });
  apiClient.wakeUp();
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
