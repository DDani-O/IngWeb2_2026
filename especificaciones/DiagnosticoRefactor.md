# Diagnóstico y propuesta de refactor — FinTrack 2026

> Pasada **solo de análisis** (25/11/2026). No se modificó código, estilos ni documentación existente.
> Alcance leído completo: consigna (PDF), `CLAUDE.md` (raíz, `frontend/`, `backend/`), `PrincipiosDesarrollo.md`, `ReglasCSS.md`, `EspecificacionDesarrolloFront.md`, specs `paginasFront/01..06`, `TeoriaComponentes.md`, **todo** `frontend/` (core, pages, components, utils, assets/css: 19 hojas, 12 páginas, 6 fragmentos HTML) y `backend/src/database/` (migración 0001).
>
> **Método.** Además de leer el código, las afirmaciones sobre responsive y router se **midieron**: un arnés (fuera del repo, ver Anexo A) cargó cada una de las 14 rutas en Firefox headless a 360, 768, 1024 y 1440 px (56 mediciones) y ejecutó pruebas de comportamiento (guards, 404 + “Volver”, remontaje del layout, navegación rápida, fugas de gráficos). Los conteos de CSS y de código muerto salen de scripts, no de muestras.
>
> Las referencias `archivo:línea` son relativas a `frontend/` salvo que se indique otra ruta.

---

## 1. Resumen ejecutivo

### Veredictos

| # | Hipótesis | Veredicto | En una línea |
|---|---|---|---|
| H1 | Routing rebuscado | **PARCIALMENTE CONFIRMADA** | `core/Router.js` es chico y correcto; la complejidad accidental está en `app.js` (fábricas de rutas con 9–10 parámetros y callbacks, registro de pestañas en `localStorage`, globales sin uso) y en que el layout **se vuelve a montar en cada navegación** (medido). |
| H2 | Componentes no reutilizables | **CONFIRMADA** | No existe ni un átomo ni una molécula en JS: los patrones de UI viven como clases CSS (eso sí está bien), pero el marcado y la lógica se copian como template strings en cada página (KPI ×4 renderizadores, 3 versiones distintas de `_formatStatValue`, 4 barras de filtros, 7 gráficos, 8 modales escritos a mano). Las únicas piezas reutilizadas (shells y modal de recomendación) dependen del contexto. |
| H3 | CSS con números mágicos que rompen el responsive | **PARCIALMENTE CONFIRMADA** (la parte “rompe el responsive” queda **mayormente refutada**) | Hay 656 valores px/rem fijos, pero solo 24 (3,7 %) son dimensiones/offsets de layout, y **ninguna ruta desborda horizontalmente** en 360/768/1024/1440. Los defectos responsive reales que medí vienen de otras causas: el navbar de la landing sin colapso, un overlay fijo que tapa el 25 % del viewport en mobile, gráficos cuadrados que ignoran los tokens de altura, y colores fijos que rompen el tema claro. El problema real del CSS es otro: no hay escala de espaciado ni de tipografía (63 `font-size` distintos) y la organización “un CSS por página” es solo nominal. |

### Los 5 problemas más importantes

1. **No hay capa de datos.** 12 de 14 páginas importan `MOCK_*` directo de `utils/constants.js`; `APIClient` **no lo importa nadie**. Cada página clona su mock, así que lo que se carga en “Cargar gasto” no aparece en “Historial”, y lo que se borra vuelve al navegar. Pasar a NestJS hoy implica tocar las 12 páginas (§3, O-02/O-03). Es lo que más bloquea la integración.
2. **XSS sistemático.** Hay 65 asignaciones `innerHTML` con datos interpolados y **cero** escapado (`sanitizeText` existe pero no se usa). Hoy ya entra input del usuario (nombre del registro → shell; comercio → lista de gastos). Con backend, el asesor va a renderizar datos de clientes: XSS almacenado entre usuarios (O-01).
3. **Faltan requisitos de la consigna.** No hay edición de gastos (no hay UI para `PUT /expenses/:id`, que es un endpoint mínimo), el asesor no puede ver gastos ni patrones **por cliente** (§4.5 de la consigna), la clasificación de perfil la hace el propio usuario (la consigna se la asigna al asesor) y el OCR es una muestra fija (O-08).
4. **Componentes inexistentes y duplicación masiva** (H2): el mismo KPI se arma de 4 formas con 3 reglas de formato contradictorias. Una de ellas decide si un valor es moneda **porque la etiqueta contiene “gasto”** (`pages/asesor/AsesorDashboardPage.js:332`).
5. **El layout se remonta en cada navegación y el router no distingue un cambio de query** (H1). Esto genera bugs medidos: en Reportes, cambiar de pestaña destruye y recrea la página y descarta el estado (las tareas marcadas vuelven al mock); el 404 deja al usuario **atrapado** si toca “Volver”; y hace falta `_cleanupOverlayArtifacts` para limpiar backdrops huérfanos.

Además, hay **funcionalidades de UI sin respaldo en la BD** (inbox/chat, comisiones, tareas, estados de recomendación, método de pago) que hay que recortar o modelar antes de escribir el backend (O-09). Las decisiones del equipo sobre estos puntos están en §6 y el plan actualizado, en §7.

---

## 2. Hipótesis 1 — Routing rebuscado

### 2.1 Veredicto: PARCIALMENTE CONFIRMADA

`core/Router.js` (252 líneas) **no** es rebuscado: busca en un `Map` por path exacto, ejecuta un guard, limpia la ruta anterior, carga el template (con caché), llama a `onEnter` y emite un evento. La complejidad que percibían existe, pero está en otro lado: en **cómo se configura** el router (`app.js`) y en **la estrategia de layout** (shells que se vuelven a montar con cada ruta).

### 2.2 Flujo real: del cambio de hash a la página visible

1. Cambia `location.hash` (link `href="#/…"`, `router.navigate()` o redirect de un guard) → `hashchange` → `Router._handleHashChange()`.
2. `parseHash()` separa path y query (`/usuario/dashboard`, `{…}`).
3. `_activate()` (`core/Router.js:109`): `this.routes.get(path)` por **coincidencia exacta**; si no hay, usa `notFoundRoute`.
4. `_canEnter()` (`core/Router.js:189`) ejecuta `beforeEnter` = `requireRole(role)` (`app.js:44`). Si no hay sesión → `navigate('/', {modal:'login'})`; si el rol no corresponde → dashboard del rol. Un redirect vuelve al paso 1.
5. `_cleanupCurrent()` → `page.destroy()` de la ruta anterior (saca listeners y gráficos).
6. `_cleanupOverlayArtifacts()` (`core/Router.js:155`): borra `.modal-backdrop`/`.offcanvas-backdrop` y estilos inline que Bootstrap deja en `body`/`html`.
7. Carga del template de la página por `fetch` con caché propia (`core/Router.js:233`) → `viewElement.innerHTML = template` (`:137`). Ese template trae **los slots vacíos del layout** (`#userTopbarSlot`, `#userSidebarSlot`, `#appFooterSlot`), repetidos en los 12 templates internos.
8. `onEnter` armado por la fábrica `createProtectedRoute` (`app.js:62`):
   1. `mountUserShell`/`mountAdvisorShell` → 3 `fetch` en paralelo **con otra caché distinta** (`components/core/templateLoader.js:1`) → `renderTemplate` (sin escapar) → `innerHTML` en cada slot.
   2. `beforePageMount` opcional: monta el modal de recomendación con 8 IDs fijos (`app.js:155` y `:168`).
   3. `import()` dinámico del módulo de la página → `new PageClass(mountNode, {router, authManager, showToast, hasRouteOpenInOtherTab, …pageOptions})` → `page.mount()` (`render()` + `attachEvents()`). Casi todas las páginas **vuelven a escribir** el nombre en topbar y sidebar que el shell acaba de pintar (12 páginas, 20 llamadas).
   4. Devuelve `() => page.destroy()` como cleanup.
9. `eventBus.emit(ROUTER.CHANGED)` → `app.js` escribe la ruta de la pestaña actual en `localStorage` (`fintrack.openTabs.v1`).

Son 9 pasos, 2 cachés de templates y 4–5 `fetch`/`innerHTML` por navegación. Para pasar de “Historial” a “Perfil”, que comparten el layout, se destruye y se recrea todo el layout.

### 2.3 Comparación con el modelo de `TeoriaComponentes.md` §9

| Criterio del modelo | Proyecto | Evaluación |
|---|---|---|
| Tabla de rutas **declarativa** | `router.registerMany([...])` existe, pero cada entrada se arma con fábricas de 3 niveles (`createProtectedRoute` → `createUserRoute`/`createAdvisorRoute`) que reciben callbacks (`shellOptions`, `pageOptions`, `beforePageMount`, `shellOptionsExtra`) y un `onEnter` imperativo. La landing y el placeholder tienen su propio `onEnter` escrito a mano. | Parcial: la tabla es una lista, pero de **comportamiento**, no de datos. |
| Layout que se monta **una vez** | Se vuelve a montar en cada navegación. Medido: un marcador puesto en `.app-navbar` desaparece al pasar de `/usuario/historial` a `/usuario/perfil`. | ✘ |
| Guards centralizados | `requireRole` está en un único lugar (`app.js:44`) y se aplica por fábrica. Medido: sin sesión → `#/?modal=login` con el modal abierto; asesor en ruta de usuario → `#/asesor/dashboard`. | ✔ (no guarda la ruta de destino para volver después del login) |
| Ruta 404 | Existe, pero se implementa como **redirect con push** a `/utils/placeholder?...` (`app.js:320-332`). Medido: con “Volver Atrás” (`history.back()`, `pages/public/PlaceholderPage.js:36`) se vuelve a la URL inválida → nuevo redirect; después de 2 clics el usuario sigue en el placeholder. | ✘ (trampa del botón Atrás) |
| Orden de restauración de sesión | `authManager.init()` (`app.js:23`) corre antes que `router.start()` (`app.js:30`). | ✔ |
| Rutas dinámicas (`/x/:id`) | No hay. Las rutas se buscan por igualdad exacta y el detalle de cliente se resuelve con modal o query. Va a hacer falta para “análisis por cliente” (`/asesor/clientes/:id`). | ✘ |
| Navegación declarativa y programática | Ambas. Hay 21 `href="#/…"` escritos a mano en HTML/JS en lugar de `ROUTES`. | ✔ con matiz |

### 2.4 Complejidad que se justifica vs. complejidad accidental

