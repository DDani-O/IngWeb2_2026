/**
 * InboxItem.js - Item individual de la bandeja de entrada
 * Muestra: tipo (mensaje/ticket), cliente, contenido truncado, fecha, estado lectura
 */

class InboxItem {
    constructor(options = {}) {
        this.id = options.id || 'item_001';
        this.type = options.type || 'message'; // 'message' or 'ticket'
        this.clientName = options.clientName || 'Cliente';
        this.clientPhoto = options.clientPhoto || 'https://via.placeholder.com/40';
        this.content = options.content || 'Contenido del mensaje';
        this.date = options.date || new Date().toISOString();
        this.isRead = options.isRead || false;
        this.onItemClick = options.onItemClick || (() => {});
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    }

    truncateText(text, maxLength = 60) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    render() {
        const container = document.createElement('div');
        const typeIcon = this.type === 'message' ? '💬' : '🎫';
        const typeLabel = this.type === 'message' ? 'Mensaje' : 'Ticket';
        const backgroundColor = this.isRead 
            ? 'transparent' 
            : 'rgba(45, 212, 191, 0.05)';
        const borderColor = this.isRead 
            ? 'rgba(45, 212, 191, 0.1)' 
            : 'rgba(45, 212, 191, 0.25)';

        container.innerHTML = `
            <div class="inbox-item" style="
                background: ${backgroundColor};
                border: 1px solid ${borderColor};
                border-left: 3px solid ${this.isRead ? 'transparent' : 'var(--accent)'};
                border-radius: 10px;
                padding: 14px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 12px;
            " onmouseover="this.style.borderColor='rgba(45, 212, 191, 0.25)'; this.style.background='rgba(45, 212, 191, 0.08)';"
               onmouseout="this.style.borderColor='${borderColor}'; this.style.background='${backgroundColor}';">
                
                <!-- Client Avatar -->
                <img src="${this.clientPhoto}" alt="${this.clientName}" style="
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(45, 212, 191, 0.2);
                    flex-shrink: 0;
                ">

                <!-- Content -->
                <div style="flex: 1; min-width: 0;">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 6px;
                    ">
                        <span style="
                            font-size: 13px;
                            font-weight: 700;
                            color: var(--text-main);
                        ">${this.clientName}</span>
                        <span style="
                            background: rgba(45, 212, 191, 0.15);
                            color: var(--accent);
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">${typeIcon} ${typeLabel}</span>
                        ${!this.isRead ? `
                            <span style="
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: var(--accent);
                                display: inline-block;
                            "></span>
                        ` : ''}
                    </div>
                    <p style="
                        margin: 0;
                        color: var(--text-muted);
                        font-size: 12px;
                        line-height: 1.4;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${this.truncateText(this.content)}</p>
                </div>

                <!-- Date & Status -->
                <div style="
                    text-align: right;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                ">
                    <small style="
                        color: var(--text-muted);
                        font-size: 11px;
                    ">${this.formatDate(this.date)}</small>
                    ${!this.isRead ? `
                        <span style="
                            background: var(--accent);
                            color: var(--bg-main);
                            padding: 3px 8px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">Nuevo</span>
                    ` : ''}
                </div>
            </div>
        `;

        // Attach click event
        container.querySelector('.inbox-item').addEventListener('click', () => {
            this.onItemClick(this.id);
        });

        return container;
    }
}
