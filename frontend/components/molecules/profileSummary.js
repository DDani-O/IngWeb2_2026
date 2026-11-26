import { html } from "../../utils/html.js";
import { avatar } from "../atoms/avatar.js";
import { keyValueList } from "./keyValueList.js";

/**
 * Molécula ProfileSummary: avatar, nombre, email y datos destacados de una cuenta.
 * @param {{fullName: string, email: string, items?: {label: string, value: *}[], footer?: *}} props
 */
export function profileSummary({ fullName = "", email = "", items = [], footer = null } = {}) {
  return html`
    <div class="profile-summary__identity">
      ${avatar({ name: fullName, size: "lg" })}
      <h2 class="profile-summary__name">${fullName}</h2>
      <p class="text-muted">${email}</p>
    </div>
    ${keyValueList({ items, variant: "boxed" })}
    ${footer ? html`<div class="section-actions">${footer}</div>` : ""}
  `;
}
