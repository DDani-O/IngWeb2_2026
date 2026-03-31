/**
 * FormInput Component
 * Input reutilizable con validación
 * Usada en: Formularios (Login, Registro)
 * 
 * Ejemplo:
 * const input = new FormInput('#container', {
 *   type: 'email',
 *   label: 'Correo Electrónico',
 *   placeholder: 'tu@correo.com',
 *   required: true,
 *   id: 'email-input'
 * });
 */

class FormInput {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      type: options.type || 'text',
      label: options.label || 'Campo',
      placeholder: options.placeholder || '',
      required: options.required || false,
      id: options.id || `input-${Date.now()}`,
      name: options.name || options.id,
      errorMessage: options.errorMessage || 'Este campo es requerido',
      icon: options.icon || null,
      validation: options.validation || (() => true), // Custom validation function
      value: options.value || ''
    };
    this.render();
    this.attachEvents();
  }

  render() {
    const requiredHTML = this.options.required ? 'required' : '';
    const iconHTML = this.options.icon
      ? `<i class="${this.options.icon} form-icon"></i>`
      : '';
    const iconClass = this.options.icon ? 'has-icon' : '';

    this.elemento.innerHTML = `
      <div class="form-group">
        <label for="${this.options.id}" class="form-label">${this.options.label}</label>
        <div class="form-input-wrapper ${iconClass}">
          ${iconHTML}
          <input
            type="${this.options.type}"
            class="form-input"
            id="${this.options.id}"
            name="${this.options.name}"
            placeholder="${this.options.placeholder}"
            value="${this.options.value}"
            ${requiredHTML}
          />
        </div>
        <div class="form-error" style="display: none;"></div>
      </div>
    `;

    this.addStyles();
  }

  attachEvents() {
    const input = this.elemento.querySelector('.form-input');
    input.addEventListener('blur', () => this.validate());
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        this.validate();
      }
    });
  }

  validate() {
    const input = this.elemento.querySelector('.form-input');
    const errorDiv = this.elemento.querySelector('.form-error');
    let isValid = true;
    let errorMsg = '';

    if (this.options.required && !input.value.trim()) {
      isValid = false;
      errorMsg = this.options.errorMessage;
    } else if (input.value && !this.options.validation(input.value)) {
      isValid = false;
      errorMsg = this.options.errorMessage;
    }

    if (!isValid) {
      input.classList.add('error');
      errorDiv.textContent = errorMsg;
      errorDiv.style.display = 'block';
    } else {
      input.classList.remove('error');
      errorDiv.style.display = 'none';
    }

    return isValid;
  }

  getValue() {
    return this.elemento.querySelector('.form-input').value;
  }

  setValue(value) {
    this.elemento.querySelector('.form-input').value = value;
  }

  addStyles() {
    if (!document.getElementById('form-input-styles')) {
      const style = document.createElement('style');
      style.id = 'form-input-styles';
      style.textContent = `
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-transform: capitalize;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--text-main);
          font-size: 1rem;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .has-icon .form-input {
          padding-left: 2.5rem;
        }

        .form-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--accent);
          pointer-events: none;
        }

        .form-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.08);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-input.error {
          border-color: #f87171;
          background-color: rgba(248, 113, 113, 0.05);
        }

        .form-input.error:focus {
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
        }

        .form-error {
          color: #f87171;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
