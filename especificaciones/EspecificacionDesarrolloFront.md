# 📋 ESPECIFICACIÓN DE DESARROLLO FRONTEND - FinTrack

**Plataforma Inteligente de Gestión de Gastos Personales - Frontend**

**Versión:** 1.0  
**Fecha:** 18 de abril de 2026  
**Estado:** Especificación Definitiva para Implementación desde Cero

---

## 📑 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Principios de Desarrollo](#2-principios-de-desarrollo)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Arquitectura del Sistema](#5-arquitectura-del-sistema)
6. [Patrones de Diseño](#6-patrones-de-diseño)
7. [Sistema de Componentes](#7-sistema-de-componentes)
8. [Gestión de Estilos](#8-gestión-de-estilos)
9. [Sistema de Eventos](#9-sistema-de-eventos)
10. [Endpoints del Backend](#10-endpoints-del-backend)
11. [Páginas y Flujos de Usuario](#11-páginas-y-flujos-de-usuario)
12. [Decisiones Técnicas](#12-decisiones-técnicas)

---

## 1. RESUMEN EJECUTIVO

### Visión General

FinTrack es una **aplicación web de gestión de finanzas personales** que permite a los usuarios registrar gastos mediante tickets digitalizados (OCR) y a asesores financieros analizar patrones de consumo.

### Objetivo de esta Especificación

Este documento detalla la **arquitectura, estructura y principios del frontend** para permitir una implementación limpia, mantenible y escalable **desde cero**, eliminando toda deuda técnica acumulada en iteraciones anteriores.

### Audiencia Objetivo

- Desarrolladores de IA que generarán el código
- Desarrolladores humanos que mantendrán el código
- Asesores técnicos del proyecto

### Restricciones Técnicas Imperativos

| Restricción | Descripción |
|-------------|-------------|
| **NO Frameworks** | Prohibido React, Vue, Angular, Svelte, etc. |
| **Tecnologías Base** | HTML5, CSS3, JavaScript ES6+ vanilla |
| **Librerías Permitidas** | Bootstrap 5 (vía CDN), Chart.js si aplica |
| **Módulos** | ES6 modules (import/export) nativos en navegador |
| **Compatibilidad** | Chrome, Firefox, Safari últimas versiones |

### Beneficios Esperados

✅ **Código limpio** - Sin deuda técnica  
✅ **Mantenible** - Arquitectura clara y documentada  
✅ **Desacoplado** - Separación HTML/CSS/JS total  
✅ **Escalable** - Patrones de diseño aplicados  
✅ **Sin dependencias complejas** - Solo librerías mínimas  

---

## 2. PRINCIPIOS DE DESARROLLO

### Referencia

Consultar documento dedicado: **`frontend/PrincipiosDesarrollo.md`**

Documento complementario obligatorio para estilos y responsive: **`ReglasCSS`**

### Resumen Ejecutivo de Principios

1. **Desacoplamiento Total** - Cada archivo JS, CSS e HTML independiente
2. **Composición antes que Herencia** - Las pantallas se arman componiendo componentes chicos con props y eventos; la herencia se reserva para la base de ciclo de vida (`Component`)
3. **Patrón Single Responsibility** - Una clase = una responsabilidad
4. **Eventos Desacoplados** - EventBus para comunicación entre módulos
5. **Configuración Centralizada** - Constantes en `utils/constants.js`
6. **Naming Conventions** - Convenciones claras para clases, métodos, variables
7. **CSS BEM Simplificado** - `.component-name`, `.component-name__element`
8. **No Inline Styles** - Todos los estilos en CSS separado
9. **Bootstrap como Base** - Usar clases de Bootstrap antes de crear custom
10. **Documentación en Código** - Comments claros en métodos complejos

---

## 3. STACK TECNOLÓGICO

### Tecnologías Core

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **HTML5** | 2024 | Estructura y semántica |
| **CSS3** | 2024 | Estilos, variables, flexbox, grid |
| **JavaScript** | ES6+ | Lógica, interactividad |
| **Bootstrap** | 5.3.0 | CDN - Componentes base |
| **Chart.js** | 4.x | CDN - Gráficos (si aplica) |

### Librerías Externas Permitidas

```html
<!-- Bootstrap 5 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Chart.js (opcional) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### Características de JavaScript Permitidas

- `class` y herencia
- `import/export` (ES6 modules)
- `async/await`
- Arrow functions
- Destructuring
- Template literals
- Spread operator
- Local Storage API
- Fetch API

### NO Permitido

- Babel/Transpilers (usar ES6 nativo)
- Bundlers (webpack, vite, etc.)
- NPM packages complejos
- Jquery
- Polyfills (asumir navegadores modernos)

---

## 4. ESTRUCTURA DE DIRECTORIOS

### Estructura Completa

Estructura vigente (actualizada en la Fase 2 del refactor; ver `DiagnosticoRefactor.md` §7).

```
frontend/
├── index.html                # Entry point: CSS, Bootstrap y Chart.js por CDN, contenedor #route-view
├── app.js                    # Arranque: tema, sesión, router (layouts + guard global), eventos de sesión
├── routes.js                 # Tabla de rutas declarativa (fuente de verdad de la navegación)
├── PrincipiosDesarrollo.md   # Guía de principios
├── ReglasCSS.md              # Reglas operativas CSS/responsive vigentes
│
├── core/                     # Infraestructura
│   ├── Router.js             # Router por hash: rutas anidadas, :params, beforeEach, layouts persistentes, 404
│   ├── TabRegistry.js        # Pestañas abiertas ("volver al dashboard" cierra la pestaña secundaria)
│   ├── templateLoader.js     # Carga y caché de templates HTML + renderTemplate con escapado
│   ├── Component.js          # Base de ciclo de vida (render, attachEvents, listen, destroy)
│   ├── PageController.js     # Base de páginas: _loadData, _runAction, helpers de DOM y modales
│   ├── APIClient.js          # Único punto de red (driver mock/http)
│   ├── AuthManager.js        # Sesión (delega en services/auth.service.js)
│   ├── EventBus.js · StateManager.js · ThemeManager.js
│
├── services/                 # Un servicio por dominio + adapters.js (API en español ↔ UI)
├── mocks/                    # Backend simulado con el contrato de la §10
├── content/                  # Contenido estático (perfiles de gasto)
│
├── components/               # Biblioteca de componentes (catálogo en la §7); JS + CSS de cada uno
│   ├── atoms/                # button, badge, avatar, trend, icon
│   ├── molecules/            # statCard, alertItem, keyValueList, mediaItem, formField, infoCard, …
│   ├── organisms/            # DataTable, FilterBar, ChartCard, Modal, ViewToggle, formularios, TicketUploader
│   ├── layout/               # AppLayout (topbar + sidebar + footer, por rol) y PublicLayout
│   ├── feedback/             # Toast
│   └── components.css        # Importa las hojas de todos los componentes
│
├── pages/                    # Cada página = NombrePage.js (con `static template`) + nombre.html
│   ├── public/               # landing, placeholder / ruta no encontrada
│   ├── cliente/              # dashboard, cargar-gasto, historial, patrones, recomendaciones, perfil, perfiles
│   └── asesor/               # dashboard, clientes, perfil
│
├── assets/css/               # global.css (tokens), layouts.css, themes/light.css, pages/ (landing, placeholder, patrones, perfiles)
└── utils/                    # constants, formatters, helpers, validators, html (escapado)
```

Los templates de las páginas internas **no** incluyen topbar, sidebar ni footer: los pone el layout. Su raíz es `<div class="app-page-content page-…">` (con `display: contents`).

### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Archivo JS** | PascalCase | `LoginPage.js`, `Component.js` |
| **Archivo CSS** | kebab-case | `global.css`, `light-theme.css` |
| **Archivo HTML** | kebab-case | `login.html`, `cargar-gasto.html` |
| **Clase** | PascalCase | `class LoginPage`, `class Component` |
| **Método** | camelCase | `attachEvents()`, `getUser()` |
| **Variable** | camelCase | `isLogged`, `userEmail` |
| **Constante** | UPPER_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |

---

## 5. ARQUITECTURA DEL SISTEMA

### Visión General

```
┌────────────────────────────────────────────┐
│        CAPA DE PRESENTACIÓN                 │
│  HTML (Estructura) + CSS (Estilos)         │
│  Páginas + Componentes                      │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│        CAPA DE APLICACIÓN                   │
│  Pages, Managers, Component Base            │
│  Lógica de negocio, ciclo de vida          │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│     CAPA DE COMUNICACIÓN                    │
│  EventBus (eventos internos)                │
│  APIClient (comunicación con backend)       │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│     CAPA DE PERSISTENCIA                    │
│  LocalStorage (sesión, preferencias)        │
│  Backend API (datos)                        │
└────────────────────────────────────────────┘
```

### Flujo de Interacción

```
1. Usuario interactúa con UI (click, input, etc.)
                ↓
2. Evento capturado en component.attachEvents()
                ↓
3. Emitir evento global: eventBus.emit('evento:tipo', datos)
                ↓
4. Manager/Page escucha: eventBus.on('evento:tipo', callback)
                ↓
5. Hacer request a backend: apiClient.post('/endpoint', data)
                ↓
6. Backend procesa y retorna respuesta
                ↓
7. Actualizar estado: stateManager.set('key', value)
                ↓
8. StateManager emite: eventBus.emit('state:changed', newState)
                ↓
9. Componentes redibujan (re-render) basados en nuevo estado
                ↓
10. UI actualizada ✅
```

### Responsabilidades por Capa

#### Capa de Presentación (HTML/CSS)

- Estructura semántica
- Accesibilidad
- Estilos visuales
- No contiene lógica

#### Capa de Aplicación (Pages, Managers)

- Lógica de negocio
- Ciclo de vida de componentes
- Orquestación de eventos
- Validación de datos

#### Capa de Comunicación

- **EventBus**: Comunicación desacoplada entre módulos
- **APIClient**: HTTP requests al backend
- Manejo de errores

#### Capa de Persistencia

- **LocalStorage**: Tokens, preferencias, estado temporal
- **Backend API**: Datos persistentes

---

## 6. PATRONES DE DISEÑO

### 1. Factory Pattern

**Uso:** Creación simplificada de componentes

**Ejemplo Conceptual:**
```
ComponentFactory.create('Button', { text: 'Guardar', type: 'primary' })
  → Retorna instancia de Button lista para usar
```

**Beneficio:** Abstrae complejidad de instanciación

---

### 2. Composition Pattern

**Uso:** Combinar componentes simples en layouts complejos

**Ejemplo Conceptual:**
```
Dashboard = Navbar + Sidebar + MainContent
MainContent = CardExpenses + CardStats + ChartAnalysis
```

**Beneficio:** Reutilización y flexibilidad

---

### 3. Observer Pattern

**Uso:** Comunicación desacoplada mediante EventBus

**Implementación:**
```
// Publicador
eventBus.emit('expense:created', expenseData)

// Suscriptores (múltiples)
eventBus.on('expense:created', (data) => { /* actualizar UI */ })
eventBus.on('expense:created', (data) => { /* enviar notificación */ })
```

**Beneficio:** Módulos completamente desacoplados

---

### 4. Builder Pattern

**Uso:** Construcción paso a paso de objetos complejos

**Ejemplo Conceptual:**
```
FormBuilder
  .addField('email', 'text', { required: true })
  .addField('password', 'password', { required: true, minLength: 8 })
  .addButton('Login', 'primary')
  .build()
```

**Beneficio:** API fluida, validación en cada paso

---

### 5. Herencia (Inheritance Pattern)

**Uso:** Crear jerarquía de clases para reutilizar lógica

**Estructura:**
```
Component (base universal)
  ↓ extends
ComponentBase (intermedias si aplica)
  ↓ extends
SpecificComponent (componentes finales)
```

**Beneficio:** Reduce duplicación, lógica centralizada

---

### 6. Singleton Pattern

**Uso:** Garantizar una única instancia global

**Clases Singleton:**
- `EventBus` - Un único bus de eventos
- `StateManager` - Un único estado global
- `AuthManager` - Una única sesión de usuario
- `ThemeManager` - Una única configuración de tema
- `APIClient` - Un único cliente HTTP (se exporta la instancia `apiClient`)
- `TabRegistry` - Un único registro de pestañas (instancia `tabRegistry`)

El `Router` **no** es singleton: se crea una vez en `app.js` con su configuración y se inyecta a las páginas.

**Implementación:** se exporta una instancia única del módulo (`export const eventBus = …`); algunas clases además tienen `getInstance()`.

**Beneficio:** Acceso centralizado, consistencia global

---

## 7. SISTEMA DE COMPONENTES

> Vigente desde la Fase 3 del refactor (`DiagnosticoRefactor.md` §7). Base teórica: `referencias/TeoriaComponentes.md`.

### Convenciones

- **Ubicación:** `frontend/components/{atoms,molecules,organisms,layout,feedback}/`. Cada componente tiene su JS y su CSS al lado (`badge.js` + `badge.css`); `components/components.css` importa todas las hojas.
- **Átomos y moléculas sin estado → funciones puras** que reciben props y devuelven HTML escapado (`SafeHtml` de `utils/html.js`). Ejemplo: `badge({ text: "Alta", tone: "danger" })`.
- **Organismos con comportamiento → clases `Component`.** Se montan con `this.mountChild(Clase, puntoDeMontaje, props)` (se destruyen con la página) y se actualizan con `componente.update(props)`.
- **Props hacia abajo, eventos hacia arriba:** un organismo nunca modifica datos del padre; avisa con `this.dispatch("nombre-evento", detalle)` (`CustomEvent` que burbujea) y el padre escucha con `this.listen(this.element, "nombre-evento", ...)`. El `EventBus` queda para hechos de aplicación (sesión, gasto creado, perfil actualizado, tema).
- **Slots:** contenido inyectable por props `SafeHtml` (`body`, `footer`, `trailing`…) o montando un componente dentro de otro (`Modal.bodyElement`).
- **Acciones en listas:** los botones llevan `data-action` y `data-id`; el contenedor atiende por delegación (DataTable lo traduce a `row-action`).
- **CSS mobile-first** (`min-width`), con tokens de `global.css`. Nombres que no chocan con Bootstrap (`status-badge`, `stat-card`, `data-table`, `alert-item`…).
- **Páginas:** solo componen y orquestan (piden datos a los servicios, pasan props, reaccionan a eventos). Sus templates tienen la estructura estática (`section-block`, `section-title`) y puntos de montaje con `id`.

### Catálogo

| Nivel | Componente | API (props → eventos) | Usado en |
|---|---|---|---|
| Átomo | `button` | `label, variant (primary·ghost·danger), size (sm·md), icon, type, href, newTab, action, id, block, disabled` | todas |
| Átomo | `badge` | `text, tone (neutral·success·warning·danger·info), icon` | historial, recomendaciones, clientes, dashboard |
| Átomo | `avatar` | `name, size (sm·md·lg)` | clientes, perfiles de cuenta |
| Átomo | `trend` | `value (%), label, goodWhen (down)` | KPIs, clientes |
| Átomo | `icon` | `name, label` (con label es accesible; sin label, decorativo) | todos |
| Molécula | `statCard` | `label, value, format (currency·number·percent·text), emoji, subtitle, trend` | dashboards, patrones |
| Molécula | `alertItem` | `title, description, tone, emoji` | dashboards, patrones |
| Molécula | `keyValueList` | `items [{label, value}], variant (rows·boxed)` | resúmenes, detalles, OCR |
| Molécula | `mediaItem` | `title, subtitle, leading, trailing, variant` | comercios, gastos recientes, categorías |
| Molécula | `formField` / `formGrid` | `id, name, label, type, value, options, required, readonly, hint, width (full·half·third), inputAttrs` | formularios |
| Molécula | `infoCard` | `title, icon, subtitle, body (slot), footer (slot), highlight` | dashboards, OCR |
| Molécula | `dateCard` | `date` | dashboards |
| Molécula | `clientCard` (+ `CLIENT_TABLE_COLUMNS`) | `client, actions` | dashboard y clientes del asesor |
| Molécula | `recommendationCard` | `recommendation, actions` | recomendaciones |
| Molécula | `profileSummary` | `fullName, email, items, footer` | perfiles de cuenta |
| Molécula | `emptyState` · `loadingState` · `errorState` | `icon, title, message, action` · `message` · `message, retryLabel` (botón `data-action="retry"`) | todas (PageController) |
| Organismo | `DataTable` | `columns [{key, label, render, align}], rows, rowKey, actions, empty, caption` → `row-action {action, id, row}`. Tarjetas en mobile, tabla desde 768px | historial, clientes, perfiles |
| Organismo | `FilterBar` | `fields [{type: search·select, name, label, options}], values, idPrefix` → `filters-change {values}`; `getValues()`, `setOptions()` | historial, clientes, recomendaciones |
| Organismo | `ChartCard` | `title, icon, type (bar·line·doughnut·pie), labels, datasets [{label, data, kind, dashed}], valueFormat, height (sm·md·lg), caption, link` | dashboards, patrones |
| Organismo | `Modal` + `confirmDialog()` | `title, size, body, footer` → `modal-close`; `open()`, `close()`, `setContent()`, `bodyElement`. `confirmDialog({...})` devuelve `Promise<boolean>` | historial, clientes, recomendaciones |
| Organismo | `ViewToggle` | `modes [{value, label, icon}], value, label` → `view-change {value}` | dashboard y clientes del asesor |
| Organismo | `RecommendationForm` | `recipients, selectedId, idPrefix` → `recommendation-submit {recommendation}` | dentro de RecommendationDialog |
| Organismo | `RecommendationDialog` | Modal + RecommendationForm; `open(clientId)`, `setRecipients()`, `setBusy()` | dashboard y clientes del asesor |
| Organismo | `ProfileForm` | `fields (esquema de formField), values, idPrefix, extraActions` → `profile-submit {values}`, `profile-reset` | perfil del cliente y del asesor |
| Organismo | `TicketUploader` | `accept, maxSizeMb, inputId` → `ticket-analyze {file}`; click, teclado y arrastrar/soltar con validación | cargar gasto |
| Template | `AppLayout` · `PublicLayout` | `config` por rol, `user`, `onLogout`, `onReturnHome` | router |
| Servicio | `createToaster(container)` | `showToast(message, tone)` | app.js |

La landing y el placeholder conservan su marcado propio (no forman parte de la Fase 3); sus estilos se ordenan en la Fase 4.

---

## 8. GESTIÓN DE ESTILOS

> Vigente desde la Fase 4 del refactor. Las reglas obligatorias y la tabla de breakpoints están en `frontend/ReglasCSS.md`; acá se resume el sistema.

### Archivos

1. `assets/css/global.css` — tokens en `:root` (tema oscuro por defecto), reset y utilidades.
2. `assets/css/themes/light.css` — redefine los tokens de color para `[data-theme="light"]`. El tema lo aplica `ThemeManager` en `<html data-theme>`.
3. `assets/css/layouts.css` — layout de la app y patrones de página compartidos.
4. `components/**/<componente>.css` — un archivo por componente (ver §7), importados por `components/components.css`.
5. `assets/css/pages/<pagina>.css` — solo lo propio de cada página.

### Tokens (extracto de `global.css`)

```css
:root {
  /* Color: marca y estados */
  --color-primary: #39dfbf;  --color-success: #31d17d;  --color-warning: #f6b437;
  --color-danger: #ff5d66;   --color-info: #31d4c7;
  /* Color: texto, superficies, bordes (los redefine light.css) */
  --text-primary · --text-secondary · --text-muted · --text-faint
  --surface-1 · --surface-2 · --surface-card · --surface-panel · --surface-hero · --modal-surface
  --border-soft · --border-strong · --field-bg · --field-border · --navbar-bg
  --action-primary-bg · --action-primary-text · --action-ghost-*
  /* Gráficos: paleta categórica (la lee getChartPalette) */
  --chart-1 … --chart-8
  /* Espaciado: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 px */
  --space-1 … --space-8
  /* Tipografía */
  --font-size-xs · sm · base · md · lg (fijos) · xl · 2xl · 3xl · display (fluidos con clamp)
  /* Radios */
  --radius-sm · md · lg · xl · pill · round
  /* Layout */
  --nav-height · --container-max · --app-shell-top-offset · --page-inline-padding
  --floating-edge-gap · --floating-bottom-gap (incluye safe-area)
}
```

### Naming: BEM simple

```css
.stat-card { }            /* bloque */
.stat-card__value { }     /* elemento */
.status-badge--danger { } /* modificador */
```

Las clases propias no reutilizan nombres de Bootstrap. Bootstrap se usa para grid utilitario, offcanvas, modales y controles de formulario (`form-control`, `form-select`).

### Reglas generales

- Todo espaciado, tamaño de fuente, radio y color sale de los tokens (detalle y excepciones en `ReglasCSS.md` §2).
- **Mobile-first** (`min-width`) en componentes y patrones nuevos; la landing conserva `max-width`.
- Breakpoints únicos: 576 · 768 · 992 · 1200 px.
- Alturas de viewport con el par `vh` + `dvh`; gráficos con alto por contenedor; flotantes con safe-area.
- Sin estilos inline. Verificación: 320–1440 px sin scroll horizontal y contraste AA en ambos temas.

---

## 9. SISTEMA DE EVENTOS

### EventBus - Bus Global de Eventos

**Clase:** `core/EventBus.js` (Singleton)

**Métodos:**
```javascript
eventBus.on(eventName, callback)      // Suscribirse a evento
eventBus.emit(eventName, data)        // Emitir evento
eventBus.off(eventName, callback)     // Desuscribirse
eventBus.once(eventName, callback)    // Suscribirse una única vez
```

### Eventos Principales de la Aplicación

#### Autenticación
```
auth:login         → Usuario inicia sesión
auth:logout        → Usuario cierra sesión
auth:register      → Nuevo usuario registrado
auth:sessionExpired → Sesión expirada
```

#### Gastos
```
expense:created    → Nuevo gasto creado
expense:updated    → Gasto actualizado
expense:deleted    → Gasto eliminado
expense:filtered   → Filtro aplicado a gastos
```

#### Análisis
```
analysis:updated   → Análisis actualizado
pattern:detected   → Patrón detectado
```

#### Navegación
```
router:navigate    → Navegar a página
page:loaded        → Página cargada
```

#### Tema
```
theme:changed      → Tema cambiado (light/dark)
```

#### Estado
```
state:changed      → Estado global cambió
state:loading      → Cargando datos
state:error        → Error en operación
```

### Ejemplo de Uso

```javascript
// Publicador - Emitir evento
eventBus.emit('expense:created', {
  id: 123,
  amount: 50.00,
  category: 'alimentos'
});

// Suscriptor 1 - Actualizar UI
eventBus.on('expense:created', (data) => {
  updateExpenseList(data);
});

// Suscriptor 2 - Enviar notificación
eventBus.on('expense:created', (data) => {
  showNotification(`Gasto agregado: $${data.amount}`);
});

// Suscriptor 3 - Recalcular estadísticas
eventBus.on('expense:created', (data) => {
  recalculateStats();
});
```

### Desacoplamiento mediante Eventos

**Sin EventBus** (acoplado):
```javascript
// LoginPage necesita conocer DashboardPage
loginPage.onLoginSuccess = (user) => {
  dashboardPage.updateUser(user);
  dashboardPage.loadData();
};
```

**Con EventBus** (desacoplado):
```javascript
// LoginPage solo emite evento
LoginPage {
  handleLoginSuccess(user) {
    eventBus.emit('auth:login', { user });
  }
}

// DashboardPage escucha independientemente
DashboardPage {
  constructor() {
    eventBus.on('auth:login', (data) => {
      this.updateUser(data.user);
      this.loadData();
    });
  }
}
```

---

## 10. ENDPOINTS DEL BACKEND

> Contrato definitivo, fijado en la fase I1 de `PlanIntegracionBackend.md` (confirma la decisión 6 de `DiagnosticoRefactor.md` §6). Es la fuente de verdad para los tres lados: el backend NestJS (`backend/src/modules/`) lo implementa, el front lo consume desde `frontend/services/*.service.js` y lo traduce al modelo de la UI en `frontend/services/adapters.js`, y el backend simulado `frontend/mocks/mockServer.js` lo replica para trabajar sin conexión. Desde la fase I4 los tres lados implementan este contrato (§10.8 registra qué cambió en el backend heredado).

### Convenciones

- **Rutas en inglés** (las fija la consigna: `/auth/login`, `/expenses`, `/tickets/upload`) y orientadas a recursos, sin prefijo por rol: el rol del token decide qué ve cada uno.
- **Todo lo demás en español snake_case, con los mismos nombres de columna que la BD**: campos de entrada y salida, query params, códigos de error y campos de formularios multipart. Los campos calculados siguen la misma regla (`categoria_nombre`, `promedio_categoria`). **No se mezclan idiomas** en una misma respuesta.
- Base URL: `API_CONFIG.BASE_URLS` en `frontend/utils/constants.js` (`local` = `http://localhost:3000/api/v1`; `production` se completa al hacer el deploy). El backend publica todo bajo el prefijo global `/api/v1`.
- Campos que no están en el contrato se rechazan con 422 (el `ValidationPipe` usa `whitelist` + `forbidNonWhitelisted`).
- Autenticación: header `Authorization: Bearer <token>` (JWT). Todas las rutas requieren token salvo login y registro.
- Roles: `cliente` y `asesor`. Una ruta de otro rol responde **403**.
- Fechas de gasto: `AAAA-MM-DD`. Timestamps: ISO 8601. Montos: número (ARS).
- **Errores** (4xx/5xx), siempre con este cuerpo:

```json
{ "error": true, "mensaje": "Descripcion legible", "codigo": "VALIDACION", "detalles": { "campos": ["monto"] } }
```

| Estado | `codigo` | Cuándo |
|---|---|---|
| 400 | `SOLICITUD_INVALIDA` | Cuerpo que no se puede interpretar (JSON mal formado) |
| 401 | `CREDENCIALES_INVALIDAS` | Login con email o contraseña incorrectos |
| 401 | `NO_AUTENTICADO` | Token ausente, inválido o vencido (el front cierra la sesión) |
| 403 | `PROHIBIDO` | Rol incorrecto o cliente no asignado al asesor |
| 404 | `NO_ENCONTRADO` | Recurso inexistente o ajeno (un id con formato inválido también es 404) |
| 404 | `RUTA_INEXISTENTE` | Método o ruta que la API no expone |
| 409 | `EMAIL_DUPLICADO` | Registro con un email existente |
| 409 | `MATRICULA_DUPLICADA` | Registro o perfil de asesor con una matrícula ya usada |
| 422 | `VALIDACION` | Datos inválidos o campos que no son del contrato (`detalles.campos` lista los campos; `mensaje` describe el primero) |
| 500 | `ERROR_INTERNO` | Error no controlado (el detalle técnico queda en el log del servidor) |

### Objetos comunes

**Usuario** (`usuarios` + `perfiles_usuarios` o `perfiles_asesores`):

```json
{
  "id": "uuid", "email": "cliente@fintrack.local", "rol": "cliente",
  "nombre_completo": "Juan Perez", "biografia": "", "foto_perfil_url": null,
  "estado": "activo", "creado_en": "2025-10-21T12:00:00.000Z",
  "perfil_cliente": {
    "ocupacion": "Disenador UX", "ingreso_estimado": 285000, "objetivo_financiero": "Fondo de emergencia",
    "perfil_de_gasto": { "id": "uuid", "nombre": "Equilibrista Cosmico", "descripcion": "..." },
    "asesor": { "id": "uuid", "nombre_completo": "Maria Rodriguez" }
  }
}
```

Para un asesor, en lugar de `perfil_cliente` viene `perfil_asesor: { matricula, especialidad, descripcion, clientes_asignados }`. `perfil_de_gasto` es el que asigna la regla de §10.6 al momento del pedido (el mismo que el análisis, y queda registrado en `clasificacion_de_perfil`); es `null` si el cliente no tiene gastos en la ventana.

**Gasto** (`gastos`):

```json
{
  "id": "uuid", "comercio": "Supermercado Central", "fecha_gasto": "2026-11-24", "monto": 18500,
  "descripcion": "", "origen": "manual", "moneda": "ARS",
  "categoria": { "id": "uuid", "nombre": "Alimentacion", "icono": "🛒" },
  "ticket_principal_id": null, "creado_en": "...", "actualizado_en": "..."
}
```

**Recomendación** (`recomendaciones_financieras`):

```json
{
  "id": "uuid", "titulo": "Reduce gastos en streaming", "mensaje": "...",
  "tipo": "sugerencia", "prioridad": "alta", "origen": "asesor",
  "leida": false, "leida_en": null, "creado_en": "...",
  "asesor": { "id": "uuid", "nombre_completo": "Maria Rodriguez" },
  "cliente": { "id": "uuid", "nombre_completo": "Juan Perez" }
}
```

`tipo`: `sugerencia` · `alerta` · `observacion`. `prioridad`: `baja` · `media` · `alta`. `origen`: `sistema` · `asesor` (`asesor` es `null` si lo generó el sistema).

### 10.1 Autenticación y perfil

| Método | Ruta | Rol | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/auth/register` | público | `{ nombre_completo, email, password, rol, matricula?, especialidad? }` (`matricula` y `especialidad` obligatorios si `rol = asesor`) | **201** `{ token, usuario }` |
| POST | `/auth/login` | público | `{ email, password }` | **200** `{ token, usuario }` |
| GET | `/auth/me` | ambos | — | **200** `usuario` |
| PUT | `/auth/profile` | ambos | cliente: `{ nombre_completo, biografia?, ocupacion?, ingreso_estimado?, objetivo_financiero? }` · asesor: `{ nombre_completo, biografia?, matricula, especialidad, descripcion? }` | **200** `usuario` |

El email no se modifica desde el perfil. La contraseña tiene entre 8 y 72 caracteres (el front además exige una mayúscula y un número). Un cliente que se registra queda asignado al asesor con más capacidad libre (`obtener_asesor_disponible()`); si no hay ninguno, queda sin asesor y el registro igual se completa.

### 10.2 Catálogos

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| GET | `/categories` | ambos | **200** `[{ id, nombre, icono }]` |
| GET | `/spending-profiles` | ambos | **200** `[{ id, nombre, descripcion }]`, del perfil más austero al más gastador (`criterio_regla.discrecional_max`) |

### 10.3 Gastos (cliente)

| Método | Ruta | Cuerpo / query | Respuesta |
|---|---|---|---|
| GET | `/expenses` | query opcional: `busqueda`, `categoria_id`, `origen`, `desde`, `hasta`, `orden` (`fecha` · `monto_desc` · `monto_asc`), `limite` | **200** `{ datos: [gasto], total }` |
| GET | `/expenses/:id` | — | **200** `gasto` |
| POST | `/expenses` | `{ comercio, fecha_gasto, monto, categoria_id, descripcion?, origen?, ticket_id? }` | **201** `gasto` |
| PUT | `/expenses/:id` | mismos campos (parcial); `origen` y `ticket_id` se aceptan pero no se modifican | **200** `gasto` |
| DELETE | `/expenses/:id` | — | **204** |

Validaciones: `comercio` obligatorio (hasta 100 caracteres), `monto > 0` con hasta 2 decimales, `fecha_gasto` con formato `AAAA-MM-DD` y fecha real, `categoria_id` existente, `descripcion` hasta 500 caracteres, `origen` en `manual` · `ticket` (por defecto `manual`; con `ticket_id` siempre es `ticket`), `ticket_id` de un ticket propio. `limite` entre 1 y 1000; sin `limite` se devuelven todos. Un cliente solo ve y modifica sus gastos: uno ajeno responde 404.

### 10.4 Tickets / OCR (cliente)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/tickets/upload` | `multipart/form-data` con el campo `archivo` (imagen JPEG, PNG o WebP de hasta 5 MB; si no, 422) | **201** `{ ticket: { id, nombre_archivo, estado_procesamiento }, analisis: { comercio_detectado, fecha_detectada, monto_detectado, categoria_sugerida: { id, nombre } \| null, confianza_general } }` |

Flujo **en un solo paso** (decisión de la fase I1): el backend sube la imagen a Supabase Storage (`tickets`), la envía al modelo de IA con visión, persiste el resultado (`analisis_ocr`) y lo devuelve en la misma respuesta. El cliente revisa y corrige el formulario precompletado y, al guardar, el front manda `POST /expenses` con `origen: "ticket"` y `ticket_id`. Con un `ticket_id`, `POST /expenses` valida que el ticket sea del cliente, guarda `ticket_principal_id`, `ocr_estado` (`procesado` si hay análisis, `fallido` si la IA no pudo leerlo) y `ocr_confianza`, y vincula el `analisis_ocr` con el gasto creado (`gasto_id`). Si la IA no responde, el upload contesta igual con `analisis` en `null` y `estado_procesamiento = error`, y el cliente completa el formulario a mano (la pantalla lo avisa y el gasto queda igual asociado al ticket). En el backend simulado, un archivo con "ilegible" en el nombre simula esa falla. No hay endpoint de confirmación aparte.

### 10.5 Recomendaciones

| Método | Ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|---|
| GET | `/recommendations` | cliente | — | **200** `[recomendacion]` (propias, más recientes primero) |
| PUT | `/recommendations/:id/read` | cliente | — | **200** `recomendacion` (`leida = true`, `leida_en`) |
| GET | `/recommendations/sent` | asesor | query `limite`, `cliente_id` (opcional: solo las de ese cliente) | **200** `[recomendacion]` enviadas por el asesor |
| POST | `/recommendations` | asesor | `{ cliente_id, titulo, mensaje, tipo, prioridad }` | **201** `recomendacion` (`origen = asesor`); 403 si el cliente no está asignado |

### 10.6 Análisis de consumo

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| GET | `/analysis/me` | cliente | **200** `analisis` |
| GET | `/analysis/clients/:id` | asesor | **200** `analisis` del cliente (403 si no está asignado) |
| GET | `/analysis/advisor/summary` | asesor | **200** `resumen_asesor` |

**`analisis`** (alimenta Dashboard, Patrones y, en la Fase 5, el análisis por cliente del asesor):

```json
{
  "cliente_id": "uuid",
  "periodo": { "desde": "2026-05-01", "hasta": "2026-11-25" },
  "gasto_mes_actual": 135880, "gasto_mes_anterior_a_la_fecha": 56900, "variacion_mes_anterior": 139,
  "gasto_promedio_mensual": 101005, "cantidad_gastos": 97,
  "categoria_dominante": { "id": "uuid", "nombre": "Alimentacion", "porcentaje": 41 },
  "comercio_mas_frecuente": { "comercio": "Supermercado Central", "cantidad": 18 },
  "dia_mayor_gasto": 5,
  "gastos_por_categoria": [{ "categoria_id": "uuid", "categoria": "Alimentacion", "monto": 250000, "porcentaje": 41 }],
  "gastos_por_mes": [{ "mes": "2026-11", "monto": 135880 }],
  "gastos_por_mes_y_categoria": [{ "mes": "2026-11", "categoria": "Alimentacion", "monto": 60000 }],
  "gastos_por_dia": [{ "fecha": "2026-11-25", "monto": 7200 }],
  "ranking_comercios": [{ "comercio": "Supermercado Central", "monto": 120000, "cantidad": 18 }],
  "gastos_inusuales": [{ "gasto_id": "uuid", "comercio": "...", "categoria": "...", "fecha_gasto": "...", "monto": 23400, "promedio_categoria": 9060, "desvio_porcentaje": 158 }],
  "alertas": [{ "nivel": "danger", "titulo": "...", "descripcion": "..." }],
  "perfil_de_gasto": { "id": "uuid", "nombre": "Equilibrista Cosmico", "descripcion": "..." },
  "nivel_riesgo": "medio",
  "ultimo_gasto_fecha": "2026-11-24"
}
```

Reglas de cálculo. Las implementan el backend (`backend/src/modules/analysis/analysis.rules.ts`, funciones puras con tests en `analysis.rules.spec.ts`) y el mock (`frontend/mocks/analytics.js`); en la fase I3 se verificó que ambos dan resultados idénticos sobre el mismo juego de datos. Si cambia una regla, se cambia en los dos y en esta sección. "Hoy" es la fecha en la zona horaria de la app (`APP_TIMEZONE`, por defecto `America/Argentina/Buenos_Aires`), no la del servidor; el análisis se calcula en cada pedido a partir de `gastos` (no se persiste):
- `gastos_por_mes`: últimos 7 meses incluido el actual. `gastos_por_dia`: últimos 14 días. `ranking_comercios`: top 5 por monto.
- `variacion_mes_anterior`: mes en curso contra el mes anterior **hasta el mismo día** (porcentaje; `null` si no hay datos).
- `gasto_promedio_mensual`: promedio de los meses completos anteriores con gastos.
- `dia_mayor_gasto`: 0 = domingo … 6 = sábado.
- **Gasto inusual**: gasto de los últimos 30 días que supera en más de 35% el promedio de su categoría (con al menos 3 gastos previos en esa categoría).
- `alertas.nivel`: `danger` · `warning` · `success` · `info`.
- **Perfil de gasto** (asignado automáticamente por el sistema; ni el cliente ni el asesor lo eligen): participación de las categorías discrecionales (Entretenimiento, Suscripciones, Otros) en los últimos 3 meses (el mes en curso y los dos anteriores, desde el día 1), comparada con `perfiles_de_gasto.criterio_regla.discrecional_max` (Drácula Nocturno < 10%, Equilibrista Cósmico < 30%, Espíritu Libre el resto). El catálogo tiene **exactamente esos 3 perfiles** y `criterio_regla` solo guarda la regla (`{ "discrecional_max": 0.1 }`); los textos, emojis y la comparativa viven en el front (`frontend/content/spendingProfiles.js`) y se vinculan por nombre. El resultado se guarda en `clasificacion_de_perfil` (`asesor_id = null`, `motivo` con el porcentaje calculado, cierra la vigencia del anterior con `vigente_hasta`). Se calcula al armar el análisis o el resumen de un cliente (la ventana de 3 meses avanza con el tiempo aunque no haya gastos nuevos) y solo se escribe una clasificación nueva si el perfil cambió respecto del vigente. Sin gastos en la ventana, el perfil queda `null`.
- `nivel_riesgo`: `alto` si hay 2 o más gastos inusuales o la variación supera 25%; `medio` si hay 1 o la variación supera 10%; `bajo` en otro caso.

**`resumen_asesor`**:

```json
{
  "asesor_id": "uuid", "clientes_activos": 8, "clientes_con_alertas": 5,
  "recomendaciones_enviadas": 7, "recomendaciones_leidas": 3,
  "alertas": [{ "nivel": "danger", "titulo": "5 clientes con gastos inusuales", "descripcion": "..." }],
  "distribucion_por_perfil": [{ "perfil": "Equilibrista Cosmico", "cantidad": 3 }],
  "gasto_por_perfil": [{ "perfil": "Equilibrista Cosmico", "monto": 320000 }],
  "actividad_mensual": [{ "mes": "2026-11", "clientes_activos": 8 }]
}
```

### 10.7 Clientes (asesor)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/clients` | **200** `[resumen_cliente]` de los clientes asignados (`asignaciones_de_clientes` activas) |
| GET | `/clients/:id` | **200** `resumen_cliente` + `usuario` (403 si no está asignado) |
| GET | `/clients/:id/expenses` | **200** `{ datos: [gasto], total }` con los mismos filtros que `GET /expenses` (403 si no está asignado) |

**`resumen_cliente`**: `{ id, nombre_completo, email, estado, perfil_de_gasto, gasto_promedio_mensual, gasto_mes_actual, variacion_mes_anterior, ultimo_gasto_fecha, gastos_inusuales (cantidad), nivel_riesgo }`.

### 10.8 Correspondencia con el backend actual (inventario de la fase I1)

Estado del backend heredado de `dev` contra este contrato. Columna **Fase**: dónde se resolvió según `PlanIntegracionBackend.md` (I2 = nombres en español y forma de las respuestas; I3 = lógica que faltaba o se reescribió). **Todas las filas están implementadas** (fases I2 e I3 completadas): el backend expone exactamente los endpoints de §10.1–10.7. La tabla queda como registro de qué cambió.

**Endpoints del contrato**

| Contrato | Backend actual | Qué cambia | Fase |
|---|---|---|---|
| `POST /auth/register` | `POST /auth/register` | Cuerpo en español (`nombre_completo`, `rol`, `matricula`, `especialidad`); se sacan los extras del cliente (`occupation`, `estimatedIncome`, `financialGoal`, `preferredCurrency`). Respuesta `{ token, usuario }` en vez de `{ access_token, user }`. 409 `EMAIL_DUPLICADO`. Se mantiene la asignación automática a un asesor (`obtener_asesor_disponible()`). | I2 |
| `POST /auth/login` | `POST /auth/login` | Respuesta `{ token, usuario }`; 401 `CREDENCIALES_INVALIDAS`. | I2 |
| `GET /auth/me` | `GET /users/me` (cliente y asesor) | Nueva ruta; objeto `usuario` de este contrato. | I2 |
| `PUT /auth/profile` | `PATCH /users/me` y `PATCH /advisor/profile` | Una sola ruta para los dos roles, con los campos de §10.1. | I2 |
| `GET /categories` | `GET /categories` (público) | Pasa a requerir token, como el resto. Respuesta `[{ id, nombre, icono }]`. | I2 |
| `GET /spending-profiles` | `GET /users/spending-profiles` | Nueva ruta; `[{ id, nombre, descripcion }]`. | I2 |
| `GET /expenses` | `GET /expenses` (`page`, `limit`, `categoryId`, `from`, `to`, `search`, `orderBy`, `order`) | Query de §10.3 (`busqueda`, `categoria_id`, `origen`, `desde`, `hasta`, `orden`, `limite`); respuesta `{ datos, total }` en vez de `{ data, pagination }`. | I2 |
| `GET /expenses/:id` | `GET /expenses/:id` | Objeto `gasto` de este contrato (hoy `amount`, `merchant`, `ocrEstado`…). | I2 |
| `POST /expenses` | `POST /expenses` | Cuerpo en español; acepta `origen` y `ticket_id` y vincula el ticket (§10.4). | I2 |
| `PUT /expenses/:id` | solo `PATCH /expenses/:id` | Se agrega `PUT` (mínimo de la consigna) y se quita `PATCH`. | I2 |
| `DELETE /expenses/:id` | `DELETE /expenses/:id` (204) | Sin cambios de forma; errores en el formato del contrato. | I2 |
| `POST /tickets/upload` | `POST /tickets/upload` (campo `file`, 8 MB, admite PDF y HEIC) | Campo `archivo`, 5 MB, JPEG/PNG/WebP; respuesta `{ ticket, analisis }`. | I2 |
| `GET /recommendations` | `GET /users/me/recommendations` (`{ stats, recommendations }`) | Nueva ruta; lista plana de `recomendacion`. | I2 |
| `PUT /recommendations/:id/read` | `PATCH /users/me/recommendations/:id` (`status`, `isRead`) | Nueva ruta; marca `leida` y `leida_en`. | I2 |
| `GET /recommendations/sent` | `GET /advisor/recommendations` (`clientId`, `status`, `type`) | Nueva ruta; query `limite`, `cliente_id`. | I2 |
| `POST /recommendations` | `POST /advisor/recommendations` (`clientId`, `content`, `problem`, `implementationSteps`…) | Nueva ruta; cuerpo `{ cliente_id, titulo, mensaje, tipo, prioridad }`. | I2 |
| `GET /analysis/me` | `GET /users/me/consumption-analysis` y `GET /analytics/consumption` (duplicados) | Se reescribe el cálculo con las reglas de §10.6 (hoy faltan variación, gasto por día, alertas, perfil y riesgo; los inusuales usan z-score y el ranking cuenta compras en vez de sumar montos). | I3 |
| `GET /analysis/clients/:id` | `GET /advisor/clients/:clientId/consumption-analysis` | Nueva ruta; mismo `analisis` que `/analysis/me`, con control de asignación (403). | I3 |
| `GET /analysis/advisor/summary` | `GET /advisor/dashboard` (`calendar`, `inbox`, `charts`… armados para la UI vieja) | Se reescribe como `resumen_asesor`. | I3 |
| `GET /clients` | `GET /advisor/clients` (paginado; `search`, `status`, `risk`, `profile`, `sortBy` en el servidor) | Nueva ruta; lista completa de `resumen_cliente` (el front filtra). | I3 |
| `GET /clients/:id` | `GET /advisor/clients/:clientId` | Nueva ruta; `resumen_cliente` + `usuario`. | I3 |
| `GET /clients/:id/expenses` | `GET /advisor/clients/:clientId/expenses` | Nueva ruta; mismos filtros y forma que `GET /expenses`. | I2 |

**Endpoints del backend que se eliminan** (no los usa el front y no suman a la consigna; `DiagnosticoRefactor.md` §6, decisiones 1 y 2):

| Endpoint | Motivo | Estado |
|---|---|---|
| `GET /expenses/summary` | Lo cubre `GET /analysis/me`. | Eliminado (I2) |
| `GET /users/me/dashboard` | Lo cubren `/auth/me` y `/analysis/me`. | Eliminado (I2) |
| `GET /analytics/consumption` | Duplicado de `/users/me/consumption-analysis`. | Eliminado (I3) |
| `GET /advisor/profile` | Lo cubre `/auth/me`. | Eliminado (I2) |
| `PATCH /advisor/recommendations/:id` · `DELETE /advisor/recommendations/:id` | La consigna pide generar recomendaciones, no editarlas ni borrarlas. | Eliminado (I2) |
| `GET /advisor/reports` | La página de reportes se eliminó en la Fase 0. | Eliminado (I3) |
| `GET /advisor/risk-assessment` | El riesgo viene en `resumen_cliente.nivel_riesgo`. | Eliminado (I3) |
| `PATCH /advisor/clients/:clientId/profile` | El perfil lo asigna el sistema (decisión 2). | Eliminado (I3) |
| `POST /tickets/:id/confirm` | El flujo de tickets es en un paso (§10.4). | Eliminado (I2) |

**Cambios de base de datos** (migración `0016_spending_profiles_v2.sql`, fase I3):
- El catálogo de `perfiles_de_gasto` pasa de los 7 perfiles del seed anterior (con `criterio_regla` en inglés: `thresholds`, `savingsRatio`…) a los 3 de §10.6 con `criterio_regla = { "discrecional_max": n }`. Las clasificaciones que apuntaban a los perfiles eliminados se borran (eran manuales; el sistema recalcula la de cada cliente en la próxima consulta). `seeds/seed_perfiles_de_gasto.sql` carga el catálogo nuevo.
- Se eliminan las 5 vistas de las migraciones `0008`/`0009`: ningún servicio las usaba y `client_anomaly_view` implementaba la regla de z-score descartada.
- Columnas que existen y quedan fuera del contrato (no se exponen, conservan sus valores por defecto): `perfiles_usuarios.pais/telefono/moneda_preferida/tema/umbral_alerta/ahorro_objetivo/notificar_*`, `perfiles_asesores.capacidad_maxima/telefono/pais/notificar_*` (`capacidad_maxima` sí la usa la asignación automática), `recomendaciones_financieras.estado/icono/problema/solucion/pasos_implementacion/ahorro_potencial`.

---

## 11. PÁGINAS Y FLUJOS DE USUARIO

### Flujo General de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                   LANDING PAGE                           │
│   (pages/public/landing.html + LandingPage.js + modales) │
└─────────────────┬───────────────────────────────────────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
      LOGIN MODAL     REGISTRO MODAL
          │                │
          └───────┬────────┘
                  │
                  ▼
          PERFIL DE USUARIO
           (si aplica flujo)
                  │
    ┌──────┴──────┐
    │             │
    ▼             ▼
USUARIO       ASESOR
DASHBOARD    DASHBOARD
    │            │
    └────┬───────┘
         │
    (Resto de app)
```

### 11.1 Página Pública - Landing Page

**Archivo:** `frontend/pages/public/landing.html` + `frontend/pages/public/LandingPage.js`

**Orquestación de ruta:** `frontend/app.js` (ruta `#/` con `templateUrl` + `onEnter`).

**Propósito:** Presentar la aplicación, atraer usuarios

**Secciones:**
1. Hero section con call-to-action
2. Features principales
3. Cómo funciona (3-5 pasos)
4. Testimonios (opcional)
5. Pricing (si aplica)
6. FAQ (si aplica)
7. Footer con links

**Componentes:**
- Navbar simple (sin usuario autenticado)
- Botones: "Iniciar Sesión", "Registrarse"
- Cards de features
- CTA buttons

**No requiere autenticación**

---

### 11.2 Flujo de Autenticación

#### 11.2.1 Login (Modal en plantilla de Landing)

**Archivo:** `frontend/pages/public/landing.html` (estructura/modal) +
`frontend/pages/public/LandingPage.js` (orquestación de eventos)

**Formulario:**
- Email (texto, required, validación)
- Contraseña (password, required)
- Botón "Iniciar Sesión"
- Link "¿Olvidó la contraseña?" (opcional)
- Link "Crear cuenta"

**Flujo:**
1. Usuario ingresa email y password
2. Validar en cliente (email formato, password no vacía)
3. POST `/auth/login`
4. Guardar token en localStorage
5. Emitir evento `auth:login`
6. Navegar al dashboard correspondiente según perfil

**Manejo de errores:**
- Email no existe → "Usuario no registrado"
- Contraseña incorrecta → "Email o contraseña inválida"
- Error de red → "Error de conexión, intente nuevamente"

---

#### 11.2.2 Registro Usuario (Modal en plantilla de Landing)

**Archivo:** `frontend/pages/public/landing.html` (estructura/modal) +
`frontend/pages/public/LandingPage.js` (orquestación de eventos)

**Formulario:**
- Email (validación)
- Nombre (required)
- Apellido (required)
- Contraseña (validación: min 8 caracteres, mayúscula, número)
- Confirmar Contraseña (debe coincidir)
- Aceptar términos (checkbox required)
- Botón "Crear Cuenta"
- Link "Ya tengo cuenta" → login

**Flujo:**
1. Validar todos los campos en cliente
2. POST `/auth/register` con perfil = "usuario"
3. Si es exitoso, guardar token y navegar al dashboard según perfil
4. Si falla (email duplicado), mostrar error

**Validaciones:**
- Email válido y único
- Contraseña fuerte (8+ chars, mayúscula, número)
- Contraseñas coinciden
- Términos aceptados

---

#### 11.2.3 Selección de Perfil

**Archivo:** flujo de autenticación en landing + lógica de estado/eventos

**Contenido:**
- Título: "¿Cuál es tu rol?"
- 2 cards grandes (usuario vs asesor)
- Botones: "Continuar como Usuario", "Continuar como Asesor"

**Lógica:**
- Usuario hace click en uno
- Actualizar perfil: PUT `/auth/profile` con perfil seleccionado
- Emitir evento `auth:roleSelected`
- Navegar al dashboard correspondiente

---

### 11.3 Páginas del Cliente

#### 11.3.1 Dashboard Usuario

**Archivo:** `pages/cliente/dashboard.html` + `pages/cliente/DashboardPage.js`

**Diseño:** 3 columnas (Sidebar + Main + Right Panel)

**Contenido:**
- **Navbar superior:** Logo, usuario (nombre), logout
- **Sidebar izquierdo:** Menú navegación (Dashboard, Cargar Gasto, Historial, Patrones, Recomendaciones, Perfil)
- **Panel central principal:**
  - Tarjeta de resumen (gasto hoy, esta semana, este mes)
  - Gráfico de gastos este mes
  - Últimos 5 gastos (tabla)
  - Botón principal: "Cargar nuevo gasto"
- **Panel derecho:**
  - Widget de categoría principal
  - Alerta de gastos inusuales (si aplica)

**Carga de datos:**
- GET `/expenses?limit=5` → últimos gastos
- GET `/analysis/user/{userId}` → resumen

**Eventos:**
- Click "Cargar gasto" → navegar a `cargar-gasto`
- Gasto creado → refrescar resumen

---

#### 11.3.2 Cargar Gasto Page

**Archivo:** `pages/cliente/cargar-gasto.html` + `pages/cliente/CargarGastoPage.js`

**2 Métodos de carga:**

**A) Carga Manual:**
- Formulario con campos:
  - Comercio (texto, autocomplete)
  - Fecha (date picker)
  - Monto (number, 2 decimales)
  - Categoría (select)
  - Descripción (textarea, opcional)
- Botón "Guardar Gasto"

**B) Carga por Imagen (OCR):**
- Drop zone o input file
- Subir imagen → POST `/tickets/upload`
- Mostrar spinner
- POST `/tickets/analyze` con ticketId
- Pre-llenar formulario con datos extraídos
- Usuario puede corregir si es necesario
- Guardar gasto

**Flujo:**
1. Si método manual → POST `/expenses` directamente
2. Si método OCR → upload + analyze → pre-fill form → user edit → POST `/expenses`
3. Success → mostrar toast de confirmación
4. Navegar a dashboard o limpiar formulario para nuevo gasto

---

#### 11.3.3 Historial Gastos Page

**Archivo:** `pages/cliente/historial.html` + `pages/cliente/HistorialPage.js`

**Contenido:**
- Filtros (barra superior):
  - Por categoría (select)
  - Rango de fechas (date picker)
  - Rango de monto (min-max inputs)
  - Búsqueda por comercio
- Tabla/lista de gastos con columnas:
  - Fecha
  - Comercio
  - Categoría (con icono)
  - Monto
  - Acciones (editar, eliminar)
- Paginación

**Datos:**
- GET `/expenses?filters...` → cargar gastos filtrados

**Interacciones:**
- Click editar → modal o página de edición
- Click eliminar → confirmación → DELETE `/expenses/:id`

---

#### 11.3.4 Patrones de Consumo Page

**Archivo:** `pages/cliente/patrones.html` + `pages/cliente/PatronesPage.js`

**Contenido:**
- Período seleccionable (último mes, últimos 3 meses, año)
- **Gráficos:**
  - Gasto por categoría (pie chart)
  - Gasto por mes (line chart)
  - Comercios más frecuentes (bar chart)
- **Estadísticas:**
  - Gasto promedio diario
  - Día de mayor gasto
  - Categoría principal
  - Gasto total período

**Datos:**
- GET `/analysis/patterns/{userId}` → patrones

**Nota:** Usar Chart.js vía CDN para gráficos

---

#### 11.3.5 Recomendaciones Page

**Archivo:** `pages/cliente/recomendaciones.html` + `pages/cliente/RecomendacionesPage.js` · Spec detallada: `paginasFront/05-Recomendaciones.md`

**Contenido:**
- Recomendaciones del sistema o del asesor, con el modelo de `recomendaciones_financieras`: título, mensaje, tipo (sugerencia/alerta/observación), prioridad (alta/media/baja), origen (sistema/asesor), fecha y leída.
- Filtros por prioridad, tipo y estado de lectura; orden por fecha o prioridad.
- Acciones: marcar como leída y ver detalle.

**Datos:**
- GET `/recommendations` → recomendaciones del cliente
- PUT `/recommendations/:id/read` → marcar como leída

---

#### 11.3.6 Perfil Page

**Archivo:** `pages/cliente/perfil.html` + `pages/cliente/PerfilPage.js`

**Contenido (campos de `usuarios` y `perfiles_usuarios`):**
- Nombre completo, ocupación, ingreso mensual estimado, objetivo financiero, biografía.
- Email de acceso (solo lectura).
- Tema visual (preferencia local, `ThemeManager`).
- Resumen: perfil de gasto asignado, asesor asignado, miembro desde.

**Datos:**
- GET `/auth/me` → información del usuario
- PUT `/auth/profile` → actualizar perfil

---

#### 11.3.7 Perfiles de Gasto Page

**Archivo:** `pages/cliente/perfiles.html` + `pages/cliente/PerfilesPage.js` · Spec detallada: `paginasFront/04-PerfilesDeGasto.md`

**Contenido:**
- Catálogo informativo de los 3 perfiles y tabla comparativa.
- Perfil asignado **automáticamente por el sistema** (`clasificacion_de_perfil`). El cliente no puede elegirlo.

**Datos:**
- GET `/spending-profiles` → catálogo
- GET `/auth/me` → `perfil_cliente.perfil_de_gasto` (perfil vigente)

---

#### 11.3.8 Editar Gasto Page

**Archivo:** `pages/cliente/editar-gasto.html` + `pages/cliente/EditarGastoPage.js` · Ruta `#/cliente/gastos/:id` (desde el historial, acción "Editar").

- Formulario `ExpenseForm` (el mismo de la carga) con los datos del gasto: permite corregir comercio, monto, fecha y descripción y **cambiar la categoría** (consigna: "categorizar gastos").
- Muestra el origen (manual o ticket) y permite eliminar el gasto con confirmación.

**Datos:** GET `/expenses/:id`, GET `/categories`, PUT `/expenses/:id`, DELETE `/expenses/:id`.

---

### 11.4 Páginas del Asesor Financiero

#### 11.4.1 Dashboard Asesor

**Archivo:** `pages/asesor/dashboard.html` + `pages/asesor/AsesorDashboardPage.js`

**Contenido:**
- **Panel superior:**
  - Total de clientes
  - Total gastos generales
  - Gasto promedio por cliente
  - Tendencia (mejora/empeoramiento)

- **Tabla de clientes:**
  - Nombre
  - Email
  - Gastos totales
  - Última actividad
  - Acción: "Ver detalles"

- **Botón:** "Añadir cliente" (si aplica)

**Datos:**
- GET `/admin/users?limit=20` → lista de clientes
- GET `/analysis/user/{userId}` por cada cliente → datos agregados

**Interacciones:**
- Click en cliente → abrir modal o navegar a página de detalles

Spec detallada: `paginasFront/03-AsesorDashboard.md`.

#### 11.4.2 Mis Clientes

**Archivo:** `pages/asesor/clientes.html` + `pages/asesor/AsesorClientesPage.js`

- Búsqueda y filtros por riesgo y estado, vista en tarjetas o tabla, detalle del cliente y envío de recomendaciones.
- "Ver análisis" abre el análisis completo del cliente (§11.4.4).

#### 11.4.4 Análisis del Cliente

**Archivo:** `pages/asesor/cliente-detalle.html` + `pages/asesor/AsesorClienteDetallePage.js` · Ruta `#/asesor/clientes/:id` (desde Mis Clientes o el dashboard, acción "Ver análisis").

Cubre la consigna §3 y §4.5 para el asesor: analizar los gastos de cada cliente, identificar patrones y gastos problemáticos y generar recomendaciones.

- Encabezado: nombre, email, **perfil de gasto asignado por el sistema**, nivel de riesgo y estado.
- Alertas e indicadores (gasto del mes, promedio mensual, categoría principal, gastos inusuales).
- Gráficos: gasto por día, por categoría y por mes con promedio.
- Gastos inusuales, ranking de comercios y últimos gastos (`DataTable`).
- Recomendaciones enviadas a ese cliente y botón para enviar una nueva (`RecommendationDialog` con el cliente preseleccionado).

**Datos:** GET `/clients/:id`, GET `/analysis/clients/:id`, GET `/clients/:id/expenses`, GET `/recommendations/sent?cliente_id=…`, POST `/recommendations`.

#### 11.4.3 Perfil del Asesor

**Archivo:** `pages/asesor/perfil.html` + `pages/asesor/AsesorPerfilPage.js`

- Campos de `usuarios` y `perfiles_asesores`: nombre completo, especialidad, matrícula, descripción profesional. Email de acceso en solo lectura.

---

### 11.5 Rutas y Navegación

**Fuente de verdad:** `frontend/routes.js` (los paths base están en `ROUTES`, `frontend/utils/constants.js`).

| Página | Ruta | Layout | Rol |
|--------|------|--------|-----|
| Landing | `#/` (`?modal=login` · `?modal=register` · `&next=<ruta>`) | public | público |
| Placeholder | `#/utils/placeholder?title=…` | public | público |
| Dashboard del cliente | `#/cliente/dashboard` | client | cliente |
| Cargar Gasto | `#/cliente/cargar-gasto` | client | cliente |
| Historial | `#/cliente/historial` | client | cliente |
| Patrones | `#/cliente/patrones` | client | cliente |
| Recomendaciones | `#/cliente/recomendaciones` | client | cliente |
| Perfil de cuenta | `#/cliente/perfil` | client | cliente |
| Perfiles de gasto | `#/cliente/perfiles` | client | cliente |
| Editar gasto | `#/cliente/gastos/:id` | client | cliente |
| Dashboard Asesor | `#/asesor/dashboard` | advisor | asesor |
| Mis Clientes | `#/asesor/clientes` | advisor | asesor |
| Análisis del cliente | `#/asesor/clientes/:id` | advisor | asesor |
| Perfil del Asesor | `#/asesor/perfil` | advisor | asesor |
| Ruta inexistente | cualquier otra: "Ruta no encontrada" en la misma URL | public | público |

**Funcionamiento del router (`core/Router.js`):**
1. Cambia el hash → se busca la ruta (coincidencia por segmentos, con parámetros `:id`).
2. Guard global `beforeEach` (en `app.js`): si la ruta tiene `meta.role` y no hay sesión → `#/?modal=login&next=<ruta>`; si el rol no coincide → dashboard del rol. Los redirects usan `replace` (no agregan entradas al historial).
3. Si cambia el layout (public · client · advisor), se desmonta el anterior y se monta el nuevo **una sola vez**; navegar entre páginas del mismo rol no lo vuelve a montar.
4. Se destruye la página anterior, se carga el template de la nueva en el `outlet` del layout y se monta. Si mientras tanto se pidió otra ruta, la activación se descarta.
5. Si la ruta tiene `reuseOnQueryChange` y solo cambió la query, se llama `page.onRouteUpdate(to)` sin remontar (la landing lo usa para abrir el modal).
6. El layout marca el link activo (`aria-current="page"`), actualiza el footer y el título del documento.

La sesión se restaura (`authManager.init()`) antes de `router.start()`. El guard es experiencia de usuario: la seguridad la impone el backend validando el token.

```javascript
router.navigate(ROUTES.CLIENT_HISTORIAL);                 // #/cliente/historial
router.navigate(ROUTES.HOME, { modal: "login" });         // #/?modal=login
router.navigate(ROUTES.ADVISOR_DASHBOARD, {}, { replace: true });
```

**Pestañas nuevas** (`core/TabRegistry.js`): desde el dashboard, los links a secciones de detalle o análisis abren en pestaña nueva; la navegación principal no. "Volver al Dashboard" cierra la pestaña secundaria si el dashboard ya está abierto en otra.

---

## 12. DECISIONES TÉCNICAS

### 12.1 Módulos ES6

**Decisión:** Usar ES6 modules nativos (import/export) sin bundler

**Por qué:**
- Soporte nativo en navegadores modernos
- Sin dependencias de build tools
- Más simple para proyecto académico
- Fácil de debuggear

**Implementación:**
```javascript
// Archivo: core/EventBus.js
export class EventBus {
  // ...
}

// Archivo: pages/cliente/DashboardPage.js
import { EventBus } from '../../core/EventBus.js';
import { APIClient } from '../../core/APIClient.js';
// ...
```

**Requisito:** Servir archivos vía HTTP (no con protocolo `file://`)

---

### 12.2 Almacenamiento Local

**Token JWT:**
```javascript
// Al login exitoso
localStorage.setItem('fintrack.authToken', response.token);

// Al hacer requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('fintrack.authToken')}`
}

// Al logout
localStorage.removeItem('fintrack.authToken');
```

**Tema:**
```javascript
// Guardar preferencia
localStorage.setItem('fintrack.theme', 'dark');

// Cargar al iniciar
const theme = localStorage.getItem('fintrack.theme') || 'dark';
themeManager.setTheme(theme);
```

**Estado temporal:**
```javascript
// Claves por usuario: `${STORAGE_KEYS.EXPENSE_DRAFT}.${userId}` (ver STORAGE_KEYS en utils/constants.js)
localStorage.setItem(`fintrack.expenseDraft.${userId}`, JSON.stringify(formData));
```

---

### 12.3 Manejo de Errores

**APIClient:**
```javascript
async post(endpoint, data) {
  try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    eventBus.emit('state:error', { message: error.message });
    throw error;
  }
}
```

**En Pages:**
```javascript
try {
  const result = await apiClient.post('/expenses', expenseData);
  eventBus.emit('expense:created', result);
  showNotification('Gasto guardado', 'success');
} catch (error) {
  showNotification(error.message, 'error');
}
```

---

### 12.4 Performance

**Lazy Loading:**
- Páginas se cargan bajo demanda (no al iniciar)
- Solo cargar archivo HTML/JS cuando navegas

**Caché de Requests:**
- Cachear GET de categorías (no cambian frecuentemente)
- Invalidar caché al crear/actualizar

**Debounce en búsquedas:**
```javascript
// No hacer request en cada keystroke
const searchInput = debounce((query) => {
  apiClient.get(`/expenses/search?q=${query}`);
}, 500);
```

---

### 12.5 Seguridad

**XSS Prevention:**
- Usar `textContent` en lugar de `innerHTML` cuando sea posible
- Si hay que usar `innerHTML`, sanitizar HTML

**CSRF:**
- Token CSRF en headers si backend lo requiere

**Autenticación:**
- JWT tokens en localStorage
- Verificar token antes de hacer requests
- Redirigir a login si token expirado

---

### 12.6 Accesibilidad

**HTML Semántico:**
```html
<header>, <nav>, <main>, <section>, <article>, <footer>
```

**Labels en Forms:**
```html
<label for="email">Email:</label>
<input id="email" type="email" required>
```

**ARIA attributes:**
```html
<button aria-label="Menú principal">☰</button>
<div role="alert">Error al guardar</div>
```

---

### 12.7 Responsive Design

**Mobile First:**
```css
/* Base: mobile */
.component { width: 100%; }

/* Tablet */
@media (min-width: 768px) {
  .component { width: 48%; }
}

/* Desktop */
@media (min-width: 1024px) {
  .component { width: 30%; }
}
```

**Breakpoints Bootstrap:**
- xs: < 576px
- sm: ≥ 576px
- md: ≥ 768px
- lg: ≥ 992px
- xl: ≥ 1200px

**Política adicional vigente:**
- Para estructura principal y vistas internas, usar offsets compartidos de shell.
- Para overlays y elementos flotantes, usar tokens con safe-area.
- Para secciones ancladas, usar compensación dinámica basada en variables.
- Para paneles/charts/chat, evitar alturas fijas no tokenizadas.

---

### 12.8 Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**No soportar:** IE 11 (ES6 modules requieren navegador moderno)

---

## 📝 PRÓXIMAS FASES

### Fase 2: Definición de Componentes
- Lista exacta de componentes necesarios
- Estructura interna de cada componente
- Variantes y opciones por componente

### Fase 3: Especificación de Páginas Detalladas
- Wireframes o mockups
- Campos exactos de cada formulario
- Flujos de interacción detallados

### Fase 4: Implementación
- Crear archivos según esta especificación
- Seguir los principios documentados
- Testing e integración

---

## ✅ CHECKLIST DE REVISIÓN

Antes de comenzar la implementación, verificar:

- [ ] Estructura de carpetas creada
- [ ] `PrincipiosDesarrollo.md` leído y comprendido
- [ ] `ReglasCSS` leído y aplicado en decisiones de estilos/layout
- [ ] Variables CSS definidas en `global.css`
- [ ] Tokens de layout/offset/altura definidos y reutilizados (sin duplicar hardcodes)
- [ ] Clases core entendidas (Component, EventBus, Router, etc.)
- [ ] Patrones de diseño claros
- [ ] Endpoints del backend clarificados con equipo backend
- [ ] Paleta de colores acordada con UI/UX
- [ ] Responsive breakpoints definidos
- [ ] Strategy `vh + dvh` validada para pantallas con viewport dinámico
- [ ] Sistema de autenticación claro

---

**FIN DE LA ESPECIFICACIÓN**

Documento elaborado: 18 de abril de 2026  
Versión: 1.0  
Estado: 🟢 LISTO PARA IMPLEMENTACIÓN
