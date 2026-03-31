/**
 * TaskItem - Individual task with title, description preview, tomato count, and controls
 * A single task card component with optional timer controls
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import { isTaskDone } from "../../models/task.js";
import type { TimerStatus } from "../../models/timer-state.js";
import { formatTimerDisplay } from "../../models/timer-state.js";
import { formatTimeEstimate } from "../../utils/time.js";
import type { Project } from "../../models/project.js";
import "../tomato/tomato-icon.js";
import "../shared/dropdown-menu.js";

@customElement("task-item")
export class TaskItem extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .task-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .task-card:hover {
      border-color: #fecaca;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .task-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      line-height: 1.4;
      flex: 1;
      word-break: break-word;
    }

    .tomato-control-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      background: #fef2f2;
      border-radius: 8px;
      padding: 2px;
    }

    .tomato-control-wrapper tomato-icon {
      margin: 0 2px;
    }

    .tomato-control-wrapper span {
      min-width: 20px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .finished-control-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      background: #f0fdf4;
      border-radius: 8px;
      padding: 2px;
    }

    .finished-control-wrapper span {
      min-width: 20px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .finished-label {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: #16a34a;
      font-size: 14px;
    }

    .btn-remove,
    .btn-add {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 16px;
      font-weight: 600;
      color: #6b7280;
    }

    .btn-remove:hover:not(:disabled),
    .btn-add:hover:not(:disabled) {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-remove:focus-visible,
    .btn-add:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .btn-remove:disabled,
    .btn-add:disabled {
      background: #e5e7eb;
      opacity: 0.5;
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

    .btn-remove.finished:hover:not(:disabled) {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-add.finished:hover:not(:disabled) {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-add.finished:focus-visible,
    .btn-remove.finished:focus-visible {
      outline: 2px solid #16a34a;
      outline-offset: 2px;
    }

    .task-description {
      font-size: 13px;
      color: #6b7280;
      margin: 12px 0 0 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .no-description {
      font-style: italic;
      color: #9ca3af;
    }

    .task-estimation-display {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .task-estimation {
      font-size: 12px;
      color: #9ca3af;
    }

    .task-estimation-icon {
      width: 14px;
      height: 14px;
      color: #9ca3af;
    }

    .task-controls-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .controls-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: 14px;
      color: #374151;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .menu-item:hover {
      background: #f3f4f6;
    }

    .menu-item.danger {
      color: #ef4444;
    }

    .menu-item.danger:hover {
      background: #fef2f2;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #16a34a;
      transition: width 0.2s ease;
    }

    .progress-text {
      font-size: 11px;
      color: #9ca3af;
      min-width: 40px;
      text-align: right;
    }

    .timer-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .timer-display {
      font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Mono", monospace;
      font-size: 24px;
      font-weight: 600;
      color: #ef4444;
      min-width: 65px;
    }

    .timer-display.running {
      color: #16a34a;
    }

    .timer-display.paused {
      color: #f59e0b;
    }

    .timer-controls {
      display: flex;
      gap: 4px;
    }

    .timer-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: #f3f4f6;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 14px;
    }

    .timer-btn:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .timer-btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .timer-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .timer-btn.start {
      background: #dcfce7;
      color: #16a34a;
    }

    .timer-btn.start:hover:not(:disabled) {
      background: #bbf7d0;
    }

    .timer-btn.pause {
      background: #fef3c7;
      color: #d97706;
    }

    .timer-btn.pause:hover:not(:disabled) {
      background: #fde68a;
    }

    .timer-btn.reset {
      background: #fee2e2;
      color: #dc2626;
    }

    .timer-btn.reset:hover:not(:disabled) {
      background: #fecaca;
    }

    .timer-inactive {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #9ca3af;
    }

    .timer-active-elsewhere {
      font-size: 11px;
      color: #9ca3af;
      font-style: italic;
    }

    .btn-done {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      border: none;
      background: #dcfce7;
      color: #16a34a;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .btn-done:hover:not(:disabled) {
      background: #bbf7d0;
    }

    .btn-done:focus-visible {
      outline: 2px solid #16a34a;
      outline-offset: 2px;
    }

    .btn-done:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Project badge styling */
    .project-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    /* Done task styling */
    .task-card.done {
      background: #f9fafb;
      border-color: #e5e7eb;
      box-shadow: none;
    }

    .task-card.done:hover {
      border-color: #e5e7eb;
      box-shadow: none;
    }

    .task-card.done .task-title {
      color: #6b7280;
      text-decoration: line-through;
      text-decoration-color: #9ca3af;
    }

    .task-card.done .task-description,
    .task-card.done .task-estimation,
    .task-card.done .progress-text,
    .task-card.done .timer-inactive,
    .task-card.done .timer-active-elsewhere {
      color: #9ca3af;
    }

    .task-card.done .progress-bar {
      background: #f3f4f6;
    }

    .task-card.done .progress-fill {
      background: #86efac;
    }
  `;

  @property({ type: Object })
  task!: Task;

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

  @property({ type: Array })
  projects?: readonly Project[];

  @property({ type: Boolean })
  showProject = false;

  private _handleEdit() {
    this.dispatchEvent(
      new CustomEvent("edit-task", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleDelete() {
    this.dispatchEvent(
      new CustomEvent("delete-task", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleAddTomato(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("add-tomato", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleRemoveTomato(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("remove-tomato", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleMarkFinished(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-tomato-finished", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleMarkUnfinished(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-tomato-unfinished", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleStartTimer(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("start-timer", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
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

  private _handleMarkDone(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("mark-done", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _truncateDescription(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  /**
   * Gets the project for a given project ID
   */
  private _getProject(projectId?: string): Project | undefined {
    if (!projectId || !this.projects) return undefined;
    return this.projects.find((p) => p.id === projectId);
  }

  /**
   * Gets the project title for display
   */
  private _getProjectTitle(projectId?: string): string {
    const project = this._getProject(projectId);
    return project?.title ?? "Unknown";
  }

  /**
   * Gets the project color for styling
   */
  private _getProjectColor(projectId?: string): string {
    const project = this._getProject(projectId);
    return project?.color ?? "#6b7280";
  }

  override render() {
    const {
      task,
      remaining,
      disabled,
      timerActiveTaskId,
      timerStatus,
      timerRemainingSeconds,
    } = this;
    const finishedCount = task.finishedTomatoCount ?? 0;
    const overlapCount = Math.min(finishedCount, task.tomatoCount);
    const extraFinishedCount = Math.max(0, finishedCount - task.tomatoCount);

    // Determine timer state for this task
    const isThisTaskActive = timerActiveTaskId === task.id;
    const hasActiveTimerElsewhere =
      timerActiveTaskId !== null && timerActiveTaskId !== task.id;
    const canStartTimer =
      !disabled && !hasActiveTimerElsewhere && timerStatus === "idle";

    // Timer display class based on status
    const timerDisplayClass = isThisTaskActive
      ? `timer-display ${timerStatus}`
      : "timer-display";

    // Determine if task is done
    const taskIsDone = isTaskDone(task);

    return html`
      <div class="task-card${taskIsDone ? " done" : ""}">
        <div class="task-header">
          <div class="tomato-control-wrapper">
            <button
              class="btn-remove"
              @click=${this._handleRemoveTomato}
              ?disabled=${disabled || task.tomatoCount <= 0}
              aria-label="Remove tomato"
              title="Remove tomato"
            >
              −
            </button>
            <tomato-icon size="16"></tomato-icon>
            <span>${task.tomatoCount}</span>
            <button
              class="btn-add"
              @click=${this._handleAddTomato}
              ?disabled=${disabled || remaining <= 0}
              aria-label="Add tomato"
              title="Add tomato"
            >
              +
            </button>
          </div>
          <div class="task-estimation-display">
            <svg
              class="task-estimation-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="task-estimation"
              >${formatTimeEstimate(
                task.tomatoCount * this.capacityInMinutes,
              )}</span
            >
          </div>
          <h3 class="task-title">${task.title}</h3>
          ${this.showProject && task.projectId
            ? html`
                <div
                  class="project-badge"
                  style="background-color: ${this._getProjectColor(
                    task.projectId,
                  )}20; color: ${this._getProjectColor(task.projectId)}"
                  title="${this._getProjectTitle(task.projectId)}"
                >
                  <span
                    class="project-dot"
                    style="background-color: ${this._getProjectColor(
                      task.projectId,
                    )}"
                  ></span>
                  <span>${this._getProjectTitle(task.projectId)}</span>
                </div>
              `
            : null}
          <dropdown-menu label="Task options">
            <button class="menu-item" @click=${this._handleEdit}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
                />
              </svg>
              Edit
            </button>
            <button class="menu-item danger" @click=${this._handleDelete}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clip-rule="evenodd"
                />
              </svg>
              Delete
            </button>
          </dropdown-menu>
        </div>

        ${task.description
          ? html`<p class="task-description">
              ${this._truncateDescription(task.description)}
            </p>`
          : null}

        <div class="task-controls-row">
          <div class="finished-control-wrapper">
            <button
              class="btn-remove finished"
              @click=${this._handleMarkUnfinished}
              ?disabled=${disabled || finishedCount <= 0}
              aria-label="Mark tomato as unfinished"
              title="Mark tomato as unfinished"
            >
              −
            </button>
            <span class="finished-label" title="Finished tomatoes">✓</span>
            <span>${finishedCount}</span>
            <button
              class="btn-add finished"
              @click=${this._handleMarkFinished}
              ?disabled=${disabled}
              aria-label="Mark tomato as finished"
              title="Mark tomato as finished"
            >
              +
            </button>
          </div>
          ${task.tomatoCount > 0
            ? html`
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    style="width: ${task.tomatoCount > 0
                      ? (overlapCount / task.tomatoCount) * 100
                      : 0}%"
                  ></div>
                </div>
                <span class="progress-text"
                  >${overlapCount}/${task.tomatoCount}${extraFinishedCount > 0
                    ? ` (+${extraFinishedCount} extra)`
                    : ""}</span
                >
              `
            : html`<span class="controls-label">done</span>`}
          ${task.tomatoCount > 0 && finishedCount < task.tomatoCount
            ? html`
                <button
                  class="btn-done"
                  @click=${this._handleMarkDone}
                  ?disabled=${disabled}
                  aria-label="Mark task as done"
                  title="Mark task as done"
                >
                  ✓ Done
                </button>
              `
            : null}
        </div>

        <!-- Timer Section -->
        <div class="timer-section">
          ${isThisTaskActive
            ? html`
                <span class=${timerDisplayClass}>
                  ${formatTimerDisplay(timerRemainingSeconds)}
                </span>
                <div class="timer-controls">
                  ${timerStatus === "running"
                    ? html`
                        <button
                          class="timer-btn pause"
                          @click=${this._handlePauseTimer}
                          aria-label="Pause timer"
                          title="Pause timer"
                        >
                          ⏸
                        </button>
                      `
                    : html`
                        <button
                          class="timer-btn start"
                          @click=${this._handleResumeTimer}
                          aria-label="Resume timer"
                          title="Resume timer"
                        >
                          ▶
                        </button>
                      `}
                  <button
                    class="timer-btn reset"
                    @click=${this._handleResetTimer}
                    aria-label="Reset timer"
                    title="Reset timer"
                  >
                    ✕
                  </button>
                </div>
              `
            : hasActiveTimerElsewhere
              ? html`<span class="timer-active-elsewhere"
                  >Timer running for another task</span
                >`
              : html`
                  <button
                    class="timer-btn start"
                    @click=${this._handleStartTimer}
                    ?disabled=${!canStartTimer}
                    aria-label="Start timer"
                    title="Start timer"
                  >
                    ▶
                  </button>
                  <span class="timer-inactive">
                    Start ${this.capacityInMinutes}min timer
                  </span>
                `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-item": TaskItem;
  }
}
