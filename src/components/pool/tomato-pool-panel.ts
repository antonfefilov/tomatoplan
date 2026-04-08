/**
 * TomatoPoolPanel - Left panel with pool summary and capacity controls
 * Displays the tomato pool with capacity adjustment controls and time slots
 */

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_DAY_START,
  MAX_CAPACITY_IN_MINUTES,
  MIN_CAPACITY_IN_MINUTES,
} from "../../constants/defaults.js";
import type { TomatoTimeSlot } from "../../models/tomato-pool.js";
import {
  calculateTotalScheduledMinutes,
  getTimeSlotDurationMinutes,
} from "../../utils/time.js";
import "../tomato/tomato-icon.js";

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

    .add-slot-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .add-slot-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }

    .add-slot-btn:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .slot-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .slot-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .slot-row.has-error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .slot-time-input {
      flex: 1;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: white;
      color: #374151;
      min-width: 80px;
      max-width: 120px;
    }

    .slot-time-input:hover {
      border-color: #d1d5db;
    }

    .slot-time-input:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
    }

    .slot-time-input.has-error {
      border-color: #ef4444;
    }

    .slot-label-input {
      flex: 2;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: white;
      color: #374151;
      min-width: 60px;
    }

    .slot-label-input:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
    }

    .slot-capacity {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      min-width: 50px;
      text-align: center;
    }

    .slot-delete-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.15s ease;
    }

    .slot-delete-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .slot-delete-btn:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .slot-error {
      font-size: 11px;
      color: #ef4444;
      margin-top: 4px;
      width: 100%;
    }

    .total-time-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #eff6ff;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }

    .total-time-label {
      font-size: 12px;
      color: #1e40af;
    }

    .total-time-value {
      font-size: 14px;
      font-weight: 600;
      color: #1d4ed8;
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

    .tomato-grid-section {
      margin-top: 16px;
    }

    .tomato-grid {
      display: grid;
      grid-template-columns: repeat(8, 24px);
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

    .tomato-cell.assigned {
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

    .legend-swatch.assigned {
      background-color: #ef4444;
    }

    .legend-swatch.available {
      background-color: #fecaca;
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

    .schedule-controls {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .calculated-capacity {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding: 10px 12px;
      background: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }

    .calculated-label {
      font-size: 12px;
      color: #991b1b;
    }

    .calculated-value {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
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

  @property({ type: Array })
  timeSlots: TomatoTimeSlot[] = [];

  @property({ type: Object })
  slotErrors: Record<string, string[]> = {};

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

  private _handleAddSlot() {
    // Calculate a reasonable default for a new slot
    // Start after the last slot's end time, or use default if no slots
    const lastSlot = this.timeSlots[this.timeSlots.length - 1];
    const defaultStart = lastSlot?.endTime ?? DEFAULT_DAY_START;

    // Parse the start time
    const startParts = defaultStart.split(":");
    const startHour = parseInt(startParts[0] ?? "8", 10);
    const startMin = parseInt(startParts[1] ?? "0", 10);

    // Calculate end time: add 1 hour, but cap at 23:59 to ensure valid range
    // If adding 1 hour would result in end <= start (e.g., start at 23:30),
    // use 23:59 as the maximum end time
    let endHour = startHour + 1;
    let endMin = startMin;

    // Cap at 23:59 to prevent zero-length slots
    if (endHour >= 24) {
      endHour = 23;
      endMin = 59;
    }

    const defaultEnd = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;

    this.dispatchEvent(
      new CustomEvent("add-slot", {
        bubbles: true,
        composed: true,
        detail: {
          startTime: defaultStart,
          endTime: defaultEnd,
          label: "",
        },
      }),
    );
  }

  private _handleSlotStartTimeChange(slotId: string, e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("update-slot", {
        bubbles: true,
        composed: true,
        detail: {
          slotId,
          updates: { startTime: target.value },
        },
      }),
    );
  }

  private _handleSlotEndTimeChange(slotId: string, e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("update-slot", {
        bubbles: true,
        composed: true,
        detail: {
          slotId,
          updates: { endTime: target.value },
        },
      }),
    );
  }

  private _handleSlotLabelChange(slotId: string, e: Event) {
    const target = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("update-slot", {
        bubbles: true,
        composed: true,
        detail: {
          slotId,
          updates: { label: target.value },
        },
      }),
    );
  }

  private _handleDeleteSlot(slotId: string) {
    this.dispatchEvent(
      new CustomEvent("remove-slot", {
        bubbles: true,
        composed: true,
        detail: { slotId },
      }),
    );
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

  /**
   * Gets the tomato capacity for a single slot
   */
  private _getSlotCapacity(slot: TomatoTimeSlot): number {
    const durationMinutes = getTimeSlotDurationMinutes(slot);
    if (durationMinutes <= 0 || this.capacityInMinutes <= 0) {
      return 0;
    }
    return Math.floor(durationMinutes / this.capacityInMinutes);
  }

  private _renderTomatoCells() {
    const cells = [];
    const displayAssigned = Math.min(this.assigned, this.capacity);

    for (let i = 0; i < this.capacity; i++) {
      const isAssigned = i < displayAssigned;
      cells.push(html`
        <div class="tomato-cell ${isAssigned ? "assigned" : "available"}">
          <tomato-icon
            size="24"
            color="${isAssigned ? "#ef4444" : "#fecaca"}"
          ></tomato-icon>
        </div>
      `);
    }

    return cells;
  }

  private _renderSlotRow(slot: TomatoTimeSlot) {
    const errors = this.slotErrors[slot.id] ?? [];
    const hasErrors = errors.length > 0;
    const slotCapacity = this._getSlotCapacity(slot);

    return html`
      <div class="slot-row ${hasErrors ? "has-error" : ""}">
        <input
          type="time"
          class="slot-time-input ${hasErrors ? "has-error" : ""}"
          .value=${slot.startTime}
          @change=${(e: Event) => this._handleSlotStartTimeChange(slot.id, e)}
          aria-label="Slot start time"
        />
        <input
          type="time"
          class="slot-time-input ${hasErrors ? "has-error" : ""}"
          .value=${slot.endTime}
          @change=${(e: Event) => this._handleSlotEndTimeChange(slot.id, e)}
          aria-label="Slot end time"
        />
        <input
          type="text"
          class="slot-label-input"
          .value=${slot.label ?? ""}
          @change=${(e: Event) => this._handleSlotLabelChange(slot.id, e)}
          placeholder="Label"
          aria-label="Slot label"
        />
        <span class="slot-capacity">${slotCapacity} 🍅</span>
        <button
          class="slot-delete-btn"
          @click=${() => this._handleDeleteSlot(slot.id)}
          aria-label="Delete slot"
          title="Delete slot"
        >
          ✕
        </button>
        ${hasErrors
          ? html`<div class="slot-error">${errors.join(". ")}</div>`
          : null}
      </div>
    `;
  }

  override render() {
    const isOverCapacity = this._isOverCapacity();
    const isAtCapacity = this._isAtCapacity();
    const totalScheduledMinutes = calculateTotalScheduledMinutes(
      this.timeSlots,
    );

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
        <div class="section">
          <div class="section-header">
            <span class="section-title">Time Slots</span>
            <button class="add-slot-btn" @click=${this._handleAddSlot}>
              <span>+ Add Slot</span>
            </button>
          </div>

          <div class="total-time-info">
            <span class="total-time-label">Total Scheduled Time:</span>
            <span class="total-time-value">
              ${this._formatMinutesToHoursMinutes(totalScheduledMinutes)}
            </span>
          </div>

          <div class="slot-list">
            ${this.timeSlots.map((slot) => this._renderSlotRow(slot))}
          </div>

          <div class="calculated-capacity">
            <span class="calculated-label">Daily Capacity (calculated)</span>
            <span class="calculated-value">${this.capacity} 🍅</span>
          </div>

          <div
            class="tomato-grid-section"
            aria-label="Tomato allocation visualization"
          >
            <div class="tomato-grid">${this._renderTomatoCells()}</div>
            <div class="tomato-legend" aria-hidden="true">
              <div class="legend-item">
                <div class="legend-swatch assigned"></div>
                <span>Assigned</span>
              </div>
              <div class="legend-item">
                <div class="legend-swatch available"></div>
                <span>Available</span>
              </div>
            </div>
          </div>

          ${isOverCapacity
            ? html`
                <div class="warning-message">
                  <span>⚠️</span>
                  <span>
                    Over capacity by ${Math.abs(this.remaining)} tomatoes
                  </span>
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

          <div class="schedule-controls">
            <div class="capacity-controls-row">
              <div class="capacity-control-group">
                <span class="capacity-control-label">Tomato Duration</span>
                <div class="capacity-control">
                  <button
                    class="capacity-btn"
                    @click=${this._handleDecreaseDuration}
                    ?disabled=${this.capacityInMinutes <=
                    MIN_CAPACITY_IN_MINUTES}
                    aria-label="Decrease duration"
                  >
                    −
                  </button>
                  <span class="capacity-value">
                    ${this.capacityInMinutes}
                    <span class="duration-unit">min</span>
                  </span>
                  <button
                    class="capacity-btn"
                    @click=${this._handleIncreaseDuration}
                    ?disabled=${this.capacityInMinutes >=
                    MAX_CAPACITY_IN_MINUTES}
                    aria-label="Increase duration"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div class="capacity-time-info">
              <span class="time-label">Total daily capacity:</span>
              <span class="time-value">
                ${this._formatMinutesToHoursMinutes(
                  this.capacity * this.capacityInMinutes,
                )}
              </span>
            </div>
          </div>
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
