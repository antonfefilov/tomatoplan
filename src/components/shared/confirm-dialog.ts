/**
 * ConfirmDialog - Modal for delete confirmations
 * A modal dialog that asks for user confirmation before destructive actions
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("confirm-dialog")
export class ConfirmDialog extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    .backdrop.open .dialog {
      transform: scale(1);
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 12px 0;
    }

    .message {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-confirm {
      background: #ef4444;
      color: white;
    }

    .btn-confirm:hover {
      background: #dc2626;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }
  `;

  @property({ type: Boolean })
  open = false;

  @property({ type: String })
  title = "Confirm Action";

  @property({ type: String })
  message = "Are you sure you want to proceed?";

  @property({ type: String })
  confirmText = "Delete";

  @property({ type: String })
  cancelText = "Cancel";

  @state()
  private _focusedElement: HTMLElement | null = null;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this._focusedElement = document.activeElement as HTMLElement;
        this._trapFocus();
      } else if (this._focusedElement) {
        this._focusedElement.focus();
      }
    }
  }

  private _trapFocus() {
    const confirmBtn = this.renderRoot.querySelector(
      ".btn-confirm",
    ) as HTMLElement;
    confirmBtn?.focus();
  }

  private _handleConfirm() {
    this.dispatchEvent(
      new CustomEvent("confirm", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleCancel() {
    this.dispatchEvent(
      new CustomEvent("cancel", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      this._handleCancel();
    }
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this._handleCancel();
    }
  }

  override render() {
    return html`
      <div
        class="backdrop ${this.open ? "open" : ""}"
        @click=${this._handleBackdropClick}
        @keydown=${this._handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div class="dialog">
          <h2 class="title" id="dialog-title">${this.title}</h2>
          <p class="message" id="dialog-message">${this.message}</p>
          <div class="actions">
            <button class="btn btn-cancel" @click=${this._handleCancel}>
              ${this.cancelText}
            </button>
            <button class="btn btn-confirm" @click=${this._handleConfirm}>
              ${this.confirmText}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "confirm-dialog": ConfirmDialog;
  }
}
