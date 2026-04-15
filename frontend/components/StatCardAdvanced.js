/**
 * StatCardAdvanced.js
 * Tarjeta de estadística mejorada con gradientes y efectos
 * Muestra valor, etiqueta y trend
 */

class StatCardAdvanced {
    constructor(options = {}) {
        this.label = options.label || 'Estadística';
        this.value = options.value || '0';
        this.unit = options.unit || '';
        this.icon = options.icon || 'fas fa-chart-bar';
        this.emoji = options.emoji || '';
        this.trend = options.trend || null; // { value: 15, direction: 'up' }
        this.colorStart = options.colorStart || '#2dd4bf';
        this.colorEnd = options.colorEnd || '#0284c7';
        this.subtitle = options.subtitle || '';
    }

    render() {
        const container = document.createElement('div');
        container.className = 'stat-card-advanced p-4 rounded-3';
        container.style.cssText = `
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%);
            border: 1px solid rgba(45, 212, 191, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            min-height: 200px;
            display: flex;
            flex-direction: column;
        `;

        // Fondo decorativo con gradiente
        const bgGradient = document.createElement('div');
        bgGradient.style.cssText = `
            position: absolute;
            top: -40px;
            right: -40px;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: radial-gradient(circle, ${this.colorStart} 0%, transparent 70%);
            opacity: 0.08;
            pointer-events: none;
        `;
        container.appendChild(bgGradient);

        const content = document.createElement('div');
        content.className = 'position-relative z-1';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.height = '100%';

        // Top section: Label + Emoji + Icon
        const topSection = document.createElement('div');
        topSection.className = 'd-flex justify-content-between align-items-start mb-3';
        topSection.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                ${this.emoji ? `<span style="font-size: 24px; line-height: 1;">${this.emoji}</span>` : ''}
                <p class="text-light-gray mb-0" style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${this.label}
                </p>
            </div>
            <div class="icon-badge d-flex justify-content-center align-items-center rounded-2" 
                 style="width: 36px; height: 36px; background: linear-gradient(135deg, ${this.colorStart}20 0%, ${this.colorEnd}10 100%); border: 1px solid ${this.colorStart}40; flex-shrink: 0;">
                <i class="${this.icon}" style="color: ${this.colorStart}; font-size: 16px;"></i>
            </div>
        `;
        content.appendChild(topSection);

        // Value section
        const valueSection = document.createElement('div');
        valueSection.className = 'mb-3 flex-grow-1 d-flex flex-column justify-content-center';
        valueSection.innerHTML = `
            <div class="d-flex align-items-baseline gap-1">
                <h2 class="mb-0 fw-bold" style="background: linear-gradient(135deg, ${this.colorStart} 0%, ${this.colorEnd} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px;">
                    ${this.value}
                </h2>
                <span class="text-accent small fw-bold" style="font-size: 12px;">${this.unit}</span>
            </div>
            ${this.subtitle ? `<small class="text-light-gray mt-2" style="font-size: 12px; line-height: 1.4;">${this.subtitle}</small>` : ''}
        `;
        content.appendChild(valueSection);

        // Trend indicator si existe
        if (this.trend) {
            const trendEl = document.createElement('div');
            trendEl.className = 'd-flex align-items-center gap-2 pt-3';
            trendEl.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
            
            const trendColor = this.trend.direction === 'up' ? '#22c55e' : this.trend.direction === 'down' ? '#ef4444' : '#f59e0b';
            const trendArrow = this.trend.direction === 'up' ? '↑' : this.trend.direction === 'down' ? '↓' : '→';
            const trendEmoji = this.trend.direction === 'up' ? '📈' : this.trend.direction === 'down' ? '📉' : '➡️';
            
            trendEl.innerHTML = `
                <span style="font-size: 14px;">${trendEmoji}</span>
                <div>
                    <span style="color: ${trendColor}; font-weight: bold; font-size: 12px;">${trendArrow} ${this.trend.value}%</span>
                    <div class="text-light-gray" style="font-size: 11px; line-height: 1.2;">${this.trend.label || 'vs. período anterior'}</div>
                </div>
            `;
            content.appendChild(trendEl);
        }

        container.appendChild(content);
        return container;
    }
}
