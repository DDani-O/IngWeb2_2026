/**
 * Button Component
 * Botón reutilizable con múltiples variantes
 * Usada en: Toda la aplicación
 * 
 * Ejemplo:
 * const btn = new Button('#container', {
 *   text: 'Click aquí',
 *   variant: 'accent',
 *   size: 'lg',
 *   onClick: () => console.log('Clicked!')
 * });
 */

class Button {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      text: options.text || 'Botón',
      variant: options.variant || 'primary', // primary, accent, outline-accent, secondary
      size: options.size || 'md', // sm, md, lg
      icon: options.icon || null,
      iconPosition: options.iconPosition || 'left', // left, right
      disabled: options.disabled || false,
      fullWidth: options.fullWidth || false,
      onClick: options.onClick || (() => {}),
      type: options.type || 'button'
    };
    this.render();
    this.attachEvents();
  }

  render() {
    const icon = this.options.icon
      ? `<i class="${this.options.icon}"></i>`
      : '';

    const iconClass = this.options.icon ? `icon-${this.options.iconPosition}` : '';
    const sizeClass = `btn-size-${this.options.size}`;
    const widthClass = this.options.fullWidth ? 'btn-full-width' : '';

    this.elemento.innerHTML = `
      <button 
        class="custom-btn btn-${this.options.variant} ${sizeClass} ${widthClass} ${iconClass}"
        type="${this.options.type}"
        ${this.options.disabled ? 'disabled' : ''}
      >
        ${this.options.iconPosition === 'left' ? icon : ''}
        <span>${this.options.text}</span>
        ${this.options.iconPosition === 'right' ? icon : ''}
      </button>
    `;

    this.addStyles();
  }

  attachEvents() {
    const btn = this.elemento.querySelector('button');
    btn.addEventListener('click', this.options.onClick);
  }

  addStyles() {
    if (!document.getElementById('button-styles')) {
      const style = document.createElement('style');
      style.id = 'button-styles';
      style.textContent = `
        .custom-btn {
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: 2px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
        }

        .custom-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
        }

        .custom-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Variantes */
        .btn-primary {
          background-color: var(--accent);
          color: var(--bg-main);
          border-color: var(--accent);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--accent-hover);
          border-color: var(--accent-hover);
        }

        .btn-accent {
          background-color: var(--accent);
          color: var(--bg-main);
          border-color: var(--accent);
        }

        .btn-accent:hover:not(:disabled) {
          background-color: var(--accent-hover);
          border-color: var(--accent-hover);
        }

        .btn-outline-accent {
          background-color: transparent;
          color: var(--accent);
          border-color: var(--accent);
        }

        .btn-outline-accent:hover:not(:disabled) {
          background-color: rgba(45, 212, 191, 0.1);
        }

        .btn-secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.15);
        }

        /* Tamaños */
        .btn-size-sm {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        .btn-size-md {
          padding: 0.65rem 1.25rem;
          font-size: 1rem;
        }

        .btn-size-lg {
          padding: 0.85rem 1.75rem;
          font-size: 1.1rem;
        }

        .btn-full-width {
          width: 100%;
          justify-content: center;
        }

        .icon-left {
          flex-direction: row;
        }

        .icon-right {
          flex-direction: row-reverse;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
