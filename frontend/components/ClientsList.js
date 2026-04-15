/**
 * ClientsList.js - Gestor de visualización de clientes (Cards o Tabla)
 * Permite al usuario alternar entre vista de tarjetas y vista de tabla
 */

class ClientsList {
    constructor(options = {}) {
        this.clients = options.clients || [];
        this.viewMode = localStorage.getItem('clientsViewMode') || 'cards'; // 'cards' or 'table'
        this.onClientClick = options.onClientClick || (() => {});
    }

    render() {
        const container = document.createElement('div');
        
        // Toggle Button
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = this.viewMode === 'cards' 
            ? '<i class="fas fa-th"></i> Ver como Tabla' 
            : '<i class="fas fa-th-list"></i> Ver como Cards';
        toggleButton.style.cssText = `
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.1) 100%);
            border: 1px solid rgba(45, 212, 191, 0.3);
            color: var(--accent);
            padding: 10px 16px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        `;
        toggleButton.onmouseover = () => {
            toggleButton.style.background = 'linear-gradient(135deg, rgba(45, 212, 191, 0.3) 0%, rgba(45, 212, 191, 0.2) 100%)';
        };
        toggleButton.onmouseout = () => {
            toggleButton.style.background = 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.1) 100%)';
        };
        toggleButton.addEventListener('click', () => {
            this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
            localStorage.setItem('clientsViewMode', this.viewMode);
            
            // Re-render content
            const contentDiv = container.querySelector('.clients-content');
            contentDiv.innerHTML = '';
            if (this.viewMode === 'cards') {
                contentDiv.appendChild(this.renderCards());
            } else {
                contentDiv.appendChild(this.renderTable());
            }
            
            // Update button text
            toggleButton.innerHTML = this.viewMode === 'cards' 
                ? '<i class="fas fa-th"></i> Ver como Tabla' 
                : '<i class="fas fa-th-list"></i> Ver como Cards';
        });

        // Content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'clients-content';
        
        if (this.viewMode === 'cards') {
            contentDiv.appendChild(this.renderCards());
        } else {
            contentDiv.appendChild(this.renderTable());
        }

        container.appendChild(toggleButton);
        container.appendChild(contentDiv);

        return container;
    }

    renderCards() {
        const cardsContainer = document.createElement('div');
        cardsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        `;

        this.clients.forEach(client => {
            const card = new AdvisorClientCard({
                clientId: client.id,
                name: client.name,
                lastName: client.lastName,
                photo: client.photo,
                lastExpense: client.lastExpense,
                consumptionProfile: client.consumptionProfile,
                unreadMessages: client.unreadMessages,
                avgMonthlySpending: client.avgMonthlySpending,
                trendPercentage: client.trendPercentage,
                financialRisk: client.financialRisk,
                onCardClick: this.onClientClick
            });

            cardsContainer.appendChild(card.render());
        });

        return cardsContainer;
    }

    renderTable() {
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = `
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid rgba(45, 212, 191, 0.15);
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.05) 0%, rgba(2, 132, 199, 0.02) 100%);
        `;

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        `;

        // Table Header
        const thead = document.createElement('thead');
        thead.style.cssText = `
            background: rgba(45, 212, 191, 0.1);
            border-bottom: 1px solid rgba(45, 212, 191, 0.2);
        `;
        thead.innerHTML = `
            <tr>
                <th style="padding: 14px; text-align: left; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Cliente</th>
                <th style="padding: 14px; text-align: left; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Perfil</th>
                <th style="padding: 14px; text-align: center; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Último Gasto</th>
                <th style="padding: 14px; text-align: right; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Gasto Promedio</th>
                <th style="padding: 14px; text-align: center; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Cambio</th>
                <th style="padding: 14px; text-align: center; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Mensajes</th>
                <th style="padding: 14px; text-align: center; color: var(--accent); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Riesgo</th>
            </tr>
        `;

        // Table Body
        const tbody = document.createElement('tbody');
        this.clients.forEach((client, idx) => {
            const tr = document.createElement('tr');
            tr.style.cssText = `
                border-bottom: 1px solid rgba(45, 212, 191, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                background: ${idx % 2 === 0 ? 'transparent' : 'rgba(45, 212, 191, 0.03)'};
            `;
            tr.onmouseover = () => {
                tr.style.background = 'rgba(45, 212, 191, 0.1)';
            };
            tr.onmouseout = () => {
                tr.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(45, 212, 191, 0.03)';
            };
            tr.addEventListener('click', () => {
                this.onClientClick(client.id);
            });

            const riskMap = {
                'low': { color: '#22c55e', label: 'Bajo', icon: '✅' },
                'medium': { color: '#f59e0b', label: 'Medio', icon: '⚠️' },
                'high': { color: '#ef4444', label: 'Alto', icon: '🚨' }
            };
            const risk = riskMap[client.financialRisk] || riskMap['low'];
            const trendColor = client.trendPercentage >= 0 ? '#ef4444' : '#22c55e';

            tr.innerHTML = `
                <td style="padding: 14px; display: flex; align-items: center; gap: 10px;">
                    <img src="${client.photo}" alt="${client.name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(45, 212, 191, 0.2);">
                    <div>
                        <div style="color: var(--text-main); font-weight: 600;">${client.name} ${client.lastName}</div>
                    </div>
                </td>
                <td style="padding: 14px; color: var(--text-muted); font-size: 12px;">${client.consumptionProfile}</td>
                <td style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 12px;">${this.formatDate(client.lastExpense)}</td>
                <td style="padding: 14px; text-align: right; color: var(--accent); font-weight: 600;">${this.formatCurrency(client.avgMonthlySpending)}</td>
                <td style="padding: 14px; text-align: center; color: ${trendColor}; font-weight: 600;">${client.trendPercentage >= 0 ? '+' : ''}${client.trendPercentage}%</td>
                <td style="padding: 14px; text-align: center;">
                    ${client.unreadMessages > 0 
                        ? `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">${client.unreadMessages}</span>`
                        : `<span style="color: var(--text-muted); font-size: 12px;">-</span>`
                    }
                </td>
                <td style="padding: 14px; text-align: center;">
                    <span style="background: rgba(${this.hexToRgb(risk.color)}, 0.15); color: ${risk.color}; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">
                        ${risk.icon} ${risk.label}
                    </span>
                </td>
            `;

            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrapper.appendChild(table);

        return tableWrapper;
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

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '45,212,191';
    }
}
