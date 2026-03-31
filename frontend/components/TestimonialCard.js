/**
 * TestimonialCard Component
 * Tarjeta de testimonio reutilizable
 * Usada en: Sección Ventajas (carousel)
 * 
 * Ejemplo:
 * const testimonial = new TestimonialCard('#container', {
 *   quote: 'Excelente servicio...',
 *   author: 'María González',
 *   role: 'Emprendedora'
 * });
 */

class TestimonialCard {
  constructor(selector, options = {}) {
    this.elemento = document.querySelector(selector);
    this.options = {
      quote: options.quote || 'Lorem ipsum dolor sit amet.',
      author: options.author || 'Nombre del Usuario',
      role: options.role || 'Rol',
      avatar: options.avatar || null,
      rating: options.rating || 5 // 1-5 stars
    };
    this.render();
  }

  render() {
    const avatarHTML = this.options.avatar
      ? `<img src="${this.options.avatar}" alt="${this.options.author}" class="testimonial-avatar">`
      : `<div class="testimonial-avatar-placeholder">${this.options.author.charAt(0)}</div>`;

    const starsHTML = this.generateStars(this.options.rating);

    this.elemento.innerHTML = `
      <div class="testimonial-card">
        <div class="stars-container">
          ${starsHTML}
        </div>
        <blockquote class="testimonial-quote">
          <p>"${this.options.quote}"</p>
        </blockquote>
        <div class="testimonial-footer">
          ${avatarHTML}
          <div class="testimonial-meta">
            <h5 class="testimonial-author">${this.options.author}</h5>
            <p class="testimonial-role">${this.options.role}</p>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating ? 'fas' : 'far';
      stars += `<i class="${filled} fa-star star-icon"></i>`;
    }
    return stars;
  }

  addStyles() {
    if (!document.getElementById('testimonial-card-styles')) {
      const style = document.createElement('style');
      style.id = 'testimonial-card-styles';
      style.textContent = `
        .testimonial-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        .testimonial-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(45, 212, 191, 0.2);
        }

        .stars-container {
          margin-bottom: 1rem;
        }

        .star-icon {
          color: var(--accent);
          font-size: 1rem;
          margin-right: 0.25rem;
        }

        .testimonial-quote {
          margin: 0 0 1.5rem;
          flex-grow: 1;
        }

        .testimonial-quote p {
          color: var(--text-muted);
          font-style: italic;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .testimonial-footer {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--accent);
        }

        .testimonial-avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--accent);
          color: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .testimonial-meta {
          flex-grow: 1;
        }

        .testimonial-author {
          color: var(--text-main);
          font-weight: 600;
          margin: 0;
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }

        .testimonial-role {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
