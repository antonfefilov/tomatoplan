/**
 * AppHeader - App title and header
 * Main header component for the application
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../tomato/tomato-icon.js";

@customElement("app-header")
export class AppHeader extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ef4444;
      margin: 0;
    }

    .subtitle {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 400;
    }

    .date-display {
      font-size: 14px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .reset-btn {
      padding: 6px 12px;
      font-size: 13px;
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .reset-btn:hover {
      background: #fee2e2;
      border-color: #fecaca;
      color: #dc2626;
    }
  `;

  @property({ type: String })
  currentDate = "";

  @property({ type: Boolean })
  showReset = false;

  private _formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  private _handleReset() {
    this.dispatchEvent(
      new CustomEvent("reset-day", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <header>
        <div class="logo-section">
          <div class="logo-text">
            <h1>Tomato Plan</h1>
            <span class="subtitle">Pomodoro Task Manager</span>
          </div>
        </div>
        ${this.currentDate
          ? html`<div class="date-display">
              ${this._formatDate(this.currentDate)}
            </div>`
          : null}
        ${this.showReset
          ? html`
              <div class="actions">
                <button class="reset-btn" @click=${this._handleReset}>
                  Reset Day
                </button>
              </div>
            `
          : null}
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-header": AppHeader;
  }
}
