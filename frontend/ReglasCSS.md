# ReglasCSS

## Objetivo
Establecer reglas de implementacion responsive para FinTrack y registrar los cambios aplicados en esta primera etapa de migracion desde layout rigido (px fijos) a layout fluido (rem, clamp, %, vh/dvh y tokens compartidos).

## Politicas seguidas
1. Evitar numeros magicos repetidos en layout y timing.
2. Centralizar valores compartidos en variables globales o constantes JS.
3. Mantener px solo para detalles de trazo fino (ejemplo: bordes de 1px) o microajustes iconograficos.
4. Priorizar unidades fluidas (`clamp`, `%`, `rem`, `dvh`) para alturas, paddings, overlays y elementos flotantes.
5. Usar fallback `vh` + `dvh` cuando la altura del viewport sea sensible en mobile.
6. No alterar arquitectura SPA, rutas ni comportamiento funcional de negocio durante el refactor visual.

## Cambios aplicados en esta iteracion

### 1) Tokens globales de layout y overlays
Archivo: `frontend/assets/css/global.css`
- Se agregaron tokens globales:
  - `--app-shell-top-offset`
  - `--page-inline-padding`
  - `--page-block-end`
  - `--anchor-extra-offset`
  - `--floating-edge-gap`
  - `--floating-bottom-gap`
  - `--chat-fab-size`
  - `--floating-teaser-bottom-gap`
  - `--chat-panel-max-height`
  - `--chart-canvas-min-height`
  - `--chart-canvas-min-height-compact`
  - `--kpi-card-min-height`

### 2) Shell principal sin compensaciones fijas
Archivo: `frontend/assets/css/layouts.css`
- `app-route-container`, `route-view` y `app-page` usan `min-height: 100vh` + `min-height: 100dvh`.
- `app-main--wide` paso de `padding: 98px 18px 34px` a:
  - `padding: var(--app-shell-top-offset) var(--page-inline-padding) var(--page-block-end)`.
- Se elimino override mobile hardcodeado de `90px 14px 28px`.

### 3) Paginas internas con offset fluido
Archivos:
- `frontend/assets/css/components/patrones.css`
- `frontend/assets/css/components/recomendaciones.css`
- `frontend/assets/css/components/perfiles.css`
- `frontend/assets/css/components/dashboard-asesor.css`

Cambios:
- Se reemplazo `padding-top: 98px` por `var(--app-shell-top-offset)`.
- En `patterns-main`, el padding completo ahora usa tokens globales.
- En `patterns-kpi-card`, `min-height: 210px` paso a `var(--kpi-card-min-height)`.
- En `recommendation-toolbar select`, `min-width` fijo paso a `min-inline-size` con `clamp` y en mobile ancho al 100%.

### 4) Dashboard usuario: overlays y paneles flotantes
Archivo: `frontend/assets/css/components/dashboard-usuario.css`
- `advisor-teaser`:
  - `right` y `bottom` migrados a tokens (`--floating-edge-gap`, `--floating-teaser-bottom-gap`).
  - ancho migrado a formula fluida (`min(20rem, calc(100vw - ...))`).
- `user-chat-fab`:
  - `right`/`bottom` migrados a tokens.
  - `width`/`height` migrados a `--chat-fab-size`.
- `chat-messages`:
  - `max-height` migrado a `--chat-panel-max-height`.
- `user-chart-grid .chart-card canvas`:
  - altura minima migrada a `--chart-canvas-min-height-compact`.

### 5) Componentes compartidos de charts
Archivo: `frontend/assets/css/components/page-shell.css`
- `chart-card canvas`:
  - `min-height: 260px` paso a `var(--chart-canvas-min-height)`.

### 6) Landing y modal de registro
Archivo: `frontend/assets/css/components/landing.css`
- First fold:
  - `--landing-first-fold-offset` paso de fijo en px a `clamp`.
  - `landing-main` (padding y gap) migrado a reglas fluidas.
  - `landing-video-card` (padding y min-height) migrado a `clamp`.
  - `landing-brands` y su titulo ahora usan espaciado fluido.
- Anchors:
  - `scroll-margin-top` ahora depende de `--anchor-extra-offset` global (sin hardcode de 12px).
- Modal registro:
  - `register-modal-dialog` con `max-width` y margenes fluidos.
  - `registerModal .modal-content` y `.modal-body` con fallback `vh` + `dvh`.
  - `register-role-item` mobile con `min-width` fluido via `clamp`.

### 7) JS: centralizacion de magic numbers UI
Archivos:
- `frontend/utils/constants.js`
- `frontend/app.js`
- `frontend/core/AuthManager.js`

Cambios:
- Nuevas constantes:
  - `UI_LAYOUT.LANDING_SCROLL_OFFSET`
  - `UI_TIMING.TOAST_DISMISS_MS`
  - `UI_TIMING.AUTH_LOGIN_DELAY_MS`
  - `UI_TIMING.AUTH_REGISTER_DELAY_MS`
- `app.js`:
  - `extraOffset` de scroll landing ahora viene de `UI_LAYOUT`.
  - timeout del toast ahora usa `UI_TIMING`.
- `AuthManager.js`:
  - latencias mock de login/register ya no estan hardcodeadas; usan `UI_TIMING`.

## Criterios de aceptacion usados en esta etapa
1. No quedan compensaciones top fijas `98px/90px` en shell principal ni pantallas principales intervenidas.
2. Componentes flotantes de usuario se posicionan con tokens y respetan safe-area.
3. Scroll a secciones de landing mantiene compensacion dinamica sin numero magico local.
4. Timeouts visuales y latencias mock pasan a constantes compartidas.

## Reglas para cambios futuros
1. Si un valor de layout se repite 2 o mas veces, debe convertirse en token global.
2. Evitar crear nuevos `padding-top` de compensacion manual por pagina.
3. Para overlays flotantes, usar siempre:
   - token de margen lateral
   - token de margen inferior con `env(safe-area-inset-bottom)`
4. Para alturas de paneles/canvas/chat, preferir `clamp` antes que `height`/`max-height` fijo.
5. Cualquier nuevo timeout UI debe definirse en `UI_TIMING`.

## Pendiente para siguientes etapas
1. Revisar grillas internas del dashboard asesor para hacerlas mas elasticas en anchos intermedios.
2. Completar normalizacion de escalas tipograficas mixtas en perfiles/recomendaciones.
3. Ejecutar matriz completa de QA responsive (viewport, zoom, anchors y smoke funcional).
