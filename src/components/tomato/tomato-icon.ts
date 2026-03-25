/**
 * TomatoIcon - SVG tomato icon component
 * A visual tomato icon using SVG for the application branding
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("tomato-icon")
export class TomatoIcon extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      display: block;
    }

    .tomato-body {
      fill: var(--tomato-color, #ef4444);
    }

    .tomato-highlight {
      fill: #fca5a5;
    }

    .tomato-stem {
      fill: #22c55e;
    }

    .tomato-leaf {
      fill: #16a34a;
    }
  `;

  @property({ type: Number })
  size = 24;

  @property({ type: String })
  color = "#ef4444";

  override render() {
    const { size, color } = this;

    return html`
      <svg
        width=${size}
        height=${size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="--tomato-color: ${color}"
      >
        <!-- Main tomato body -->
        <path
          class="tomato-body"
          d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"
        />
        <!-- Highlight -->
        <path
          class="tomato-highlight"
          d="M8 9C8 7.89543 8.89543 7 10 7C11.1046 7 12 7.89543 12 9C12 9.55228 11.5523 10 11 10H9C8.44772 10 8 9.55228 8 9Z"
          opacity="0.6"
        />
        <!-- Stem -->
        <rect class="tomato-stem" x="11" y="2" width="2" height="3" rx="0.5" />
        <!-- Left leaf -->
        <path
          class="tomato-leaf"
          d="M12 3C12 3 10 4 9 5C8 6 8 7 8 7C8 7 9 5 12 3Z"
        />
        <!-- Right leaf -->
        <path
          class="tomato-leaf"
          d="M12 3C12 3 14 4 15 5C16 6 16 7 16 7C16 7 15 5 12 3Z"
        />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tomato-icon": TomatoIcon;
  }
}
