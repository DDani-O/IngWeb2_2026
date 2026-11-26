/**
 * routes.js - Tabla de rutas de la SPA (fuente de verdad de la navegación).
 *
 * Cada ruta indica:
 * - `path` (las hijas se concatenan al padre; admite parámetros `:id`),
 * - `layout` ("public", "client", "advisor"), heredado por las hijas,
 * - `meta.role` para el guard global (app.js), heredado por las hijas,
 * - `title` (título del documento y footer del layout),
 * - `page`: import diferido que devuelve la clase de la página; la página declara su template,
 * - `activeNav` (opcional): link del menú que se marca activo (para rutas de detalle),
 * - `props` opcionales que se pasan a la página, y `reuseOnQueryChange` si la página
 *   sabe actualizarse con `onRouteUpdate(to)` cuando solo cambia la query.
 */
import { ROLES, ROUTES } from "./utils/constants.js";

const lazy = (loader, exportName) => () => loader().then((module) => module[exportName]);

export const routes = [
  {
    path: ROUTES.HOME,
    layout: "public",
    title: "Domina tus gastos",
    reuseOnQueryChange: true,
    page: lazy(() => import("./pages/public/LandingPage.js"), "LandingPage"),
  },
  {
    path: ROUTES.PLACEHOLDER,
    layout: "public",
    title: "Seccion temporal",
    page: lazy(() => import("./pages/public/PlaceholderPage.js"), "PlaceholderPage"),
  },
  {
    path: "/cliente",
    layout: "client",
    meta: { role: ROLES.CLIENT },
    children: [
      { path: "dashboard", title: "Dashboard del cliente", page: lazy(() => import("./pages/cliente/DashboardPage.js"), "DashboardPage") },
      { path: "cargar-gasto", title: "Carga de gastos", page: lazy(() => import("./pages/cliente/CargarGastoPage.js"), "CargarGastoPage") },
      { path: "historial", title: "Historial de gastos", page: lazy(() => import("./pages/cliente/HistorialPage.js"), "HistorialPage") },
      { path: "gastos/:id", title: "Editar gasto", activeNav: ROUTES.CLIENT_HISTORIAL, page: lazy(() => import("./pages/cliente/EditarGastoPage.js"), "EditarGastoPage") },
      { path: "patrones", title: "Patrones de consumo", page: lazy(() => import("./pages/cliente/PatronesPage.js"), "PatronesPage") },
      { path: "recomendaciones", title: "Recomendaciones financieras", page: lazy(() => import("./pages/cliente/RecomendacionesPage.js"), "RecomendacionesPage") },
      { path: "perfil", title: "Perfil del cliente", page: lazy(() => import("./pages/cliente/PerfilPage.js"), "PerfilPage") },
      { path: "perfiles", title: "Perfiles de gasto", page: lazy(() => import("./pages/cliente/PerfilesPage.js"), "PerfilesPage") },
    ],
  },
  {
    path: "/asesor",
    layout: "advisor",
    meta: { role: ROLES.ADVISOR },
    children: [
      { path: "dashboard", title: "Panel asesor", page: lazy(() => import("./pages/asesor/AsesorDashboardPage.js"), "AsesorDashboardPage") },
      { path: "clientes", title: "Gestion de clientes", page: lazy(() => import("./pages/asesor/AsesorClientesPage.js"), "AsesorClientesPage") },
      { path: "clientes/:id", title: "Analisis del cliente", activeNav: ROUTES.ADVISOR_CLIENTES, page: lazy(() => import("./pages/asesor/AsesorClienteDetallePage.js"), "AsesorClienteDetallePage") },
      { path: "perfil", title: "Perfil del asesor", page: lazy(() => import("./pages/asesor/AsesorPerfilPage.js"), "AsesorPerfilPage") },
    ],
  },
];

/** Se muestra en la misma URL cuando ninguna ruta coincide (sin redirect). */
export const notFoundRoute = {
  path: "*",
  layout: "public",
  title: "Ruta no encontrada",
  page: lazy(() => import("./pages/public/PlaceholderPage.js"), "PlaceholderPage"),
  props: {
    query: {
      title: "Ruta no encontrada",
      description: "La ruta solicitada no existe. Podes volver a la pagina anterior o ir al inicio.",
      icon: "fa-route",
      ctaText: "Ir al Inicio",
      ctaUrl: ROUTES.HOME,
    },
  },
};
