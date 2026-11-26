/**
 * Layout de las páginas públicas (landing, placeholder, ruta no encontrada).
 * No agrega estructura: cada página pública trae su propia navbar.
 */
export class PublicLayout {
  /**
   * @param {HTMLElement} container
   */
  mount(container) {
    this.element = container;
    this.element.replaceChildren();
    this.outlet = container;
    return this;
  }

  setActive() {
    // Sin navegación propia que marcar.
  }

  destroy() {
    this.element?.replaceChildren();
  }
}
