# Frontend — SPA en JavaScript vanilla

HTML, CSS y JavaScript con ES modules nativos, sin bundler, sin dependencias npm y sin frameworks de componentes. Bootstrap 5, Chart.js y Font Awesome se cargan por CDN. Deploy: https://fintrack-iua.netlify.app. Visión general: [README principal](../README.md); contrato de la API: [backend/README.md §3](../backend/README.md#3-contrato-de-la-api).

```bash
python3 -m http.server 5500    # desde frontend/ → http://localhost:5500 (no abrir con file://)
```

## 1. Estructura

| Ruta | Qué hay |
|---|---|
| `index.html` · `app.js` | Arranque: tema, sesión, router con layouts y guard por rol, sesión expirada, toasts. |
| `routes.js` | Tabla de rutas declarativa (§2). |
| `core/` | `Router`, `Component`, `PageController`, `APIClient`, `AuthManager`, `EventBus`, `ThemeManager`, `TabRegistry`, `templateLoader`. |
| `services/` | Un servicio por dominio (`auth`, `profile`, `categories`, `expenses`, `tickets`, `recommendations`, `analysis`, `clients`) y `adapters.js`. |
| `mocks/` | Backend simulado: `mockServer.js` (rutas y validaciones), `seed.js` (datos), `analytics.js` (reglas del análisis). |
| `components/` | Biblioteca de componentes (§4), cada uno con su CSS al lado. |
| `pages/{public,cliente,asesor}/` | Cada pantalla: `nombre.html` (template, kebab-case) + `NombrePage.js` (controlador, PascalCase). |
| `content/` | Contenido fijo que no vive en la base (textos y comparativa de los perfiles de gasto). |
| `assets/css/` | Tokens, layout, tema claro y estilos propios de cada página (§5). |
| `assets/video/` | Video de demo de la landing: MP4 (H.264) y WebM de respaldo, sin audio, y su portada. |
| `utils/` | `constants.js` (rutas, roles, eventos, tiempos, configuración de la API, enums de la base), `formatters.js`, `validators.js`, `helpers.js` y `html.js`. |

## 2. Ruteo y layouts

- **Ruteo por hash** (`#/cliente/dashboard`), así Netlify sirve todo sin redirects.
- **`routes.js` es la tabla de rutas.** Cada ruta tiene `path` (admite `:id`), `layout` (`public`, `client`, `advisor`) y `meta.role` (las hijas heredan los dos), `title`, `page` (import diferido) y, opcional, `activeNav` (para las rutas de detalle).
- **Layouts persistentes:** `PublicLayout` y `AppLayout`. Al navegar dentro del mismo rol solo cambia la página.
- **Guard global** en `app.js`:
  - sin sesión, manda a la landing con `next`;
  - con otro rol, manda al dashboard propio.
  - Es solo experiencia de usuario: la seguridad la impone el backend con el token.
- **404:** una ruta inexistente muestra "Ruta no encontrada" en el lugar.
- **Pestañas:** desde el dashboard, los links a secciones de detalle (patrones, historial, recomendaciones, perfiles) abren en pestaña nueva. `TabRegistry` recuerda qué ruta tiene cada pestaña: al "volver al dashboard" desde una secundaria, si el dashboard ya está abierto en otra, esa pestaña se cierra en vez de duplicarlo.

**Agregar una página:**
1. Crear `pages/<rol>/NombrePage.js`, que extiende `PageController` y declara `static template = "./pages/<rol>/nombre.html"`.
2. Crear el template.
3. Sumar la ruta en `routes.js` y la constante en `ROUTES` (`utils/constants.js`).

`PageController` resuelve lo común:
- `_loadData(task)`: estados de carga, vacío y error con reintento;
- `_runAction(task, { button, successMessage })`: deshabilita el botón, muestra el toast y avisa los errores;
- `_showCharts(charts)`: dibuja los gráficos;
- `_isAlive()`: evita escribir en una página que ya se destruyó.

## 3. Servicios, adapters y drivers