**Se justifica (resuelve un problema real):**
- Router por hash con `Map`, guard que normaliza el resultado (`true`/string/objeto) y función de cleanup por ruta. Medido: después de 8 navegaciones ida y vuelta quedan 2 instancias de Chart.js (las de la página actual) y 0 backdrops, o sea, **no hay fugas**.
- `import()` diferido de cada página (lazy loading, pedido en la spec §12.4).
- Restauración de sesión antes del primer guard.
- Navegación rápida: medí 3 cambios de hash seguidos (5 ms entre uno y otro), con la caché caliente y con la caché fría, y en ambos casos el DOM final correspondía a la última ruta. No reproduje condiciones de carrera, aunque `_activate` no tiene token de navegación (es un riesgo teórico, no un bug observado).

**Accidental (indirección, mezcla de responsabilidades o código sin uso):**

| Elemento | Evidencia | Por qué es accidental |
|---|---|---|
| Fábricas de rutas con callbacks | `app.js:62-153` | Mezclan 4 responsabilidades por ruta: guard, layout, modal y opciones de página. El `footerText` por ruta es un dato del layout, no de la ruta. |
| Montaje del modal en el router | `app.js:155-179` | El router conoce 8 IDs del DOM de dos páginas. Eso es responsabilidad de la página o del componente modal. |
| Registro de pestañas abiertas | `app.js:12-13, 32, 38-40, 367-420`, `core/PageController.js:82-109`, `components/navigation/UserShell.js:22` | ~70 líneas que existen solo porque algunos links abren con `target="_blank"` (5 lugares). Sirven para que “Volver al Dashboard” intente `window.close()`. Problemas: `window.opener` siempre es `null` con `_blank` moderno (noopener por defecto), así que esa rama es inútil; `window.close()` falla si la pestaña ya tiene historial y se compensa con un `setTimeout` de 120 ms literal (`PageController.js:96`, viola la regla de `UI_TIMING`); si una pestaña se cierra sin `beforeunload`, el registro queda con entradas viejas; y duplicar una pestaña copia el `tabId` de `sessionStorage`. Es una decisión de UX que se metió en el ruteo. |
| Globales sin uso | `app.js:351-365` (`window.fintrackRouter`, `fintrackNavigate`, `fintrackOpenModal`) | Nadie los llama. `activeLandingPage` (`app.js:16, 194, 202`) existe solo para `fintrackOpenModal`. |
| `EventBus` de navegación | `app.js:34` escucha `ROUTER.NAVIGATE`, pero nadie lo emite | Es código muerto. |
| Dos cachés y dos `fetch` de templates | `core/Router.js:12,233-251` y `components/core/templateLoader.js:1-31` | Hacen lo mismo con implementaciones distintas. Encima piden `Cache-Control: no-cache` y después cachean en memoria (es contradictorio). |
| Re-montaje del shell | paso 8.1 | Obliga a limpiar backdrops (paso 6): si el layout fuera persistente, alcanzaría con cerrar el offcanvas. |
| Cambio de query = remontar la página | `pages/asesor/AsesorReportesPage.js:172` (`navigate(..., {replace:true})`) | Medido: al hacer clic en la pestaña “Tareas” se destruyen la página y el topbar. El sidebar se actualiza “de casualidad” porque se recrea. Efecto colateral: el estado de tareas, que vive en la instancia, vuelve al mock. |
| 404 como redirect | `app.js:320` | Debería mostrar la vista de “no encontrada” en la misma URL (o usar `replace`). |

### 2.5 Propuesta

**Objetivo:** tabla de rutas con **datos** (no callbacks), layouts persistentes por rol, guard global por metadatos, 404 en el lugar y soporte de `:param`. No implica cambiar la tecnología (sigue siendo hash routing vanilla).

**Tabla de rutas (`frontend/routes.js`):**

```js
import { ROUTES } from "./utils/constants.js";

export const routes = [
  { path: ROUTES.HOME, layout: "public", template: "pages/public/landing.html",
    page: () => import("./pages/public/LandingPage.js") },

  { path: "/usuario", layout: "user", meta: { role: "usuario" }, children: [
    { path: "dashboard",       title: "Dashboard",            page: () => import("./pages/usuario/DashboardPage.js") },
    { path: "cargar-gasto",    title: "Carga de gastos",      page: () => import("./pages/usuario/CargarGastoPage.js") },
    { path: "historial",       title: "Historial de gastos",  page: () => import("./pages/usuario/HistorialPage.js") },
    { path: "gastos/:id",      title: "Editar gasto",         page: () => import("./pages/usuario/EditarGastoPage.js") }, // nuevo (consigna: PUT)
    { path: "patrones",        title: "Patrones de consumo",  page: () => import("./pages/usuario/PatronesPage.js") },
    { path: "recomendaciones", title: "Recomendaciones",      page: () => import("./pages/usuario/RecomendacionesPage.js") },
    { path: "perfil",          title: "Perfil de cuenta",     page: () => import("./pages/usuario/PerfilPage.js") },
    { path: "perfiles",        title: "Perfiles de gasto",    page: () => import("./pages/usuario/PerfilesPage.js") },
  ]},

  { path: "/asesor", layout: "advisor", meta: { role: "asesor" }, children: [
    { path: "dashboard",    title: "Panel asesor",       page: () => import("./pages/asesor/AsesorDashboardPage.js") },
    { path: "clientes",     title: "Clientes",           page: () => import("./pages/asesor/AsesorClientesPage.js") },
    { path: "clientes/:id", title: "Análisis de cliente", page: () => import("./pages/asesor/AsesorClienteDetallePage.js") }, // nuevo (consigna 4.5)
    { path: "inbox",        title: "Bandeja",            page: () => import("./pages/asesor/AsesorInboxPage.js") },
    { path: "reportes",     title: "Reportes",           page: () => import("./pages/asesor/AsesorReportesPage.js"), reuseOnQueryChange: true },
    { path: "perfil",       title: "Perfil del asesor",  page: () => import("./pages/asesor/AsesorPerfilPage.js") },
  ]},

  { path: "*", layout: "public", page: () => import("./pages/public/NotFoundPage.js") },
];
```

Cada página declara su template (`static template = "pages/usuario/historial.html"`) o lo infiere por convención. Así la tabla no repite rutas de archivos.

**API del router:**

```js
const router = new Router({ routes, outlet: "#route-view", layouts: { public: PublicLayout, user: AppLayout, advisor: AppLayout } });

router.beforeEach((to, from) => {           // guard único, por metadatos
  if (!to.meta.role) return true;
  if (!authManager.isAuthenticated()) return { path: ROUTES.HOME, query: { modal: "login", next: to.fullPath } };
  if (!authManager.hasRole(to.meta.role)) return authManager.getDefaultRouteForRole(authManager.getCurrentRole());
  return true;
});

router.start();                              // después de authManager.init()
router.navigate(path, { query, replace });   // programática
router.current;                              // { path, params, query, route, meta }
router.onChange((to) => {...});              // reemplaza el uso de EVENTS.ROUTER.CHANGED
```

**Ciclo de activación propuesto:** `match` (con `:params`) → `beforeEach` → si el layout cambió: `oldLayout.destroy()` + `newLayout.mount()` (una sola vez por rol) → `layout.setActive(to)` (link activo, título, footer) → si es la misma ruta y `reuseOnQueryChange`: `page.onRouteUpdate(to)`; si no: `page.destroy()` → cargar template en `layout.outlet` → `new Page(outlet, { params, query, services })` → `mount()`. Las páginas reciben **servicios**, no `router` ni `authManager` crudos.

**Qué se elimina:** fábricas `create*Route`, `beforePageMount`, globales `window.fintrack*`, `activeLandingPage`, listener de `ROUTER.NAVIGATE`, una de las dos cachés de templates, `_cleanupOverlayArtifacts` (queda reducido a cerrar el offcanvas del layout), los slots en los 12 templates y los `_setText('#userTopbarName')` de las páginas. El registro de pestañas se **elimina** si deciden no abrir pestañas nuevas (recomendado, §6); si deciden mantenerlo, se aísla en `core/TabRegistry.js` sin tocar el router.

**Archivos afectados:** `app.js` (queda en ~40 líneas), `core/Router.js`, nuevo `routes.js`, `components/navigation/UserShell.js` + `AdvisorShell.js` → `components/layout/AppLayout.js`, `core/PageController.js` (sale `_handleBackToRoute`), los 12 templates internos (se quitan los slots), `pages/public/PlaceholderPage.js` (se divide en `NotFoundPage`), `pages/asesor/AsesorReportesPage.js` (`onRouteUpdate`). Actualizar spec §11.5 (tabla de rutas) y §4 (estructura).

---

## 3. Hipótesis 2 — Componentes no reutilizables

### 3.1 Veredicto: CONFIRMADA

Con un matiz importante a favor del proyecto: **el sistema visual sí es reutilizable a nivel CSS**. Clases como `.kpi-card`, `.badge-soft`, `.action-btn`, `.chart-card`, `.table-shell`, `.section-block` y `.app-modal-surface` se usan en varias páginas, y solo 4 clases CSS no tienen uso. Lo que no existe es el componente en JS: cada página vuelve a escribir el marcado, el mapeo de datos y el comportamiento.

### 3.2 Inventario completo

**Piezas de `components/` y `core/`**

| Pieza | Tipo real | Responsabilidad | Usuarios | Nivel Atomic |
|---|---|---|---|---|
| `core/Component.js` | Clase base | Ciclo de vida, `listen()` con limpieza automática, `on/emit` al bus global, `registerChild` | 14/14 páginas (12 vía `PageController`, 2 directo) | — (infraestructura) |
| `core/PageController.js` | Clase base de página | Helpers de DOM (`_setText`, `_getValue`), logout, “volver al dashboard” + registro de pestañas, modales Bootstrap | 12 páginas | — (mezcla helpers de vista con navegación) |
| `components/core/templateLoader.js` | Funciones | `fetch` + caché de fragmentos, `renderTemplate` con `{{clave}}` **sin escapar** | 3 módulos | — |
| `components/navigation/UserShell.js` | Función `mountUserShell` | Topbar + sidebar + footer de usuario | 7 páginas | Template (layout), pero sin ciclo de vida |
| `components/navigation/AdvisorShell.js` | Función `mountAdvisorShell` | Lo mismo para asesor | 5 páginas | Template; **duplica** a `UserShell` (de 256 líneas entre los dos, 90 difieren y son casi todas cambios de nombre) |
| `components/modals/AdvisorRecommendationModal.js` | Función | Inyecta HTML del modal con 8 IDs configurables | 2 páginas (dashboard y clientes asesor) | Organismo **sin comportamiento**: no valida, no emite, no sabe abrirse |

