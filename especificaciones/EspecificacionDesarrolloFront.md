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
├── components/
│   ├── layout/               # AppLayout (topbar + sidebar + footer, por rol) y PublicLayout
│   └── modals/               # Modal de nueva recomendación del asesor
│
├── pages/                    # Cada página = NombrePage.js (con `static template`) + nombre.html
│   ├── public/               # landing, placeholder / ruta no encontrada
│   ├── cliente/              # dashboard, cargar-gasto, historial, patrones, recomendaciones, perfil, perfiles
│   └── asesor/               # dashboard, clientes, perfil
│
├── assets/css/               # global.css (tokens), layouts.css, themes/, components/<pagina>.css
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

### Concepto General

Un **componente** es una unidad reutilizable de UI que encapsula estructura (HTML), estilos (CSS) e interactividad (JS).

### Características Base

Todos los componentes heredan de la clase `Component` que proporciona:

- **Ciclo de vida**: `constructor()` → `render()` → `attachEvents()` → `destroy()`
- **Validación de opciones**: Verificar que recibe parámetros correctos
- **Logging interno**: Debug habilitado/deshabilitado
- **Sistema de eventos**: Emitir eventos propios
- **Manejo de memoria**: Limpiar recursos al destruir

### Estructura de un Componente

**Archivo JS:** `components/NombreComponente/NombreComponente.js`

```javascript
class NombreComponente extends Component {
  // Opciones por defecto
  static DEFAULTS = {
    text: '',
    type: 'primary'
  };

  // Validar opciones recibidas
  _validateOptions(options) {
    if (options.type && !['primary', 'secondary'].includes(options.type)) {
      throw new Error('Tipo inválido');
    }
  }

  // Generar HTML
  render() {
    this.elemento.innerHTML = `
      <button class="btn btn-${this.options.type}">
        ${this.options.text}
      </button>
    `;
  }

  // Adjuntar event listeners
  attachEvents() {
    this.elemento.querySelector('button').addEventListener('click', (e) => {
      this.emit('clicked', { target: e.target });
    });
  }

  // Limpiar recursos
  destroy() {
    // Quitar event listeners, limpiar referencias
    super.destroy();
  }
}
```

**Archivo CSS:** `components/NombreComponente/NombreComponente.css`

```css
/* Componente principal */
.component-nombre {
  /* estilos base */
}

/* Variantes */
.component-nombre--primary {
  /* estilos para variante primary */
}

.component-nombre--secondary {
  /* estilos para variante secondary */
}
```

### Ciclo de Vida Completo

```
1. new NombreComponente(selector, options)
   ↓
2. Constructor valida opciones
   ↓
3. render() genera HTML en el selector
   ↓
4. attachEvents() adjunta event listeners
   ↓
5. Componente activo y funcional
   ↓
6. destroy() limpia y quita listeners
```

### Reutilización mediante Herencia

```
Component (base universal)
  ↓
CardComponent (base para tarjetas)
  ├── FeatureCard (tarjeta de feature)
  ├── StatsCard (tarjeta de estadísticas)
  └── ProfileCard (tarjeta de perfil)
```

### Nota sobre Lista de Componentes

La lista específica de componentes necesarios (Button, FormInput, Card, Modal, etc.) se detallará en la **siguiente etapa del proyecto**. En esta fase, definimos la arquitectura y estructura base.

---

## 8. GESTIÓN DE ESTILOS

### Variables CSS (Tema Global)

Archivo: `assets/css/global.css`

```css
:root {
  /* Colores Principales */
  --primary-color: #06D6A0;        /* Turquesa/Cyan */
  --secondary-color: #118AB2;      /* Azul */
  --danger-color: #EF476F;         /* Rojo */
  --warning-color: #FFD166;        /* Amarillo */
  --success-color: #06D6A0;        /* Verde */
  
  /* Colores Neutros */
  --bg-dark: #0a0e27;              /* Fondo oscuro */
  --bg-light: #f5f7fa;             /* Fondo claro */
  --text-dark: #1a202c;            /* Texto oscuro */
  --text-light: #e2e8f0;           /* Texto claro */
  --border-color: #e2e8f0;         /* Bordes */
  
  /* Tamaños de Fuente */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Bordes y Sombras */
  --border-radius: 0.5rem;
  --border-radius-lg: 1rem;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
}
```

### Temas (Light/Dark)

Archivo: `assets/css/themes/light.css`
```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
}
```

Archivo: `assets/css/themes/dark.css`
```css
[data-theme="dark"] {
  --bg-primary: #1a202c;
  --bg-secondary: #0a0e27;
  --text-primary: #e2e8f0;
  --text-secondary: #cbd5e0;
}
```

