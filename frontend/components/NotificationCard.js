/**
 * NotificationCard.js
 * Componente genérico para mensajes/alertas reutilizables.
 */

class NotificationCard {
    constructor(options = {}) {
        this.emoji = options.emoji || 'ℹ️';
        this.title = options.title || 'Notificación';
        this.message = options.message || '';
        this.titleColor = options.titleColor || '#2dd4bf';
        this.background = options.background || 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)';
        this.border = options.border || '1px solid rgba(45, 212, 191, 0.3)';
        this.footer = options.footer || '';
        this.footerColor = options.footerColor || '#94a3b8';
        this.compact = options.compact !== undefined ? options.compact : false;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'notification-card';
        container.style.cssText = `
            background: ${this.background};
            border: ${this.border};
            border-radius: 12px;
            padding: ${this.compact ? '12px 14px' : '14px 16px'};
            display: flex;
            gap: 12px;
            align-items: flex-start;
        `;

        container.innerHTML = `
            <div style="font-size: 20px; min-width: 24px;">${this.emoji}</div>
            <div style="flex: 1;">
                <p style="font-size: 13px; font-weight: 600; color: ${this.titleColor}; margin: 0 0 4px 0;">${this.title}</p>
                <small class="text-light-gray" style="font-size: 11px; line-height: 1.4;">${this.message}</small>
                ${this.footer ? `<div style="margin-top: 8px; font-size: 12px; color: ${this.footerColor};">${this.footer}</div>` : ''}
            </div>
        `;

        return container;
    }
}
