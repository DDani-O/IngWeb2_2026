# Frontend — SPA vanilla JS

Antes de escribir código leer `PrincipiosDesarrollo.md` (SOLID, nomenclatura, anti-patrones, checklist de commit) y `ReglasCSS.md` (tokens de layout y reglas CSS). Spec general: `../especificaciones/EspecificacionDesarrolloFront.md`; spec de cada página: `../especificaciones/paginasFront/NN-*.md`.

## Estructura

- `index.html` + `app.js` — bootstrap: inicializa `ThemeManager`, `AuthManager`, configura el `Router` (rutas por hash, guards por rol) y monta los shells.
- `core/` — singletons y clases base: `Router`, `EventBus`, `StateManager`, `AuthManager` (mock, sesión en `localStorage`), `APIClient` (fetch; `API_CONFIG.BASE_URL` en `utils/constants.js`), `Component`, `PageController`, `ThemeManager`.
- `pages/<rol>/` — cada pantalla = `nombre.html` (template, kebab-case) + `NombrePage.js` (controlador, PascalCase). Roles: `public/`, `usuario/`, `asesor/`.
- `components/` — `layout/`, `navigation/` (shells de usuario y asesor), `modals/`, `core/templateLoader.js`.
- `assets/css/` — `global.css`, `layouts.css`, `themes/` (light/dark), `components/<pagina>.css`.
- `utils/` — `constants.js` (`ROUTES`, `EVENTS`, `UI_TIMING`, `API_CONFIG`), `formatters.js`, `helpers.js`, `validators.js`.

## Reglas clave

- ES modules nativos, sin bundler ni frameworks. Sin dependencias npm en el front.
- Comunicación entre módulos vía `EventBus`; estado compartido en `StateManager`. No acoplar páginas entre sí.
- Toda llamada HTTP pasa por `APIClient`; nunca `fetch` directo desde una página.
- Rutas, eventos, timeouts y magic numbers van a `utils/constants.js` (todo timeout UI en `UI_TIMING`).
- CSS: variables/tokens, nomenclatura BEM, sin estilos inline. Valores de layout repetidos → token global. Overlays con `env(safe-area-inset-bottom)`; alturas con `clamp()`.
- JSDoc en métodos públicos; métodos privados con prefijo `_`; manejo de errores con `try/catch`; sin `console.log` sobrante.
- Al reemplazar mocks por el backend real, mantener la forma de los datos que esperan las páginas o adaptar en una sola capa (servicio/`APIClient`), no en cada página.

## Verificación

No hay tests automatizados. Después de un cambio: levantar `python3 -m http.server 5500` y recorrer el checklist manual del `README.md` (login usuario/asesor, guards de rutas, recomendaciones, perfiles, logout), revisando la consola del navegador sin errores.