- **Las páginas solo usan servicios** (`services/*.service.js`), nunca `APIClient`, `fetch` ni `mocks/` directo. Toda llamada de red pasa por `APIClient`.
- **`adapters.js` es la única capa que traduce** el contrato en español (`fecha_gasto`, `nombre_completo`) al modelo de la UI (`date`, `fullName`) y al revés. Si el contrato cambia, se toca acá y en el mock, no en las páginas.
- **`APIClient` tiene dos drivers**, elegidos por entorno en `API_CONFIG` (`utils/constants.js`):

  | Dónde | Driver | API |
  |---|---|---|
  | Deploy (cualquier host que no sea `localhost`) | siempre `http` | `API_CONFIG.BASE_URLS.production` |
  | `localhost` / `127.0.0.1` | `mock` por defecto | `http://localhost:3000/api/v1` con `http` |

  Para cambiarlo en local: `localStorage.setItem("fintrack.apiDriver", "http")` y recargar (`"mock"` para volver).
- **El backend simulado** (`mocks/`) implementa el mismo contrato que NestJS (tokens, roles, validaciones, errores y reglas del análisis) y guarda sus datos en `localStorage` (`fintrack.mockDb`).
  - Datos: 8 clientes con 7 meses de gastos generados a partir de hoy; cuentas `cliente@fintrack.local` y `asesor@fintrack.local`, clave `Fintrack2026*`.
  - Si los datos guardados son de otra versión (`SEED_VERSION`) o les falta una colección, se regenera solo. Al cambiar la forma de los datos del seed, se sube `SEED_VERSION`.
- **Sesión:** `AuthManager` guarda el token en `localStorage`. Un 401 `NO_AUTENTICADO` emite `AUTH.SESSION_EXPIRED` y `app.js` cierra la sesión y vuelve a la landing.

## 4. Componentes

Organizados con **Atomic Design**:
- átomos y moléculas: piezas sin estado;
- organismos: piezas con comportamiento;
- layouts.

Rigen dos reglas de comunicación: **los datos bajan por props y los avisos suben por eventos**.

- **Átomos y moléculas son funciones** que reciben props y devuelven HTML escapado, por ejemplo `badge({ text: "Alta", tone: "danger" })`.
- **Organismos son clases `Component`:**
  - el padre los monta con `this.mountChild(Clase, elemento, props)` (se destruyen con la página) y los actualiza con `update(props)`;
  - avisan hacia arriba con `this.dispatch("nombre-evento", detalle)` (un `CustomEvent` que burbujea) y el padre escucha con `this.listen(elemento, "nombre-evento", handler)`;
  - un organismo nunca modifica datos del padre.
- **Plantillas con escapado por defecto:** todo `innerHTML` con datos se arma con ``html`...` `` (`utils/html.js`). Los valores se escapan salvo que ya sean `SafeHtml` (lo que devuelve otro componente). `attrs()` arma atributos y `cx()` une clases.
- **Slots:** contenido inyectable por props `SafeHtml` (`body`, `footer`, `trailing`) o montando un componente dentro de otro (`Modal.bodyElement`).
- **Acciones en listas:** los botones llevan `data-action` y `data-id`; el contenedor atiende por delegación.

