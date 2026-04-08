/**
 * StatsCard Component
 * Tarjeta de estadísticas reutilizable
 * Usada en: Dashboards (Usuario, Asesor)
 * 
 * Ejemplo:
 * const stats = new StatsCard('#container', {
 *   label: 'Total de Gastos',
 *   value: '$1,234.50',
 *   icon: 'fas fa-dollar-sign',
 *   trend: '+12.5%',
 *   trendUp: true,
 *   color: 'accent'
 * });
 */

class StatsCard {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      label: options.label || 'Métrica',
      value: options.value || '0',
      icon: options.icon || 'fas fa-chart-bar',
      subtext: options.subtext || '',
      trend: options.trend || null,
      trendUp: options.trendUp !== undefined ? options.trendUp : true,
      color: options.color || 'accent', // accent, secondary, danger, success
      onClick: options.onClick || (() => {})
    };
    this.render();
    this.attachEvents();
  }

  render() {
    const trendHTML = this.options.trend
      ? `<div class="stats-trend ${this.options.trendUp ? 'trend-up' : 'trend-down'}">
          <i class="fas fa-${this.options.trendUp ? 'arrow-up' : 'arrow-down'}"></i>
          ${this.options.trend}
        </div>`
      : '';

    const subtextHTML = this.options.subtext
      ? `<p class="stats-subtext">${this.options.subtext}</p>`
      : '';

    const colorClass = `stats-color-${this.options.color}`;

    this.elemento.innerHTML = `
      <div class="stats-card ${colorClass}">
        <div class="stats-header">
          <div class="stats-icon">
            <i class="${this.options.icon}"></i>
          </div>
          ${trendHTML}
        </div>
        <div class="stats-content">
          <h5 class="stats-label">${this.options.label}</h5>
          <p class="stats-value">${this.options.value}</p>
          ${subtextHTML}
        </div>
      </div>
    `;

    this.addStyles();
  }

  attachEvents() {
    this.elemento.querySelector('.stats-card').addEventListener('click', this.options.onClick);
  }

  addStyles() {
    if (!document.getElementById('stats-card-styles')) {
      const style = document.createElement('style');
      style.id = 'stats-card-styles';
      style.textContent = `
        .stats-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .stats-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .stats-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        /* Color Variants */
        .stats-color-accent .stats-icon {
          background-color: rgba(45, 212, 191, 0.1);
          color: var(--accent);
        }

        .stats-color-secondary .stats-icon {
          background-color: rgba(148, 163, 184, 0.1);
          color: var(--accent);
        }

        .stats-color-danger .stats-icon {
          background-color: rgba(248, 113, 113, 0.1);
          color: #f87171;
        }

        .stats-color-success .stats-icon {
          background-color: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .stats-trend {
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .trend-up {
          color: #22c55e;
        }

        .trend-down {
          color: #f87171;
        }

        .stats-content {
          flex-grow: 1;
        }

        .stats-label {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0 0 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stats-value {
          color: var(--text-main);
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
        }

        .stats-subtext {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 0.5rem 0 0;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
