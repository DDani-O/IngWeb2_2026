# 📖 PRINCIPIOS DE DESARROLLO FRONTEND - FinTrack

**Guía de Principios, Convenciones y Mejores Prácticas**

**Versión:** 1.0  
**Fecha:** 18 de abril de 2026  
**Leer antes de escribir cualquier código**

---

## 📑 TABLA DE CONTENIDOS

1. [Principios SOLID Aplicados](#1-principios-solid-aplicados)
2. [Convenciones de Nomenclatura](#2-convenciones-de-nomenclatura)
3. [Estructura y Organización del Código](#3-estructura-y-organización-del-código)
4. [Desacoplamiento y Modularidad](#4-desacoplamiento-y-modularidad)
5. [Sistema de Componentes](#5-sistema-de-componentes)
6. [Manejo de Eventos](#6-manejo-de-eventos)
7. [Comunicación Backend](#7-comunicación-backend)
8. [Gestión del Estado](#8-gestión-del-estado)
9. [Estilos y CSS](#9-estilos-y-css)
10. [Testing y Debugging](#10-testing-y-debugging)
11. [Documentación](#11-documentación)
12. [Anti-Patrones a Evitar](#12-anti-patrones-a-evitar)

---

## 1. PRINCIPIOS SOLID APLICADOS

### 1.1 S - Single Responsibility Principle

**Cada clase tiene una responsabilidad única y bien definida**

❌ **MAL** - Clase con múltiples responsabilidades:
```javascript
class LoginForm {
  // ¡Hace demasiado!
  render() { /* genera HTML */ }
  validate() { /* valida datos */ }
  makeAPICall() { /* hace request */ }
  manageUI() { /* actualiza UI */ }
  handleErrors() { /* maneja errores */ }
  saveToLocalStorage() { /* persiste datos */ }
}
```

✅ **BIEN** - Clases con responsabilidad única:
```javascript
// Responsabilidad: Renderizar UI
class LoginForm extends Component {
  render() { /* genera HTML */ }
  attachEvents() { /* event listeners */ }
}

// Responsabilidad: Validar
class LoginValidator {
  validateEmail(email) { /* ... */ }
  validatePassword(password) { /* ... */ }
}

// Responsabilidad: Comunicación HTTP
class APIClient {
  post(endpoint, data) { /* ... */ }
}

// Responsabilidad: Persistencia
class StorageManager {
  save(key, value) { /* ... */ }
  get(key) { /* ... */ }
}
```

**Beneficio:** Cada clase es fácil de testear, mantener y extender

---

### 1.2 O - Open/Closed Principle

**Abierto para extensión, cerrado para modificación**

❌ **MAL** - Modificar clase cada vez que necesito nuevo tipo:
```javascript
class Button {
  render() {
    if (this.type === 'primary') {
      return `<button class="btn-primary">...</button>`;
    }
    if (this.type === 'secondary') {
      return `<button class="btn-secondary">...</button>`;
    }
    // ¡Modifico la clase cada vez que agrego tipo nuevo!
  }
}
```

✅ **BIEN** - Extensible mediante herencia:
```javascript
// Base abierta a extensión
class Button extends Component {
  static DEFAULTS = { type: 'primary' };
  
  render() {
    const buttonClass = this.getButtonClass();
    return `<button class="${buttonClass}">...</button>`;
  }
  
  getButtonClass() {
    return `btn btn-${this.options.type}`;
  }
}

// Extensión sin modificar la clase base
class PrimaryButton extends Button {
  static DEFAULTS = { type: 'primary' };
}

class DangerButton extends Button {
  static DEFAULTS = { type: 'danger' };
}
```

**Beneficio:** Agregar nuevas funcionalidades sin tocar código existente

---

### 1.3 L - Liskov Substitution Principle

**Las subclases deben ser substituibles por sus clases padre**

✅ **BIEN** - Cualquier componente puede reemplazar a Component:
```javascript
class Component { /* base */ }
class Card extends Component { /* puede reemplazar a Component */ }
class Button extends Component { /* puede reemplazar a Component */ }

// Todos son "Component"
const components = [
  new Card('.card-1'),
  new Button('.button-1'),
  new Card('.card-2')
];

// Todos responden igual
components.forEach(component => {
  component.render();
  component.attachEvents();
});
```

**Beneficio:** Polimorfismo seguro, código genérico y reutilizable

---

### 1.4 I - Interface Segregation Principle

**Clientes no deben depender de interfaces que no usan**

❌ **MAL** - Interfaz gorda:
```javascript
// ¡FormComponent debe implementar TODOS estos métodos!
class FormComponent {
  render() { }
  attachEvents() { }
  validate() { }
  submit() { }
  save() { }
  delete() { }
  export() { }
  import() { }
}

// Pero mi botón simple solo necesita render + attachEvents
class SubmitButton extends FormComponent {
  render() { /* ... */ }
  attachEvents() { /* ... */ }
  validate() { throw new Error('No aplicable'); }
  submit() { throw new Error('No aplicable'); }
  // ... implementar todos aunque no los necesite
}
```

✅ **BIEN** - Interfaces segregadas:
```javascript
// Interfaz mínima - todos deben implementar
class Component {
  render() { }
  attachEvents() { }
  destroy() { }
}

// Interfaz adicional si es necesaria
class ValidableComponent extends Component {
  validate() { }
}

// Solo lo que necesito
class SubmitButton extends Component {
  render() { /* ... */ }
  attachEvents() { /* ... */ }
}

// Si necesito validación
class FormInput extends ValidableComponent {
  render() { /* ... */ }
  attachEvents() { /* ... */ }
  validate() { /* ... */ }
}
```

**Beneficio:** Clases simples, sin métodos innecesarios

---

### 1.5 D - Dependency Inversion Principle

**Depender de abstracciones, no de implementaciones concretas**

❌ **MAL** - Dependencia de implementación concreta:
```javascript
class LoginPage {
  constructor() {
    // ¡Acoplado a XMLHttpRequest específico!
    this.http = new XMLHttpRequestClient();
    this.storage = new LocalStorageImpl();
  }
}
```

✅ **BIEN** - Dependencia inyectada:
```javascript
class LoginPage {
  constructor(httpClient, storageManager) {
    // Depende de abstracciones, no de implementaciones
    this.http = httpClient;      // Podría ser Fetch, Axios, etc.
    this.storage = storageManager; // Podría ser LocalStorage, SessionStorage, etc.
  }
}

// Uso flexible
const loginPage = new LoginPage(
  new APIClient(),        // Implementación de http
  new StorageManager()    // Implementación de storage
);
```

**Beneficio:** Fácil de testear, cambiar implementaciones sin afectar la lógica

---

## 2. CONVENCIONES DE NOMENCLATURA

### 2.1 Nombres de Archivos

#### JavaScript
- **Clases:** PascalCase
  ```
  ✅ LoginPage.js
  ✅ Component.js
  ✅ EventBus.js
  ❌ login-page.js
  ❌ loginPage.js
  ```

- **Funciones/Utilidades:** camelCase
  ```
  ✅ helpers.js
  ✅ formatters.js
  ❌ Helpers.js
  ❌ format-helpers.js
  ```

- **Constantes:** UPPER_CASE
  ```
  ✅ constants.js
  ✅ API_CONFIG.js
  ❌ Constant.js
  ```

#### HTML
- **kebab-case (minúsculas con guiones)**
  ```
  ✅ login.html
  ✅ cargar-gasto.html
  ✅ elegir-perfil.html
  ❌ Login.html
  ❌ CargarGasto.html
  ```

#### CSS
- **kebab-case**
  ```
  ✅ global.css
  ✅ components.css
  ✅ light-theme.css
  ❌ Global.css
  ❌ componentsFile.css
  ```

---

### 2.2 Nombres de Variables

```javascript
// ✅ BIEN - Claro y descriptivo
const userEmail = 'user@example.com';
const isAuthenticated = true;
const expenseList = [];
const totalAmount = 1000;

// ❌ MAL - Vago o confuso
const x = 'user@example.com';
const flag = true;
const list = [];
const n = 1000;
```

### 2.3 Nombres de Métodos

```javascript
// ✅ BIEN - Verbos que describen acción
class User {
  getName() { }
  setEmail(email) { }
  isAuthenticated() { }
  validatePassword(pwd) { }
  loadData() { }
  saveChanges() { }
}

// ❌ MAL - Verbos genéricos o no-claros
class User {
  get() { }      // ¿qué obtenemos?
  handle() { }   // ¿qué manejamos?
  data() { }     // ¿qué hacemos con datos?
}
```

### 2.4 Nombres de Clases

```javascript
// ✅ BIEN - Sustantivos, significado claro
class LoginPage { }
class ExpenseValidator { }
class APIClient { }
class ThemeManager { }

// ❌ MAL - Genéricos o confusos
class Page { }      // ¿cuál página?
class Handler { }   // ¿qué maneja?
class Util { }      // ¿utilidad de qué?
```

### 2.5 Nombres de Constantes

```javascript
// ✅ BIEN
const API_BASE_URL = 'https://api.fintrack.local/v1';
const MAX_LOGIN_ATTEMPTS = 3;
const DEFAULT_CURRENCY = 'USD';
const ERROR_MESSAGES = { /* ... */ };

// ❌ MAL
const apiUrl = 'https://api.fintrack.local/v1';
const max = 3;
const currency = 'USD';
const messages = { /* ... */ };
```

---

## 3. ESTRUCTURA Y ORGANIZACIÓN DEL CÓDIGO

### 3.1 Orden de Elementos en una Clase

```javascript
class LoginPage extends Component {
  // 1. Propiedades estáticas
  static DEFAULTS = { };
  
  // 2. Constructor
  constructor(selector, options = {}) {
    super(selector, options);
    this.validator = new LoginValidator();
  }
  
  // 3. Método estático privado si aplica
  static _createDefault() { }
  
  // 4. Métodos públicos (en orden lógico)
  render() { }
  attachEvents() { }
  
  // 5. Métodos privados (con prefijo _)
  _handleSubmit() { }
  _validateForm() { }
  _handleLoginSuccess() { }
  _handleLoginError() { }
  
  // 6. Cleanup
  destroy() {
    super.destroy();
  }
}
```

### 3.2 Indentación y Espaciado

```javascript
// ✅ Indentación consistente (2 espacios)
class Component {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = options;
  }

  render() {
    if (this.elemento) {
      // Espacio después de if, while, etc.
      this.elemento.innerHTML = this.getHTML();
    }
  }

  getHTML() {
    return `
      <div class="component">
        <!-- Espacios claros en template strings -->
      </div>
    `;
  }
}
```

### 3.3 Longitud de Línea

- **Máximo 100 caracteres** por línea
- Excepto URLs, template strings muy complejos

```javascript
// ✅ BIEN - Legible
const userData = {
  name: 'Juan',
  email: 'juan@example.com',
  role: 'usuario'
};

// ❌ MAL - Muy largo
const userData = { name: 'Juan', email: 'juan@example.com', role: 'usuario' };
```

---

## 4. DESACOPLAMIENTO Y MODULARIDAD

### 4.1 Importar Solo lo Necesario

```javascript
// ✅ BIEN - Importar lo específico
import { EventBus } from '../../core/EventBus.js';
import { APIClient } from '../../core/APIClient.js';

// ❌ MAL - Importar todo (si el módulo lo permite)
import * as Core from '../../core/';  // ¿Qué estoy importando?
```

### 4.2 Evitar Acoplamiento Fuerte

```javascript
// ❌ MAL - Acoplado directo
class DashboardPage {
  constructor() {
    this.loginPage = new LoginPage(); // ¿Por qué necesita LoginPage?
    this.historialPage = new HistorialPage(); // ¿Todas las páginas?
  }
}

// ✅ BIEN - Desacoplado mediante eventos
class DashboardPage extends Component {
  constructor(selector, options = {}) {
    super(selector, options);
    
    // Solo escucha eventos, no conoce otras páginas
    eventBus.on('auth:login', () => this.onUserLogin());
    eventBus.on('expense:created', () => this.refreshData());
  }
  
  onUserLogin() { /* ... */ }
  refreshData() { /* ... */ }
}
```

### 4.3 Inyección de Dependencias

```javascript
// ✅ BIEN - Las dependencias se inyectan
class ExpenseService {
  constructor(apiClient, validator) {
    this.apiClient = apiClient;
    this.validator = validator;
  }
  
  async createExpense(data) {
    this.validator.validate(data);
    return await this.apiClient.post('/expenses', data);
  }
}

// Uso flexible
const service = new ExpenseService(
  new APIClient(),
  new ExpenseValidator()
);
```

---

## 5. SISTEMA DE COMPONENTES

### 5.1 Estructura Básica de Componente

```javascript
/**
 * LoginForm.js - Formulario de login
 * 
 * Responsabilidad: Renderizar y manejar formulario de login
 * Emite: 'loginForm:submit' con credenciales
 * Escucha: -
 */

import { Component } from '../../core/Component.js';
import { eventBus } from '../../core/EventBus.js';

export class LoginForm extends Component {
  static DEFAULTS = {
    submitButtonText: 'Iniciar Sesión',
    showForgotPassword: true
  };

  constructor(selector, options = {}) {
    super(selector, options);
  }

  /**
   * Renderiza el HTML del formulario
   * Debe ser implementado por todas las subclases
   */
  render() {
    this.elemento.innerHTML = `
      <form class="login-form" id="login-form">
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required
            placeholder="tu@email.com"
            class="form-control"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required
            class="form-control"
          >
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary btn-block"
        >
          ${this.options.submitButtonText}
        </button>
        
        ${this.options.showForgotPassword ? `
          <a href="#/forgot-password" class="forgot-password-link">
            ¿Olvidó su contraseña?
          </a>
        ` : ''}
      </form>
    `;
  }

  /**
   * Adjunta event listeners
   * Debe ser implementado por todas las subclases
   */
  attachEvents() {
    const form = this.elemento.querySelector('#login-form');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  /**
   * Maneja el envío del formulario
   * @private
   */
  _handleSubmit() {
    const email = this.elemento.querySelector('#email').value;
    const password = this.elemento.querySelector('#password').value;
    
    // Emitir evento para que otras clases lo escuchen
    eventBus.emit('loginForm:submit', {
      email,
      password
    });
  }

  /**
   * Limpia recursos
   */
  destroy() {
    // Quitar event listeners, limpiar referencias
    super.destroy();
  }
}
```

### 5.2 Herencia para Reutilización

```javascript
// Base - Componente base para inputs
class InputBase extends Component {
  getInputHTML(type = 'text', placeholder = '') {
    return `
      <input 
        type="${type}" 
        class="form-control"
        placeholder="${placeholder}"
        id="${this.options.id}"
        name="${this.options.name}"
        ${this.options.required ? 'required' : ''}
      >
    `;
  }
  
  getValue() {
    return this.elemento.querySelector('input').value;
  }
}

// Específico - Input de email
class EmailInput extends InputBase {
  render() {
    this.elemento.innerHTML = this.getInputHTML('email', 'Email...');
  }
}

// Específico - Input de contraseña
class PasswordInput extends InputBase {
  render() {
    this.elemento.innerHTML = this.getInputHTML('password', '••••••••');
  }
}
```

---

## 6. MANEJO DE EVENTOS

### 6.1 Usar EventBus para Desacoplamiento

```javascript
// ✅ BIEN - Mediante eventos desacoplados
class LoginPage {
  _handleLoginSuccess(response) {
    // Guardar token
    localStorage.setItem('authToken', response.token);
    
    // Emitir evento (otros módulos lo escuchan)
    eventBus.emit('auth:login', { user: response.user });
    
    // Navegar (Router lo escucha)
    eventBus.emit('router:navigate', { page: 'elegir-perfil' });
  }
}

// Otros módulos escuchan sin acoplamiento
class DashboardPage {
  constructor() {
    eventBus.on('auth:login', (data) => {
      this.currentUser = data.user;
      this.loadData();
    });
  }
}

// ❌ MAL - Acoplamiento directo
class LoginPage {
  _handleLoginSuccess(response) {
    // ¡Conoce sobre DashboardPage!
    const dashboard = new DashboardPage();
    dashboard.currentUser = response.user;
    dashboard.loadData();
  }
}
```

### 6.2 Nombres de Eventos Consistentes

```javascript
// Usar namespace:action
'auth:login'           // auth namespace, login action
'auth:logout'          // auth namespace, logout action
'expense:created'      // expense namespace, created action
'expense:updated'      // expense namespace, updated action
'router:navigate'      // router namespace, navigate action
'state:changed'        // state namespace, changed action
```

### 6.3 Manejo de Listeners en Componentes

```javascript
class Component {
  constructor(selector, options = {}) {
    this._listeners = {}; // Guardar referencias de listeners
  }

  /**
   * Adjuntar evento con referencia
   * (permite remover después en destroy)
   */
  _addEventListener(element, event, handler) {
    const key = `${element.id}:${event}`;
    this._listeners[key] = handler;
    element.addEventListener(event, handler);
  }

  /**
   * Limpiar todos los listeners
   */
  destroy() {
    // Remover todos los event listeners adjuntados
    Object.entries(this._listeners).forEach(([, handler]) => {
      handler.target?.removeEventListener(handler.event, handler);
    });
    this._listeners = {};
  }
}
```

---

## 7. COMUNICACIÓN BACKEND

### 7.1 Usar APIClient Singleton

```javascript
// ✅ BIEN - Usar siempre el mismo cliente
class ExpenseService {
  async getExpenses(filters = {}) {
    try {
      const response = await apiClient.get('/expenses', { params: filters });
      return response.data;
    } catch (error) {
      eventBus.emit('state:error', { message: error.message });
      throw error;
    }
  }
}

// ❌ MAL - Crear nuevos clientes o hacer requests directos
class ExpenseService {
  async getExpenses(filters = {}) {
    // ¡Acoplado a fetch específico!
    const response = await fetch('/expenses?...');
    return await response.json();
  }
}
```

### 7.2 Manejo de Errores Consistente

```javascript
async function loadExpenses() {
  try {
    // Emitir estado loading
    eventBus.emit('state:loading', { isLoading: true });
    
    const expenses = await apiClient.get('/expenses');
    
    // Guardar en estado
    stateManager.set('expenses', expenses);
    
    // Emitir éxito
    eventBus.emit('expense:loaded', { expenses });
    
  } catch (error) {
    // Emitir error
    eventBus.emit('state:error', { 
      message: error.message,
      code: error.code 
    });
    
  } finally {
    eventBus.emit('state:loading', { isLoading: false });
  }
}
```

### 7.3 Headers de Autenticación

```javascript
class APIClient {
  async _request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Agregar token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    });
    
    if (response.status === 401) {
      // Token expirado, logout
      eventBus.emit('auth:sessionExpired');
    }
    
    return response;
  }
}
```

---

## 8. GESTIÓN DEL ESTADO

### 8.1 StateManager Singleton

```javascript
// ✅ BIEN - Estado centralizado
class StateManager {
  constructor() {
    this._state = {
      user: null,
      expenses: [],
      isLoading: false,
      theme: 'light'
    };
    this._listeners = [];
  }

  /**
   * Obtener valor del estado
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Establecer valor y emitir evento
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;
    
    // Emitir solo si cambió
    if (oldValue !== value) {
      eventBus.emit('state:changed', {
        key,
        oldValue,
        newValue: value
      });
    }
  }

  /**
   * Obtener todo el estado
   */
  getAll() {
    return { ...this._state };
  }
}

// Uso
stateManager.set('user', { id: 1, name: 'Juan' });
const user = stateManager.get('user');

eventBus.on('state:changed', (e) => {
  console.log(`${e.key} cambió de ${e.oldValue} a ${e.newValue}`);
});
```

### 8.2 NO Modificar Estado Directamente

```javascript
// ❌ MAL - Modificar directamente (mutación)
stateManager._state.user.name = 'Pedro'; // ¡No emite evento!

// ✅ BIEN - Usar método set
stateManager.set('user', {
  ...stateManager.get('user'),
  name: 'Pedro'
}); // ¡Emite evento!
```

---

## 9. ESTILOS Y CSS

### 9.1 Desacoplamiento HTML/CSS

```javascript
// ✅ BIEN - Clases CSS definidas en archivos CSS
render() {
  this.elemento.innerHTML = `
    <button class="btn btn-primary">Guardar</button>
  `;
}

// ❌ MAL - Estilos inline (evitar)
render() {
  this.elemento.innerHTML = `
    <button style="background-color: #06D6A0; padding: 10px;">
      Guardar
    </button>
  `;
}
```

### 9.2 Naming BEM para Clases CSS

```css
/* ✅ BIEN - BEM pattern */

/* Block - componente principal */
.login-form { }

/* Element - subelemento */
.login-form__input { }
.login-form__button { }
.login-form__error { }

/* Modifier - variante */
.login-form--loading { }
.login-form__input--error { }
.login-form__button--disabled { }

/* ❌ MAL - Nombres genéricos o anidados */
.form { }        /* ¿cuál form? */
.input { }       /* ¿cuál input? */
.btn { }         /* usar Bootstrap */
.form .btn { }   /* evitar selectores anidados */
```

### 9.3 Usar Variables CSS

```css
/* ✅ BIEN */
.login-form__button {
  background-color: var(--primary-color);
  color: var(--text-light);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
}

/* ❌ MAL - Hardcodear colores */
.login-form__button {
  background-color: #06D6A0;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
}
```

### 9.4 Media Queries - Mobile First

```css
/* ✅ BIEN - Mobile first */

/* Base: mobile (< 768px) */
.dashboard {
  display: flex;
  flex-direction: column;
}

.dashboard__sidebar {
  width: 100%;
  order: 2;
}

/* Tablet (≥ 768px) */
@media (min-width: 768px) {
  .dashboard {
    flex-direction: row;
  }
  
  .dashboard__sidebar {
    width: 250px;
    order: 1;
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .dashboard__sidebar {
    width: 300px;
  }
}
```

---

## 10. TESTING Y DEBUGGING

### 10.1 Logging en Desarrollo

```javascript
class Component {
  constructor(selector, options = {}) {
    this.DEBUG = options.debug || false;
    this._log('Componente inicializado', { selector, options });
  }

  _log(message, data = null) {
    if (this.DEBUG) {
      console.log(`[${this.constructor.name}] ${message}`, data);
    }
  }

  render() {
    this._log('Renderizando componente');
  }
}

// Uso con debug
const form = new LoginForm('#login-form', { debug: true });
// [LoginForm] Componente inicializado
// [LoginForm] Renderizando componente
```

### 10.2 Validación en Tiempo de Desarrollo

```javascript
class Component {
  _validateOptions(options) {
    // Validar tipos
    if (options.text !== undefined && typeof options.text !== 'string') {
      throw new TypeError('options.text debe ser string');
    }
    
    if (options.type && !['primary', 'secondary'].includes(options.type)) {
      throw new Error('options.type debe ser primary o secondary');
    }
  }
}

// Capturar errores temprano
try {
  new LoginForm('.form', { text: 123 }); // ❌ TypeError
} catch (error) {
  console.error('Error en configuración:', error.message);
}
```

### 10.3 Try-Catch en Operaciones Críticas

```javascript
async function handleExpenseCreation(expenseData) {
  try {
    // Validar
    const validation = expenseValidator.validate(expenseData);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }
    
    // Crear
    const result = await apiClient.post('/expenses', expenseData);
    
    // Éxito
    eventBus.emit('expense:created', result);
    return result;
    
  } catch (error) {
    // Logging para debugging
    console.error('Error creando gasto:', {
      message: error.message,
      data: expenseData,
      timestamp: new Date().toISOString()
    });
    
    // Emitir para UI
    eventBus.emit('state:error', { message: error.message });
    throw error;
  }
}
```

---

## 11. DOCUMENTACIÓN

### 11.1 JSDoc para Funciones Públicas

```javascript
/**
 * Crea un nuevo gasto en el sistema
 * 
 * @param {Object} expenseData - Datos del gasto
 * @param {number} expenseData.monto - Monto en USD
 * @param {string} expenseData.comercio - Nombre del comercio
 * @param {string} expenseData.categoria - ID de categoría
 * @param {Date} expenseData.fecha - Fecha del gasto
 * 
 * @returns {Promise<Object>} Gasto creado con ID
 * @throws {Error} Si los datos son inválidos
 * 
 * @example
 * const expense = await createExpense({
 *   monto: 50.00,
 *   comercio: 'Supermercado',
 *   categoria: 'alimentos',
 *   fecha: new Date()
 * });
 */
async function createExpense(expenseData) {
  // ...
}
```

### 11.2 Comentarios en Código Complejo

```javascript
// ✅ BIEN - Explica POR QUÉ, no QUÉ

// Debounce la búsqueda para evitar requests excesivos al servidor
const handleSearch = debounce((query) => {
  apiClient.get(`/expenses/search?q=${query}`);
}, 500);

// ❌ MAL - Explica lo obvio

// Hacer un debounce
const handleSearch = debounce((query) => {
  // Hacer request a API
  apiClient.get(`/expenses/search?q=${query}`);
}, 500);
```

### 11.3 Documentar Archivos

```javascript
/**
 * LoginPage.js
 * 
 * Página de login de la aplicación
 * 
 * Responsabilidades:
 * - Renderizar formulario de login
 * - Validar credenciales
 * - Comunicarse con backend
 * 
 * Eventos emitidos:
 * - auth:login → Usuario autenticado exitosamente
 * 
 * Eventos escuchados:
 * - (ninguno)
 * 
 * Dependencias:
 * - LoginValidator
 * - APIClient
 * - EventBus
 */

import { Component } from '../../core/Component.js';

export class LoginPage extends Component {
  // ...
}
```

---

## 12. ANTI-PATRONES A EVITAR

### ❌ Evitar: Callback Hell

```javascript
// ❌ MALO
function loadData() {
  apiClient.get('/users', (users) => {
    users.forEach(user => {
      apiClient.get(`/user/${user.id}/expenses`, (expenses) => {
        expenses.forEach(expense => {
          apiClient.get(`/category/${expense.categoryId}`, (category) => {
            // ¡3 niveles de anidamiento!
            updateUI(user, expenses, category);
          });
        });
      });
    });
  });
}

// ✅ BIEN - Usar async/await
async function loadData() {
  const users = await apiClient.get('/users');
  
  for (const user of users) {
    const expenses = await apiClient.get(`/user/${user.id}/expenses`);
    
    for (const expense of expenses) {
      const category = await apiClient.get(`/category/${expense.categoryId}`);
      updateUI(user, expense, category);
    }
  }
}
```

### ❌ Evitar: Modificación Global

```javascript
// ❌ MALO - Contamina el scope global
window.userId = 1;
window.expenses = [];
window.loadExpenses = () => { };

// ✅ BIEN - Encapsular en módulos
export const state = {
  userId: 1,
  expenses: [],
  loadExpenses: () => { }
};
```

### ❌ Evitar: Magic Numbers

```javascript
// ❌ MALO
if (expenses.length > 100) { /* */ }
if (amount > 5000) { /* */ }
const timeout = 3000;

// ✅ BIEN - Usar constantes
const MAX_EXPENSES_PER_PAGE = 100;
const HIGH_EXPENSE_THRESHOLD = 5000;
const API_TIMEOUT_MS = 3000;

if (expenses.length > MAX_EXPENSES_PER_PAGE) { /* */ }
if (amount > HIGH_EXPENSE_THRESHOLD) { /* */ }
const timeout = API_TIMEOUT_MS;
```

### ❌ Evitar: Funciones Demasiado Largas

```javascript
// ❌ MALO - 150 líneas en una función
function handleExpenseCreation(formData) {
  // validar
  // formatear
  // hacer request
  // guardar
  // actualizar UI
  // notificar
  // logging
  // ...
}

// ✅ BIEN - Funciones pequeñas y enfocadas
function handleExpenseCreation(formData) {
  validateFormData(formData);
  const formatted = formatExpenseData(formData);
  const result = await saveExpense(formatted);
  updateExpenseList(result);
  notifyUser('Gasto guardado');
}
```

### ❌ Evitar: Copiar-Pegar Código

```javascript
// ❌ MALO - Duplicación
class LoginForm {
  render() {
    return `<input class="form-control" placeholder="Email">`;
  }
}

class ProfileForm {
  render() {
    return `<input class="form-control" placeholder="Email">`;
  }
}

// ✅ BIEN - Reutilización mediante herencia
class InputComponent extends Component {
  getInputHTML(placeholder) {
    return `<input class="form-control" placeholder="${placeholder}">`;
  }
}

class LoginForm extends InputComponent {
  render() {
    return this.getInputHTML('Email');
  }
}
```

### ❌ Evitar: Estado Implícito

```javascript
// ❌ MALO - Estado disperso e implícito
let currentUser = null;
let isLoading = false;
let errors = [];
let selectedExpense = null;

function updateUI() {
  // ¿En qué estado estamos? ¿Cómo cambió?
}

// ✅ BIEN - Estado centralizado y explícito
class StateManager {
  constructor() {
    this._state = {
      currentUser: null,
      isLoading: false,
      errors: [],
      selectedExpense: null
    };
  }
  
  set(key, value) {
    this._state[key] = value;
    eventBus.emit('state:changed', { key, value }); // ¡Explícito!
  }
}
```

---

## 🎯 CHECKLIST ANTES DE HACER COMMIT

- [ ] Nombres de archivos siguen convención (PascalCase para clases, kebab-case para HTML/CSS)
- [ ] Código sigue principios SOLID
- [ ] Sin acoplamiento fuerte entre módulos
- [ ] EventBus utilizado para desacoplamiento
- [ ] Métodos tienen responsabilidad única
- [ ] JSDoc en funciones públicas
- [ ] Sin inline styles, estilos en archivos CSS
- [ ] CSS usa variables y BEM naming
- [ ] Manejo de errores con try-catch
- [ ] Sin console.log() innecesarios en producción
- [ ] Estado centralizado en StateManager
- [ ] Componentes extienden Component base
- [ ] Métodos privados prefijados con _

---

## 📚 REFERENCIAS

- [SOLID Principles in JavaScript](https://en.wikipedia.org/wiki/SOLID)
- [Naming Conventions](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide)
- [ES6 Modules](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/import)
- [CSS BEM](http://getbem.com/)

---

**Documento de Referencia**  
**18 de abril de 2026**  
**Leer antes de escribir CUALQUIER código**
