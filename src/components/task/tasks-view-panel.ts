/**
 * TasksViewPanel - Right panel for Tasks view with filtered task list
 * Displays all tasks from both daily and weekly contexts with filtering
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import type { Project } from "../../models/project.js";
import type { TimerStatus } from "../../models/timer-state.js";
import { isTaskDone } from "../../models/task.js";
import type { TasksFilter } from "./tasks-pool-panel.js";
import "./task-list.js";

@customElement("tasks-view-panel")
export class TasksViewPanel extends LitElement {
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
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .header-count {
      font-size: 12px;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 12px;
      margin-left: 8px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .add-btn:hover {
      background: #dc2626;
    }

    .add-btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .empty-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      text-align: center;
      max-width: 280px;
    }

    .filter-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f3f4f6;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .filter-info-text {
      font-size: 12px;
      color: #6b7280;
    }

    .filter-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #e5e7eb;
      color: #374151;
      font-weight: 500;
    }

    .project-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
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

  @property({ type: Number })
  remaining = 0;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Number })
  capacityInMinutes = 25;

  @property({ type: String })
  timerActiveTaskId: string | null = null;

  @property({ type: String })
  timerStatus: TimerStatus = "idle";

  @property({ type: Number })
  timerRemainingSeconds = 0;

  @property({ type: Boolean })
  showAssignToToday = false;

  @property({ type: Boolean })
  showRemoveFromDay = false;

  @property({ type: String })
  todayDate?: string;

  /**
   * Filters tasks based on the selected status and project filters
   */
  private _getFilteredTasks(): Task[] {
    let filtered = [...this.tasks];

    // Apply status filter
    if (this.statusFilter === "active") {
      filtered = filtered.filter((task) => !isTaskDone(task));
    } else if (this.statusFilter === "done") {
      filtered = filtered.filter((task) => isTaskDone(task));
    }

    // Apply project filter
    if (this.projectFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.projectId === this.projectFilter,
      );
    }

    return filtered;
  }

  /**
   * Gets the project title for a given project ID
   */
  private _getProjectTitle(projectId?: string): string {
    if (!projectId) return "No Project";
    const project = this.projects.find((p) => p.id === projectId);
    return project?.title ?? "Unknown Project";
  }

  /**
   * Gets the project color for a given project ID
   */
  private _getProjectColor(projectId?: string): string {
    if (!projectId) return "#6b7280";
    const project = this.projects.find((p) => p.id === projectId);
    return project?.color ?? "#6b7280";
  }

  private _handleAddTask(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("open-task-dialog", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleEditTask(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("edit-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleDeleteTask(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("delete-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleMarkTomatoFinished(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-tomato-finished", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleMarkTomatoUnfinished(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-tomato-unfinished", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleReorderTask(
    e: CustomEvent<{ taskId: string; toIndex: number }>,
  ) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("reorder-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleStartTimer(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("start-timer", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handlePauseTimer(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("pause-timer", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleResumeTimer(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("resume-timer", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleResetTimer(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("reset-timer", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleMarkDone(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-done", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleAssignToToday(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("assign-to-today", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleRemoveFromDay(e: CustomEvent<{ taskId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("remove-from-day", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  override render() {
    const filteredTasks = this._getFilteredTasks();
    const taskCount = filteredTasks.length;

    // Determine if filters are active
    const isFiltered =
      this.statusFilter !== "all" || this.projectFilter !== "all";

    return html`
      <div class="panel-header">
        <div class="header-left">
          <div>
            <span class="header-title">Tasks</span>
            ${taskCount > 0
              ? html`<span class="header-count">${taskCount} tasks</span>`
              : null}
          </div>
        </div>
        <button class="add-btn" @click=${this._handleAddTask}>
          <span>+</span>
          <span>Add Task</span>
        </button>
      </div>

      <div class="panel-content">
        ${isFiltered
          ? html`
              <div class="filter-info">
                <span class="filter-info-text">Showing:</span>
                ${this.statusFilter !== "all"
                  ? html`
                      <span class="filter-badge">
                        ${this.statusFilter === "active" ? "Active" : "Done"}
                      </span>
                    `
                  : null}
                ${this.projectFilter !== "all"
                  ? html`
                      <span
                        class="project-badge"
                        style="background-color: ${this._getProjectColor(
                          this.projectFilter,
                        )}20; color: ${this._getProjectColor(
                          this.projectFilter,
                        )}"
                      >
                        ${this._getProjectTitle(this.projectFilter)}
                      </span>
                    `
                  : null}
              </div>
            `
          : null}
        ${taskCount === 0
          ? html`
              <div class="empty-container">
                <div class="empty-icon">📝</div>
                <h3 class="empty-title">
                  ${isFiltered ? "No matching tasks" : "No tasks yet"}
                </h3>
                <p class="empty-description">
                  ${isFiltered
                    ? "Try adjusting your filters to see more tasks."
                    : "Add your first task to start planning your work."}
                </p>
                ${!isFiltered
                  ? html`
                      <button class="add-btn" @click=${this._handleAddTask}>
                        <span>+</span>
                        <span>Add Your First Task</span>
                      </button>
                    `
                  : null}
              </div>
            `
          : html`
              <task-list
                .tasks=${filteredTasks}
                .remaining=${this.remaining}
                .disabled=${this.disabled}
                .capacityInMinutes=${this.capacityInMinutes}
                .timerActiveTaskId=${this.timerActiveTaskId}
                .timerStatus=${this.timerStatus}
                .timerRemainingSeconds=${this.timerRemainingSeconds}
                .projects=${this.projects}
                .showProject=${true}
                .showAssignToToday=${this.showAssignToToday}
                .showRemoveFromDay=${this.showRemoveFromDay}
                .todayDate=${this.todayDate}
                @edit-task=${this._handleEditTask}
                @delete-task=${this._handleDeleteTask}
                @mark-tomato-finished=${this._handleMarkTomatoFinished}
                @mark-tomato-unfinished=${this._handleMarkTomatoUnfinished}
                @reorder-task=${this._handleReorderTask}
                @start-timer=${this._handleStartTimer}
                @pause-timer=${this._handlePauseTimer}
                @resume-timer=${this._handleResumeTimer}
                @reset-timer=${this._handleResetTimer}
                @mark-done=${this._handleMarkDone}
                @assign-to-today=${this._handleAssignToToday}
                @remove-from-day=${this._handleRemoveFromDay}
              ></task-list>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tasks-view-panel": TasksViewPanel;
  }
}
