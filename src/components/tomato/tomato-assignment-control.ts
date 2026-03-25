/**
 * TomatoAssignmentControl - +/- buttons for assigning tomatoes to tasks
 * Controls for incrementing/decrementing tomato count on tasks
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("tomato-assignment-control")
export class TomatoAssignmentControl extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 2px;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 16px;
      font-weight: 600;
      color: #6b7280;
    }

    .btn:hover:not(:disabled) {
      background: #e5e7eb;
      color: #374151;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .btn-add:hover:not(:disabled) {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-remove:hover:not(:disabled) {
      background: #fee2e2;
      color: #dc2626;
    }

    .count {
      min-width: 28px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .count.has-value {
      color: #ef4444;
    }

    .tomato-display {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mini-tomato {
      font-size: 18px;
      line-height: 1;
    }
  `;

  @property({ type: Number })
  count = 0;

  @property({ type: Number })
  maxCount = 20;

  @property({ type: Number })
  remaining = 0;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  showCount = true;

  private _handleAdd() {
    if (this.disabled || this.count >= this.maxCount || this.remaining <= 0) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("add-tomato", {
        bubbles: true,
        composed: true,
        detail: { currentCount: this.count },
      }),
    );
  }

  private _handleRemove() {
    if (this.disabled || this.count <= 0) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("remove-tomato", {
        bubbles: true,
        composed: true,
        detail: { currentCount: this.count },
      }),
    );
  }

  private _canAdd(): boolean {
    return !this.disabled && this.count < this.maxCount && this.remaining > 0;
  }

  private _canRemove(): boolean {
    return !this.disabled && this.count > 0;
  }

  override render() {
    return html`
      <div class="control-group">
        <button
          class="btn btn-remove"
          @click=${this._handleRemove}
          ?disabled=${!this._canRemove()}
          aria-label="Remove tomato"
          title="Remove tomato"
        >
          −
        </button>
        ${this.showCount
          ? html`<span class="count ${this.count > 0 ? "has-value" : ""}"
              >${this.count}</span
            >`
          : null}
        <button
          class="btn btn-add"
          @click=${this._handleAdd}
          ?disabled=${!this._canAdd()}
          aria-label="Add tomato"
          title="Add tomato"
        >
          +
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tomato-assignment-control": TomatoAssignmentControl;
  }
}
