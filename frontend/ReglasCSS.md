# Reglas CSS — FinTrack

Reglas obligatorias para escribir estilos. Vigentes desde la Fase 4 del refactor (`../especificaciones/DiagnosticoRefactor.md` §7). Al final hay un breve historial de cambios.

## 1. Dónde va cada estilo

| Archivo | Contenido |
|---|---|
| `assets/css/global.css` | Tokens (`:root`, tema oscuro por defecto), reset y utilidades de texto. |
| `assets/css/themes/light.css` | Solo redefine tokens de color para `[data-theme="light"]` (más ajustes puntuales de color). |
| `assets/css/layouts.css` | Estructura del layout de la app (navbar, sidebar, `app-main`, `section-block`, `hero-panel`) y patrones de página compartidos (`dashboard-hero`, `two-column`, `section-actions`, `section-header`, `tag-list`). |
| `components/<nivel>/<componente>.css` | Estilos de cada componente, al lado de su JS. Los importa `components/components.css`. |
| `assets/css/pages/<pagina>.css` | Solo lo que es propio de una página y no es reutilizable (landing, placeholder, perfiles, puntos de color de patrones). |

Si un estilo aparece en dos páginas, es un componente o un patrón de `layouts.css`, no se copia.

## 2. Tokens: nada de valores sueltos

- **Espaciado** (`gap`, `padding`, `margin`): siempre `var(--space-1…8)` → 4, 8, 12, 16, 20, 24, 32 y 48 px.
- **Tipografía** (`font-size`): siempre `var(--font-size-*)`: `xs` 12 · `sm` 14 · `base` 16 · `md` 18 · `lg` 20 px, y los fluidos `xl`, `2xl`, `3xl`, `display` (con `clamp`, para que los títulos no rompan en mobile).
- **Radios:** `--radius-sm` · `md` · `lg` · `xl` · `pill` · `round`.
- **Colores:** siempre tokens de color (`--text-*`, `--surface-*`, `--border-*`, `--color-*`, `--action-*`, `--field-*`, `--navbar-bg`, `--modal-surface`). Para tonos derivados se usa `color-mix(in srgb, var(--color-x) N%, transparent)`. Un color literal fuera de `global.css` o `light.css` rompe el tema claro.
- **Layout compartido:** `--nav-height`, `--container-max`, `--app-shell-top-offset`, `--page-inline-padding`, `--page-block-end`, `--floating-edge-gap`, `--floating-bottom-gap`.
- **Se permiten valores fijos** para: bordes de 1–3 px, tamaños de íconos y controles táctiles (mínimo 2.25–2.75rem), anchos máximos de lectura y offsets calculados a partir de tokens (`calc(var(--nav-height) + …)`). Cualquier otra excepción lleva un comentario que la justifique.

## 3. Responsive

- **Breakpoints únicos** (los de Bootstrap 5):

  | Nombre | Mobile-first (componentes nuevos) | Desktop-first (solo landing y legado) |
  |---|---|---|
  | sm | `@media (min-width: 576px)` | `@media (max-width: 575px)` |
  | md | `@media (min-width: 768px)` | — |
  | lg | `@media (min-width: 992px)` | `@media (max-width: 991px)` |
  | xl | `@media (min-width: 1200px)` | — |

  CSS no permite usar variables dentro de `@media`, por eso esta tabla es la referencia. No se agregan breakpoints nuevos.
- **Mobile-first** en todo componente o patrón nuevo: estilos base para 320–575 px y `min-width` para pantallas mayores. La landing conserva `max-width`; si se reescribe, pasa a mobile-first.
- **Grillas:** columnas con `minmax(0, 1fr)` y `min-width: 0` en los puntos de montaje, para que un canvas o un texto largo no estire la grilla. Ningún layout debe desbordar en 320 px.
- **Alturas de viewport:** siempre el par `vh` y `dvh` (primero `vh` como fallback, después `dvh`), también dentro de las media queries.
- **Gráficos:** el alto lo define el contenedor (`.chart-card__canvas--sm/md/lg`); Chart.js usa `maintainAspectRatio: false`.
- **Flotantes** (toast): tokens de borde y `--floating-bottom-gap`, que incluye `env(safe-area-inset-bottom)`.
- **Navbars:** alto fijo `--nav-height` (incluido el borde); el contenido y los modales se desplazan con ese token.

## 4. Nombres y prácticas

- BEM simple: `.bloque`, `.bloque__elemento`, `.bloque--modificador`. Las clases de los componentes no reutilizan nombres de Bootstrap (`badge`, `card`, `table`, `alert`, `modal`).
- Sin estilos inline ni `element.style` desde JS (la única excepción es el router limpiando lo que deja Bootstrap).
- Sin `!important`, salvo para pisar utilidades de Bootstrap (y con comentario).
- Accesibilidad: foco visible (`:focus-visible`) en todo control propio y `prefers-reduced-motion` en animaciones.

## 5. Verificación de un cambio de estilos

1. Recorrer las rutas en 320, 360, 768, 1024 y 1440 px sin scroll horizontal.
2. Revisar ambos temas (oscuro y claro, desde Perfil de cuenta); el texto tiene que mantener contraste AA (4.5:1).
3. Confirmar que no quedan valores literales de espaciado, tipografía o color fuera de los tokens.

## Historial

- **Etapa inicial:** migración de px fijos a tokens de layout (`--app-shell-top-offset`, flotantes con safe-area, `clamp` en alturas, timing en `UI_TIMING`).
- **Fase 0:** se eliminaron el teaser y el chat del asesor, con sus tokens.
- **Fase 3:** biblioteca de componentes con CSS mobile-first; se borraron 8 hojas por página; gráficos con alto por contenedor; toast con safe-area.
- **Fase 4:** escalas de espaciado y tipografía (de 49 a 9 tamaños de fuente; 0 espaciados ni colores literales), tema claro aplicado a la landing (antes mostraba texto oscuro sobre fondo oscuro), navbar de la landing con alto fijo y un solo botón en mobile, par `vh`/`dvh` completo, borrado de `themes/dark.css` (repetía `:root`), de tokens sin uso y del `scroll-margin` sin efecto; `assets/css/components/` pasó a `assets/css/pages/`.
