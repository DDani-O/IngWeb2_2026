/**
 * UnusualExpenseCard.js
 * Componente reutilizable para representar un gasto inusual.
 */

class UnusualExpenseCard {
    constructor(options = {}) {
        this.category = options.category || 'Categoría';
        this.date = options.date || '';
        this.expected = Number(options.expected || 0);
        this.detected = Number(options.detected || 0);
        this.severity = options.severity || 'Media';
    }

    render() {
        const delta = this.detected - this.expected;
        const deltaPercent = this.expected > 0 ? Math.round((delta / this.expected) * 100) : 0;
        const severityColor = this.severity === 'Alta' ? '#ef4444' : '#f59e0b';

        // Reutiliza NotificationCard para mantener misma estructura visual entre alertas.
        if (typeof NotificationCard !== 'undefined') {
            const detail = `
                <div class="d-flex justify-content-between" style="font-size: 12px; margin-top: 6px;">
                    <span class="text-light-gray">Esperado: ${this.formatCurrency(this.expected)}</span>
                    <span class="text-light-gray">Detectado: ${this.formatCurrency(this.detected)}</span>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #fca5a5;">
                    +${this.formatCurrency(delta)} (${deltaPercent}%) sobre tu promedio
                </div>
            `;

            return new NotificationCard({
                emoji: this.severity === 'Alta' ? '🚨' : '⚠️',
                title: `${this.category} (${this.severity})`,
                message: `Fecha: ${this.date}`,
                titleColor: severityColor,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                compact: true,
                footer: detail,
                footerColor: '#94a3b8'
            }).render();
        }

        // Fallback para compatibilidad si NotificationCard no está disponible.
        const fallback = document.createElement('div');
        fallback.className = 'unusual-card';
        fallback.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <strong class="text-white" style="font-size: 14px;">${this.category}</strong>
                <small style="color: ${severityColor}; font-weight: 700;">${this.severity}</small>
            </div>
            <small class="text-light-gray d-block mb-2">${this.date}</small>
            <div class="d-flex justify-content-between" style="font-size: 12px;">
                <span class="text-light-gray">Esperado: ${this.formatCurrency(this.expected)}</span>
                <span class="text-light-gray">Detectado: ${this.formatCurrency(this.detected)}</span>
            </div>
            <div class="mt-2" style="font-size: 12px; color: #fca5a5;">
                +${this.formatCurrency(delta)} (${deltaPercent}%) sobre tu promedio
            </div>
        `;

        return fallback;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(value);
    }
}