**Fragmentos HTML**

| Fragmento | Usado por | Nivel |
|---|---|---|
| `components/layout/user-topbar.html` | UserShell (7 páginas) | Organismo (Navbar) |
| `components/layout/advisor-topbar.html` | AdvisorShell (5) | Organismo; idéntico al anterior salvo IDs |
| `components/navigation/user-sidebar.html` | UserShell (7) | Organismo (Sidebar) |
| `components/navigation/advisor-sidebar.html` | AdvisorShell (5) | Organismo; idéntico salvo textos/IDs |
| `components/layout/app-footer-mini.html` | ambos shells (12) | Átomo (una línea) |
| `components/modals/advisor-recommendation-modal.html` | 2 páginas | Organismo (formulario + modal pegados) |

**Páginas** (todas son nivel *Page* y además hacen de organismo, molécula y servicio a la vez)

| Página | JS / HTML (líneas) | Qué hace además de componer | Patrones que reimplementa |
|---|---|---|---|
| `usuario/DashboardPage` | 433 / 121 | Lee mock, formatea, crea 2 gráficos (+1 muerto), chat simulado | KPI, alerta, calendario, tarjetas resumen, lista de comercios, chart ×3, modal chat |
| `usuario/CargarGastoPage` | 261 / 128 | Form, borrador en `localStorage`, OCR simulado | lista de gastos con badge, key-value OCR, dropzone |
| `usuario/HistorialPage` | 196 / 96 | Filtros, orden, tabla, borrado local | barra de filtros, tabla, badge, empty state, modal detalle |
| `usuario/PatronesPage` | 353 / 77 | 4 gráficos, insights, inusuales | KPI, chart ×4, alerta (2 variantes), lista con color |
| `usuario/PerfilesPage` | 157 / 58 | Tarjetas de perfil, comparativa, selección | tabla, badge |
| `usuario/RecomendacionesPage` | 253 / 129 | Filtros, 3 grupos, acciones, 2 modales | barra de filtros, tarjeta, badge ×2, empty ×3, modal ×2 |
| `usuario/PerfilPage` | 187 / 123 | Form de perfil, persistencia, **tema** | form, key-value |
| `asesor/AsesorDashboardPage` | 338 / 94 | KPI, clientes (cards/tabla), inbox, recomendaciones | KPI, alerta, calendario, tarjeta cliente, tabla cliente, toggle de vista, item inbox, form recomendación |
| `asesor/AsesorClientesPage` | 282 / 99 | Filtros, cards/tabla, modal detalle, recomendación | **los mismos** cliente/tabla/toggle/form de recomendación + filtros |
| `asesor/AsesorInboxPage` | 189 / 68 | Lista + detalle + respuesta | item de lista (otra variante), empty |
| `asesor/AsesorReportesPage` | 241 / 83 | KPI, comisiones, tareas, descargas, pestañas | KPI (4ª variante), tabla, badge ×3, items |
| `asesor/AsesorPerfilPage` | 178 / 110 | Form de perfil profesional | **mismo flujo** que `PerfilPage` |
| `public/LandingPage` | 449 / 251 | Contenido, carrusel, login/registro | cards, modales auth |
| `public/PlaceholderPage` | 98 / 37 | Página genérica por query | — (es el **único** componente realmente parametrizable y agnóstico) |

### 3.3 Patrones repetidos que deberían ser un solo componente

| Patrón | Dónde aparece | Variantes | Evidencia |
|---|---|---|---|
| **KPI / StatCard** | `DashboardPage.js:110`, `PatronesPage.js:55`, `AsesorDashboardPage.js:92`, `AsesorReportesPage.js:53` | 4 renderizadores, 3 `_formatStatValue` **incompatibles** | Por defecto, Dashboard → moneda (`DashboardPage.js:413-427`); Patrones → `String` (`PatronesPage.js:308`); Asesor → moneda si la etiqueta incluye “gasto” (`AsesorDashboardPage.js:332`). La tendencia sale de `formatTrendLabel` o de `_buildTrendLabel` (`PatronesPage.js:328`), con reglas distintas para valor 0. |
| **Alerta / Insight** | `DashboardPage.js:89`, `AsesorDashboardPage.js:71` (idénticos), `PatronesPage.js` insights e inusuales | 3 marcados, 3 bloques CSS (`alert-card`, `patterns-insight`, `patterns-unusual-alert`) | — |
| **Calendario** | `dashboard.html` usuario y asesor + `_renderCalendar` ×2 | 2 copias idénticas | Además muestra una **fecha fija del mock** (“14 Abril 2026”), no la fecha real. |
| **Badge de estado** | 24 usos de `badge-soft` en 6 páginas con ternarios inline; `risk-pill` ×4; `profile-tag`, `inbox-badge`, `profile-active-badge`, `recommendation-savings` | 6 clases CSS para lo mismo; el mapeo estado→tono se repite en cada página (`_statusColor` en Recomendaciones, ternarios en Historial, Cargar gasto y Reportes) | — |
| **Avatar con iniciales** | `avatar-badge` ×6, `sidebar-user-card__avatar`, `user-profile-avatar` | 3 tamaños con 3 clases | — |
| **Tarjeta de cliente + fila de tabla** | `AsesorDashboardPage.js:116`, `AsesorClientesPage.js:95` | 2 + 2 copias con diferencias menores (mayúsculas en etiquetas, botón vs link) | — |
| **Toggle cards/tabla** | `AsesorDashboardPage._syncClientsView`, `AsesorClientesPage._syncView` | 2 idénticas | — |
| **Formulario de recomendación** | `_renderRecommendationClientOptions` + `_handleCreateRecommendation` en ambas páginas de asesor | 2 idénticas, +8 IDs en `app.js` | — |
| **Barra de filtros + `_applyFilters`** | Historial, Clientes, Recomendaciones, Inbox | 4 implementaciones y 4 CSS (`history-toolbar`, `advisor-clients-toolbar`, `recommendation-toolbar`, `advisor-inbox-toolbar`) | La búsqueda no tiene `debounce` (existe en `helpers.js` sin uso). |
| **Tabla** | Historial, Perfiles, Clientes ×2, Comisiones | 5 tablas, cada una con su `map` a `<tr>` | — |
| **Gráfico** | 7 `new window.Chart` en 2 páginas | Opciones de ejes copiadas 10 veces, 9 colores hardcodeados en JS | El tercer gráfico del dashboard (`DashboardPage.js:270, 337-373`) no tiene `<canvas>`: es código muerto. |
| **Lista clave-valor** | `summary-card__row`, `ocr-result__row`, `profile-meta-item`, `history-detail-card p`, `advisor-inbox-detail__meta`, `advisor-client-metrics` | 6 variantes | — |
| **Ítem de lista con avatar** | `inbox-item` (dashboard asesor), `advisor-inbox-item-page` (inbox), `recent-expense-item`, `merchant-item`, `advisor-task-item`, `advisor-download-item` | 6 | El de la página Inbox no es accesible por teclado; el del dashboard sí. |
| **Estados vacío / carga / error** | Vacío: `history-empty` (Historial e Inbox), `<p class="text-muted">` ×3 en Recomendaciones; carga y error: **no existen** | — | Hoy todo es síncrono. Con backend hacen falta en todas las páginas. |
| **Modal** | 8 `modal fade` escritos a mano (chat, detalle gasto, detalle y contacto de recomendación, detalle de cliente, login, registro) + 2 desde el fragmento | 10 instancias de la misma estructura Bootstrap | — |
| **Editor de perfil** | `PerfilPage` y `AsesorPerfilPage` | ~80 % igual (`_buildBaseProfile`, `_loadPersistedProfile`, `_handleSave`, `_handleReset`, meta-list) | — |
| **Encabezado de sección** | 27 `section-title` con ícono | — | Bien resuelto en CSS; como molécula ahorraría marcado. |

### 3.4 Evaluación contra el “Diagnóstico arquitectónico” y las reglas de comunicación

| Pieza | Pequeño y predecible | Solo presentación | Reutilizable | Agnóstico | Props claras | Desacoplado | Comunicación |
|---|---|---|---|---|---|---|---|
| `UserShell`/`AdvisorShell` | ✔ | ✔ | Parcial (dos copias) | ✘ (rutas y textos fijos de cada rol dentro del componente) | ✔ (`userName`, `activeRoute`, `footerText`) | ✘ (las páginas reescriben su DOM por ID) | Solo props; el logout lo cablea **cada página** por ID (`PageController._bindLogoutButtons`) en vez de que el shell emita `logout`. |
| `AdvisorRecommendationModal` | ✔ | ✔ | ✘ (necesita 8 IDs distintos para que dos instancias no choquen) | ✘ (nombre y opciones con el contexto: “advisor”, “client”; tipos fijos en el HTML) | ✘ (8 IDs no son props de dominio) | ✘ (la página busca `#advisorClientRecommendationForm` para escuchar el submit, `AsesorClientesPage.js:37`) | No emite nada; el padre lee el DOM interno. |
| `PlaceholderPage` | ✔ | ✔ | ✔ | ✔ | ✔ (`title`, `description`, `icon`, `cta*`) | ✔ | Props por query. Es el ejemplo a seguir. |
| Páginas | ✘ (200–450 líneas) | ✘ (datos, formato, persistencia, navegación) | ✘ | ✘ | ✘ (reciben `router`, `authManager`, `showToast`, `hasRouteOpenInOtherTab`) | ✘ (importan mocks) | Sin eventos padre-hijo, porque no hay hijos. |

**¿La clase base `Component` se usa de verdad?** A medias. Se usa bien como **ciclo de vida de página**: `listen()` + `destroy()` evitan fugas (lo medí) y todas las páginas la heredan. Pero lo que la convertiría en un modelo de componentes **nunca se usa**: `registerChild` (0 usos), `on`/`emit` (0 usos desde páginas), `setHTML` (0) y `static DEFAULTS` (1 uso, en Placeholder). Ninguna página tiene hijos, así que la composición no ocurre. Además, `emit` publica en el **bus global**, que es el canal equivocado para avisar “hijo → padre”.

### 3.5 La teoría aplicada a este proyecto (JS vanilla)

