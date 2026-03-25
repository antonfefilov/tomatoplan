/**
 * IconButton - Reusable icon button with tooltip
 * A button that displays an icon and shows a tooltip on hover
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("icon-button")
export class IconButton extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      color: inherit;
    }

    button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.05);
    }

    button:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 8px;
      background: #1f2937;
      color: white;
      font-size: 12px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.15s ease,
        visibility 0.15s ease;
      pointer-events: none;
      z-index: 100;
    }

    .tooltip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: #1f2937;
    }

    button:hover:not(:disabled) + .tooltip,
    button:focus:not(:disabled) + .tooltip {
      opacity: 1;
      visibility: visible;
    }

    ::slotted(svg) {
      width: 20px;
      height: 20px;
    }
  `;

  @property({ type: String })
  label = "";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  size: "sm" | "md" | "lg" = "md";

  private _handleClick(e: Event) {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.dispatchEvent(
      new CustomEvent("icon-click", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <button
        type="button"
        aria-label=${this.label}
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
      ${this.label ? html`<span class="tooltip">${this.label}</span>` : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "icon-button": IconButton;
  }
}
