/**
 * ProfileCard.js
 * Tarjeta de perfil del usuario para el panel lateral
 * Muestra información básica y acceso a edición de perfil
 */

class ProfileCard {
    constructor(options = {}) {
        this.userName = options.userName || 'Juan Pérez';
        this.userInitials = options.userInitials || 'JP';
        this.userRole = options.userRole || 'Usuario Standard';
        this.onEditClick = options.onEditClick || (() => {});
    }

    render() {
        const container = document.createElement('div');
        container.className = 'profile-card-small p-3 rounded-3';
        container.style.cssText = `
            background: linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%);
            border: 1px solid rgba(45, 212, 191, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        container.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="avatar-small rounded-circle d-flex justify-content-center align-items-center fw-bold text-dark me-3" 
                     style="width: 48px; height: 48px; background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); font-size: 18px;">
                    ${this.userInitials}
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-0 text-white fw-bold text-truncate">${this.userName}</h6>
                    <small class="text-accent">Editar Perfil</small>
                </div>
                <i class="fas fa-arrow-right text-accent" style="font-size: 12px; opacity: 0.6;"></i>
            </div>
        `;

        container.addEventListener('click', () => this.onEditClick());

        container.addEventListener('mouseenter', () => {
            container.style.background = 'linear-gradient(135deg, rgba(45, 212, 191, 0.25) 0%, rgba(20, 184, 166, 0.15) 100%)';
            container.style.borderColor = 'rgba(45, 212, 191, 0.5)';
            container.style.boxShadow = '0 0 15px rgba(45, 212, 191, 0.2)';
        });

        container.addEventListener('mouseleave', () => {
            container.style.background = 'linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)';
            container.style.borderColor = 'rgba(45, 212, 191, 0.3)';
            container.style.boxShadow = 'none';
        });

        return container;
    }
}
