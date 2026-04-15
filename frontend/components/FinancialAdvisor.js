/**
 * FinancialAdvisor.js
 * Tarjeta que muestra el asesor asignado
 * Incluye información del asesor y opción de chatear
 */

class FinancialAdvisor {
    constructor(options = {}) {
        this.advisorName = options.advisorName || 'María Rodríguez';
        this.advisorTitle = options.advisorTitle || 'Asesor Financiero Senior';
        this.advisorInitials = options.advisorInitials || 'MR';
        this.advisorBio = options.advisorBio || 'Con 8 años de experiencia, estoy aquí para ayudarte a optimizar tus gastos y alcanzar tus metas financieras.';
        this.advisorExpertise = options.advisorExpertise || ['Presupuesto', 'Inversión', 'Ahorros', 'Control de Gastos'];
        this.onChatClick = options.onChatClick || (() => {});
    }

    render() {
        const container = document.createElement('div');
        container.className = 'financial-advisor-card p-4 rounded-3';
        container.style.cssText = `
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
            border: 1px solid rgba(168, 85, 247, 0.3);
            position: relative;
            overflow: hidden;
        `;

        // Decoración de fondo
        const bgDecor = document.createElement('div');
        bgDecor.style.cssText = `
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
            opacity: 0.3;
            pointer-events: none;
        `;
        container.appendChild(bgDecor);

        const content = document.createElement('div');
        content.className = 'position-relative z-1';
        
        const header = document.createElement('div');
        header.className = 'd-flex align-items-start mb-3';
        header.innerHTML = `
            <div class="avatar rounded-circle d-flex justify-content-center align-items-center fw-bold text-white me-3" 
                 style="width: 60px; height: 60px; min-width: 60px; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); font-size: 20px;">
                ${this.advisorInitials}
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-0 text-white fw-bold">${this.advisorName}</h6>
                <small class="text-accent">${this.advisorTitle}</small>
                <p class="text-light-gray small mb-0 mt-1" style="font-size: 13px; line-height: 1.4;">
                    ${this.advisorBio}
                </p>
            </div>
        `;
        content.appendChild(header);

        // Especialidades
        const expertise = document.createElement('div');
        expertise.className = 'mb-3';
        expertise.innerHTML = `
            <small class="text-light-gray d-block mb-2">Especialidades:</small>
            <div class="d-flex flex-wrap gap-2">
                ${this.advisorExpertise.map((skill, idx) => {
                    const colors = ['#2dd4bf', '#06b6d4', '#f59e0b', '#22c55e'];
                    const color = colors[idx % colors.length];
                    return `
                        <span class="badge" style="background: linear-gradient(135deg, ${color} 0%, transparent 100%); border: 1px solid ${color}; color: #fff; font-size: 11px; padding: 4px 8px;">
                            ${skill}
                        </span>
                    `;
                }).join('')}
            </div>
        `;
        content.appendChild(expertise);

        // Botón de chat
        const chatBtn = document.createElement('button');
        chatBtn.className = 'btn btn-sm fw-bold w-100';
        chatBtn.style.cssText = `
            background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            font-size: 13px;
            transition: all 0.3s ease;
        `;
        chatBtn.innerHTML = '<i class="fas fa-comments me-2"></i> Chatear con Asesor';
        
        chatBtn.addEventListener('mouseenter', () => {
            chatBtn.style.transform = 'translateY(-2px)';
            chatBtn.style.boxShadow = '0 5px 15px rgba(168, 85, 247, 0.4)';
        });
        
        chatBtn.addEventListener('mouseleave', () => {
            chatBtn.style.transform = 'translateY(0)';
            chatBtn.style.boxShadow = 'none';
        });

        chatBtn.addEventListener('click', () => this.onChatClick());
        content.appendChild(chatBtn);

        container.appendChild(content);
        return container;
    }
}
