/**
 * Modal Component
 * Modal reutilizable con diferentes tipos
 * Usada en: Login, Registro, Confirmaciones, etc.
 * 
 * Ejemplo:
 * const modal = new Modal('modal-id', {
 *   title: 'Confirmar acción',
 *   content: '<p>¿Estás seguro?</p>',
 *   buttons: [
 *     { text: 'Cancelar', variant: 'secondary', onClick: () => modal.hide() },
 *     { text: 'Confirmar', variant: 'accent', onClick: () => console.log('Confirmado') }
 *   ]
 * });
 * modal.show();
 */

class Modal {
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      title: options.title || 'Modal',
      content: options.content || '',
      size: options.size || 'md', // sm, md, lg
      centered: options.centered !== undefined ? options.centered : true,
      backdrop: options.backdrop !== undefined ? options.backdrop : true,
      buttons: options.buttons || [],
      onShow: options.onShow || (() => {}),
      onHide: options.onHide || (() => {})
    };

    this.modal = null;
    this.backdrop = null;
    this.render();
    this.attachEvents();
  }

  render() {
    // Verificar si el modal ya existe
    if (document.getElementById(this.id)) {
      return;
    }

    const sizeClass = `modal-${this.options.size}`;
    const centeredClass = this.options.centered ? 'modal-centered' : '';

    const buttonsHTML = this.options.buttons
      .map(btn => `
        <button 
          class="btn btn-${btn.variant || 'secondary'} modal-btn"
          data-action="${btn.text.toLowerCase().replace(/\\s+/g, '-')}"
        >
          ${btn.text}
        </button>
      `)
      .join('');

    const modalHTML = `
      <div 
        id="${this.id}" 
        class="custom-modal ${sizeClass} ${centeredClass}"
        style="display: none;"
      >
        <div class="modal-backdrop" style="display: none;"></div>
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${this.options.title}</h5>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              ${this.options.content}
            </div>
            ${buttonsHTML ? `<div class="modal-footer">${buttonsHTML}</div>` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById(this.id);
    this.backdrop = this.modal.querySelector('.modal-backdrop');

    this.addStyles();
  }

  attachEvents() {
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.hide());

    if (this.options.backdrop) {
      this.backdrop.addEventListener('click', () => this.hide());
    }

    this.options.buttons.forEach((btn, index) => {
      const btnElement = this.modal.querySelectorAll('.modal-btn')[index];
      if (btnElement && btn.onClick) {
        btnElement.addEventListener('click', btn.onClick);
      }
    });
  }

  show() {
    this.modal.style.display = 'flex';
    this.backdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
    this.options.onShow();
  }

  hide() {
    this.modal.style.display = 'none';
    this.backdrop.style.display = 'none';
    document.body.style.overflow = 'auto';
    this.options.onHide();
  }

  updateContent(content) {
    this.modal.querySelector('.modal-body').innerHTML = content;
  }

  updateTitle(title) {
    this.modal.querySelector('.modal-title').textContent = title;
  }

  addStyles() {
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .custom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .custom-modal.modal-centered {
          align-items: center;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: -1;
        }

        .modal-dialog {
          position: relative;
          z-index: 1;
          width: 90%;
          max-width: 500px;
        }

        /* Tamaños */
        .modal-sm .modal-dialog {
          max-width: 300px;
        }

        .modal-md .modal-dialog {
          max-width: 500px;
        }

        .modal-lg .modal-dialog {
          max-width: 800px;
        }

        .modal-content {
          background-color: var(--bg-main);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          animation: slideInUp 0.3s ease;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          color: var(--text-main);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.75rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: var(--text-main);
        }

        .modal-body {
          padding: 1.5rem;
          color: var(--text-main);
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .modal-btn {
          flex: 0 0 auto;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