**Qué significa “agnóstico al contexto”.** Un componente no sabe *dónde* está ni *para qué* lo usan: recibe todo lo que necesita (datos y configuración) y avisa lo que pasó, sin decidir qué hacer después. Una prueba práctica: si lo copio a otra página o a otro proyecto, ¿funciona sin cambiar su código? Hay tres señales de que un componente **no** es agnóstico, y las tres aparecen en el código:
1. **Su nombre o sus opciones nombran el contexto.** `AdvisorRecommendationModal` con `clientSelectId`. El agnóstico sería `Modal` + `RecommendationForm({ recipients })`.
2. **Busca cosas fuera de su raíz.** `DashboardPage.render()` escribe en `#userTopbarName`, que pertenece al shell (`DashboardPage.js:27`).
3. **Decide con datos que no son suyos.** `_formatStatValue` infiere el formato desde el texto de la etiqueta (`AsesorDashboardPage.js:332`): el KPI depende de cómo se redactó el mock. El agnóstico recibe `format: "currency"` explícito.

**Props → opciones del constructor (solo lectura).**
```js
class StatCard extends Component {
  static DEFAULTS = { label: "", value: 0, format: "number", icon: "", subtitle: "", trend: null };
  render() { this.element.innerHTML = statCardTemplate(this.options); }
  update(nextProps) { this.options = { ...this.options, ...nextProps }; this.render(); } // el padre "cambia la prop"
}
```
El hijo **nunca** muta `this.options` por su cuenta. El patrón actual de copiar el mock a `this.data` y mutarlo (`recommendation.status = "Completada"`, `RecomendacionesPage.js`) es exactamente la “segunda fuente de verdad” que advierte la teoría: hoy se pierde al navegar y, con backend, se desincroniza.

**Eventos → `CustomEvent` sobre el elemento raíz (hijo → padre).**
```js
// dentro de DataTable
this.element.dispatchEvent(new CustomEvent("row-action", { bubbles: true, detail: { action, id } }));
// en la página (padre, dueño del dato)
this.listen(tableEl, "row-action", (e) => this._onRowAction(e.detail));
```
Se reserva el `EventBus` para hechos de **aplicación** que atraviesan módulos (`auth:logout`, `expense:created`) y se usa `CustomEvent` (o un callback `onX` en las opciones) para la relación padre-hijo. Hoy la página “escucha” a sus pseudo-hijos buscando IDs internos con `querySelector`, que es el equivalente a que el padre le meta mano al estado del hijo.

**Slots → puntos de inserción.** Un elemento `[data-slot="nombre"]` dentro del template del componente, y una API para llenarlo con un nodo, un string **escapado** o un `Component`:
```js
const modal = new Modal(host, { title: "Nueva recomendación", size: "md" });
modal.mount();
modal.setSlot("body", form.element);   // RecommendationForm es otro componente
this.registerChild(modal); this.registerChild(form);   // destroy en cascada
```

**Por qué un componente específico de página rompe la reutilización.** El caso del modal de recomendación lo muestra: para usarlo dos veces hubo que agregarle 8 opciones de ID y que el router lo monte. Además, cada página que lo usa reimplementa el poblado del `<select>` y el submit, así que la lógica quedó **duplicada igual**. Si mañana cambia el formulario (por ejemplo, agregar `prioridad`, que la BD exige), hay que tocar el fragmento, las 2 páginas y `app.js`. Ese es el problema del monolito que describe la teoría en §1.

### 3.6 Propuesta: catálogo de componentes genéricos

**Criterio de implementación (para no sobre-ingeniar):** los átomos y moléculas **sin estado** se hacen como **funciones puras** que devuelven HTML escapado (`badge({...})`). Los organismos **con comportamiento** se hacen como clases `Component` que emiten `CustomEvent`. Todos escapan por defecto con un helper `html` (tagged template) apoyado en `sanitizeText`, y así se corrige O-01 de paso.

Ubicación: `frontend/components/{atoms,molecules,organisms,layout,feedback}/` con su CSS al lado o en `assets/css/components/<componente>.css` (un archivo por **componente**, no por página).

**Átomos**

| Componente | Props (por defecto) | Eventos | Slots | Reemplaza |
|---|---|---|---|---|
| `button()` | `label`, `variant="primary"\|"ghost"`, `icon=null`, `type="button"`, `href=null`, `size="md"`, `data={}` | — (el padre usa delegación con `data-action`) | — | 70 `action-btn` escritos a mano |
| `badge()` | `text`, `tone="neutral"\|"success"\|"warning"\|"danger"\|"info"`, `icon=null` | — | — | `badge-soft` ×24, `risk-pill` ×4, `profile-tag`, `inbox-badge`, `profile-active-badge`, `recommendation-savings` |
| `avatar()` | `name`, `size="sm"\|"md"\|"lg"` | — | — | `avatar-badge` ×6, `sidebar-user-card__avatar`, `user-profile-avatar` |
| `trend()` | `direction="up"\|"down"\|"flat"`, `value`, `label=""`, `goodWhen="down"` | — | — | `formatTrendLabel`, `_buildTrendLabel`, `advisor-client-change--*` |
| `icon()` | `name`, `label=null` (si hay label, no es `aria-hidden`) | — | — | 116 `<i class="fa-solid …">` |

**Moléculas**

| Componente | Props | Eventos | Slots | Reemplaza |
|---|---|---|---|---|
| `statCard()` | `label`, `value`, `format="number"\|"currency"\|"percent"\|"text"`, `icon=""`, `subtitle=""`, `trend=null` | — | — | 4 renderizadores KPI + 3 `_formatStatValue` |
| `alertItem()` | `title`, `description`, `tone="info"`, `icon=""`, `meta=[]` | — | — | `alert-card` ×2, `patterns-insight`, `patterns-unusual-alert` |
| `keyValueList()` | `items=[{label, value}]`, `variant="rows"\|"boxed"` | — | — | 6 variantes clave-valor |
| `sectionHeader()` | `title`, `icon=null`, `level=2` | — | `actions` | 27 `section-title` |
| `mediaItem()` | `title`, `subtitle=""`, `meta=""`, `avatarName=null`, `badge=null`, `active=false`, `unread=false`, `id` | (en lista) `select` vía organismo | `aside` | 6 variantes de ítem de lista |
| `formField()` | `id`, `name`, `label`, `type="text"`, `required=false`, `options=null`, `hint=""`, `error=""`, `attrs={}` | — | — | Campos de 6 formularios |
| `emptyState()` / `loadingState()` / `errorState()` | `icon`, `title`, `message`, `actionLabel=null` | `retry` (error) | — | `history-empty`, los `<p>` de Recomendaciones; carga y error son nuevos |

**Organismos (clases `Component`)**

| Componente | Props (por defecto) | Eventos | Slots | Reemplaza |
|---|---|---|---|---|
| `DataTable` | `columns=[{key, label, render?, align="start"}]`, `rows=[]`, `rowKey="id"`, `actions=[{id, label, variant}]`, `empty={title, message}`, `mobile="scroll"\|"cards"` | `row-action {action, id}` | `empty` | 5 tablas |
| `FilterBar` | `fields=[{type:"search"\|"select", name, label, options}]`, `values={}`, `debounceMs=UI_TIMING.SEARCH_DEBOUNCE_MS` | `filters-change {values}` | `end` (contador, toggle) | 4 toolbars; la lógica de filtrado pasa a la página o al servicio |
| `ChartCard` | `title`, `type`, `labels`, `datasets`, `height="md"` (alto fijo de contenedor + `maintainAspectRatio:false`), `link=null` | — (escucha `theme:changed` y se repinta) | `footer` | 7 instanciaciones de Chart.js, colores en JS |
| `Modal` | `title`, `size="md"`, `open=false`, `dismissible=true` | `close` | `body`, `footer` | 10 modales; envuelve `bootstrap.Modal` |
| `ConfirmDialog` | `title`, `message`, `confirmLabel="Confirmar"`, `tone="danger"` | `confirm`, `cancel` | — | `window.confirm` (Historial) |
| `ViewToggle` | `modes=[{id, label, icon}]`, `value` | `view-change {value}` | — | 2 toggles |
| `RecommendationForm` | `recipients=[{id, name}]`, `types` (de constantes alineadas con el enum de la BD), `priorities`, `initial={}` | `submit {payload}`, `cancel` | — | modal-fragmento + 2×`_handleCreateRecommendation` + 8 IDs |
| `ClientCard` | `client`, `actions=["detail", "recommend"]` | `client-action {action, id}` | — | 2 variantes de tarjeta |
| `RecommendationCard` | `recommendation`, `actions` | `recommendation-action {action, id}` | — | `_buildRecommendationCard` |
| `ProfileForm` | `schema=[formField props]`, `values`, `summaryFields` | `submit {values}`, `reset` | `extra` | `PerfilPage` + `AsesorPerfilPage` |
| `TicketUploader` | `accept="image/*"`, `maxSizeMb=5` | `file-selected {file}`, `analyze {file}` | — | dropzone (y que el “Arrastrá” funcione de verdad) |
| `Toast` (servicio) | `show(message, tone="success", ms=UI_TIMING.TOAST_DISMISS_MS)` | — | — | `showToast` de `app.js` |

**Templates (layouts)**

| Componente | Props | Eventos | Slots | Reemplaza |
|---|---|---|---|---|
| `AppLayout` | `role`, `navItems` (de una constante por rol), `user`, `activePath`, `title` | `logout` (lo maneja `app.js` una sola vez) | `outlet` | `UserShell` + `AdvisorShell` + 4 fragmentos + 12 juegos de slots + `_bindLogoutButtons` en 12 páginas |
| `PublicLayout` | — | — | `outlet` | navbar del placeholder |

**Resultado esperado en las páginas:** cada página pasa a **componer** y a orquestar (pedir datos al servicio, pasar props, reaccionar a eventos). Estimo que bajan de 200–450 a 80–180 líneas. Archivos tocados: las 12 páginas internas y sus templates, `PageController.js` (se reduce), `components/` (nuevo), `assets/css/components/` (se reorganiza por componente, ver §4.5).

---

## 4. Hipótesis 3 — CSS con números mágicos que rompen el responsive

### 4.1 Veredicto: PARCIALMENTE CONFIRMADA

- **Confirmado:** hay muchos valores fijos sin tokenizar y no se cumple la regla 1 de `ReglasCSS.md` (“si un valor se repite 2 o más veces, debe ser token”): `gap: 10px` aparece 34 veces.
- **Refutado en su mayor parte:** que eso *rompa* el responsive. **Ninguna** de las 56 mediciones mostró desborde horizontal de página. Los 24 valores realmente de layout están acotados por grid/flex y no desbordan en los anchos pedidos.
- **Lo que sí rompe**, medido, son 4 cosas que no son “px mágicos” (§4.4).

### 4.2 Medición de valores fijos

Script sobre las 19 hojas, sin comentarios, contando cada número px/rem/em dentro de declaraciones:

