# Frontend — SPA vanilla JS

Antes de escribir código leer `PrincipiosDesarrollo.md` (SOLID, nomenclatura, anti-patrones, checklist de commit) y `ReglasCSS.md` (tokens de layout y reglas CSS). Spec general: `../especificaciones/EspecificacionDesarrolloFront.md`; spec de cada página: `../especificaciones/paginasFront/NN-*.md`.

## Estructura

- `index.html` + `app.js` — bootstrap: inicializa `ThemeManager`, `AuthManager`, configura el `Router` (rutas por hash, guards por rol) y monta los shells.
- `core/` — singletons y clases base: `Router`, `EventBus`, `StateManager`, `AuthManager` (sesión en `localStorage`, delega en `auth.service`), `APIClient` (único punto de red; driver `mock` o `http` según `API_CONFIG` en `utils/constants.js`), `Component`, `PageController` (incluye `_loadData`/`_runAction` para carga, errores y acciones), `ThemeManager`.
- `services/` — un servicio por dominio (`auth`, `profile`, `categories`, `expenses`, `tickets`, `recommendations`, `analysis`, `clients`) y `adapters.js`, la **única** capa que traduce el contrato en español de la API al modelo de la UI.
- `mocks/` — backend simulado (`mockServer.js`, `seed.js`, `analytics.js`) con el mismo contrato que NestJS (spec §10). Guarda sus datos en `localStorage` (`fintrack.mockDb`).
- `content/` — contenido estático que no vive en la BD (textos y comparativa de los perfiles de gasto).
- `pages/<rol>/` — cada pantalla = `nombre.html` (template, kebab-case) + `NombrePage.js` (controlador, PascalCase). Roles: `public/`, `cliente/`, `asesor/`.
- `components/` — `layout/`, `navigation/` (shells de usuario y asesor), `modals/`, `core/templateLoader.js`.
- `assets/css/` — `global.css`, `layouts.css`, `themes/` (light/dark), `components/<pagina>.css`.
- `utils/` — `constants.js` (`ROUTES`, `ROLES`, `EVENTS`, `UI_TIMING`, `API_CONFIG`, enums de la BD), `formatters.js`, `helpers.js`, `validators.js`, `html.js` (plantillas con escapado por defecto: todo `innerHTML` con datos usa `html\`...\``).

## Reglas clave

- ES modules nativos, sin bundler ni frameworks de componentes. Sin dependencias npm en el front. Bootstrap 5 y Chart.js por CDN están permitidos.
- Comunicación entre módulos vía `EventBus`; estado compartido en `StateManager`. No acoplar páginas entre sí.
- Las páginas solo usan **servicios** (`services/*.service.js`); nunca `APIClient`, `fetch` ni `mocks/` directo. Toda llamada de red pasa por `APIClient`.
- Contrato de la API: `../especificaciones/EspecificacionDesarrolloFront.md` §10 (rutas en inglés, cuerpos en español). Si cambia, se ajustan el mock y `adapters.js` en el mismo cambio.
- Rutas, eventos, timeouts y magic numbers van a `utils/constants.js` (todo timeout UI en `UI_TIMING`).
- CSS: variables/tokens, nomenclatura BEM, sin estilos inline. Valores de layout repetidos → token global. Overlays con `env(safe-area-inset-bottom)`; alturas con `clamp()`.
- JSDoc en métodos públicos; métodos privados con prefijo `_`; manejo de errores con `try/catch`; sin `console.log` sobrante.
- Para usar el backend real: `API_CONFIG.DRIVER = "http"` (o `localStorage.setItem("fintrack.apiDriver", "http")` para probar) y completar `API_CONFIG.BASE_URLS`. Ninguna página cambia.

## Verificación

No hay tests automatizados. Después de un cambio: levantar `python3 -m http.server 5500` y recorrer el checklist manual del `README.md` (login usuario/asesor, guards de rutas, recomendaciones, perfiles, logout), revisando la consola del navegador sin errores.
