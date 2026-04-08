# 📦 Componentes FinTrack - Estructura Completa

## 📂 Estructura del Proyecto

```
frontend/
├── components/                          ← 🎯 CARPETA DE COMPONENTES
│   ├── FeatureCard.js                   ✅ Tarjeta de características
│   ├── PricingCard.js                   ✅ Tarjeta de precios
│   ├── Button.js                        ✅ Botón reutilizable
│   ├── SectionHeader.js                 ✅ Encabezado de sección
│   ├── FormInput.js                     ✅ Input de formulario
│   ├── TestimonialCard.js               ✅ Tarjeta de testimonio
│   ├── StatsCard.js                     ✅ Tarjeta de estadísticas
│   ├── SocialButtons.js                 ✅ Botones de redes sociales
│   ├── Modal.js                         ✅ Modal/Diálogo
│   ├── README.md                        📖 Documentación completa
│   ├── ejemplo-refactorizado.html       🎓 Ejemplo de uso
│   └── advanced-patterns.js             🚀 Patrones avanzados
│
├── pages/                               (Páginas existentes)
├── assets/
│   └── css/
│       └── estilos.css                  (Estilos base)
│
├── index.html                           (Página principal)
└── index-refactored.html               (Versión con componentes)
```

---

## 🎯 Matriz de Componentes

| Componente | Ubicaciones Actuales | Métodos Principales | Propiedades Clave |
|-----------|-------------------|-------------------|-----------------|
| **FeatureCard** | "Cómo Funciona", "Ventajas" | `render()` | icon, title, description, step |
| **PricingCard** | Sección "Planes" | `render()`, `attachEvents()` | name, price, features, highlight |
| **Button** | Todo el sitio | `render()`, `attachEvents()` | text, variant, size, icon |
| **SectionHeader** | Inicio de secciones | `render()` | title, subtitle, accentWord |
| **TestimonialCard** | Carousel de ventajas | `render()`, `generateStars()` | quote, author, role, rating |
| **FormInput** | Login, Registro | `validate()`, `getValue()`, `setValue()` | type, label, placeholder, validation |
| **StatsCard** | Dashboards | `render()`, `attachEvents()` | label, value, trend, color |
| **SocialButtons** | Footer | `render()`, `attachEvents()` | platforms, variant, size |
| **Modal** | Login, Confirmaciones | `show()`, `hide()`, `updateContent()` | title, content, buttons |

---

## 💻 Cómo Empezar

### Paso 1: Incluir los Scripts
```html
<script src="./components/Button.js"></script>
<script src="./components/FeatureCard.js"></script>
<!-- ... más componentes -->
```

### Paso 2: Crear Contenedores en HTML
```html
<div id="myButton"></div>
<div id="myCard"></div>
```

### Paso 3: Instanciar Componentes
```javascript
new Button('#myButton', { text: 'Click aquí' });
new FeatureCard('#myCard', { icon: 'fas fa-rocket', title: 'Mi Feature' });
```

---

## 🔄 Casos de Uso

### Landing Page (index.html)
- ✅ Button (Hero CTA, Navbar)
- ✅ FeatureCard (Sección "Cómo Funciona")
- ✅ PricingCard (Sección "Planes")
- ✅ SectionHeader (Headers de secciones)
- ✅ TestimonialCard (Carousel)
- ✅ SocialButtons (Footer)
- ✅ Modal (Login/Registro)
- ✅ FormInput (Formularios)

### Dashboard Usuario
- ✅ StatsCard (Métricas)
- ✅ Button (Acciones)
- ✅ Modal (Confirmaciones)
- ✅ FormInput (Búsquedas, filtros)

### Dashboard Asesor
- ✅ StatsCard (Datos)
- ✅ FeatureCard (Clientes)
- ✅ Button (Acciones)

### Formularios Autenticación
- ✅ FormInput (Validación)
- ✅ Button (Submit)
- ✅ SocialButtons (Login social)
- ✅ Modal (Recuperar contraseña)

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Total de Componentes** | 9 |
| **Líneas de Código JS** | ~1,500+ |
| **Estilos Encapsulados** | Sí (cada componente) |
| **Frameworks Necesarios** | Bootstrap 5 (opcional) |
| **Dependencias Externas** | FontAwesome, Bootstrap (CSS) |
| **Compatibilidad** | Chrome, Firefox, Safari, Edge |

---

## 🎓 Documentación

| Archivo | Propósito |
|---------|-----------|
| [README.md](./README.md) | Guía completa con ejemplos |
| [ejemplo-refactorizado.html](./ejemplo-refactorizado.html) | Implementación en HTML real |
| [advanced-patterns.js](./advanced-patterns.js) | Patrones avanzados y mejores prácticas |

---

## 🚀 Próximos Pasos Recomendados

1. **Refactorizar index.html** → Usar `ejemplo-refactorizado.html` como base
2. **Crear páginas de auth** → Usar FormInput + Modal
3. **Builds dashboards** → Usar StatsCard + Button + FeatureCard
4. **Agregar componentes nuevos** → Navbar, Sidebar, Carousel
5. **Sistema de temas** → Variables CSS dinámicas

---

## ⚡ Quick Reference

```javascript
// Button
new Button('#id', { text: '...', variant: 'accent', onClick: () => {} })

// FeatureCard
new FeatureCard('#id', { icon: '...', title: '...', description: '...' })

// PricingCard
new PricingCard('#id', { name: '...', price: '...', features: [...] })

// SectionHeader
new SectionHeader('#id', { title: '...', subtitle: '...' })

// FormInput
new FormInput('#id', { type: 'email', label: '...', required: true })

// TestimonialCard
new TestimonialCard('#id', { quote: '...', author: '...', role: '...' })

// StatsCard
new StatsCard('#id', { label: '...', value: '...', icon: '...' })

// SocialButtons
new SocialButtons('#id', { platforms: ['twitter', 'instagram'] })

// Modal
new Modal('id', { title: '...', content: '...', buttons: [...] })
```

---

## 🔗 Enlaces Útiles

- 📖 [README Completo](./README.md)
- 🎓 [Ejemplo Práctico](./ejemplo-refactorizado.html)
- 🚀 [Patrones Avanzados](./advanced-patterns.js)
- 🎨 [Estilos Personalizados](../assets/css/estilos.css)

---

## 💡 Tips & Tricks

### ✅ Validar múltiples inputs
```javascript
[email, password, terms].every(input => input.validate())
```

### ✅ Componentes en loops
```javascript
items.forEach((item, i) => {
  new Card(`#card-${i}`, item);
});
```

### ✅ Eventos con contexto
```javascript
new Button('#btn', {
  onClick: () => this.handleClick() // arrow function
})
```

### ✅ Modales confirmables
```javascript
modal.show();
// El usuario ve content e interactúa
// Luego modal.hide()
```

---

**Última actualización:** Marzo 2026  
**Versión:** 1.0  
**Creado por:** DevSolutions Studio para FinTrack
