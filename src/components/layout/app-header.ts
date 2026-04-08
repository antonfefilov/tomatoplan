/**
 * AppHeader - App title and header
 * Main header component for the application
 * Displays view-specific content based on HeaderModel
 */

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../tomato/tomato-icon.js";
import { formatWeekRangeFromDates } from "../../models/weekly-pool.js";
import { calculateTomatoesRemainingInTimeSlots } from "../../utils/time.js";
import type { HeaderModel } from "./app-header.types.js";

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
    .remaining-display,
    .week-range-display,
    .week-stats-display,
    .projects-stats-display,
    .tasks-stats-display,
    .tracks-stats-display {
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

    .remaining-display tomato-icon,
    .week-stats-display tomato-icon,
    .projects-stats-display tomato-icon {
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

  @property({ attribute: false })
  headerModel: HeaderModel | null = null;

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

  /**
   * willUpdate runs BEFORE render, so setting state here won't trigger
   * an additional update cycle (avoiding the Lit warning)
   */
  override willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("headerModel")) {
      const oldModel = changedProperties.get(
        "headerModel",
      ) as HeaderModel | null;
      const newModel = this.headerModel;

      // Update time display when entering day view or timing settings changed
      if (this._shouldUpdateTimeDisplay(oldModel, newModel)) {
        this._updateTime();
      } else if (newModel?.view !== "day") {
        // Leaving day view - clear display state
        this._currentTime = "";
        this._tomatoesRemaining = null;
      }
    }
  }

  /**
   * updated runs AFTER render, so we only do non-render-triggering work here
   * Timer scheduling doesn't set state, so it's safe here
   */
  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("headerModel")) {
      const oldModel = changedProperties.get(
        "headerModel",
      ) as HeaderModel | null;
      const newModel = this.headerModel;

      if (this._shouldRescheduleTimer(oldModel, newModel)) {
        this._clearTimer();
        this._scheduleNextUpdate();
      } else if (newModel?.view !== "day" && oldModel?.view === "day") {
        // Leaving day view - clear timer
        this._clearTimer();
      }
    }
  }

  private _updateTime(): void {
    // Only compute time and remaining tomatoes for day view
    if (this.headerModel?.view !== "day") {
      this._currentTime = "";
      this._tomatoesRemaining = null;
      return;
    }

    const now = new Date();
    this._currentTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate tomatoes remaining using slot-aware calculation
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    this._tomatoesRemaining = calculateTomatoesRemainingInTimeSlots(
      nowMinutes,
      this.headerModel.timeSlots,
      this.headerModel.capacityInMinutes,
    );
  }

  private _scheduleNextUpdate(): void {
    // Only schedule timer updates for day view
    if (this.headerModel?.view !== "day") {
      return;
    }

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

  /**
   * Checks if the time display needs to be updated based on model changes
   * Update when entering day view or timing settings changed
   */
  private _shouldUpdateTimeDisplay(
    oldModel: HeaderModel | null,
    newModel: HeaderModel | null,
  ): boolean {
    // If entering day view from non-day view
    if (oldModel?.view !== "day" && newModel?.view === "day") {
      return true;
    }

    // If already in day view and timing settings changed
    if (oldModel?.view === "day" && newModel?.view === "day") {
      return (
        oldModel.timeSlots !== newModel.timeSlots ||
        oldModel.timeSlots.length !== newModel.timeSlots.length ||
        oldModel.capacityInMinutes !== newModel.capacityInMinutes ||
        // Deep compare time slots for changes
        oldModel.timeSlots.some(
          (oldSlot, index) =>
            !newModel.timeSlots[index] ||
            oldSlot.startTime !== newModel.timeSlots[index].startTime ||
            oldSlot.endTime !== newModel.timeSlots[index].endTime,
        )
      );
    }

    return false;
  }

  /**
   * Checks if the timer needs to be rescheduled based on model changes
   * Only reschedule when:
   * - View changed from non-day to day, OR
   * - View is day AND day timing settings changed
   */
  private _shouldRescheduleTimer(
    oldModel: HeaderModel | null,
    newModel: HeaderModel | null,
  ): boolean {
    // If entering day view from non-day view
    if (oldModel?.view !== "day" && newModel?.view === "day") {
      return true;
    }

    // If already in day view and timing settings changed
    if (oldModel?.view === "day" && newModel?.view === "day") {
      return (
        oldModel.timeSlots !== newModel.timeSlots ||
        oldModel.timeSlots.length !== newModel.timeSlots.length ||
        oldModel.capacityInMinutes !== newModel.capacityInMinutes ||
        // Deep compare time slots for changes
        oldModel.timeSlots.some(
          (oldSlot, index) =>
            !newModel.timeSlots[index] ||
            oldSlot.startTime !== newModel.timeSlots[index].startTime ||
            oldSlot.endTime !== newModel.timeSlots[index].endTime,
        )
      );
    }

    return false;
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

  // ============================================
  // View-specific render methods
  // ============================================

  private _renderDayInfo(model: { date: string }): unknown {
    const dateDisplay = model.date
      ? html`<div class="date-display">${this._formatDate(model.date)}</div>`
      : null;

    const timeDisplay = this._currentTime
      ? html`<div class="time-display">${this._currentTime}</div>`
      : null;

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

    return html`${dateDisplay}${timeDisplay}${remainingDisplay}`;
  }

  private _renderWeekInfo(model: {
    weekStartDate: string;
    weekEndDate: string;
    planned: number;
    capacity: number;
  }): unknown {
    const weekRange = formatWeekRangeFromDates(
      model.weekStartDate,
      model.weekEndDate,
    );

    return html`
      <div class="week-range-display">${weekRange}</div>
      <span class="week-stats-display">
        <tomato-icon size="16"></tomato-icon>
        ${model.planned} planned / ${model.capacity} capacity
      </span>
    `;
  }

  private _renderProjectsInfo(model: {
    projectCount: number;
    activeProjectCount: number;
    totalFinished: number;
    totalPlanned: number;
  }): unknown {
    const projectSummary = `${model.projectCount} projects, ${model.activeProjectCount} active`;

    return html`
      <div class="projects-stats-display">${projectSummary}</div>
      <span class="projects-stats-display">
        <tomato-icon size="16"></tomato-icon>
        ${model.totalFinished} finished / ${model.totalPlanned} planned
      </span>
    `;
  }

  private _renderTracksInfo(model: {
    trackCount: number;
    selectedTrackTitle?: string;
  }): unknown {
    const selectedDisplay = model.selectedTrackTitle
      ? `Selected: ${model.selectedTrackTitle}`
      : "No track selected";

    return html`
      <div class="tracks-stats-display">${model.trackCount} tracks</div>
      <div class="tracks-stats-display">${selectedDisplay}</div>
    `;
  }

  private _renderTasksInfo(model: {
    taskCount: number;
    activeTaskCount: number;
    doneTaskCount: number;
  }): unknown {
    return html`
      <div class="tasks-stats-display">${model.taskCount} tasks</div>
      <div class="tasks-stats-display">
        ${model.activeTaskCount} active, ${model.doneTaskCount} done
      </div>
    `;
  }

  private _renderViewInfo(): unknown {
    if (!this.headerModel) {
      return null;
    }

    switch (this.headerModel.view) {
      case "day":
        return this._renderDayInfo(this.headerModel);
      case "week":
        return this._renderWeekInfo(this.headerModel);
      case "projects":
        return this._renderProjectsInfo(this.headerModel);
      case "tasks":
        return this._renderTasksInfo(this.headerModel);
      case "tracks":
        return this._renderTracksInfo(this.headerModel);
      default:
        return null;
    }
  }

  override render() {
    const showReset =
      this.headerModel?.view === "day" && this.headerModel.showReset;

    return html`
      <header>
        <div class="logo-section">
          <div class="logo-text">
            <h1>Tomato Plan</h1>
            <span class="subtitle">Pomodoro Task Manager</span>
          </div>
        </div>
        <div class="header-info">${this._renderViewInfo()}</div>
        ${showReset
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
