/**
 * ProjectsAnalyticsPanel - Left panel for Projects tab with overall metrics
 * Displays overall project statistics and progress
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  getCapacityColor,
  getCapacityUsagePercent,
  isOverCapacity,
  formatMinutesToHoursMinutes,
} from "../../models/project-analytics.js";

@customElement("projects-analytics-panel")
export class ProjectsAnalyticsPanel extends LitElement {
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
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }

    .stat-card.primary {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .stat-card.primary .stat-value {
      color: #dc2626;
    }

    .progress-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 13px;
      color: #6b7280;
    }

    .progress-value {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    .progress-bar {
      height: 10px;
      background: #e5e7eb;
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.3s ease;
    }

    .progress-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: #9ca3af;
    }

    .capacity-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .capacity-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .capacity-label {
      font-size: 13px;
      color: #6b7280;
    }

    .capacity-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 13px;
      color: #dc2626;
    }

    .status-breakdown {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #f9fafb;
      border-radius: 6px;
      font-size: 12px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.active {
      background: #22c55e;
    }

    .status-dot.completed {
      background: #3b82f6;
    }

    .status-dot.archived {
      background: #9ca3af;
    }

    .status-count {
      font-weight: 600;
      color: #111827;
    }

    .status-name {
      color: #6b7280;
    }
  `;

  @property({ type: Number })
  weeklyCapacity = 125;

  @property({ type: Number })
  totalPlanned = 0;

  @property({ type: Number })
  totalFinished = 0;

  @property({ type: Number })
  projectCount = 0;

  @property({ type: Number })
  activeProjectCount = 0;

  @property({ type: Number })
  completedProjectCount = 0;

  @property({ type: Number })
  archivedProjectCount = 0;

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

  private _getCapacityPercent(): number {
    return getCapacityUsagePercent(this.totalPlanned, this.weeklyCapacity);
  }

  private _getCapacityColor(): string {
    return getCapacityColor(this._getCapacityPercent());
  }

  private _isOverCapacity(): boolean {
    return isOverCapacity(this.totalPlanned, this.weeklyCapacity);
  }

  private _getRemainingCapacity(): number {
    return this.weeklyCapacity - this.totalPlanned;
  }

  private _getProgressPercent(): number {
    if (this.totalPlanned === 0) return 0;
    return Math.min(100, (this.totalFinished / this.totalPlanned) * 100);
  }

  private _getProgressColor(): string {
    const percent = this._getProgressPercent();
    if (percent >= 100) return "#22c55e";
    if (percent >= 75) return "#84cc16";
    if (percent >= 50) return "#f59e0b";
    return "#ef4444";
  }

  override render() {
    const capacityPercent = this._getCapacityPercent();
    const capacityColor = this._getCapacityColor();
    const isOverCapacity = this._isOverCapacity();
    const remaining = this._getRemainingCapacity();
    const progressPercent = this._getProgressPercent();
    const progressColor = this._getProgressColor();

    return html`
      <div class="panel-header">
        <div class="header-left">
          <h2 class="panel-title">Analytics</h2>
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
          <h3 class="section-title">Project Overview</h3>
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-value">${this.projectCount}</div>
              <div class="stat-label">Total Projects</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.activeProjectCount}</div>
              <div class="stat-label">Active</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.completedProjectCount}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.archivedProjectCount}</div>
              <div class="stat-label">Archived</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Weekly Progress</h3>
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Overall Progress</span>
              <span class="progress-value"
                >${Math.round(progressPercent)}%</span
              >
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                style="width: ${progressPercent}%; background-color: ${progressColor}"
              ></div>
            </div>
            <div class="progress-stats">
              <span>${this.totalFinished} finished</span>
              <span>${this.totalPlanned} planned</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Capacity Usage</h3>
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Weekly Capacity</span>
              <span class="progress-value">
                ${this.totalPlanned}/${this.weeklyCapacity} tomatoes
              </span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                style="width: ${Math.min(
                  100,
                  capacityPercent,
                )}%; background-color: ${capacityColor}"
              ></div>
            </div>
            <div class="progress-stats">
              <span>
                ${isOverCapacity
                  ? html`<span style="color: #ef4444;">
                      ${Math.abs(remaining)} over
                    </span>`
                  : html`${remaining} remaining`}
              </span>
            </div>

            <div class="capacity-section">
              <div class="capacity-row">
                <span class="capacity-label">Planned Time</span>
                <span class="capacity-value">
                  ${formatMinutesToHoursMinutes(
                    this.totalPlanned * this.capacityInMinutes,
                  )}
                </span>
              </div>
              <div class="capacity-row">
                <span class="capacity-label">Finished Time</span>
                <span class="capacity-value">
                  ${formatMinutesToHoursMinutes(
                    this.totalFinished * this.capacityInMinutes,
                  )}
                </span>
              </div>
              <div class="capacity-row">
                <span class="capacity-label">Weekly Capacity</span>
                <span class="capacity-value">
                  ${formatMinutesToHoursMinutes(
                    this.weeklyCapacity * this.capacityInMinutes,
                  )}
                </span>
              </div>
            </div>

            ${isOverCapacity
              ? html`
                  <div class="warning-message">
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
              : null}
          </div>
        </div>

        <div class="status-breakdown">
          <div class="status-item">
            <div class="status-dot active"></div>
            <span class="status-count">${this.activeProjectCount}</span>
            <span class="status-name">active</span>
          </div>
          <div class="status-item">
            <div class="status-dot completed"></div>
            <span class="status-count">${this.completedProjectCount}</span>
            <span class="status-name">completed</span>
          </div>
          <div class="status-item">
            <div class="status-dot archived"></div>
            <span class="status-count">${this.archivedProjectCount}</span>
            <span class="status-name">archived</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "projects-analytics-panel": ProjectsAnalyticsPanel;
  }
}
