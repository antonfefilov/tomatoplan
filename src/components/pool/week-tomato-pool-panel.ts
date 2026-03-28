/**
 * WeekTomatoPoolPanel - Left panel for Week view with pool visualization
 * Displays weekly tomato capacity, planned tomatoes, and controls
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formatWeekRange } from "../../models/weekly-pool.js";
import {
  formatMinutesToHoursMinutes,
  getCapacityColor,
  getCapacityUsagePercent,
  isOverCapacity,
} from "../../models/project-analytics.js";
import type { WeeklyPool } from "../../models/weekly-pool.js";
import "../tomato/tomato-icon.js";
import "../shared/empty-state.js";

@customElement("week-tomato-pool-panel")
export class WeekTomatoPoolPanel extends LitElement {
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

    .week-range {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
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

    .tomato-grid-section {
      margin-top: 16px;
    }

    .tomato-grid {
      display: grid;
      grid-template-columns: repeat(10, 24px);
      gap: 4px;
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .tomato-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease;
    }

    .tomato-cell:hover {
      transform: scale(1.1);
    }

    .tomato-cell.planned {
      opacity: 1;
    }

    .tomato-cell.available {
      opacity: 0.55;
    }

    .tomato-legend {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #6b7280;
    }

    .legend-swatch {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-swatch.planned {
      background-color: #ef4444;
    }

    .legend-swatch.available {
      background-color: #fecaca;
    }

    .capacity-section {
      margin-top: 16px;
    }

    .capacity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .capacity-label {
      font-size: 13px;
      color: #6b7280;
    }

    .capacity-value-text {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    .capacity-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .capacity-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .capacity-stats {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 12px;
      color: #9ca3af;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
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

    .over-capacity-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-top: 12px;
      font-size: 13px;
      color: #dc2626;
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

    .remaining-info {
      margin-top: 16px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 8px;
      border: 1px solid #fecaca;
    }

    .remaining-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .remaining-label {
      font-size: 12px;
      color: #991b1b;
    }

    .remaining-value {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
    }

    .remaining-negative {
      color: #ef4444;
    }

    .finished-info {
      margin-top: 8px;
      font-size: 13px;
      color: #6b7280;
    }
  `;

  @property({ type: Number })
  weeklyCapacity = 125;

  @property({ type: Number })
  planned = 0;

  @property({ type: Number })
  remaining = 125;

  @property({ type: Number })
  finished = 0;

  @property({ type: String })
  weekStartDate = "";

  @property({ type: String })
  weekEndDate = "";

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
    if (this.weeklyCapacity > 25) {
      this.dispatchEvent(
        new CustomEvent("weekly-capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: this.weeklyCapacity - 5 },
        }),
      );
    }
  }

  private _handleIncreaseCapacity() {
    if (this.weeklyCapacity < 200) {
      this.dispatchEvent(
        new CustomEvent("weekly-capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: this.weeklyCapacity + 5 },
        }),
      );
    }
  }

  private _getCapacityPercent(): number {
    return getCapacityUsagePercent(this.planned, this.weeklyCapacity);
  }

  private _getCapacityBarColor(): string {
    return getCapacityColor(this._getCapacityPercent());
  }

  private _isOverCapacity(): boolean {
    return isOverCapacity(this.planned, this.weeklyCapacity);
  }

  private _isAtCapacity(): boolean {
    return this.remaining === 0 && this.planned > 0;
  }

  private _renderTomatoCells() {
    const cells = [];
    const displayPlanned = Math.min(this.planned, this.weeklyCapacity);

    for (let i = 0; i < this.weeklyCapacity; i++) {
      const isPlanned = i < displayPlanned;
      cells.push(html`
        <div class="tomato-cell ${isPlanned ? "planned" : "available"}">
          <tomato-icon
            size="24"
            color="${isPlanned ? "#ef4444" : "#fecaca"}"
          ></tomato-icon>
        </div>
      `);
    }

    return cells;
  }

  override render() {
    const isOverCapacity = this._isOverCapacity();
    const isAtCapacity = this._isAtCapacity();
    const capacityPercent = this._getCapacityPercent();
    const capacityColor = this._getCapacityBarColor();

    const weekPool: WeeklyPool = {
      weekStartDate: this.weekStartDate,
      weekEndDate: this.weekEndDate,
      weeklyCapacity: this.weeklyCapacity,
      capacityInMinutes: this.capacityInMinutes,
      weekId: "",
    };

    return html`
      <div class="panel-header">
        <div class="header-left">
          <h2 class="panel-title">Week Tomato Pool</h2>
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
        <div class="section">
          <div class="week-range">${formatWeekRange(weekPool)}</div>

          <div class="capacity-controls-row">
            <div class="capacity-control-group">
              <span class="capacity-control-label">Weekly Capacity</span>
              <div class="capacity-control">
                <button
                  class="capacity-btn"
                  @click=${this._handleDecreaseCapacity}
                  ?disabled=${this.weeklyCapacity <= 25}
                  aria-label="Decrease weekly capacity"
                >
                  −
                </button>
                <span class="capacity-value">${this.weeklyCapacity}</span>
                <button
                  class="capacity-btn"
                  @click=${this._handleIncreaseCapacity}
                  ?disabled=${this.weeklyCapacity >= 200}
                  aria-label="Increase weekly capacity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div class="capacity-time-info">
            <span class="time-label">Total time:</span>
            <span class="time-value">
              ${formatMinutesToHoursMinutes(
                this.weeklyCapacity * this.capacityInMinutes,
              )}
            </span>
          </div>
        </div>

        <div class="capacity-section">
          <div class="capacity-header">
            <span class="capacity-label">Planned</span>
            <span class="capacity-value-text">
              ${this.planned}/${this.weeklyCapacity} tomatoes
            </span>
          </div>
          <div class="capacity-bar">
            <div
              class="capacity-fill"
              style="width: ${Math.min(
                100,
                capacityPercent,
              )}%; background-color: ${capacityColor}"
            ></div>
          </div>
          <div class="capacity-stats">
            <span class="stat">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              ${this.finished} finished
            </span>
            <span class="stat">
              ${isOverCapacity
                ? html`<span style="color: #ef4444;">
                    ${Math.abs(this.remaining)} over
                  </span>`
                : html`${this.remaining} remaining`}
            </span>
          </div>
        </div>

        <div
          class="tomato-grid-section"
          aria-label="Weekly tomato allocation visualization"
        >
          <div class="tomato-grid">${this._renderTomatoCells()}</div>
          <div class="tomato-legend" aria-hidden="true">
            <div class="legend-item">
              <div class="legend-swatch planned"></div>
              <span>Planned</span>
            </div>
            <div class="legend-item">
              <div class="legend-swatch available"></div>
              <span>Available</span>
            </div>
          </div>
        </div>

        ${isOverCapacity
          ? html`
              <div class="over-capacity-message">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  ></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Project estimates exceed weekly capacity
              </div>
            `
          : isAtCapacity
            ? html`
                <div class="warning-message">
                  <span>✅</span>
                  <span>All capacity allocated to projects!</span>
                </div>
              `
            : null}

        <div class="remaining-info">
          <div class="remaining-header">
            <span class="remaining-label">Remaining Capacity</span>
            <span
              class="remaining-value ${isOverCapacity
                ? "remaining-negative"
                : ""}"
            >
              ${isOverCapacity
                ? html`−${Math.abs(this.remaining)}`
                : html`${this.remaining}`}
              🍅
            </span>
          </div>
          <div class="finished-info">
            Finished tomatoes are tracked via completed tasks
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "week-tomato-pool-panel": WeekTomatoPoolPanel;
  }
}