| Nivel | Componente | Props → eventos |
|---|---|---|
| Átomo | `button` | `label, variant (primary·ghost·danger), size, icon, type, href, newTab, action, id, block, disabled` |
| Átomo | `badge` · `avatar` · `trend` · `icon` | `text, tone, icon` · `name, size` · `value, label, goodWhen` · `name, label` |
| Molécula | `statCard` | `label, value, format (currency·number·percent·text), emoji, subtitle, trend` |
| Molécula | `alertItem` · `keyValueList` · `mediaItem` | `title, description, tone, emoji` · `items, variant` · `title, subtitle, leading, trailing, variant` |
| Molécula | `formField` / `formGrid` | `id, name, label, type, value, options, required, readonly, hint, width, inputAttrs` |
| Molécula | `infoCard` · `dateCard` · `profileSummary` | `title, icon, subtitle, body, footer, highlight` · `date` · `fullName, email, items, footer` |
| Molécula | `clientCard` · `recommendationCard` | `client, actions` · `recommendation, actions` |
| Molécula | `emptyState` · `loadingState` · `errorState` | estados de `PageController` (`errorState` trae el botón `data-action="retry"`) |
| Molécula | `spendingAnalysis` | indicadores, gráficos, ranking e inusuales del `analisis`, compartidos por los dashboards, Patrones y el detalle del cliente |
| Organismo | `DataTable` | `columns, rows, rowKey, actions, empty, caption` → `row-action {action, id, row}`; tarjetas en mobile, tabla desde 768 px |
| Organismo | `FilterBar` | `fields (search·select), values, idPrefix` → `filters-change {values}` |
| Organismo | `ChartCard` | `title, icon, type (bar·line·doughnut·pie), labels, datasets, valueFormat, height, caption, link` |
| Organismo | `Modal` + `confirmDialog()` | `title, size, body, footer` → `modal-close`; `confirmDialog()` devuelve `Promise<boolean>` |
| Organismo | `ViewToggle` | `modes, value, label` → `view-change {value}` |
| Organismo | `RecommendationForm` · `RecommendationDialog` | `recipients, selectedId` → `recommendation-submit` · modal con el formulario |
| Organismo | `ProfileForm` | `fields, values, idPrefix, extraActions` → `profile-submit`, `profile-reset` |
| Organismo | `ExpenseForm` · `TicketUploader` | formulario de gasto · `accept, maxSizeMb` → `ticket-analyze {file}` (click, teclado y arrastrar) |
| Organismo | `AuthModals` | modales de login y registro de la landing → `auth-success {user}` |
| Layout | `AppLayout` · `PublicLayout` | barra superior, menú lateral por rol y tarjeta del usuario · navbar pública |
| Feedback | `createToaster()` · `confirmExpenseDeletion()` | `showToast(message, tone)` · confirmación de borrado de un gasto |

## 5. Estilos

| Archivo | Contenido |
|---|---|
| `assets/css/global.css` | Tokens en `:root` (tema oscuro por defecto), reset y utilidades. |
| `assets/css/themes/light.css` | Solo redefine los tokens de color para `[data-theme="light"]`. |
| `assets/css/layouts.css` | Layout de la app (navbar, sidebar, `section-block`) y patrones compartidos (`dashboard-hero`, `two-column`, `section-header`, `tag-list`). |
| `components/**/<componente>.css` | Un archivo por componente, importados por `components/components.css`. |
| `assets/css/pages/<pagina>.css` | Solo lo propio de una página (landing, placeholder, perfiles, patrones). |

Si un estilo aparece en dos páginas, es un componente o un patrón de `layouts.css`; no se copia.

**Tokens, nada de valores sueltos:**
- Espaciado: `--space-1…8` = 4, 8, 12, 16, 20, 24, 32 y 48 px.
- Tipografía: `--font-size-xs` 12, `sm` 14, `base` 16, `md` 18, `lg` 20 px, y los fluidos `xl`, `2xl`, `3xl`, `display` (con `clamp`).
- Radios: `--radius-sm · md · lg · xl · pill · round`.
- Colores: siempre tokens (`--text-*`, `--surface-*`, `--border-*`, `--color-*`, `--action-*`, `--field-*`, `--chart-1…8`). Los tonos derivados con `color-mix(in srgb, var(--color-x) N%, transparent)`. Un color literal fuera de `global.css` o `light.css` rompe el tema claro.
- Layout: `--nav-height`, `--container-max`, `--app-shell-top-offset`, `--page-inline-padding`, `--floating-bottom-gap` (incluye `env(safe-area-inset-bottom)`).
- Se permiten valores fijos en bordes de 1–3 px, íconos y controles táctiles, anchos máximos de lectura y `calc()` a partir de tokens. Cualquier otra excepción lleva un comentario.

