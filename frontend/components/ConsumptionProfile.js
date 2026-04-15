/**
 * ConsumptionProfile.js
 * Tarjeta con el perfil de consumo del usuario
 * Muestra el tipo de consumidor con nombres chistosos
 */

class ConsumptionProfile {
    constructor(options = {}) {
        this.profileType = options.profileType || 'ahorrativo'; // ahorrativo, equilibrado, deudor
        this.perceptionPercentage = options.perceptionPercentage || 65;
        
        this.profiles = {
            ahorrativo: {
                emoji: '🧛',
                name: 'Drácula Nocturno',
                description: 'Eres tan cuidadoso con tu dinero que hasta los vampiros toman apuntes... Te gusta guardar cada peso.',
                color: '#2dd4bf',
                colorLight: 'rgba(45, 212, 191, 0.15)'
            },
            equilibrado: {
                emoji: '⚖️',
                name: 'Equilibrista Cósmico',
                description: 'Perfecto balance entre gasto y ahorro. Eres el tipo de persona que confunde su presupuesto con un arte.',
                color: '#06b6d4',
                colorLight: 'rgba(6, 182, 212, 0.15)'
            },
            deudor: {
                emoji: '🦅',
                name: 'Espíritu Libre',
                description: 'Gasta con libertad... quizás demasiada 😄. Pero hey, ¡la vida es para vivirla! (También para pagarla)',
                color: '#f59e0b',
                colorLight: 'rgba(245, 158, 11, 0.15)'
            }
        };
        
        this.currentProfile = this.profiles[this.profileType] || this.profiles.equilibrado;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'consumption-profile-card p-4 rounded-3';
        container.style.cssText = `
            background: linear-gradient(135deg, ${this.currentProfile.colorLight} 0%, rgba(20, 184, 166, 0.08) 100%);
            border: 2px solid ${this.currentProfile.color};
            overflow: hidden;
            position: relative;
        `;

        // Fondo decorativo
        const background = document.createElement('div');
        background.style.cssText = `
            position: absolute;
            top: 0;
            right: -20px;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle, ${this.currentProfile.color} 0%, transparent 70%);
            opacity: 0.1;
            pointer-events: none;
        `;
        container.appendChild(background);

        const content = document.createElement('div');
        content.className = 'position-relative z-1';
        content.innerHTML = `
            <div class="d-flex align-items-center mb-3">
                <span style="font-size: 48px; margin-right: 15px;">${this.currentProfile.emoji}</span>
                <div>
                    <h5 class="fw-bold mb-0" style="color: ${this.currentProfile.color};">${this.currentProfile.name}</h5>
                    <small class="text-light-gray">Tu Perfil de Consumidor</small>
                </div>
            </div>
            <p class="text-light-gray mb-3 small" style="line-height: 1.5; font-size: 14px;">
                ${this.currentProfile.description}
            </p>
            <div style="padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);" class="mb-3">
                <small class="text-accent d-block mb-2" style="font-style: italic;">
                    💡 ¿Quieres conocer otros tipos de perfiles y cómo llegar a serlo?
                </small>
                <a href="perfiles.html" class="btn btn-sm btn-outline-primary" style="font-size: 12px;">
                    Explorar perfiles →
                </a>
            </div>
            <small class="text-light-gray d-block" style="font-style: italic;">
                ⓘ Este perfil se actualiza según tus hábitos de consumo
            </small>
        `;

        container.appendChild(content);
        return container;
    }
}