| Archivo | Total | Legítimos¹ | Espaciado | Tipografía | **Layout problemático²** | Fluido (clamp/min/calc) |
|---|---:|---:|---:|---:|---:|---:|
| `components/landing.css` | 202 | 48 | 90 | 38 | 9 | 16 |
| `components/dashboard-asesor.css` | 65 | 15 | 31 | 15 | 2 | 2 |
| `layouts.css` | 55 | 20 | 24 | 9 | 2 | 0 |
| `components/page-shell.css` | 53 | 14 | 23 | 15 | 1 | 0 |
| `global.css` | 52 | 39³ | 7 | 2 | 4 | 0 |
| `components/dashboard-usuario.css` | 48 | 15 | 22 | 10 | 0 | 1 |
| `components/recomendaciones.css` | 41 | 5 | 22 | 12 | 0 | 2 |
| `components/perfiles.css` | 35 | 5 | 20 | 10 | 0 | 0 |
| `components/patrones.css` | 28 | 6 | 17 | 5 | 0 | 0 |
| `components/cargar-gasto.css` | 20 | 4 | 11 | 4 | 1 | 0 |
| `components/asesor-inbox.css` | 14 | 2 | 9 | 2 | 1 | 0 |
| `components/placeholder.css` | 14 | 1 | 6 | 5 | 2 | 0 |
| `components/historial.css` | 11 | 1 | 9 | 1 | 0 | 0 |
| `components/asesor-reportes.css` | 9 | 1 | 7 | 1 | 0 | 0 |
| `components/perfil-usuario.css` | 8 | 0 | 4 | 2 | 2 | 0 |
| `components/asesor-clientes.css` | 1 | 0 | 1 | 0 | 0 | 0 |
| `components/asesor-perfil.css` | 0 | — | — | — | — | — (archivo vacío de 1 byte, igual se carga) |
| `themes/dark.css`, `themes/light.css` | 0 | — | — | — | — | — |
| **Total** | **656** | **175** | **303** | **131** | **24** | **21** |

¹ Bordes (78), radios (21), sombras (7), íconos/avatares/controles ≤80 px (24), microajustes (4) y definiciones de token (41).
² Dimensiones de contenedor (14), offsets `top/right/bottom/left` (6), `minmax(px)` en grids (4). La lista completa está en el Anexo B.
³ La mayoría son definiciones de tokens en `:root`.

**Fragmentación (lo que realmente pide tokens):** 63 valores distintos de `font-size`, 40 de `padding`, 15 de `margin-bottom`, 13 de `gap` y 12 de `border-radius`, aunque existen 4 tokens de radio (`--radius-sm..xl`). Las declaraciones más repetidas son `gap:10px` ×34, `gap:8px` ×27, `margin-bottom:8px` ×19, `gap:14px` ×12, `padding:12px` ×11 y `gap:12px` ×11. No hay escala de espaciado ni tipográfica, aunque la spec §8 la define (`--spacing-*`, `--font-size-*`) y nunca se implementó.

### 4.3 Breakpoints, unidades y tokens

- **Breakpoints:** consistentes y alineados a Bootstrap (575/991/1199 px, en 8, 8 y 3 archivos). Hay un `1100px` suelto (`landing.css`) y un único `min-width: 992px`. **No están centralizados**: CSS no permite `var()` dentro de `@media`, así que lo mínimo es documentarlos como constantes en `ReglasCSS.md`. **21 de 22 media queries son `max-width` (desktop-first)**, cuando la spec (§8, §12.7) y `PrincipiosDesarrollo.md` §9.4 exigen mobile-first. Es una inconsistencia de documentación más que un bug.
- **Grid/flex:** se usan bien. Las grillas con `minmax(0, Xfr)` y `auto-fit` absorben el contenido. Por ejemplo, con el mes más largo (“Septiembre”) la columna del calendario pasa de 191 a 205 px y no desborda (medido a 1200/1280/1440).
- **`clamp()` / `vh`/`dvh`:** `clamp` en 37 declaraciones, la mayoría en `global.css` y `landing.css`. `vh`+`dvh` como fallback en `layouts.css` y `placeholder.css` ✔. En cambio, `landing.css:599/606` declara el par vh/dvh y `landing.css:813/817` lo pisa en mobile **solo con `vh`**, así que en el breakpoint donde más importa se pierde el `dvh`.
- **Sistema de tokens:** 87 custom properties. **13 no se usan** (`--bg-750`, `--bg-850`, `--bg-overlay`, `--navbar-bg`, `--surface-3`, `--surface-overlay`, `--landing-surface-soft/strong/glass`, `--theme-bg-main`, `--theme-bg-surface`, `--theme-text-main`, `--theme-text-secondary`). `themes/dark.css` redefine 31 variables y **27 son idénticas** a las de `:root` en `global.css`: es duplicación pura.
- **Colores fijos fuera de tokens:** `landing.css` tiene 48, `page-shell.css` 10, `light.css` 5, `dashboard-asesor.css` 4 y `patrones.css` 4. En JS hay 9 colores en los gráficos (`DashboardPage.js`, `PatronesPage.js`) que no siguen el tema.

### 4.4 Casos concretos: qué rompe y qué no

**Sí rompe (medido):**

| # | Caso | Medición | Causa real |
|---|---|---|---|
| R1 | Navbar de la landing a 360 px | Los botones “Iniciar Sesión”/“Empezar Gratis” pasan a 2 líneas (58 px de alto contra 45 px en 768). El navbar queda en 83 px, pero `--nav-height` vale 74 px. | Las acciones no colapsan en mobile (los links sí, `landing.css:796`) y la marca mide 2rem fijos (`layouts.css:39`). Además, `--nav-height` se usa como constante para el modal de registro y el `scroll-margin`, así que esos offsets quedan cortos por 9 px. |
| R2 | Teaser del asesor en el dashboard a 360 px | Elemento fijo de 320×202 px en y=518 sobre un viewport de 800 px (25 % de la pantalla) + FAB de 50 px. Aparece en cada carga hasta que se cierra y tapa contenido. | Decisión de diseño (`position: fixed`, `dashboard-usuario.css:119`), no px. Usa tokens con safe-area correctamente, pero en mobile debería arrancar colapsado (solo el FAB). |
| R3 | Altura de gráficos | Los `canvas` son **cuadrados**: 562×562 a 1440 px (dashboard), dona de 603×603 en Patrones, 258×258 a 360. | Chart.js usa `maintainAspectRatio: true` por defecto. Los tokens `--chart-canvas-min-height(-compact)` (`page-shell.css:116`, `dashboard-usuario.css:94`) **no tienen efecto real**: dan una falsa sensación de control. Falta alto en el contenedor + `maintainAspectRatio:false`. |
| R4 | Tema claro en la landing | Fondo del navbar `rgba(2,22,26,.84)` (fijo, `landing.css:17`) con texto `rgb(42,75,70)` (el `--text-200` del tema claro): **texto oscuro sobre fondo oscuro**. Lo mismo pasa en video-card y planes. | 48 colores fijos en `landing.css`. Es alcanzable: el usuario elige “Claro” en Perfil, cierra sesión y vuelve a la landing. |

**Valor fijo que no rompe (medido o verificado):**

| Caso | Por qué no es problema |
|---|---|
| `stat-grid`/`card-grid-3` con `minmax(230px, 1fr)` (`layouts.css:122,128`), `advisor-client-grid` `minmax(250px)` | A 360 px el contenedor útil mide 288 px > 250, así que pasa a 1 columna sin desborde. Recién rompería por debajo de ~290 px de viewport, que no es objetivo. |
| Toast `min-width: 250px; right: 18px` (`global.css:204,213`) | Entra en 360 px. Lo único que le falta es `env(safe-area-inset-bottom)`, que `ReglasCSS` regla 3 pide para flotantes. |
| Tablas con `white-space: nowrap` (`historial.css:9`, `dashboard-asesor.css:142`) | Scrollean **dentro** de `.table-responsive` (Historial: 816 px de contenido en 288 a 360 px de ancho). No rompen la página, pero en mobile la experiencia es mala: se podría ofrecer `DataTable` con `mobile="cards"`. |
| Íconos y avatares en px (36–78 px) | Son legítimos: son tamaños táctiles o iconográficos. |
| `--kpi-card-min-height: clamp(11.5rem, 27vh, 13.125rem)` | No rompe, pero hace que el alto de las KPI dependa del **alto** de la ventana (184 px con 600 de alto, 210 con 1100). No tiene mucho sentido; alcanza con un `min-height` en rem o con nada. |
| Modal de registro a 360×640 | El body mide 409 px con 484 de contenido: scrollea por dentro, que es lo correcto. |

### 4.5 Otros problemas de CSS

- **CSS muerto: muy poco** (es una buena noticia). Hay 4 clases sin uso: `.chart-grid-3`, `.landing-logo-item__dot`, `.text-secondary` y `.text-body-secondary` (las dos últimas son overrides de utilidades Bootstrap que no se usan). Hay ~40 clases “gancho” en el HTML sin regla (`page-user-*`, `*-main`, `*-hero`, `report-section`…): no hacen daño, pero son ruido. `ReglasCSS.md` todavía documenta un `padding-top: 98px` que ya no existe en esos archivos.
- **“Un CSS por página” es nominal.** `index.html:21-39` carga las 19 hojas en todas las rutas. Las reglas se reparten por página aunque los componentes son compartidos: `.avatar-badge` y `.advisor-recommendation-modal` viven en `dashboard-asesor.css` y se usan en Clientes e Inbox; los breakpoints de `.history-toolbar` y `.advisor-clients-toolbar` están en `page-shell.css` (`:257-266`) y sus reglas base en `historial.css` y `asesor-clientes.css`; `.history-detail-card` se usa como “detalle de cliente”.
- **CSS duplicado:** `dark.css` repite `:root` (27 de 31). Los 3 tonos de badge están copiados en `badge-soft`, `risk-pill`, `profile-active-badge`, `recommendation-savings` y `advisor-client-unread` (la misma receta `color-mix` 74/20/34). `#como-funciona.landing-section, …` repite el `scroll-margin-top` de `.landing-section` (`landing.css:224` y `:230`).
- **Regla sin efecto:** el `scroll-margin-top` de la landing (`landing.css:224-231`) solo actúa con scroll nativo a anclas, y el scroll se hace por JS (`LandingPage._scrollToLandingSection` con `UI_LAYOUT.LANDING_SCROLL_OFFSET`), porque el hash está ocupado por el router. Hay dos mecanismos para lo mismo y uno nunca se ejecuta.
- **Estilos inline:** 0 en HTML/JS ✔. El JS solo **quita** propiedades inline que deja Bootstrap (`core/Router.js:155-184`).
- **Cumplimiento de `ReglasCSS.md`:** regla 1 (tokenizar repetidos) ✘; regla 2 (sin `padding-top` de compensación) ✔; regla 3 (flotantes con safe-area) ✔ en teaser y FAB, ✘ en toast; regla 4 (`clamp` en alturas) ✔ formal pero inefectivo en gráficos (R3); regla 5 (vh+dvh) parcial (overrides mobile); regla 6 (anclas con tokens) ✔ formal, pero el mecanismo está duplicado; regla 7 (timing en constantes) ✘ en `PageController.js:96` (120 ms) y `TESTIMONIAL_AUTO_MS` (fuera de `UI_TIMING`).

