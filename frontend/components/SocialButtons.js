/**
 * SocialButtons Component
 * Botones de redes sociales reutilizables
 * Usada en: Footer, Login, etc.
 * 
 * Ejemplo:
 * const socialBtns = new SocialButtons('#container', {
 *   platforms: ['twitter', 'instagram', 'linkedin'],
 *   onClick: (platform) => console.log('Clicked:', platform)
 * });
 */

class SocialButtons {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      platforms: options.platforms || ['twitter', 'instagram', 'linkedin'],
      variant: options.variant || 'outline', // outline, solid
      size: options.size || 'md', // sm, md, lg
      onClick: options.onClick || (() => {}),
      urls: options.urls || {} // {platform: 'url'}
    };

    this.platformIcons = {
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      linkedin: 'fab fa-linkedin-in',
      facebook: 'fab fa-facebook',
      github: 'fab fa-github',
      youtube: 'fab fa-youtube',
      tiktok: 'fab fa-tiktok',
      whatsapp: 'fab fa-whatsapp'
    };

    this.render();
    this.attachEvents();
  }

  render() {
    const sizeClass = `social-btn-${this.options.size}`;
    const variantClass = `social-${this.options.variant}`;

    const buttonsHTML = this.options.platforms
      .map(platform => {
        const icon = this.platformIcons[platform] || 'fas fa-link';
        const href = this.options.urls[platform] || '#';
        return `
          <a 
            href="${href}" 
            class="social-btn ${sizeClass} ${variantClass}"
            data-platform="${platform}"
            target="_blank"
            rel="noopener noreferrer"
            title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"
          >
            <i class="${icon}"></i>
          </a>
        `;
      })
      .join('');

    this.elemento.innerHTML = `<div class="social-buttons">${buttonsHTML}</div>`;
    this.addStyles();
  }

  attachEvents() {
    this.elemento.querySelectorAll('.social-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = btn.getAttribute('data-platform');
        this.options.onClick(platform);
      });
    });
  }

  addStyles() {
    if (!document.getElementById('social-buttons-styles')) {
      const style = document.createElement('style');
      style.id = 'social-buttons-styles';
      style.textContent = `
        .social-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .social-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 2px solid;
          color: inherit;
        }

        .social-btn:hover {
          transform: translateY(-3px);
        }

        /* Tamaños */
        .social-btn-sm {
          width: 32px;
          height: 32px;
          font-size: 0.9rem;
        }

        .social-btn-md {
          width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        .social-btn-lg {
          width: 50px;
          height: 50px;
          font-size: 1.25rem;
        }

        /* Variantes */
        .social-outline {
          background-color: transparent;
          color: var(--text-muted);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .social-outline:hover {
          color: var(--accent);
          border-color: var(--accent);
          background-color: rgba(45, 212, 191, 0.1);
        }

        .social-solid {
          background-color: var(--accent);
          color: var(--bg-main);
          border-color: var(--accent);
        }

        .social-solid:hover {
          background-color: var(--accent-hover);
          border-color: var(--accent-hover);
        }

        /* Color específico por plataforma (opcional) */
        .social-btn[data-platform="twitter"]:hover {
          --platform-color: #1DA1F2;
        }

        .social-btn[data-platform="instagram"]:hover {
          --platform-color: #E1306C;
        }

        .social-btn[data-platform="linkedin"]:hover {
          --platform-color: #0077B5;
        }

        .social-btn[data-platform="facebook"]:hover {
          --platform-color: #1877F2;
        }

        .social-btn[data-platform="github"]:hover {
          --platform-color: #ffffff;
        }

        .social-btn[data-platform="youtube"]:hover {
          --platform-color: #FF0000;
        }

        .social-btn[data-platform="tiktok"]:hover {
          --platform-color: #25f4ee;
        }

        .social-btn[data-platform="whatsapp"]:hover {
          --platform-color: #25D366;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
