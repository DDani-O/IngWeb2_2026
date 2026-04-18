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

### Resumen Ejecutivo de Principios

1. **Desacoplamiento Total** - Cada archivo JS, CSS e HTML independiente
2. **Herencia antes que Composición** - Para reutilización en componentes
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

```
frontend/
│
├── PrincipiosDesarrollo.md          # Guía de principios (LEER PRIMERO)
├── index.html                       # HTML principal - entry point
├── app.js                           # JavaScript entry point - inicialización
│
├── assets/                          # Recursos estáticos (desacoplados)
│   │
│   ├── css/
│   │   ├── global.css              # Variables CSS, resets, utilidades
│   │   ├── layouts.css             # Grillas, containers, espacios
│   │   └── themes/
│   │       ├── light.css           # Variables tema claro
│   │       └── dark.css            # Variables tema oscuro
│   │
│   └── img/
│       ├── logos/                  # Logos de la app
│       ├── icons/                  # Iconos custom
│       └── backgrounds/            # Imágenes de fondo
│
├── core/                            # ARQUITECTURA BASE DEL SISTEMA
│   │
│   ├── Component.js                # 🔷 Clase base universal para todos
│   │                               #    - Ciclo de vida (render, attachEvents, destroy)
│   │                               #    - Manejo de opciones y validación
│   │                               #    - Sistema de logging interno
│   │
│   ├── EventBus.js                 # 🔶 Sistema de eventos global (Singleton)
│   │                               #    - on(event, callback)
│   │                               #    - emit(event, data)
│   │                               #    - off(event, callback)
│   │
│   ├── Router.js                   # 🔶 Enrutador SPA (Singleton)
│   │                               #    - navigate(page, params)
│   │                               #    - Historial de navegación
│   │                               #    - Hash-based routing
│   │
│   ├── APIClient.js                # 🔶 Cliente HTTP (Singleton)
│   │                               #    - GET, POST, PUT, DELETE
│   │                               #    - Manejo de headers y autenticación
│   │                               #    - Control de errores
│   │
│   ├── StateManager.js             # 🔶 Gestor de estado global (Singleton)
│   │                               #    - Estado compartido de la app
│   │                               #    - Getters y setters
│   │                               #    - Emite eventos al cambiar
│   │
│   ├── AuthManager.js              # 🔶 Gestión de autenticación (Singleton)
│   │                               #    - Login, logout, registro
│   │                               #    - Manejo de tokens JWT
│   │                               #    - Verificación de sesión
│   │
│   └── ThemeManager.js             # 🔶 Gestión de temas (Singleton)
│                                   #    - Cambiar tema light/dark
│                                   #    - Persistencia en localStorage
│
├── components/                      # COMPONENTES REUTILIZABLES
│   │                               # Estructura a definir en siguiente fase
│   └── [Componentes personalizados van aquí]
│
├── utils/                           # UTILIDADES Y HELPERS
│   │
│   ├── helpers.js                  # Funciones utilitarias generales
│   │                               # - DOM manipulation
│   │                               # - Array/Object utilities
│   │                               # - Timing utilities
│   │
│   ├── validators.js               # Validaciones de datos
│   │                               # - isValidEmail()
│   │                               # - isValidPassword()
│   │                               # - isValidAmount()
│   │                               # - etc.
│   │
│   ├── formatters.js               # Formatos de presentación
│   │                               # - formatCurrency(amount)
│   │                               # - formatDate(date)
│   │                               # - formatTime(time)
│   │
│   └── constants.js                # Constantes y enums globales
│                                   # - API URLs
│                                   # - Event names
│                                   # - Error messages
│                                   # - Colores, tamaños, etc.
│
└── pages/                           # PÁGINAS/VISTAS DE LA APLICACIÓN
    │                               # Cada página = 1 archivo HTML + 1 archivo JS
    │
    ├── auth/                        # 🔓 FLUJO DE AUTENTICACIÓN
    │   ├── login.html              # Formulario de login
    │   ├── LoginPage.js            # Controlador de login
    │   │
    │   ├── registro-usuario.html   # Formulario de registro (usuario regular)
    │   ├── RegistroUsuarioPage.js  # Controlador de registro usuario
    │   │
    │   ├── elegir-perfil.html      # Selección de rol (usuario vs asesor)
    │   └── ElegirPerfilPage.js     # Controlador de elección de perfil
    │
    ├── usuario/                     # 👤 PÁGINAS DEL USUARIO REGULAR
    │   ├── dashboard.html          # Panel principal del usuario
    │   ├── DashboardPage.js        # Controlador dashboard usuario
    │   │
    │   ├── cargar-gasto.html       # Formulario de carga de gasto
    │   ├── CargarGastoPage.js      # Controlador de carga
    │   │
    │   ├── historial.html          # Listado histórico de gastos
    │   ├── HistorialPage.js        # Controlador de historial
    │   │
    │   ├── patrones.html           # Análisis de patrones de consumo
    │   ├── PatronesPage.js         # Controlador de patrones
    │   │
    │   ├── perfil.html             # Perfil del usuario
    │   ├── PerfilPage.js           # Controlador de perfil
    │   │
    │   ├── perfiles.html           # Perfiles de gasto (clasificaciones)
    │   ├── PerfilesPage.js         # Controlador de perfiles
    │   │
    │   ├── recomendaciones.html    # Recomendaciones financieras
    │   └── RecomendacionesPage.js  # Controlador de recomendaciones
    │
    ├── asesor/                      # 💼 PÁGINAS DEL ASESOR FINANCIERO
    │   ├── dashboard.html          # Panel de asesor (clientes y análisis)
    │   └── AsesorDashboardPage.js  # Controlador dashboard asesor
    │
    └── public/                      # 🌐 PÁGINAS PÚBLICAS
        ├── landing.html            # Página de bienvenida/marketing
        └── LandingPage.js          # Controlador de landing

```

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
- `APIClient` - Un único cliente HTTP

