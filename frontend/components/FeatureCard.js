/**
 * FeatureCard Component
 * Tarjeta reutilizable con icono, título y descripción
 * Usada en: "Cómo funciona" y "Ventajas"
 * 
 * Ejemplo:
 * const card = new FeatureCard('#container', {
 *   icon: 'fas fa-receipt',
 *   step: '1',
 *   title: 'Registra al instante',
 *   description: 'Sube tus gastos como prefieras...'
 * });
 */

class FeatureCard {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      icon: options.icon || 'fas fa-chart-pie',
      title: options.title || 'Característica',
      description: options.description || 'Descripción de la característica',
      step: options.step || null, // Opcional: para mostrar número
      highlight: options.highlight || false // Para destacar como "popular"
    };
    this.render();
  }

  render() {
    const stepHTML = this.options.step 
      ? `<span class="step-number">${this.options.step}</span>` 
      : '';

    const highlightClass = this.options.highlight ? 'feature-highlight' : '';

    this.elemento.innerHTML = `
      <div class="feature-card ${highlightClass}">
        <div class="feature-icon-wrapper">
          <i class="${this.options.icon}"></i>
          ${stepHTML}
        </div>
        <h4 class="feature-title">${this.options.title}</h4>
        <p class="feature-description">${this.options.description}</p>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (!document.getElementById('feature-card-styles')) {
      const style = document.createElement('style');
      style.id = 'feature-card-styles';
      style.textContent = `
        .feature-card {
          text-align: center;
          padding: 2rem 1.5rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          background-color: rgba(45, 212, 191, 0.05);
        }

        .feature-icon-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background-color: rgba(45, 212, 191, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: var(--accent);
        }

        .step-number {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: var(--accent);
          color: var(--bg-main);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .feature-title {
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.75rem;
          font-size: 1.1rem;
        }

        .feature-description {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .feature-highlight {
          background: rgba(45, 212, 191, 0.05);
          border: 1px solid rgba(45, 212, 191, 0.2);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
