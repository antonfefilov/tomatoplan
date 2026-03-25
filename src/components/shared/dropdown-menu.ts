/**
 * DropdownMenu - Reusable dropdown menu with three-dots icon
 * A dropdown menu that shows slotted items when clicked
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("dropdown-menu")
export class DropdownMenu extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
    }

    .trigger {
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

    .trigger:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .trigger:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .trigger svg {
      width: 20px;
      height: 20px;
    }

    .menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      min-width: 150px;
      background: white;
      border-radius: 8px;
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
      opacity: 0;
      visibility: hidden;
      transform: scale(0.95) translateY(-4px);
      transition:
        opacity 0.15s ease,
        visibility 0.15s ease,
        transform 0.15s ease;
      z-index: 100;
      padding: 4px 0;
    }

    .menu.open {
      opacity: 1;
      visibility: visible;
      transform: scale(1) translateY(0);
    }

    ::slotted(.menu-item) {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: 14px;
      color: #374151;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    ::slotted(.menu-item:hover) {
      background: #f3f4f6;
    }

    ::slotted(.menu-item:focus-visible) {
      outline: 2px solid #ef4444;
      outline-offset: -2px;
    }

    ::slotted(.menu-item.danger) {
      color: #ef4444;
    }

    ::slotted(.menu-item.danger:hover) {
      background: #fef2f2;
    }

    ::slotted(.menu-divider) {
      height: 1px;
      background: #e5e7eb;
      margin: 4px 0;
    }
  `;

  @property({ type: Boolean })
  open = false;

  @property({ type: String })
  label = "More options";

  @state()
  private _focusedElement: HTMLElement | null = null;

  private _handleTriggerClick(e: Event) {
    e.stopPropagation();
    this.open = !this.open;
    if (this.open) {
      this._focusedElement = document.activeElement as HTMLElement;
    }
  }

  private _handleOutsideClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this._close();
    }
  };

  private _handleSlotClick(e: Event) {
    const target = e.target as HTMLElement;
    if (target.classList.contains("menu-item")) {
      this._close();
    }
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this._close();
      this._focusedElement?.focus();
    }
  }

  private _close() {
    this.open = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleOutsideClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick);
  }

  override render() {
    return html`
      <button
        class="trigger"
        type="button"
        aria-label=${this.label}
        aria-expanded=${this.open}
        aria-haspopup="menu"
        @click=${this._handleTriggerClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
      </button>
      <div
        class="menu ${this.open ? "open" : ""}"
        role="menu"
        @click=${this._handleSlotClick}
        @keydown=${this._handleKeydown}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dropdown-menu": DropdownMenu;
  }
}
