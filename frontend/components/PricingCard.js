/**
 * PricingCard Component
 * Tarjeta de planes/precios reutilizable
 * Usada en: Sección "Planes"
 * 
 * Ejemplo:
 * const card = new PricingCard('#container', {
 *   name: 'Plan Pro',
 *   price: '4.99',
 *   highlight: true,
 *   features: ['Feature 1', 'Feature 2'],
 *   buttonText: 'Elegir Pro',
 *   buttonColor: 'accent'
 * });
 */

class PricingCard {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      name: options.name || 'Plan',
      price: options.price || '0',
      period: options.period || '/mes',
      description: options.description || '',
      features: options.features || [],
      buttonText: options.buttonText || 'Elegir Plan',
      buttonColor: options.buttonColor || 'outline-accent',
      highlight: options.highlight || false,
      badge: options.badge || null,
      onButtonClick: options.onButtonClick || (() => {})
    };
    this.render();
    this.attachEvents();
  }

  render() {
    const badgeHTML = this.options.badge
      ? `<div class="pricing-badge">${this.options.badge}</div>`
      : '';

    const highlightClass = this.options.highlight ? 'pricing-highlight' : '';
    const borderClass = this.options.highlight ? 'pricing-border-accent' : '';
    
    const featuresHTML = this.options.features
      .map(feature => `
        <li class="pricing-feature">
          <i class="fas fa-check pricing-check"></i>
          ${feature}
        </li>
      `)
      .join('');

    this.elemento.innerHTML = `
      <div class="pricing-card ${highlightClass} ${borderClass}">
        ${badgeHTML}
        <h5 class="pricing-name">${this.options.name}</h5>
        <div class="pricing-price">
          <span class="price-number">$${this.options.price}</span>
          <span class="price-period">${this.options.period}</span>
        </div>
        ${this.options.description ? `<p class="pricing-description">${this.options.description}</p>` : ''}
        <ul class="pricing-features">
          ${featuresHTML}
        </ul>
        <button class="btn btn-${this.options.buttonColor} pricing-button" style="width: 100%;">
          ${this.options.buttonText}
        </button>
      </div>
    `;

    this.addStyles();
  }

  attachEvents() {
    this.elemento.querySelector('.pricing-button').addEventListener('click', () => {
      this.options.onButtonClick();
    });
  }

  addStyles() {
    if (!document.getElementById('pricing-card-styles')) {
      const style = document.createElement('style');
      style.id = 'pricing-card-styles';
      style.textContent = `
        .pricing-card {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
        }

        .pricing-highlight {
          background: rgba(45, 212, 191, 0.05) !important;
          border: 1px solid rgba(45, 212, 191, 0.3) !important;
          box-shadow: 0 8px 32px rgba(45, 212, 191, 0.1);
        }

        .pricing-border-accent {
          border: 1px solid var(--accent-line) !important;
        }

        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--accent);
          color: var(--bg-main);
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .pricing-name {
          color: var(--text-main);
          font-weight: 700;
          margin-bottom: 1rem;
          font-size: 1.15rem;
        }

        .pricing-price {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .price-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .price-period {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .pricing-description {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }

        .pricing-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem;
          flex-grow: 1;
        }

        .pricing-feature {
          padding: 0.75rem 0;
          color: var(--text-muted);
          font-size: 0.95rem;
          display: flex;
          align-items: center;
        }

        .pricing-check {
          margin-right: 0.75rem;
          color: var(--accent);
        }

        .pricing-button {
          padding: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .pricing-button:hover {
          transform: scale(1.02);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