### 4.6 Propuesta

1. **Escalas en `global.css`:** `--space-1..7` (4/8/12/16/20/24/32 px, en rem), `--text-xs..3xl` (7–8 pasos, los `clamp` de títulos incluidos) y usar los 4 radios existentes. Reemplazar valores con un script de mapeo al más cercano y revisar visualmente. Baja los 63 `font-size` a ~8.
2. **Temas:** dejar en `:root` solo los tokens base, eliminar la copia de `dark.css` y migrar los 48 colores de `landing.css` a tokens de superficie que `light.css` redefina (arregla R4).
3. **CSS por componente:** `assets/css/components/{badge,stat-card,data-table,filter-bar,modal,chart-card,media-item,app-layout}.css`. Las hojas de página quedan solo con la grilla de esa página (y varias desaparecen: `asesor-perfil.css`, `asesor-clientes.css`, `historial.css`).
4. **Arreglos puntuales:** R1 (colapsar acciones de la landing en <576 px y medir `--nav-height` en vez de suponerlo), R2 (teaser colapsado en mobile), R3 (`ChartCard` con alto de contenedor y `maintainAspectRatio:false`), safe-area en el toast, vh/dvh en los overrides del registro, eliminar el `scroll-margin` muerto y los 13 tokens sin uso.
5. **Mobile-first:** solo conviene **en los archivos que se reescriben** al crear componentes. No vale la pena convertir lo que no se toca. Actualizar la spec para que diga la verdad (§5, D-10).
6. **Breakpoints:** documentarlos como tabla única en `ReglasCSS.md` (576/992/1200) y eliminar el 1100.

---

## 5. Otros hallazgos

Severidad: **A** alta, **M** media, **B** baja. Esfuerzo: **S** (<½ día), **M** (1–2 días), **L** (>2 días).

### 5.1 Código, datos, estado y seguridad

| ID | Área | Problema | Evidencia | Sev. | Esf. | Propuesta |
|---|---|---|---|---|---|---|
| O-01 | Seguridad | XSS: 65 `innerHTML` con interpolación, 0 escapado; `renderTemplate` no escapa; `sanitizeText` sin uso. Hoy entran el nombre del registro (→ shell) y el comercio (→ lista de gastos). Con backend, el asesor renderiza datos de clientes. | `components/core/templateLoader.js:33-36`; `pages/usuario/CargarGastoPage.js:98-124`; `core/AuthManager.js:104`; `utils/helpers.js` (`sanitizeText`) | A | S | Tagged template `html\`\`` que escape por defecto + `textContent` para texto suelto. Hacerlo **antes** de conectar el backend. |
| O-02 | Datos | No hay capa de servicios: 12 páginas importan `MOCK_*`; `APIClient` y `apiClient` tienen 0 imports; 16 clonados `JSON.parse(JSON.stringify(...))`. | `grep MOCK_ pages` → 12 archivos | A | M | `services/{auth,expenses,tickets,recommendations,analysis,advisor,profile}.service.js` con API `async`, mismo contrato para el driver mock y el HTTP; un `services/adapters.js` mapea español (BD) ↔ forma de la UI. Las páginas solo llaman servicios (`TeoriaComponentes` §8). |
| O-03 | Estado | Estado disperso y efímero: el gasto creado no llega a Historial, los borrados y recomendaciones completadas se pierden al navegar. `StateManager` **solo se escribe** (0 `get`). El `EventBus` emite 7 eventos y solo `ROUTER.CHANGED` tiene suscriptor; `ROUTER.NAVIGATE` tiene suscriptor y ningún emisor; `EVENTS.EXPENSE.CREATED` nunca se emite. | `CargarGastoPage.js:136`; `HistorialPage.js:170`; `RecomendacionesPage.js` (mutación de `recommendation.status`); `app.js:34` | A | M | La fuente de verdad pasa a ser el servicio (con caché simple si hace falta), que emite `expense:created/updated/deleted` en el bus; las páginas que estén montadas recargan. `StateManager` queda para sesión y tema, o se elimina si no aporta. |
| O-04 | Estado | Claves de `localStorage` no son por usuario y no se limpian al salir: el perfil guardado **pisa nombre y email** del próximo usuario que entra; perfil activo y borrador de gasto se comparten. 4 claves ad hoc fuera de `STORAGE_KEYS`. | `pages/usuario/PerfilPage.js:9, 158`; `pages/asesor/AsesorPerfilPage.js` (`ADVISOR_PROFILE_STORAGE_KEY`); `CargarGastoPage.js:9`; `core/AuthManager.js:119` | M | S | Claves en `STORAGE_KEYS` con sufijo `userId`; `logout` limpia las de sesión. Con backend, el perfil vive en la BD. |
| O-05 | Estado | `PerfilPage` cambia el tema por fuera de `ThemeManager` (no emite `theme:changed` y los gráficos no se repintan). | `pages/usuario/PerfilPage.js:117-118` | B | S | `themeManager.setTheme()`. |
| O-06 | Integración | `APIClient` no está listo: fuerza `Content-Type: application/json` (rompe `FormData` para `/tickets/upload`), `JSON.parse` sin protección, no maneja 401 ni emite `auth:sessionExpired`, no traduce `AbortError`, `RETRIES` sin uso, lee el token de `localStorage` en vez de `AuthManager`, y `BASE_URL` está hardcodeada. | `core/APIClient.js:46-91`; `utils/constants.js:12-14` | A | S | Detectar `FormData`, parsear de forma segura, 401 → logout + evento, normalizar errores `{status, code, message}` (spec §10.7), `BASE_URL` por entorno (local / deploy). |
| O-07 | Auth | Login y registro simulados dentro de `AuthManager`; el registro no persiste el usuario; el rol `usuario` del front es `cliente` en la BD; “Recordar sesión” se ignora; contraseñas mock en el bundle. | `core/AuthManager.js:57-114`; `utils/constants.js:263,271`; `migrations/0001_init_schema.sql:14` | M | S | `AuthManager` delega en `auth.service`; mapear el rol en el adaptador; quitar `MOCK_AUTH_USERS` del bundle cuando haya backend. |
| O-08 | Consigna | Faltan requisitos: (a) **edición de gasto** (no hay UI para `PUT /expenses/:id`, endpoint mínimo); (b) **recategorizar** gastos; (c) el **asesor no ve gastos ni patrones por cliente** (el modal de detalle solo muestra agregados), cuando la consigna §4.5 dice “El asesor podrá visualizar esta información para cada usuario”; (d) **clasificar perfiles** es capacidad del asesor en la consigna, pero el front deja que el **usuario se autoseleccione** (y la misma página dice que el perfil “se actualiza automáticamente”); (e) OCR simulado con muestra fija; (f) “detectar comportamientos problemáticos”: solo mock. | `HistorialPage.js:157-173` (detalle y eliminar, sin editar); `AsesorClientesPage.js:234-255`; `PerfilesPage.js:122-131`, `perfiles.html` (CTA); `CargarGastoPage.js:152-176` | A | L | Agregar `/usuario/gastos/:id` (editar) y `/asesor/clientes/:id` (análisis por cliente, reutilizando los `ChartCard`/`StatCard` de Patrones); pasar la clasificación de perfil al asesor (la BD ya tiene `clasificacion_de_perfil.asesor_id`). |
| O-09 | Modelo | La UI tiene funcionalidades **sin tablas ni columnas** en la BD: inbox/mensajes/chat/contacto con el asesor, comisiones, tareas, descargas, estados de recomendación (`Pendiente/En Progreso/Completada/Descartada` contra `leida` boolean), ahorro potencial y pasos, método de pago (obligatorio en el form), referencia, estado `Validado/Pendiente` del gasto, tipos de recomendación `Ahorro/Presupuesto/Habito` (la BD usa `sugerencia/alerta/observacion`). | `migrations/0001_init_schema.sql:156-202`; `components/modals/advisor-recommendation-modal.html`; `cargar-gasto.html` (`expensePaymentMethod required`) | A | M | **Decisión** (§6): recortar del front lo que no entra en la consigna o crear `0002_*.sql`. Hay que decidirlo antes de escribir los DTOs de Nest. |
| O-10 | Contrato | La forma de los datos difiere entre front (inglés: `merchant`, `amount`, `fullName`), BD (`comercio`, `monto`, `nombre_completo`) y spec §10 (`nombre` + `apellido`, `perfil`). La spec tampoco es consistente consigo misma: `register` devuelve el usuario plano con `token` y `login` devuelve `{token, user}`. | `especificaciones/EspecificacionDesarrolloFront.md` §10.1–10.2 | M | S | Fijar el contrato en la spec (un formato de respuesta) y adaptar en `services/adapters.js`, no en las páginas (lo pide `frontend/CLAUDE.md`). |
| O-11 | Duplicación | Shells duplicados; 3 `_formatStatValue`; editor de perfil ×2; formulario de recomendación ×2; toggle ×2; filtros ×4; opciones de gráfico ×10 (ver §3.3). | §3.3 | M | M | Catálogo de §3.6. |
| O-12 | Duplicación | 12 páginas vuelven a escribir el nombre en topbar y sidebar (20 llamadas); 39 fallbacks hardcodeados (“Juan Perez”, “Maria Rodriguez”, “JP”, “MR”). | p. ej. `DashboardPage.js:27`, `CargarGastoPage.js:26-28`; `app.js:58-60` | B | S | Que lo haga el layout con el usuario de la sesión; sin fallbacks inventados. |
| O-13 | Código muerto | 17 exports sin uso (8 en `helpers.js`, 3 en `validators.js`, 3 en `formatters.js`, `APIClient`/`apiClient`, `clearTemplateCache`); 9 métodos sin uso (`EventBus.once`, `Component.setHTML`, `Component.registerChild`, `APIClient.post/put/parseHashQuery`, `PageController._handleBackToDashboard`, `Router.stop`, `ThemeManager.toggleTheme`); `PLACEHOLDER_PRESETS` (solo lo usan helpers muertos); `window.fintrack*`; constantes `USE_MOCK_API`, `MOCK_DELAY_MS`, `RETRIES`, `APP_NAME`, `APP_VERSION`; eventos `ROLE_SELECTED`, `SESSION_EXPIRED`, `LOADING`, `ERROR`, `EXPENSE.CREATED`, `RECOMMENDATION.UPDATED`; gráfico diario sin canvas; parámetro `targetBlank` de `buildLink`; `#recommendationsSummaryStrip` siempre oculto; `MOCK_ADVISOR_DASHBOARD.charts` sin gráficos; `asesor-perfil.css` vacío. | Script del Anexo A; `DashboardPage.js:270-373`; `UserShell.js:9-11`; `recomendaciones.html` (`summary-strip app-hidden`) | B | S | Borrar lo muerto, pero **usar** lo que hace falta y existe sin uso (`sanitizeText`, `debounce`, `formatDate`, `isValidEmail`, `once`, `registerChild`, `EVENTS.EXPENSE.*`, `SESSION_EXPIRED`). |
| O-14 | Listeners | `PerfilesPage._selectProfile` vuelve a renderizar y re-bindear: el array de listeners crece con nodos ya desconectados hasta `destroy()`. Fuera de esto, la limpieza es correcta (medido). | `pages/usuario/PerfilesPage.js:127` | B | S | Delegación con un listener en el contenedor (como ya hace Historial). |
| O-15 | Errores | `Router._activate` no tiene `try/catch`: si falla un `fetch` de template o un `import()`, la vista queda en blanco y hay una promesa rechazada sin manejar. No hay estados de carga ni de error en ninguna página. | `core/Router.js:109-150` | M | S | `try/catch` en el router con vista de error + `loadingState`/`errorState` en las páginas al pasar a servicios. |
| O-16 | Router | Trampa del 404 con “Volver Atrás” (medido). | `app.js:320-332`; `PlaceholderPage.js:35-36` | M | S | 404 en el lugar o `replace: true`. |
| O-17 | Router | Cambio de pestaña en Reportes = remontar página y shell; se pierde el estado de tareas (medido el remontaje). | `AsesorReportesPage.js:163-172` | M | S | `reuseOnQueryChange` (§2.5) o actualizar el hash sin re-activar. |
| O-18 | Organización | `utils/constants.js` tiene 1284 líneas: la configuración real ocupa ~140 y el resto (desde la línea 257, ~80 %) son mocks. | `utils/constants.js:257-1284` | B | S | `mocks/*.js` consumidos solo por el driver mock de los servicios. |
| O-19 | Accesibilidad | Los ítems de la página Inbox no son operables con teclado (`article` sin `tabindex`/`role`), mientras que los del dashboard sí; los errores de formulario no tienen `role="alert"` ni `aria-describedby`; los gráficos no tienen alternativa textual; el botón “¿Olvidaste tu contraseña?” no hace nada; la dropzone dice “Arrastrá” pero no hay drag & drop; se usa `window.confirm`; el contraste en tema claro de la landing está roto (R4). | `AsesorInboxPage.js:139`; `landing.html:150,155`; `cargar-gasto.html` (`ticket-dropzone`) | M | S–M | Se resuelve casi todo al crear `mediaItem`, `formField`, `ChartCard`, `TicketUploader` y `ConfirmDialog`. |
| O-20 | Navegación UX | Inconsistencia: algunos links abren pestaña nueva (`target="_blank"` en 5 lugares, p. ej. “Ver detalle” de las tarjetas resumen) y otros equivalentes no (los botones del hero, el sidebar). Es lo que obliga al registro de pestañas. | `DashboardPage.js:161-163, 195-197, 204`; `dashboard.html:62`; `perfiles.html:47` | M | S | Decisión (§6). Recomiendo navegar siempre en la misma pestaña. |
| O-21 | Dependencias | `frontend/CLAUDE.md`/`CLAUDE.md` dicen “sin frameworks de UI”, pero la spec permite **Bootstrap 5** y el código lo usa para grid, modales, offcanvas y utilidades. Al mismo tiempo, la spec pide “usar Bootstrap primero (`.btn`, `.card`)” y el código usa `.action-btn`/`.section-block` propios. | `index.html:8-11, 49`; spec §1, §2.9, §8 | M | S | Decisión (§6). Bootstrap no es un framework de componentes JS en el sentido de la consigna, pero conviene dejarlo explícito y coherente en todos los documentos. |