### Estructura de CSS

1. **global.css** - Variables, resets, utilidades
2. **layouts.css** - Grillas, containers, espacios
3. **themes/** - Variaciones de tema
4. **components/** - Estilos específicos de cada componente (1 archivo por componente)

### Naming: BEM Simplificado

```css
/* Block - componente principal */
.component-button { }

/* Element - subelemento */
.component-button__icon { }
.component-button__text { }

/* Modifier - variante */
.component-button--primary { }
.component-button--small { }
.component-button--disabled { }

/* Combinaciones */
.component-button--primary:hover { }
.component-button--primary .component-button__icon { }
```

### Reglas Generales

✅ **Usar Bootstrap primero** - `.btn`, `.card`, `.container` de Bootstrap antes de crear custom  
✅ **CSS Variables** - Referenciar `var(--primary-color)` en lugar de hardcodear colores  
✅ **Flexbox y Grid** - Para layouts, no floats  
✅ **Mobile First** - Media queries `@media (min-width: ...)` ascendente  
✅ **Desacoplado** - Estilos nunca inline, siempre en archivos CSS separados  

### Reglas Operativas Responsive (alineadas con ReglasCSS)

Estas reglas son de cumplimiento obligatorio y complementan la estrategia general de estilos.

1. **Tokenización obligatoria de layout**
  - Cualquier valor repetido en offsets, spacing o alturas debe vivir en variables globales.
  - En la implementación actual, los tokens base viven en `assets/css/global.css`.

2. **Prohibido compensar navbar con valores fijos por página**
  - No usar `padding-top` hardcodeado por vista como estrategia principal.
  - Usar un offset compartido de shell (`--app-shell-top-offset`) y derivados.

3. **Elementos flotantes con safe-area**
  - CTA flotantes, FABs, teasers y paneles deben usar tokens + `env(safe-area-inset-bottom)`.
  - Evitar valores absolutos fijos de `right/bottom/width/height` para overlays críticos.

4. **Alturas fluidas para paneles y gráficos**
  - Preferir `clamp(...)` para `min-height` y `max-height` en cards, charts y chats.
  - Evitar alturas rígidas que generen clipping en pantallas bajas o zoom alto.

5. **Viewport moderno con fallback**
  - Para contenedores dependientes del alto de pantalla, usar `vh` + `dvh`.
  - Objetivo: reducir saltos visuales por barras dinámicas en mobile.

6. **Navegación por anchors sin números mágicos locales**
  - `scroll-margin-top` y offsets de scroll deben depender de tokens compartidos,
    no de números hardcodeados aislados.

7. **Sincronización CSS/JS para UX timing y offsets**
  - Cualquier timeout UI o offset de interacción debe centralizarse en constantes
    (`utils/constants.js`) y no quedar inline en módulos.

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

> Contrato vigente desde la Fase 1 del refactor (`DiagnosticoRefactor.md` §6, decisión 6). El backend NestJS lo implementa tal cual; el front lo consume desde `frontend/services/*.service.js` y lo traduce al modelo de la UI en `frontend/services/adapters.js`. El backend simulado `frontend/mocks/mockServer.js` implementa exactamente este contrato.

### Convenciones

- **Rutas en inglés** (las fija la consigna: `/auth/login`, `/expenses`, `/tickets/upload`); **cuerpos en español**, con los mismos nombres de columna que la BD.
- Base URL: `API_CONFIG.BASE_URLS` en `frontend/utils/constants.js` (`local` = `http://localhost:3000`; `production` se completa al hacer el deploy).
- Autenticación: header `Authorization: Bearer <token>` (JWT). Todas las rutas requieren token salvo login y registro.
- Roles: `cliente` y `asesor`. Una ruta de otro rol responde **403**.
- Fechas de gasto: `AAAA-MM-DD`. Timestamps: ISO 8601. Montos: número (ARS).
- **Errores** (4xx/5xx), siempre con este cuerpo:

```json
{ "error": true, "mensaje": "Descripcion legible", "codigo": "VALIDACION", "detalles": { "campos": ["monto"] } }
```

| Estado | `codigo` | Cuándo |
|---|---|---|
| 401 | `CREDENCIALES_INVALIDAS` | Login con email o contraseña incorrectos |
| 401 | `NO_AUTENTICADO` | Token ausente, inválido o vencido (el front cierra la sesión) |
| 403 | `PROHIBIDO` | Rol incorrecto o cliente no asignado al asesor |
| 404 | `NO_ENCONTRADO` | Recurso inexistente o ajeno |
| 409 | `EMAIL_DUPLICADO` | Registro con un email existente |
| 422 | `VALIDACION` | Datos inválidos (`detalles.campos` lista los campos) |
| 500 | `ERROR_INTERNO` | Error no controlado |

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

Para un asesor, en lugar de `perfil_cliente` viene `perfil_asesor: { matricula, especialidad, descripcion, clientes_asignados }`. `perfil_de_gasto` es el registro vigente de `clasificacion_de_perfil` (puede ser `null`).

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

El email no se modifica desde el perfil. Un cliente que se registra queda asignado a un asesor (regla del backend).

### 10.2 Catálogos

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| GET | `/categories` | ambos | **200** `[{ id, nombre, icono }]` |
| GET | `/spending-profiles` | ambos | **200** `[{ id, nombre, descripcion }]` |

### 10.3 Gastos (cliente)

| Método | Ruta | Cuerpo / query | Respuesta |
|---|---|---|---|
| GET | `/expenses` | query opcional: `busqueda`, `categoria_id`, `origen`, `desde`, `hasta`, `orden` (`fecha` · `monto_desc` · `monto_asc`), `limite` | **200** `{ datos: [gasto], total }` |
| GET | `/expenses/:id` | — | **200** `gasto` |
| POST | `/expenses` | `{ comercio, fecha_gasto, monto, categoria_id, descripcion?, origen?, ticket_id? }` | **201** `gasto` |
| PUT | `/expenses/:id` | mismos campos (parcial) | **200** `gasto` |
| DELETE | `/expenses/:id` | — | **204** |

Validaciones: `monto > 0`, `fecha_gasto` con formato `AAAA-MM-DD`, `categoria_id` existente, `origen` en `manual` · `ticket` (por defecto `manual`). Un cliente solo ve y modifica sus gastos.

### 10.4 Tickets / OCR (cliente)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/tickets/upload` | `multipart/form-data` con el campo `archivo` (imagen) | **201** `{ ticket: { id, nombre_archivo, estado_procesamiento }, analisis: { comercio_detectado, fecha_detectada, monto_detectado, categoria_sugerida: { id, nombre } \| null, confianza_general } }` |

El backend guarda la imagen (`tickets`), la envía al servicio de OCR/IA, persiste el resultado (`analisis_ocr`) y lo devuelve en la misma respuesta. El front precompleta el formulario y, al guardar, manda `POST /expenses` con `origen: "ticket"` y `ticket_id`.

### 10.5 Recomendaciones

| Método | Ruta | Rol | Cuerpo / query | Respuesta |
|---|---|---|---|---|
| GET | `/recommendations` | cliente | — | **200** `[recomendacion]` (propias, más recientes primero) |
| PUT | `/recommendations/:id/read` | cliente | — | **200** `recomendacion` (`leida = true`, `leida_en`) |
| GET | `/recommendations/sent` | asesor | query `limite` | **200** `[recomendacion]` enviadas por el asesor |
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

Reglas de cálculo (las implementa hoy el mock en `frontend/mocks/analytics.js` y el backend debe reproducirlas):
- `gastos_por_mes`: últimos 7 meses incluido el actual. `gastos_por_dia`: últimos 14 días. `ranking_comercios`: top 5 por monto.
- `variacion_mes_anterior`: mes en curso contra el mes anterior **hasta el mismo día** (porcentaje; `null` si no hay datos).
- `gasto_promedio_mensual`: promedio de los meses completos anteriores con gastos.
- `dia_mayor_gasto`: 0 = domingo … 6 = sábado.
- **Gasto inusual**: gasto de los últimos 30 días que supera en más de 35% el promedio de su categoría (con al menos 3 gastos previos en esa categoría).
- `alertas.nivel`: `danger` · `warning` · `success` · `info`.
- **Perfil de gasto** (asignado automáticamente, sin intervención del cliente): participación de las categorías discrecionales (Entretenimiento, Suscripciones, Otros) en los últimos 3 meses, comparada con `perfiles_de_gasto.criterio_regla.discrecional_max` (Drácula Nocturno < 10%, Equilibrista Cósmico < 30%, Espíritu Libre el resto). El resultado se guarda en `clasificacion_de_perfil`.
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

**`resumen_cliente`**: `{ id, nombre_completo, email, estado, perfil_de_gasto, gasto_promedio_mensual, gasto_mes_actual, variacion_mes_anterior, ultimo_gasto_fecha, gastos_inusuales (cantidad), nivel_riesgo }`.

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
- El análisis completo por cliente (`#/asesor/clientes/:id`) se agrega en la Fase 5 del refactor.

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
| Dashboard Asesor | `#/asesor/dashboard` | advisor | asesor |
| Mis Clientes | `#/asesor/clientes` | advisor | asesor |
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
