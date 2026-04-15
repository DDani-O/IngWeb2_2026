/**
 * AdvisorClientCard.js - Tarjeta individual de cliente para dashboard de asesor
 * Muestra: nombre, avatar, último gasto, perfil de gasto, mensajes sin leer,
 * gasto promedio mensual, trend %, y badge de riesgo financiero
 */

class AdvisorClientCard {
    constructor(options = {}) {
        this.clientId = options.clientId || 'cli_001';
        this.name = options.name || 'Cliente';
        this.lastName = options.lastName || 'Desconocido';
        this.photo = options.photo || 'https://via.placeholder.com/40?text=' + this.name[0];
        this.lastExpense = options.lastExpense || new Date().toISOString().split('T')[0];
        this.consumptionProfile = options.consumptionProfile || 'Perfil Estándar';
        this.unreadMessages = options.unreadMessages || 0;
        this.avgMonthlySpending = options.avgMonthlySpending || 0;
        this.trendPercentage = options.trendPercentage || 0;
        this.financialRisk = options.financialRisk || 'low'; // 'low', 'medium', 'high'
        this.onCardClick = options.onCardClick || (() => {});
    }

    getRiskBadgeData() {
        const riskMap = {
            'low': { color: '#22c55e', label: 'Bajo', icon: '✅' },
            'medium': { color: '#f59e0b', label: 'Medio', icon: '⚠️' },
            'high': { color: '#ef4444', label: 'Alto', icon: '🚨' }
        };
        return riskMap[this.financialRisk] || riskMap['low'];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoy';
        if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
        
        const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (daysAgo < 30) return `Hace ${daysAgo}d`;
        
        return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    }

    render() {
        const container = document.createElement('div');
        const riskData = this.getRiskBadgeData();
        const trendColor = this.trendPercentage >= 0 ? '#ef4444' : '#22c55e';
        const trendIcon = this.trendPercentage >= 0 ? '📈' : '📉';
        const trendLabel = this.trendPercentage >= 0 ? 'más que mes anterior' : 'menos que mes anterior';

        container.innerHTML = `
            <div class="advisor-client-card" style="
                background: linear-gradient(135deg, rgba(45, 212, 191, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%);
                border: 1px solid rgba(45, 212, 191, 0.15);
                border-radius: 14px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.borderColor='rgba(45, 212, 191, 0.3)'; this.style.boxShadow='0 8px 24px rgba(45, 212, 191, 0.15)'; this.style.transform='translateY(-4px)';"
               onmouseout="this.style.borderColor='rgba(45, 212, 191, 0.15)'; this.style.boxShadow='none'; this.style.transform='translateY(0)';">
                
                <!-- Decorative background -->
                <div style="
                    position: absolute;
                    top: -40px;
                    right: -40px;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(45, 212, 191, 0.08) 0%, transparent 70%);
                    pointer-events: none;
                "></div>

                <!-- Header: Avatar + Name + Risk Badge -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <img src="${this.photo}" alt="${this.name}" style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 2px solid rgba(45, 212, 191, 0.2);
                        ">
                        <div style="flex: 1;">
                            <div style="
                                font-size: 14px;
                                font-weight: 700;
                                color: var(--text-main);
                                margin-bottom: 2px;
                            ">${this.name} ${this.lastName}</div>
                            <small style="
                                color: var(--text-muted);
                                font-size: 11px;
                            ">${this.consumptionProfile}</small>
                        </div>
                    </div>

                    <!-- Risk Badge -->
                    <div style="
                        background: rgba(${this.hexToRgb(riskData.color)}, 0.1);
                        border: 1px solid rgba(${this.hexToRgb(riskData.color)}, 0.3);
                        color: ${riskData.color};
                        padding: 4px 10px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        white-space: nowrap;
                    ">
                        ${riskData.icon} ${riskData.label}
                    </div>
                </div>

                <!-- Unread Messages Badge -->
                ${this.unreadMessages > 0 ? `
                    <div style="
                        background: rgba(239, 68, 68, 0.15);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        color: #ef4444;
                        padding: 6px 10px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-envelope"></i> ${this.unreadMessages} mensaje${this.unreadMessages > 1 ? 's' : ''} sin leer
                    </div>
                ` : ''}

                <!-- Grid: Last Expense, Avg Spending, Trend -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                    position: relative;
                    z-index: 1;
                ">
                    <div style="background: rgba(255, 255, 255, 0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                        <small style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Último Gasto</small>
                        <div style="color: var(--text-main); font-weight: 600; font-size: 13px; margin-top: 4px;">
                            ${this.formatDate(this.lastExpense)}
                        </div>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                        <small style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Gasto Promedio</small>
                        <div style="color: var(--accent); font-weight: 600; font-size: 13px; margin-top: 4px;">
                            ${this.formatCurrency(this.avgMonthlySpending)}
                        </div>
                    </div>
                </div>

                <!-- Trend -->
                <div style="
                    background: rgba(255, 255, 255, 0.02);
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    z-index: 1;
                ">
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${trendIcon} Cambio vs. mes anterior
                    </div>
                    <div style="
                        color: ${trendColor};
                        font-weight: 700;
                        font-size: 12px;
                    ">
                        ${this.trendPercentage >= 0 ? '+' : ''}${this.trendPercentage}%
                    </div>
                </div>
            </div>
        `;

        // Attach click event
        container.querySelector('.advisor-client-card').addEventListener('click', () => {
            this.onCardClick(this.clientId);
        });

        return container;
    }

    hexToRgb(hex) {
        // Convierte #RRGGBB a r,g,b
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '45,212,191';
    }
}