### 5.2 Inconsistencias y errores en la documentación

| ID | Documento | Problema | Propuesta |
|---|---|---|---|
| D-01 | `EspecificacionDesarrolloFront.md` §2.2 | “**Herencia antes que Composición**” contradice `TeoriaComponentes.md` (composición) y la propia spec §6.2 (Composition Pattern). | Invertir: “Composición antes que herencia; herencia solo para la base de ciclo de vida”. |
| D-02 | `PrincipiosDesarrollo.md` §1.2 (OCP) y §5.2 | El “BIEN” crea subclases `PrimaryButton`/`DangerButton` y `EmailInput`/`PasswordInput` para **variantes**: eso se resuelve con una prop (`variant`, `type`) con valor por defecto, como muestra la teoría. | Reescribir los ejemplos con props. |
| D-03 | `PrincipiosDesarrollo.md` §6.3 | El ejemplo de `destroy()` tiene un bug: guarda el handler y después llama `handler.target?.removeEventListener(...)`, pero `target` no existe, así que **nunca saca nada**. El `core/Component.js` real está bien. | Copiar la implementación real (`listen` con `{target, eventName, handler}`). |
| D-04 | Spec §7, Principios §5 | Usan `this.elemento`; el código usa `this.element`. La spec promete “validación de opciones” y “logging interno” en `Component`, que no existen. Factory y Builder (§6.1, §6.4) no están implementados. | Alinear con el código o implementar `_validateOptions` si se adopta el catálogo. |
| D-05 | Spec §4 | El árbol muestra `pages/auth/*` (no existe), el asesor con una sola página (hay 5), sin `services/`, `components/` “a definir” y CSS en `components/NombreComponente/NombreComponente.css` (es por página). Dice que `ReglasCSS` está “en raíz del repo” (está en `frontend/`; Principios §9 repite el error). | Actualizar el árbol junto con el refactor. |
| D-06 | Spec §6.6 | Router y APIClient “Singleton con `getInstance()`”: el Router se instancia con `new` en `app.js` y `APIClient` no tiene `getInstance`. | Corregir el texto. |
| D-07 | Spec §8 | Los tokens documentados (`--primary-color`, `--spacing-md`, `--font-size-base`…) no existen; los reales son `--color-primary` y no hay escala. | Documentar los reales después de §4.6. |
| D-08 | Spec §11.5 | La tabla de rutas omite `/asesor/clientes`, `/inbox`, `/reportes` y `/perfil`. | Reemplazarla por `routes.js` como fuente de verdad. |
| D-09 | Spec §11.2.2 y §11.2.3 | El registro pide `nombre` + `apellido` (el front usa `fullName` y la BD `nombre_completo`); la “Selección de perfil” como paso aparte no existe (el rol se elige en el modal). | Actualizar. |
| D-10 | Spec §8, §12.7; Principios §9.4 | Mobile-first obligatorio contra 21/22 `max-width` en el código. | Decidir (§6) y dejarlo escrito. |
| D-11 | Spec §12.2 | Claves `authToken`/`theme` y tema por defecto `light`; el código usa `fintrack.*` y `dark`. | Corregir. |
| D-12 | Spec §12.3; Principios §7.2–7.3 | `APIClient` “emite `state:error`/`auth:sessionExpired`”: no lo hace. | Implementarlo (O-06) o corregir. |
| D-13 | `paginasFront/02` y `03` | El dashboard de usuario especifica 3 gráficos (hay 2 y uno quedó como código muerto); el dashboard de asesor especifica 3 gráficos (no hay ninguno, aunque el mock tiene los datos). | Decidir: implementar con `ChartCard` o sacarlos de la spec. |
| D-14 | `ReglasCSS.md` | Documenta reemplazos de `padding-top: 98px` en archivos donde hoy no hay `padding-top`; la “regla de 2 repeticiones” se incumple 300 veces, lo que sugiere que está mal formulada (los valores de una escala se repiten por diseño). | Reformular: “todo espaciado/tipografía sale de la escala; los valores **fuera de escala** son los que se justifican”. |
| D-15 | `README.md` | Dice que el asesor solo tiene dashboard; no tiene la documentación exigida por la consigna §9 (arquitectura, modelo de datos, endpoints, tecnologías, uso de IA) ni URLs de deploy. | Completar al cerrar el backend. |

---

## 6. Decisiones tomadas (25/11/2026)

