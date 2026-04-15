/**
 * SummaryCard.js
 * Tarjeta de resumen clickeable para patrones, recomendaciones e historial
 * Muestra un resumen compacto con opción de expandir
 */

class SummaryCard {
    constructor(options = {}) {
        this.title = options.title || 'Resumen';
        this.icon = options.icon || 'fas fa-chart-pie';
        this.subtitle = options.subtitle || 'Ver más detalles';
        this.items = options.items || [];
        this.colorGradient = options.colorGradient || 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)';
        this.accentColor = options.accentColor || '#2dd4bf';
        this.borderColor = options.borderColor || 'rgba(45, 212, 191, 0.3)';
        this.onClick = options.onClick || (() => {});
    }

    render() {
        const container = document.createElement('div');
        container.className = 'summary-card p-4 rounded-3';
        container.style.cssText = `
            background: ${this.colorGradient};
            border: 1px solid ${this.borderColor};
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
            position: relative;
        `;

        // Hover effect
        const hoverIn = () => {
            container.style.transform = 'translateY(-4px)';
            container.style.boxShadow = `0 8px 20px ${this.accentColor}40`;
            container.style.borderColor = `${this.accentColor}`;
        };

        const hoverOut = () => {
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = 'none';
            container.style.borderColor = this.borderColor;
        };

        container.addEventListener('mouseenter', hoverIn);
        container.addEventListener('mouseleave', hoverOut);
        container.addEventListener('click', () => this.onClick());

        // Contenido
        const content = document.createElement('div');
        content.className = 'position-relative z-1';
        
        const header = document.createElement('div');
        header.className = 'd-flex align-items-center justify-content-between mb-3';
        header.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="icon-box rounded me-3 d-flex justify-content-center align-items-center" 
                     style="width: 40px; height: 40px; background: rgba(255,255,255,0.08);">
                    <i class="${this.icon}" style="color: ${this.accentColor}; font-size: 20px;"></i>
                </div>
                <div>
                    <h6 class="mb-0 text-white fw-bold">${this.title}</h6>
                    <small class="text-light-gray" style="font-size: 12px;">${this.subtitle}</small>
                </div>
            </div>
            <i class="fas fa-chevron-right" style="color: ${this.accentColor}; font-size: 18px; opacity: 0.7;"></i>
        `;
        content.appendChild(header);

        // Items preview
        if (this.items.length > 0) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'mt-3 pt-3';
            itemsContainer.style.borderTop = `1px solid rgba(255, 255, 255, 0.1)`;
            
            this.items.slice(0, 3).forEach((item, idx) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'd-flex justify-content-between align-items-center mb-2';
                if (idx === this.items.length - 1) itemEl.style.marginBottom = '0';
                
                itemEl.innerHTML = `
                    <span class="text-light-gray small" style="font-size: 13px;">
                        ${item.label || `Elemento ${idx + 1}`}
                    </span>
                    <span class="text-accent small fw-bold">${item.value || ''}</span>
                `;
                itemsContainer.appendChild(itemEl);
            });

            if (this.items.length > 3) {
                const moreEl = document.createElement('small');
                moreEl.className = 'text-accent d-block mt-2';
                moreEl.style.fontSize = '11px';
                moreEl.innerHTML = `+${this.items.length - 3} más`;
                itemsContainer.appendChild(moreEl);
            }

            content.appendChild(itemsContainer);
        }

        container.appendChild(content);
        return container;
    }
}
