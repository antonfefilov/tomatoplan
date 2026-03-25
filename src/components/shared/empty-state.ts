/**
 * EmptyState - Empty state placeholder component
 * Displays when there's no content to show
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("empty-state")
export class EmptyState extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .description {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      max-width: 280px;
      line-height: 1.5;
    }

    ::slotted([slot="action"]) {
      margin-top: 16px;
    }
  `;

  @property({ type: String })
  title = "No items";

  @property({ type: String })
  description = "";

  @property({ type: String })
  icon = "";

  override render() {
    return html`
      <div class="container">
        ${this.icon ? html`<div class="icon">${this.icon}</div>` : null}
        <h3 class="title">${this.title}</h3>
        ${this.description
          ? html`<p class="description">${this.description}</p>`
          : null}
        <slot name="action"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "empty-state": EmptyState;
  }
}
