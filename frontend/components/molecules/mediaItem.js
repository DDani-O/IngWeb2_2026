import { attrs, cx, html } from "../../utils/html.js";

/**
 * Molécula MediaItem: fila con elemento inicial (avatar, ranking), texto y elemento final.
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {*} [props.leading] SafeHtml a la izquierda (avatar, número)
 * @param {*} [props.trailing] SafeHtml a la derecha (monto, badge)
 * @param {"default"|"accent"} [props.variant]
 */
export function mediaItem({ title, subtitle = "", leading = null, trailing = null, variant = "default" } = {}) {
  return html`
    <article ${attrs({ class: cx("media-item", variant === "accent" && "media-item--accent") })}>
      ${leading ? html`<div class="media-item__leading">${leading}</div>` : ""}
      <div class="media-item__body">
        <p class="media-item__title">${title}</p>
        ${subtitle ? html`<p class="media-item__subtitle">${subtitle}</p>` : ""}
      </div>
      ${trailing ? html`<div class="media-item__trailing">${trailing}</div>` : ""}
    </article>
  `;
}