**Implementación:** Constructor privado con método `getInstance()`

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

### Base URL

```
http://api.fintrack.local/v1
```

### 10.1 Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **POST** | `/auth/register` | Registrar nuevo usuario |
| **POST** | `/auth/login` | Login (retorna JWT token) |
| **POST** | `/auth/logout` | Logout |
| **GET** | `/auth/me` | Obtener usuario autenticado |
| **PUT** | `/auth/profile` | Actualizar perfil de usuario |

#### POST `/auth/register`
```javascript
Request:
{
  email: "usuario@example.com",
  password: "SecurePass123",
  nombre: "Juan",
  apellido: "Pérez",
  perfil: "usuario" // o "asesor"
}

Response (201):
{
  id: 1,
  email: "usuario@example.com",
  nombre: "Juan",
  perfil: "usuario",
  token: "eyJhbGc..."
}
```

#### POST `/auth/login`
```javascript
Request:
{
  email: "usuario@example.com",
  password: "SecurePass123"
}

Response (200):
{
  token: "eyJhbGc...",
  user: {
    id: 1,
    email: "usuario@example.com",
    nombre: "Juan",
    perfil: "usuario"
  }
}
```

#### GET `/auth/me`
```javascript
Headers:
Authorization: Bearer <token>

Response (200):
{
  id: 1,
  email: "usuario@example.com",
  nombre: "Juan",
  apellido: "Pérez",
  perfil: "usuario",
  createdAt: "2026-01-15T10:00:00Z"
}
```

### 10.2 Gastos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/expenses` | Listar gastos del usuario |
| **GET** | `/expenses/:id` | Obtener gasto específico |
| **POST** | `/expenses` | Crear nuevo gasto |
| **PUT** | `/expenses/:id` | Actualizar gasto |
| **DELETE** | `/expenses/:id` | Eliminar gasto |
| **POST** | `/expenses/filter` | Filtrar gastos |

#### GET `/expenses?page=1&limit=20`
```javascript
Response (200):
{
  total: 150,
  page: 1,
  limit: 20,
  data: [
    {
      id: 1,
      monto: 45.50,
      comercio: "Supermercado X",
      categoria: "alimentos",
      fecha: "2026-04-18",
      descripcion: "Compra semanal",
      usuarioId: 1
    },
    // ... más gastos
  ]
}
```

