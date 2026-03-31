/**
 * SectionHeader Component
 * Encabezado reutilizable para secciones
 * Usada en: Todas las secciones principales
 * 
 * Ejemplo:
 * const header = new SectionHeader('#container', {
 *   title: 'Nuestros Planes',
 *   subtitle: 'Elige el plan que mejor se ajuste a ti',
 *   accentWord: 'Planes'
 * });
 */

class SectionHeader {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      title: options.title || 'Título de Sección',
      subtitle: options.subtitle || '',
      accentWord: options.accentWord || null, // Palabra para poner en color accent
      centered: options.centered !== undefined ? options.centered : true,
      showDivider: options.showDivider !== undefined ? options.showDivider : false
    };
    this.render();
  }

  render() {
    const dividerHTML = this.options.showDivider 
      ? '<hr class="section-header-divider">'
      : '';

    let titleHTML = this.options.title;
    if (this.options.accentWord) {
      titleHTML = titleHTML.replace(
        this.options.accentWord,
        `<span class="accent-word">${this.options.accentWord}</span>`
      );
    }

    const alignClass = this.options.centered ? 'text-center' : '';
    const subtitleHTML = this.options.subtitle
      ? `<p class="section-subtitle">${this.options.subtitle}</p>`
      : '';

    this.elemento.innerHTML = `
      ${dividerHTML}
      <div class="section-header ${alignClass}">
        <h2 class="section-title">${titleHTML}</h2>
        ${subtitleHTML}
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (!document.getElementById('section-header-styles')) {
      const style = document.createElement('style');
      style.id = 'section-header-styles';
      style.textContent = `
        .section-header {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .accent-word {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          font-size: 1.15rem;
          color: var(--text-muted);
          margin: 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-header-divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 2rem;
          }

          .section-subtitle {
            font-size: 1rem;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
