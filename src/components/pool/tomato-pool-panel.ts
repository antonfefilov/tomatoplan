/**
 * TomatoPoolPanel - Left panel with pool summary and capacity controls
 * Displays the tomato pool with capacity adjustment controls
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  MIN_DAILY_CAPACITY,
  MAX_DAILY_CAPACITY,
  MIN_CAPACITY_IN_MINUTES,
  MAX_CAPACITY_IN_MINUTES,
  DEFAULT_DAILY_CAPACITY,
} from "../../constants/defaults.js";
import "../tomato/tomato-icon.js";
import "../tomato/tomato-pool-visual.js";
import "../shared/empty-state.js";

@customElement("tomato-pool-panel")
export class TomatoPoolPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      min-height: 52px;
      border-bottom: 1px solid #e5e7eb;
      background: white;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #6b7280;
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
    }

    .toggle-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .toggle-btn:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .toggle-btn svg {
      width: 18px;
      height: 18px;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    :host([collapsed]) .panel-content {
      display: none;
    }

    :host([collapsed]) .panel-title {
      display: none;
    }

    .stats-card {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #ef4444;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .stat-item.remaining .stat-value {
      color: #22c55e;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .capacity-controls-row {
      display: flex;
      gap: 12px;
    }

    .capacity-control-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .capacity-control-label {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .capacity-control {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 4px 8px;
    }

    .capacity-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: none;
      background: white;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .capacity-btn:hover:not(:disabled) {
      background: #fee2e2;
      color: #ef4444;
    }

    .capacity-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .capacity-value {
      min-width: 32px;
      text-align: center;
      font-size: 15px;
      font-weight: 600;
      color: #374151;
    }

    .duration-unit {
      font-size: 10px;
      font-weight: 400;
      color: #6b7280;
      margin-left: 1px;
    }

    .progress-section {
      margin-top: 16px;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #ef4444);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-fill.over-capacity {
      background: #ef4444;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
      color: #92400e;
    }

    .at-capacity-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
      color: #166534;
    }

    .capacity-time-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding: 8px 12px;
      background: #f3f4f6;
      border-radius: 6px;
    }

    .time-label {
      font-size: 12px;
      color: #6b7280;
    }

    .time-value {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  `;

  @property({ type: Number })
  capacity = DEFAULT_DAILY_CAPACITY;

  @property({ type: Number })
  assigned = 0;

  @property({ type: Number })
  remaining = DEFAULT_DAILY_CAPACITY;

  @property({ type: Number })
  taskCount = 0;

  @property({ type: Number })
  capacityInMinutes = 25;

  @property({ type: Boolean, reflect: true })
  collapsed = false;

  private _handleToggleCollapse() {
    this.dispatchEvent(
      new CustomEvent("toggle-collapse", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleDecreaseCapacity() {
    if (this.capacity > MIN_DAILY_CAPACITY) {
      this.dispatchEvent(
        new CustomEvent("capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: this.capacity - 1 },
        }),
      );
    }
  }

  private _handleIncreaseCapacity() {
    if (this.capacity < MAX_DAILY_CAPACITY) {
      this.dispatchEvent(
        new CustomEvent("capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: this.capacity + 1 },
        }),
      );
    }
  }

  private _handleDecreaseDuration() {
    if (this.capacityInMinutes > MIN_CAPACITY_IN_MINUTES) {
      this.dispatchEvent(
        new CustomEvent("duration-change", {
          bubbles: true,
          composed: true,
          detail: { minutes: this.capacityInMinutes - 1 },
        }),
      );
    }
  }

  private _handleIncreaseDuration() {
    if (this.capacityInMinutes < MAX_CAPACITY_IN_MINUTES) {
      this.dispatchEvent(
        new CustomEvent("duration-change", {
          bubbles: true,
          composed: true,
          detail: { minutes: this.capacityInMinutes + 1 },
        }),
      );
    }
  }

  private _getProgressPercent(): number {
    if (this.capacity === 0) return 0;
    return Math.min(100, (this.assigned / this.capacity) * 100);
  }

  private _isOverCapacity(): boolean {
    return this.remaining < 0;
  }

  private _isAtCapacity(): boolean {
    return this.remaining === 0 && this.assigned > 0;
  }

  /**
   * Formats minutes into a human-readable hours/minutes string
   * e.g., 200 minutes -> "3h 20m"
   */
  private _formatMinutesToHoursMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }

  override render() {
    const progressPercent = this._getProgressPercent();
    const isOverCapacity = this._isOverCapacity();
    const isAtCapacity = this._isAtCapacity();

    return html`
      <div class="panel-header">
        <div class="header-left">
          <h2 class="panel-title">Today's Tomato Pool</h2>
        </div>
        <button
          class="toggle-btn"
          @click=${this._handleToggleCollapse}
          aria-label=${this.collapsed ? "Expand panel" : "Collapse panel"}
          aria-expanded=${!this.collapsed}
          aria-controls="panel-content"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="panel-content" id="panel-content">
        <div class="stats-card">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${this.assigned}</div>
              <div class="stat-label">Assigned</div>
            </div>
            <div class="stat-item remaining">
              <div class="stat-value">${Math.max(0, this.remaining)}</div>
              <div class="stat-label">Available</div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-bar">
              <div
                class="progress-fill ${isOverCapacity ? "over-capacity" : ""}"
                style="width: ${progressPercent}%"
              ></div>
            </div>
            <div class="progress-label">
              <span>0</span>
              <span>${this.assigned} / ${this.capacity}</span>
              <span>${this.capacity}</span>
            </div>
          </div>

          ${isOverCapacity
            ? html`
                <div class="warning-message">
                  <span>⚠️</span>
                  <span
                    >Over capacity by ${Math.abs(this.remaining)} tomatoes</span
                  >
                </div>
              `
            : isAtCapacity
              ? html`
                  <div class="at-capacity-message">
                    <span>✅</span>
                    <span>All tomatoes assigned!</span>
                  </div>
                `
              : null}
        </div>

        <div class="section">
          <div class="capacity-controls-row">
            <div class="capacity-control-group">
              <span class="capacity-control-label">Daily Capacity</span>
              <div class="capacity-control">
                <button
                  class="capacity-btn"
                  @click=${this._handleDecreaseCapacity}
                  ?disabled=${this.capacity <= MIN_DAILY_CAPACITY}
                  aria-label="Decrease capacity"
                >
                  −
                </button>
                <span class="capacity-value">${this.capacity}</span>
                <button
                  class="capacity-btn"
                  @click=${this._handleIncreaseCapacity}
                  ?disabled=${this.capacity >= MAX_DAILY_CAPACITY}
                  aria-label="Increase capacity"
                >
                  +
                </button>
              </div>
            </div>
            <div class="capacity-control-group">
              <span class="capacity-control-label">Tomato Duration</span>
              <div class="capacity-control">
                <button
                  class="capacity-btn"
                  @click=${this._handleDecreaseDuration}
                  ?disabled=${this.capacityInMinutes <= MIN_CAPACITY_IN_MINUTES}
                  aria-label="Decrease duration"
                >
                  −
                </button>
                <span class="capacity-value"
                  >${this.capacityInMinutes}<span class="duration-unit"
                    >min</span
                  ></span
                >
                <button
                  class="capacity-btn"
                  @click=${this._handleIncreaseDuration}
                  ?disabled=${this.capacityInMinutes >= MAX_CAPACITY_IN_MINUTES}
                  aria-label="Increase duration"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div class="capacity-time-info">
            <span class="time-label">Total time:</span>
            <span class="time-value"
              >${this._formatMinutesToHoursMinutes(
                this.capacity * this.capacityInMinutes,
              )}</span
            >
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-title">Visual</span>
          </div>
          <tomato-pool-visual
            .capacity=${this.capacity}
            .assigned=${this.assigned}
          ></tomato-pool-visual>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tomato-pool-panel": TomatoPoolPanel;
  }
}
