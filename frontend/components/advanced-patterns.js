/**
 * 🎯 QUICK START GUIDE - Guía rápida para usar componentes
 * 
 * Este archivo muestra patrones avanzados y mejores prácticas
 */

// ============================================
// 1️⃣ CREAR COMPONENTES
// ============================================

// Forma básica
const myButton = new Button('#container', {
  text: 'Click',
  onClick: () => console.log('Clicked!')
});

// Con opciones avanzadas
const advancedButton = new Button('#container', {
  text: 'Enviar',
  variant: 'accent',
  size: 'lg',
  fullWidth: true,
  icon: 'fas fa-arrow-right',
  iconPosition: 'right',
  onClick: handleSubmit
});

// ============================================
// 2️⃣ CREAR MÚLTIPLES COMPONENTES EN LOOP
// ============================================

const features = [
  { icon: 'fas fa-rocket', title: 'Fast', description: '⚡ Super rápido' },
  { icon: 'fas fa-lock', title: 'Secure', description: '🔒 Muy seguro' },
  { icon: 'fas fa-chart-line', title: 'Scale', description: '📈 Escalable' }
];

// ❌ Evita esto - Crear contenedores manualmente
/*
features.forEach(feature => {
  const div = document.createElement('div');
  div.id = `feature-${Math.random()}`;
  container.appendChild(div);
  new FeatureCard(`#${div.id}`, feature);
});
*/

// ✅ Mejor: Usar índice
features.forEach((feature, i) => {
  const div = document.createElement('div');
  div.id = `feature-${i}`;
  container.appendChild(div);
  new FeatureCard(`#feature-${i}`, feature);
});

// ✅ Mejor aún: Ya tener los contenedores en HTML
// <div id="feature-0"></div>
// <div id="feature-1"></div>
// <div id="feature-2"></div>

features.forEach((feature, i) => {
  new FeatureCard(`#feature-${i}`, feature);
});

// ============================================
// 3️⃣ VALIDAR FORMULARIOS
// ============================================

const email = new FormInput('#email', {
  type: 'email',
  label: 'Email',
  required: true,
  validation: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
});

const password = new FormInput('#password', {
  type: 'password',
  label: 'Password',
  required: true,
  validation: (val) => val.length >= 8
});

// Validación en submit
function handleSubmit() {
  // Validar todos a la vez
  const allValid = [email, password].every(input => input.validate());
  
  if (allValid) {
    const formData = {
      email: email.getValue(),
      password: password.getValue()
    };
    console.log('Enviando:', formData);
    // Aquí iría fetch() o fetch()
  }
}

// ============================================
// 4️⃣ USAR MODALES
// ============================================

// Crear modal
const deleteModal = new Modal('delete-confirm', {
  title: '⚠️ Confirmar eliminación',
  content: '<p>¿Estás seguro de que quieres eliminar esto?</p>',
  size: 'md',
  buttons: [
    {
      text: 'Cancelar',
      variant: 'secondary',
      onClick: () => deleteModal.hide()
    },
    {
      text: 'Eliminar',
      variant: 'outline-danger', // ← si tuvieras este variant
      onClick: async () => {
        try {
          await fetch('/api/delete', { method: 'DELETE' });
          alert('Eliminado exitosamente');
          deleteModal.hide();
        } catch (error) {
          alert('Error al eliminar');
        }
      }
    }
  ]
});

// Mostrar modal cuando sea necesario
document.getElementById('btn-delete').addEventListener('click', () => {
  deleteModal.show();
});

// ============================================
// 5️⃣ EVENTOS Y CALLBACKS
// ============================================

// ✅ Usar arrow functions para mantener contexto
class UserManager {
  constructor() {
    this.user = null;
    this.setupButtons();
  }

  setupButtons() {
    // ✅ Bien: Arrow function mantiene 'this'
    new Button('#edit-btn', {
      onClick: () => this.editUser()
    });

    // ❌ Evita: Function normal pierde 'this'
    // new Button('#edit-btn', {
    //   onClick: function() { this.editUser() }
    // });
  }

  editUser() {
    console.log('Editing:', this.user);
  }
}

// ============================================
// 6️⃣ COMPONENTES DINÁMICOS
// ============================================

class Dashboard {
  constructor() {
    this.stats = [
      { label: 'Total Gastos', value: '$1,234', trend: '+5%', trendUp: true },
      { label: 'Presupuesto', value: '$2,000', trend: '-10%', trendUp: false }
    ];
    this.render();
  }

  render() {
    const container = document.getElementById('stats-container');
    
    this.stats.forEach((stat, i) => {
      const div = document.createElement('div');
      div.id = `stat-${i}`;
      container.appendChild(div);
      
      new StatsCard(`#stat-${i}`, {
        ...stat,
        icon: i === 0 ? 'fas fa-dollar-sign' : 'fas fa-target',
        onClick: () => this.viewDetails(i)
      });
    });
  }