| # | Tema | Decisión del equipo | Consecuencia en el plan |
|---|---|---|---|
| 1 | Funcionalidades sin respaldo en la BD (O-09) | Se conserva **solo lo que suma a la consigna**; el resto se elimina. | Se eliminan: bandeja de entrada del asesor (página y sección del dashboard), chat y teaser del asesor, modal “Contactar a mi asesor”, Reportes (comisiones, tareas, descargas), mensajes sin leer en clientes, estados extendidos de recomendación, ahorro potencial y pasos de implementación, método de pago, referencia, estado Validado/Pendiente del gasto, y los campos de perfil que no están en la BD (salvo el tema visual, que es una preferencia local y cubre el extra “Modo oscuro”). La recomendación queda con el modelo de la BD: `titulo`, `mensaje`, `tipo` (sugerencia/alerta/observación), `prioridad` (baja/media/alta), `origen` (sistema/asesor), `leida`. |
| 2 | Clasificación de perfil | La hace **el sistema automáticamente**. El cliente **no puede autoseleccionarse**, ni siquiera planteado como meta. | La página “Perfiles de gasto” pasa a ser informativa: muestra el perfil asignado, sin botones de selección, sin guías tipo “cómo llegar a ser…” y sin CTA de cambio. El asesor ve el perfil asignado en el análisis por cliente (Fase 5). |
| 3 | Pestañas nuevas | Se **mantiene** abrir en pestaña nueva cuando corresponda y sea útil. | El registro de pestañas se conserva, pero se aísla en `core/TabRegistry.js` (Fase 2): sin la rama muerta de `window.opener`, con el tiempo en `UI_TIMING` y con un criterio declarativo (los links a secciones de detalle o análisis desde el dashboard abren pestaña nueva; la navegación principal no). |
| 4 | Bootstrap | Se usa. | Se corrige `CLAUDE.md` (raíz y `frontend/`): Bootstrap 5 y Chart.js por CDN están permitidos; lo prohibido son los frameworks de componentes (React, Vue, etc.). |
| 5 | Mobile-first | Se adopta **para los componentes nuevos**. | En la Fase 3, cada página migra a los componentes nuevos y los bloques viejos (marcado, JS y CSS) **se eliminan**, no quedan conviviendo. |
| 6 | Contrato de API | El backend responde **en español**, igual que la BD. | Los servicios (Fase 1) adaptan las respuestas en español al modelo de la UI en un único lugar (`services/adapters.js`). La spec §10 se reescribe en español y con un formato de respuesta único. |
| 7 | Terminología de roles | Se unifica todo en **“cliente”** (“usuario” incluye también a los asesores). | Fase 0: valor de rol `cliente`, rutas `/cliente/*`, carpeta `pages/cliente/`, constantes `ROUTES.CLIENT_*`, textos de UI y documentación. Los identificadores internos `user*` (shells, clases CSS `user-*`, mocks `MOCK_USER_*`) se renombran a medida que se reescriben en las Fases 1–4, así no se renombra dos veces código que se va a eliminar. |
| 8 | Chat con el asesor | Se elimina. | Incluido en la decisión 1. |
| 9 | Gráficos de las specs | Se implementan. | Fase 3, con `ChartCard`: en el dashboard del cliente, gastos por día, por categoría y mensual con línea de promedio; en el dashboard del asesor, distribución de clientes por perfil, gasto total por perfil y actividad de clientes. |
| 10 | Alcance | Se ejecuta el **plan completo**, una fase por commit. | Ver §7. |

## 7. Plan de refactor por fases (actualizado)

Cada fase termina con el front funcionando (checklist manual del README + recorrido de todas las rutas sin errores de consola), la documentación afectada actualizada en el mismo cambio y un mensaje de commit propuesto. Los commits los hacen ustedes.

### Fase 0 — Decisiones aplicadas y limpieza · ✅ completada (25/11/2026)
- `CLAUDE.md` (raíz y `frontend/`): Bootstrap permitido; terminología “cliente”.
- **Unificación “cliente”** (decisión 7): rol, rutas, carpeta `pages/cliente/`, `ROUTES.CLIENT_*`, guards, registro y textos.
- **Eliminación de alcance** (decisiones 1, 2 y 8): inbox, chat/teaser/FAB, contacto con el asesor, Reportes, mensajes sin leer, estados extendidos y campos extra de recomendación (queda “marcar como leída”), método de pago/referencia/estado del gasto, campos de perfil fuera de la BD, autoselección de perfil. Con sus rutas, links del sidebar, mocks, CSS y specs.
- Formulario de recomendación del asesor alineado con la BD (`tipo` y `prioridad` con los valores del enum; sin “ahorro estimado”).
- Código muerto confirmado (O-13), conservando lo que se va a usar.
- Bugs rápidos: 404 sin trampa (O-16), tema vía `ThemeManager` (O-05), claves de storage por usuario y limpieza al salir (O-04), delegación en Perfiles (O-14), `try/catch` en el router (O-15).
- Escapado por defecto: helper `html` y `escapeHtml`, aplicado en `renderTemplate` y en todos los `innerHTML` con datos (O-01).
- Documentos: D-01, D-02, D-03, D-08, D-11 y las specs de páginas afectadas por las eliminaciones.

### Fase 1 — Capa de servicios (desbloquea el backend) · ✅ completada (25/11/2026)
- `services/*.service.js` (`auth`, `expenses`, `categories`, `tickets`, `recommendations`, `analysis`, `clients`, `profile`) con API `async`, driver mock y driver HTTP intercambiables; los mocks pasan de `constants.js` a `mocks/` y **en español, con la forma de la API**, para que el adaptador se ejercite desde el día uno.
- `services/adapters.js`: español (API) → modelo de la UI.
- `APIClient`: `FormData`, errores normalizados, 401 → `auth:sessionExpired`, `BASE_URL` por entorno. `AuthManager` delega en `auth.service`.
- Fuente de verdad en los servicios + eventos `expense:created/updated/deleted` y `recommendation:read`.
- Estados de carga y error mínimos en las páginas.
- Spec §10 reescrita: endpoints en español, respuesta única `{ token, usuario }` para login y registro, rol `cliente`, errores `{ error, mensaje, codigo }`.
- Criterio de salida: pasar de `driver: "mock"` a `"http"` no toca ninguna página.
- Como quedó implementado: el mock es un backend simulado detrás de `APIClient` (`mocks/mockServer.js`), con el mismo contrato, tokens, 401/403/422 y persistencia en `localStorage`. El análisis de consumo y la asignación automática de perfil se calculan de verdad en `mocks/analytics.js` (son la referencia de lo que tiene que hacer el backend). Las rutas quedaron en inglés porque la consigna fija `/auth/login`, `/expenses` y `/tickets/upload`; los cuerpos van en español.

### Fase 2 — Router y layouts · ✅ completada (25/11/2026)
- `routes.js` declarativo, `beforeEach` por `meta.role`, parámetros `:id`, 404 en el lugar, `next` para volver después del login.
- `AppLayout` persistente por rol (reemplaza `UserShell`/`AdvisorShell` y los 4 fragmentos); se quitan los slots de los templates, los `_setText` del shell y `_bindLogoutButtons`.
- `core/TabRegistry.js` (decisión 3); se eliminan los globales `window.fintrack*`.
- Spec §4 y §11.5 actualizadas (la tabla de rutas pasa a ser `routes.js`).

### Fase 3 — Componentes genéricos (mobile-first) y gráficos · ✅ completada (25/11/2026)
- Átomos: `button`, `badge`, `avatar`, `trend`, `icon`.
- Moléculas: `statCard`, `alertItem`, `keyValueList`, `sectionHeader`, `mediaItem`, `formField`, `emptyState`/`loadingState`/`errorState`.
- Organismos: `DataTable`, `FilterBar`, `ChartCard`, `Modal`, `ConfirmDialog`, `ViewToggle`, `RecommendationForm`, `ClientCard`, `RecommendationCard`, `ProfileForm`, `TicketUploader`, servicio `Toast`.
- Migración página por página (dashboard del cliente + patrones → dashboard del asesor + clientes → historial → cargar gasto → recomendaciones → perfiles → perfiles de cuenta), **eliminando** el marcado, el JS y el CSS viejos de cada una (decisión 5).
- Gráficos nuevos de las specs (decisión 9).
- Accesibilidad incorporada en cada componente (O-19).
- Como quedó implementado: 5 átomos, 11 moléculas y 9 organismos (catálogo en la spec §7). Cambios respecto del catálogo previsto: no se creó `sectionHeader` (los títulos de sección son HTML estático de los templates), se sumaron `dateCard`, `profileSummary` y `RecommendationDialog` (Modal + RecommendationForm), y `ClientCard` y `RecommendationCard` quedaron como moléculas (render puro con acciones por delegación). La landing y el placeholder conservan su marcado (quedan para la Fase 4 de CSS).

### Fase 4 — CSS
- Escalas de espaciado y tipografía, temas sin duplicación, tokens sin uso fuera, colores de la landing tokenizados (R4).
- Arreglos R1 (navbar de la landing), R3 si quedó algo fuera de `ChartCard`, safe-area del toast, vh/dvh en los overrides.
- Borrado de las hojas por página que hayan quedado vacías y renombre de las clases `user-*` que sobrevivan.
- `ReglasCSS.md` reformulado (D-14) con la tabla única de breakpoints.

### Fase 5 — Funcionalidad que exige la consigna
- Edición y recategorización de gasto (`/cliente/gastos/:id`, `PUT /expenses/:id`).
- Análisis por cliente para el asesor (`/asesor/clientes/:id`): gastos, patrones, gastos inusuales y perfil asignado por el sistema.
- Carga de ticket contra `POST /tickets/upload` a través del servicio (OCR real cuando esté el backend).
- README y documentación de entrega (D-15).

---

## Anexo A — Cómo se midió

- **Arnés responsive** (en el scratchpad de la sesión, fuera del repo): una página del mismo origen que el front escribe la sesión mock en `localStorage` y carga `index.html#<ruta>` en un `iframe` de 360/768/1024/1440 × 800 px. Espera 3–3,5 s y mide `scrollWidth` contra `clientWidth`, los elementos que se salen del borde (excluyendo contenedores con scroll y overlays cerrados) y los contenedores con scroll interno. Se ejecutó con Firefox headless. Resultado: 0 desbordes de página en 56 mediciones; scroll interno solo en `.table-responsive` (Historial 360/768, Perfiles 360, Reportes 360).
- **Pruebas de comportamiento:** guard sin sesión y con rol equivocado; 404 + 2 clics en “Volver Atrás”; marcador en `.app-page`/`.app-navbar` antes de cambiar de pestaña en Reportes y antes de navegar entre dos páginas de usuario; 3 cambios de hash con 5 ms entre sí (caché caliente y fría); 8 navegaciones ida y vuelta contando `Chart.instances` y `.modal-backdrop`; tema claro midiendo colores computados; calendario con “Septiembre”.
- **Scripts estáticos:** clasificación de valores px/rem por propiedad, repetidos y distintos, media queries, colores fuera de tokens, tokens sin uso, clases CSS sin uso (contemplando clases dinámicas `prefijo--${…}`), exports y métodos sin uso, uso de `EventBus`/`StateManager`/`localStorage`.

## Anexo B — Valores de layout “problemáticos” (los 24)

`global.css:204-205` (toast `right/bottom`), `:213-214` (toast `min/max-width`); `layouts.css:122,128` (`minmax(230px)`); `components/dashboard-asesor.css:7` (`minmax(250px)`), `:263` (`min-height: 5.4rem` del textarea del modal); `components/page-shell.css` (`grid-template-columns: 30px 1fr` del alert-card); `components/asesor-inbox.css` (`min-height: 8rem`); `components/cargar-gasto.css` (`min-height: 9.5rem`); `components/perfil-usuario.css` (avatar 5.2rem ×2); `components/placeholder.css` (`max-width: 840px`, `620px`); `components/landing.css` (`max-width` 650/620/360/350/520 px; `top/right: -8px` del índice de paso; `top: -16px` del badge de plan; `top: 1px` del check de lista). Ninguno produce desborde en los anchos medidos. Son candidatos a escala o token, no bugs.
