/**
 * AppHeader - App title and header
 * Main header component for the application
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../tomato/tomato-icon.js";
import { calculateTomatoesRemainingUntilDayEnd } from "../../utils/time.js";

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

    .header-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .date-display,
    .time-display,
    .remaining-display {
      font-size: 14px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .remaining-display {
      gap: 4px;
    }

    .remaining-display tomato-icon {
      flex-shrink: 0;
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

  @property({ type: String })
  dayStart = "08:00";

  @property({ type: String })
  dayEnd = "18:25";

  @property({ type: Number })
  capacityInMinutes = 25;

  @property({ type: Number })
  dailyCapacity = 25;

  @state()
  private _currentTime = "";

  @state()
  private _tomatoesRemaining: number | null = null;

  private _timerId: number | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._updateTime();
    this._scheduleNextUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimer();
  }

  private _updateTime(): void {
    const now = new Date();
    this._currentTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate tomatoes remaining until day end
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    this._tomatoesRemaining = calculateTomatoesRemainingUntilDayEnd(
      nowMinutes,
      this.dayStart,
      this.dayEnd,
      this.capacityInMinutes,
    );
  }

  private _scheduleNextUpdate(): void {
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    this._timerId = window.setTimeout(() => {
      this._updateTime();
      this._timerId = window.setInterval(() => this._updateTime(), 60000);
    }, msUntilNextMinute);
  }

  private _clearTimer(): void {
    if (this._timerId !== null) {
      window.clearTimeout(this._timerId);
      window.clearInterval(this._timerId);
      this._timerId = null;
    }
  }

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
    // Format tomatoes remaining (whole numbers only, rounded down)
    const tomatoesDisplay =
      this._tomatoesRemaining !== null
        ? Math.floor(this._tomatoesRemaining)
        : null;

    const remainingDisplay =
      tomatoesDisplay !== null
        ? html`<span class="remaining-display">
            <tomato-icon size="16"></tomato-icon>
            ${tomatoesDisplay} left today
          </span>`
        : null;

    return html`
      <header>
        <div class="logo-section">
          <div class="logo-text">
            <h1>Tomato Plan</h1>
            <span class="subtitle">Pomodoro Task Manager</span>
          </div>
        </div>
        <div class="header-info">
          ${this.currentDate
            ? html`<div class="date-display">
                ${this._formatDate(this.currentDate)}
              </div>`
            : null}
          ${this._currentTime
            ? html`<div class="time-display">${this._currentTime}</div>`
            : null}
          ${remainingDisplay}
        </div>
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