#### POST `/expenses`
```javascript
Request:
{
  monto: 45.50,
  comercio: "Supermercado X",
  categoria: "alimentos",
  fecha: "2026-04-18",
  descripcion: "Compra semanal"
}

Response (201):
{
  id: 1,
  monto: 45.50,
  comercio: "Supermercado X",
  categoria: "alimentos",
  fecha: "2026-04-18",
  usuarioId: 1,
  createdAt: "2026-04-18T15:30:00Z"
}
```

### 10.3 Tickets/OCR

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **POST** | `/tickets/upload` | Subir imagen de ticket |
| **POST** | `/tickets/analyze` | Analizar ticket con IA |
| **GET** | `/tickets/:id` | Obtener ticket procesado |

#### POST `/tickets/upload`
```javascript
Request (FormData):
{
  file: <File> // Imagen del ticket
}

Response (201):
{
  id: 1,
  fileName: "ticket_001.jpg",
  uploadedAt: "2026-04-18T15:30:00Z",
  status: "pending" // pending, analyzing, completed, failed
}
```

#### POST `/tickets/analyze`
```javascript
Request:
{
  ticketId: 1
}

Response (200):
{
  id: 1,
  extractedData: {
    monto: 45.50,
    comercio: "Supermercado X",
    fecha: "2026-04-18",
    categoria: null // opcional
  },
  confidence: 0.95,
  status: "completed"
}
```

### 10.4 Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/categories` | Listar todas las categorías |

#### GET `/categories`
```javascript
Response (200):
{
  data: [
    { id: 1, nombre: "Alimentos", icono: "🍔" },
    { id: 2, nombre: "Transporte", icono: "🚗" },
    { id: 3, nombre: "Entretenimiento", icono: "🎬" },
    // ... más categorías
  ]
}
```

### 10.5 Análisis (Solo Asesor)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/analysis/user/:userId` | Análisis general de usuario |
| **GET** | `/analysis/patterns/:userId` | Patrones de consumo |

#### GET `/analysis/user/:userId`
```javascript
Headers:
Authorization: Bearer <asesor_token>

Response (200):
{
  usuarioId: 1,
  gastoTotal: 5000.00,
  gastoPromedio: 150.00,
  categoriaDestacada: "alimentos",
  periodoAnalisis: "ultimo_mes"
}
```

#### GET `/analysis/patterns/:userId`
```javascript
Headers:
Authorization: Bearer <asesor_token>

Response (200):
{
  usuarioId: 1,
  patrones: [
    {
      tipo: "gasto_diario_promedio",
      valor: 150.00
    },
    {
      tipo: "categoria_mas_gastada",
      valor: "alimentos"
    },
    {
      tipo: "dia_pico_gasto",
      valor: "viernes"
    }
  ]
}
```

### 10.6 Usuarios (Solo Asesor/Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/admin/users` | Listar todos los usuarios |
| **GET** | `/admin/users/:id` | Detalles de usuario específico |

#### GET `/admin/users?page=1&limit=20`
```javascript
Headers:
Authorization: Bearer <asesor_token>

Response (200):
{
  total: 45,
  page: 1,
  limit: 20,
  data: [
    {
      id: 1,
      email: "usuario@example.com",
      nombre: "Juan",
      perfil: "usuario",
      createdAt: "2026-01-15T10:00:00Z",
      gastosTotales: 5000.00
    },
    // ... más usuarios
  ]
}
```

### 10.7 Manejo de Errores

Todos los endpoints retornan errores en formato:

```javascript
Response (4xx/5xx):
{
  error: true,
  message: "Descripción del error",
  code: "ERROR_CODE",
  details: {} // opcional
}
```

**Códigos de error comunes:**
- `401 Unauthorized` - Token inválido o expirado
- `403 Forbidden` - Sin permiso para acceder
- `404 Not Found` - Recurso no existe
- `422 Unprocessable Entity` - Datos inválidos
- `500 Internal Server Error` - Error del servidor

---

## 11. PÁGINAS Y FLUJOS DE USUARIO

### Flujo General de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                   LANDING PAGE                           │
│        (index.html, login/registro por modales)          │
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

**Archivo:** `frontend/index.html` + `frontend/app.js`

**Nota técnica (implementación actual):** La landing vive en `index.html` y no existe carpeta
`pages/public`.

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

#### 11.2.1 Login (Modal en Landing)

**Archivo:** `frontend/index.html` (estructura/modal) + `frontend/app.js` (orquestación de eventos)

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