  viewDetails(index) {
    const modal = new Modal(`detail-${index}`, {
      title: `Detalles: ${this.stats[index].label}`,
      content: `<p>Aquí irán más detalles sobre ${this.stats[index].label}</p>`
    });
    modal.show();
  }
}

const dashboard = new Dashboard();

// ============================================
// 7️⃣ COMPOSICIÓN DE COMPONENTES
// ============================================

// Crear una sección completa como unidad reutilizable
class FeatureSection {
  constructor(containerId, title, subtitle, features) {
    this.container = document.getElementById(containerId);
    this.render(title, subtitle, features);
  }

  render(title, subtitle, features) {
    // Limpiar
    this.container.innerHTML = '';

    // Header
    const headerDiv = document.createElement('div');
    headerDiv.id = 'section-header';
    this.container.appendChild(headerDiv);
    
    new SectionHeader('#section-header', { title, subtitle });

    // Cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'row g-4';
    cardsContainer.id = 'features-row';
    this.container.appendChild(cardsContainer);

    features.forEach((feature, i) => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      col.id = `feature-${i}`;
      cardsContainer.appendChild(col);
      
      new FeatureCard(`#feature-${i}`, feature);
    });
  }
}

// Uso
const features1 = new FeatureSection('section-1', 
  'Nuestras Características',
  'Esto es lo que nos hace especial',
  [
    { icon: 'fas fa-rocket', step: '1', title: 'Feature 1', description: 'Desc 1' },
    { icon: 'fas fa-lock', step: '2', title: 'Feature 2', description: 'Desc 2' }
  ]
);

// ============================================
// 8️⃣ VALIDACIÓN PERSONALIZADA
// ============================================

const username = new FormInput('#username', {
  type: 'text',
  label: 'Nombre de usuario',
  required: true,
  errorMessage: 'El nombre debe tener 3-20 caracteres',
  validation: (value) => {
    return value.length >= 3 && value.length <= 20 && /^[a-zA-Z0-9_]+$/.test(value);
  }
});

// ============================================
// 9️⃣ MANEJO DE ERRORES
// ============================================

async function submitForm() {
  try {
    // Validar todos los inputs
    const inputs = [email, password];
    const isValid = inputs.every(input => input.validate());

    if (!isValid) return;

    // Deshabilitar botón
    submitBtn.element.disabled = true;

    // Enviar
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.getValue(),
        password: password.getValue()
      })
    });

    if (!response.ok) throw new Error('Error en la solicitud');

    const data = await response.json();
    
    // Mostrar éxito
    const successModal = new Modal('success-modal', {
      title: '✅ ¡Éxito!',
      content: `<p>${data.message}</p>`,
      buttons: [
        {
          text: 'Cerrar',
          variant: 'accent',
          onClick: () => window.location.href = '/dashboard'
        }
      ]
    });
    successModal.show();

  } catch (error) {
    // Mostrar error
    const errorModal = new Modal('error-modal', {
      title: '❌ Error',
      content: `<p>${error.message}</p>`,
      buttons: [
        {
          text: 'Intentar de nuevo',
          variant: 'accent',
          onClick: () => errorModal.hide()
        }
      ]
    });
    errorModal.show();
  } finally {
    submitBtn.element.disabled = false;
  }
}

// ============================================
// 🔟 REUTILIZAR COMPONENTES EN DIFERENTES PÁGINAS
// ============================================

/*
// utils/components.js - Crear función helper

export function createLoginForm(containerId) {
  const container = document.getElementById(containerId);

  const email = new FormInput('#email-input', {
    type: 'email',
    label: 'Email',
    required: true
  });

  const password = new FormInput('#password-input', {
    type: 'password',
    label: 'Password',
    required: true
  });

  const submitBtn = new Button('#submit-btn', {
    text: 'Ingresar',
    variant: 'accent',
    fullWidth: true,
    onClick: () => handleLogin(email, password)
  });

  return { email, password, submitBtn };
}

// Uso en cualquier página:
import { createLoginForm } from './utils/components.js';
const form = createLoginForm('login-container');
*/

// ============================================
// ☝️ CONCLUSIÓN
// ============================================

/**
 * Resumen de mejores prácticas:
 * 
 * 1. ✅ Siempre valida inputs antes de enviar
 * 2. ✅ Usa arrow functions en callbacks para mantener 'this'
 * 3. ✅ Crea componentes en loops cuando sea posible
 * 4. ✅ Reutiliza componentes en diferentes contextos
 * 5. ✅ Maneja errores con try-catch
 * 6. ✅ Crea wrappers/helper functions para componentes complejos
 * 7. ✅ Deshabilita botones durante operaciones async
 * 8. ✅ Usa modales para confirmaciones y mensajes
 */