**Responsive:**
- **Mobile-first** (`min-width`) en todo componente o patrón nuevo: la base es para 320–575 px. La landing conserva `max-width`.
- **Breakpoints únicos**, los de Bootstrap: 576 · 768 · 992 · 1200 px (CSS no admite variables en `@media`). No se agregan otros.
- **Grillas** con `minmax(0, 1fr)` y `min-width: 0` en los puntos de montaje, para que un gráfico o un texto largo no estiren la grilla.
- **Alturas de viewport** con el par `vh` (fallback) y `dvh`.
- **Gráficos:** el alto lo da el contenedor (`.chart-card__canvas--sm/md/lg`), con `maintainAspectRatio: false`.

**Nombres y prácticas:**
- **BEM simple:** `.bloque`, `.bloque__elemento`, `.bloque--modificador`. No se reutilizan nombres de Bootstrap (`badge`, `card`, `table`, `alert`, `modal`); Bootstrap queda para grid, modales, offcanvas y controles de formulario.
- **Sin estilos inline** ni `element.style` desde JS; sin `!important` salvo para pisar a Bootstrap, con comentario.
- **Accesibilidad:** foco visible (`:focus-visible`) en los controles propios y `prefers-reduced-motion` en las animaciones.

## 6. Principios del front

Además de los comunes ([README §11](../README.md#11-principios-de-desarrollo)):

- **Las páginas componen y orquestan:** piden datos a los servicios, pasan props y reaccionan a eventos. El marcado repetido va a un componente, no se copia entre páginas.
- **Sin acoplamiento entre páginas.** Para hechos de aplicación entre módulos está el `EventBus`, solo con los eventos que alguien escucha: `AUTH.SESSION_EXPIRED`, `THEME.CHANGED`, `PROFILE.UPDATED`, `API.WAKING` y `API.AWAKE`. Un evento nuevo entra en el mismo cambio que su listener.
- **No hay estado global.** Cada página carga sus datos; lo que persiste (sesión, tema, borrador del gasto, driver) va en `localStorage` con las claves de `STORAGE_KEYS`.
- **Nada suelto:** rutas, eventos, tiempos y textos fijos van a `utils/constants.js` (los tiempos de la UI en `UI_TIMING`).
- **Ciclo de vida limpio:** los listeners se registran con `listen()` y los hijos con `mountChild()`, así `destroy()` los libera al salir de la página. Después de un `await`, chequear `_isAlive()` antes de tocar el DOM.
- **Errores:** las cargas van por `_loadData` y las acciones por `_runAction`, que muestran estados y mensajes consistentes; nunca un `catch` vacío.
- **Nombres:** clases y páginas en PascalCase, funciones y variables en camelCase, constantes en MAYÚSCULAS, privados con prefijo `_`, templates y CSS en kebab-case. Sin `console.log` sobrante.

## 7. Arranque en frío

El backend en el plan gratuito de Render se duerme tras 15 minutos sin uso y tarda cerca de un minuto en despertar. Con el driver `http`:
1. `APIClient.wakeUp()` llama a `GET /health` al abrirse la app, con hasta `COLD_START_TIMEOUT_MS` (90 s).
2. Los demás pedidos esperan a esa respuesta.
3. Si tarda más de `COLD_START_NOTICE_MS` (2,5 s), se emite `API.WAKING` y se muestra "Despertando el servidor…" hasta `API.AWAKE`.

La carga de tickets usa `UPLOAD_TIMEOUT_MS` (30 s) porque espera a la IA.

## 8. Verificación manual

No hay tests automáticos del front. Después de un cambio:
1. Servir con `python3 -m http.server 5500` y recorrer la [prueba manual del README](../README.md#10-prueba-manual-y-guion-de-demo) con el mock y, si toca datos de la API, con el backend local (driver `http`).
2. Revisar la consola del navegador: sin errores.
3. Si el cambio es visual, recorrer 320, 375, 768, 1024 y 1440 px en los dos temas: sin scroll horizontal y con contraste AA (4,5:1).
4. Confirmar que no quedan valores literales de espaciado, tipografía o color fuera de los tokens.