#### 11.2.2 Registro Usuario (Modal en Landing)

**Archivo:** `frontend/index.html` (estructura/modal) + `frontend/app.js` (orquestación de eventos)

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

### 11.3 Páginas del Usuario Regular

#### 11.3.1 Dashboard Usuario

**Archivo:** `pages/usuario/dashboard.html` + `pages/usuario/DashboardPage.js`

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

**Archivo:** `pages/usuario/cargar-gasto.html` + `pages/usuario/CargarGastoPage.js`

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

**Archivo:** `pages/usuario/historial.html` + `pages/usuario/HistorialPage.js`

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

**Archivo:** `pages/usuario/patrones.html` + `pages/usuario/PatronesPage.js`

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

**Archivo:** `pages/usuario/recomendaciones.html` + `pages/usuario/RecomendacionesPage.js`

**Contenido:**
- Lista de recomendaciones (pueden ser del sistema o asesor)
- Cards de recomendación con:
  - Título
  - Descripción
  - Categoría relacionada
  - Nivel de prioridad (info, warning, danger)
  - Fecha

**Datos:**
- GET `/recommendations/{userId}` → recomendaciones

---

#### 11.3.6 Perfil Page

**Archivo:** `pages/usuario/perfil.html` + `pages/usuario/PerfilPage.js`

**Contenido:**
- Avatar (opcional)
- Información del usuario:
  - Nombre
  - Email
  - Teléfono
  - Moneda preferida
  - Tema (light/dark)
- Botones:
  - Editar perfil
  - Cambiar contraseña
  - Logout

**Datos:**
- GET `/auth/me` → información del usuario

---

#### 11.3.7 Perfiles de Gasto Page

**Archivo:** `pages/usuario/perfiles.html` + `pages/usuario/PerfilesPage.js`

**Contenido:**
- Sistema de clasificación del usuario:
  - Perfil financiero generado por el sistema
  - Ejemplos: "Consumidor equilibrado", "Consumidor ahorrador", etc.
- Histórico de perfiles (opcional)

**Datos:**
- GET `/analysis/user/{userId}` → perfil

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

---

### 11.5 Rutas y Navegación

**URLs (hash-based):**

| Página | Ruta |
|--------|------|
| Landing | `#/` |
| Login (modal) | `#/?modal=login` |
| Registro (modal) | `#/?modal=register` |
| Dashboard Usuario | `#/usuario/dashboard` |
| Cargar Gasto | `#/usuario/cargar-gasto` |
| Historial | `#/usuario/historial` |
| Patrones | `#/usuario/patrones` |
| Recomendaciones | `#/usuario/recomendaciones` |
| Perfil Usuario | `#/usuario/perfil` |
| Perfiles Gasto | `#/usuario/perfiles` |
| Dashboard Asesor | `#/asesor/dashboard` |
| Placeholder | `#/utils/placeholder` |

**Implementación:** Hash-based routing en `Router.js`

```javascript
router.navigate('usuario/dashboard')  // Cambia a #/usuario/dashboard
router.navigate('/')                  // Cambia a #/
```

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

// Archivo: pages/usuario/DashboardPage.js
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
localStorage.setItem('authToken', response.token);

// Al hacer requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
}

// Al logout
localStorage.removeItem('authToken');
```

**Tema:**
```javascript
// Guardar preferencia
localStorage.setItem('theme', 'dark');

// Cargar al iniciar
const theme = localStorage.getItem('theme') || 'light';
themeManager.setTheme(theme);
```

**Estado temporal:**
```javascript
localStorage.setItem('formDraft', JSON.stringify(formData));
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
- [ ] Variables CSS definidas en `global.css`
- [ ] Clases core entendidas (Component, EventBus, Router, etc.)
- [ ] Patrones de diseño claros
- [ ] Endpoints del backend clarificados con equipo backend
- [ ] Paleta de colores acordada con UI/UX
- [ ] Responsive breakpoints definidos
- [ ] Sistema de autenticación claro

---

**FIN DE LA ESPECIFICACIÓN**

Documento elaborado: 18 de abril de 2026  
Versión: 1.0  
Estado: 🟢 LISTO PARA IMPLEMENTACIÓN
