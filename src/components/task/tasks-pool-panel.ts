/**
 * TasksPoolPanel - Left panel for Tasks view with statistics and filters
 * Displays task statistics and filter controls for the unified tasks view
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import type { Project } from "../../models/project.js";
import { isTaskDone } from "../../models/task.js";

export type TasksFilter = "all" | "active" | "done";

@customElement("tasks-pool-panel")
export class TasksPoolPanel extends LitElement {
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .stat-value.total {
      color: #3b82f6;
    }

    .stat-value.active {
      color: #ef4444;
    }

    .stat-value.done {
      color: #16a34a;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .filter-section {
      margin-top: 20px;
    }

    .filter-group {
      margin-bottom: 16px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      flex: 1;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .filter-btn:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .filter-btn.active {
      color: white;
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .project-filter-select {
      width: 100%;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .project-filter-select:hover {
      border-color: #d1d5db;
    }

    .project-filter-select:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .summary-section {
      margin-top: 20px;
      padding: 16px;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-size: 13px;
      color: #6b7280;
    }

    .summary-value {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
  `;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Array })
  projects: readonly Project[] = [];

  @property({ type: String })
  statusFilter: TasksFilter = "all";

  @property({ type: String })
  projectFilter: string = "all";

  @property({ type: Boolean, reflect: true })
  collapsed = false;

  @state()
  private _totalTasks = 0;

  @state()
  private _activeTasks = 0;

  @state()
  private _doneTasks = 0;

  private _computeStats(): void {
    this._totalTasks = this.tasks.length;
    this._activeTasks = this.tasks.filter((t) => !isTaskDone(t)).length;
    this._doneTasks = this.tasks.filter((t) => isTaskDone(t)).length;
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("tasks")) {
      this._computeStats();
    }
  }

  private _handleToggleCollapse() {
    this.dispatchEvent(
      new CustomEvent("toggle-collapse", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleStatusFilterChange(filter: TasksFilter) {
    this.dispatchEvent(
      new CustomEvent("status-filter-change", {
        bubbles: true,
        composed: true,
        detail: { filter },
      }),
    );
  }

  private _handleProjectFilterChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent("project-filter-change", {
        bubbles: true,
        composed: true,
        detail: { projectId: target.value },
      }),
    );
  }

  /**
   * Computes total tomatoes across all tasks
   */
  private _getTotalTomatoes(): number {
    return this.tasks.reduce((sum, task) => sum + task.tomatoCount, 0);
  }

  /**
   * Computes total finished tomatoes across all tasks
   */
  private _getFinishedTomatoes(): number {
    return this.tasks.reduce(
      (sum, task) => sum + (task.finishedTomatoCount ?? 0),
      0,
    );
  }

  override render() {
    const totalTomatoes = this._getTotalTomatoes();
    const finishedTomatoes = this._getFinishedTomatoes();

    return html`
      <div class="panel-header">
        <div class="header-left">
          <h2 class="panel-title">All Tasks</h2>
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
            <span class="section-title">Task Statistics</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value total">${this._totalTasks}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-card">
              <span class="stat-value active">${this._activeTasks}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-card">
              <span class="stat-value done">${this._doneTasks}</span>
              <span class="stat-label">Done</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-group">
            <span class="filter-label">Status</span>
            <div class="filter-buttons">
              <button
                class="filter-btn ${this.statusFilter === "all"
                  ? "active"
                  : ""}"
                @click=${() => this._handleStatusFilterChange("all")}
                aria-pressed=${this.statusFilter === "all"}
              >
                All
              </button>
              <button
                class="filter-btn ${this.statusFilter === "active"
                  ? "active"
                  : ""}"
                @click=${() => this._handleStatusFilterChange("active")}
                aria-pressed=${this.statusFilter === "active"}
              >
                Active
              </button>
              <button
                class="filter-btn ${this.statusFilter === "done"
                  ? "active"
                  : ""}"
                @click=${() => this._handleStatusFilterChange("done")}
                aria-pressed=${this.statusFilter === "done"}
              >
                Done
              </button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label">Project</span>
            <select
              class="project-filter-select"
              @change=${this._handleProjectFilterChange}
              aria-label="Filter by project"
            >
              <option value="all">All Projects</option>
              ${this.projects.map(
                (project) => html`
                  <option
                    value=${project.id}
                    ?selected=${this.projectFilter === project.id}
                  >
                    ${project.title}
                  </option>
                `,
              )}
            </select>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-row">
            <span class="summary-label">Total Tomatoes</span>
            <span class="summary-value">${totalTomatoes} 🍅</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Finished Tomatoes</span>
            <span class="summary-value">${finishedTomatoes} ✅</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Completion</span>
            <span class="summary-value">
              ${totalTomatoes > 0
                ? Math.round((finishedTomatoes / totalTomatoes) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tasks-pool-panel": TasksPoolPanel;
  }
}
