# 🧩 Componentes de FinTrack

Una librería de componentes reutilizables para mantener tu código limpio, modular y escalable.

## 📚 Tabla de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Componentes Disponibles](#componentes-disponibles)
3. [Ejemplos](#ejemplos)
4. [Mejores Prácticas](#mejores-prácticas)

---

## 🚀 Inicio Rápido

### Importar un componente

```html
<!-- En tu HTML -->
<script src="./components/Button.js"></script>

<!-- O importar múltiples -->
<script src="./components/FeatureCard.js"></script>
<script src="./components/PricingCard.js"></script>
<script src="./components/SectionHeader.js"></script>
```

### Usar un componente

```javascript
// Crear el componente
const button = new Button('#container', {
  text: 'Haz clic aquí',
  variant: 'accent',
  onClick: () => alert('¡Clickeado!')
});
```

---

## 🎨 Componentes Disponibles

### 1. **Button** - Botones reutilizables
**Archivo:** `Button.js`

```javascript
const btn = new Button('#container', {
  text: 'Enviar',
  variant: 'accent',          // primary, accent, outline-accent, secondary
  size: 'lg',                 // sm, md, lg
  icon: 'fas fa-arrow-right', // Opcional
  iconPosition: 'right',      // left, right
  fullWidth: true,
  onClick: () => { /* ... */ }
});
```

---

### 2. **FeatureCard** - Tarjetas con icono y descripción
**Archivo:** `FeatureCard.js`

Perfecta para mostrar características, pasos o ventajas.

```javascript
const card = new FeatureCard('#container', {
  icon: 'fas fa-receipt',
  step: '1',                  // Opcional: número de paso
  title: 'Registra al instante',
  description: 'Sube tus gastos como prefieras...',
  highlight: false            // Destacar la tarjeta
});
```

**Caso de uso:** Sección "Cómo Funciona" y "Ventajas"

---

### 3. **PricingCard** - Tarjetas de planes/precios
**Archivo:** `PricingCard.js`

```javascript
const pricing = new PricingCard('#container', {
  name: 'Plan Pro',
  price: '4.99',
  period: '/mes',
  description: 'Tus finanzas supervisadas por expertos',
  features: [
    'Asesor Financiero asignado',
    'Recomendaciones mensuales',
    'Detección de gastos hormiga'
  ],
  buttonText: 'Elegir Pro',
  buttonColor: 'accent',
  highlight: true,                    // Destacar este plan
  badge: 'MÁS POPULAR',              // Banner superior
  onButtonClick: () => { /* ... */ }
});
```

---

### 4. **SectionHeader** - Encabezados de secciones
**Archivo:** `SectionHeader.js`

```javascript
const header = new SectionHeader('#container', {
  title: 'Elige el plan ideal para ti',
  subtitle: 'Comienza gratis y mejora cuando estés listo',
  accentWord: 'plan',         // Palabra para colorear
  centered: true,
  showDivider: true           // Línea divisora antes
});
```

---

### 5. **TestimonialCard** - Tarjetas de testimonios
**Archivo:** `TestimonialCard.js`

```javascript
const testimonial = new TestimonialCard('#container', {
  quote: 'En menos de una semana dejé de gastar en cosas que no necesitaba.',
  author: 'María González',
  role: 'Emprendedora',
  avatar: 'https://...jpg',   // Opcional
  rating: 5                    // 1-5 estrellas
});
```

---

### 6. **FormInput** - Campos de formulario validados
**Archivo:** `FormInput.js`

```javascript
const email = new FormInput('#container', {
  type: 'email',
  label: 'Correo Electrónico',
  placeholder: 'tu@correo.com',
  required: true,
  id: 'email-input',
  icon: 'fas fa-envelope',    // Opcional
  errorMessage: 'Por favor ingresa un email válido',
  validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
});

// Validar y obtener valor
if (email.validate()) {
  const valor = email.getValue();
}
```

---

### 7. **StatsCard** - Tarjetas de estadísticas
**Archivo:** `StatsCard.js`

Perfecta para dashboards.

```javascript
const stats = new StatsCard('#container', {
  label: 'Total de Gastos',
  value: '$1,234.50',
  icon: 'fas fa-dollar-sign',
  trend: '+12.5%',
  trendUp: true,              // false para tendencia negativa
  color: 'accent',            // accent, secondary, danger, success
  onClick: () => { /* ... */ }
});
```

---

### 8. **SocialButtons** - Botones de redes sociales
**Archivo:** `SocialButtons.js`

```javascript
const social = new SocialButtons('#container', {
  platforms: ['twitter', 'instagram', 'linkedin', 'facebook'],
  variant: 'outline',         // outline, solid
  size: 'md',                 // sm, md, lg
  urls: {
    twitter: 'https://twitter.com/...',
    instagram: 'https://instagram.com/...',
    // ...
  },
  onClick: (platform) => console.log('Compartir en:', platform)
});
```

---

### 9. **Modal** - Modales y diálogos
**Archivo:** `Modal.js`

```javascript
const modal = new Modal('confirm-modal', {
  title: 'Confirmar acción',
  content: '<p>¿Estás seguro que deseas continuar?</p>',
  size: 'md',                 // sm, md, lg
  centered: true,
  backdrop: true,             // Cerrar al hacer clic fondo
  buttons: [
    {
      text: 'Cancelar',
      variant: 'secondary',
      onClick: () => modal.hide()
    },
    {
      text: 'Confirmar',
      variant: 'accent',
      onClick: () => {
        console.log('Confirmado');
        modal.hide();
      }
    }
  ]
});

// Controlar el modal
modal.show();
modal.hide();
modal.updateContent('<p>Nuevo contenido</p>');
modal.updateTitle('Nuevo titulo');
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Sección de Características

```html
<section id="features">
  <div id="header"></div>
  <div class="row" id="cards-container"></div>
</section>

<script>
  // Header
  new SectionHeader('#header', {
    title: 'Un equipo trabajando para tu bolsillo',
    subtitle: 'El proceso es simple: tú subes la info, nosotros te ayudas a entenderla'
  });

  // Cards
  const features = [
    { 
      icon: 'fas fa-receipt', 
      step: '1',
      title: 'Registra al instante',
      description: 'Sube tus gastos como prefieras'
    },
    { 
      icon: 'fas fa-eye', 
      step: '2',
      title: 'Alguien vigila por ti',
      description: 'Un asesor revisa tu actividad'
    },
    // ...
  ];

  features.forEach((feature, i) => {
    const div = document.createElement('div');
    div.className = 'col-md-4';
    document.getElementById('cards-container').appendChild(div);
    new FeatureCard(`.col-md-4:nth-child(${i + 1})`, feature);
  });
</script>
```

### Ejemplo 2: Sección de Precios

```html
<section id="pricing">
  <div id="header"></div>
  <div class="row" id="pricing-container"></div>
</section>

<script>
  new SectionHeader('#header', {
    title: 'Elige el plan ideal para ti',
    subtitle: 'Comienza gratis y mejora cuando estés listo',
    accentWord: 'plan'
  });

  const plans = [
    {
      name: 'Plan Básico',
      price: '0',
      features: ['Carga limitada', 'Gráficos básicos'],
      buttonText: 'Comenzar Gratis',
      highlight: false
    },
    {
      name: 'Plan Pro',
      price: '4.99',
      features: ['Asesor Financiero', 'Recomendaciones mensuales'],
      buttonText: 'Elegir Pro',
      highlight: true,
      badge: 'MÁS POPULAR'
    },
    // ...
  ];

  plans.forEach((plan, i) => {
    const div = document.createElement('div');
    div.className = 'col-lg-4 col-md-6';
    document.getElementById('pricing-container').appendChild(div);
    new PricingCard(`.col-lg-4:nth-child(${i + 1})`, {
      ...plan,
      onButtonClick: () => alert(`Elegiste: ${plan.name}`)
    });
  });
</script>
```

### Ejemplo 3: Formulario de Login

```html
<form id="login-form">
  <div id="email-input"></div>
  <div id="password-input"></div>
  <div id="submit-btn"></div>
</form>

<script>
  const email = new FormInput('#email-input', {
    type: 'email',
    label: 'Correo Electrónico',
    placeholder: 'tu@correo.com',
    required: true,
    id: 'login-email',
    icon: 'fas fa-envelope'
  });

  const password = new FormInput('#password-input', {
    type: 'password',
    label: 'Contraseña',
    placeholder: '••••••••',
    required: true,
    id: 'login-password',
    icon: 'fas fa-lock'
  });

  new Button('#submit-btn', {
    text: 'Ingresar',
    variant: 'accent',
    fullWidth: true,
    onClick: () => {
      if (email.validate() && password.validate()) {
        console.log({
          email: email.getValue(),
          password: password.getValue()
        });
      }
    }
  });
</script>
```

---

## 🎯 Mejores Prácticas

### 1. **Organiza tus HTML**
```html
<!-- ✅ Bien: Un contenedor por componente -->
<div id="btn-submit"></div>
<div id="form-email"></div>
<div id="form-password"></div>

<!-- ❌ Evita: Múltiples componentes en mismo contenedor -->
<div id="form"></div>
```

### 2. **Reutiliza variables**
```javascript
// ✅ Bien: Guarda reference para después
const submitBtn = new Button('#btn-submit', { /* ... */ });

// Luego puedes reutilizar o actualizar
submitBtn.element.disabled = true;
```

### 3. **Mantén estilos organizados**
Los estilos se cargan automáticamente una sola vez. Si usas Bootstrap + estos componentes, **los estilos conviven sin conflictos**.

### 4. **Valida antes de enviar**
```javascript
// ✅ Siempre valida
if (email.validate() && password.validate()) {
  // Enviar datos
}
```

### 5. **Usa eventos apropiadamente**
```javascript
// ✅ Bien: Usar onClick en componente
const btn = new Button('#container', {
  onClick: () => handleSubmit()
});

// ❌ Evita: Múltiples listeners en mismo elemento
addEventListener('click', ...);
```

---

## 📋 Checklist de Componentes

- [x] Button
- [x] FeatureCard
- [x] PricingCard
- [x] SectionHeader
- [x] TestimonialCard
- [x] FormInput
- [x] StatsCard
- [x] SocialButtons
- [x] Modal

---

## 🔮 Próximos Componentes (Ideas)

- [ ] Navbar reutilizable
- [ ] Sidebar para dashboards
- [ ] Carousel/Slider
- [ ] Tooltip
- [ ] Dropdown/Select
- [ ] Alert/Toast
- [ ] Pagination
- [ ] Table reutilizable

---

## 📞 Soporte

Si tienes dudas, revisa:
1. Los comentarios en cada archivo `.js`
2. Las secciones de ejemplo (HTML real) en `index.html`
3. El estilo personalizado en `estilos.css`

**Happy coding! 🚀**
