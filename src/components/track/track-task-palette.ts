/**
 * TrackTaskPalette - Available tasks for track
 * Shows tasks that can be added to the track and tasks already in the track
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Track } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import { isTaskDone } from "../../models/task.js";
import "../shared/empty-state.js";

@customElement("track-task-palette")
export class TrackTaskPalette extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .palette-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .palette-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .palette-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .palette-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .section {
      margin-bottom: 20px;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 12px 0;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .task-item:hover {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .task-item.in-track {
      background: #ecfdf5;
      border-color: #10b981;
    }

    .task-item.in-track:hover {
      border-color: #059669;
      background: #d1fae5;
    }

    .task-item.done {
      opacity: 0.6;
    }

    .task-info {
      flex: 1;
      min-width: 0;
    }

    .task-title {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-meta {
      font-size: 11px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .task-tomatoes {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .tomato-icon {
      width: 12px;
      height: 12px;
      fill: #ef4444;
    }

    .action-btn {
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

    .action-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .action-btn.remove:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    .empty-text {
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
      padding: 12px;
    }
  `;

  @property({ type: Object })
  track?: Track;

  @property({ type: Array })
  trackTasks: readonly Task[] = [];

  @property({ type: Array })
  availableTasks: readonly Task[] = [];

  private _handleAddTask(taskId: string) {
    this.dispatchEvent(
      new CustomEvent("add-task-to-track", {
        bubbles: true,
        composed: true,
        detail: { taskId },
      }),
    );
  }

  private _handleRemoveTask(taskId: string) {
    this.dispatchEvent(
      new CustomEvent("remove-task-from-track", {
        bubbles: true,
        composed: true,
        detail: { taskId },
      }),
    );
  }

  private _renderTaskItem(task: Task, isInTrack: boolean) {
    const isDone = isTaskDone(task);

    return html`
      <div
        class="task-item ${isInTrack ? "in-track" : ""} ${isDone ? "done" : ""}"
        @click=${isInTrack ? undefined : () => this._handleAddTask(task.id)}
      >
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            <div class="task-tomatoes">
              <svg class="tomato-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="14" r="8" />
                <path
                  d="M12 2C12 2 14 4 14 6C14 6 12 5 12 5C12 5 10 6 10 6C10 4 12 2 12 2Z"
                  fill="#22c55e"
                />
              </svg>
              <span>${task.tomatoCount}</span>
            </div>
            ${task.projectId
              ? html`<span class="task-project-badge">project</span>`
              : null}
          </div>
        </div>
        ${isInTrack
          ? html`
              <button
                class="action-btn remove"
                title="Remove from track"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._handleRemoveTask(task.id);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            `
          : html`
              <button
                class="action-btn"
                title="Add to track"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._handleAddTask(task.id);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            `}
      </div>
    `;
  }

  override render() {
    // Separate tasks into "in track" and "available"
    const tasksInTrack = this.trackTasks;
    const tasksNotInTrack = this.availableTasks.filter(
      (t) => !this.track?.taskIds.includes(t.id) && !isTaskDone(t),
    );

    return html`
      <div class="palette-container">
        <div class="palette-header">
          <h3 class="palette-title">Tasks</h3>
        </div>

        <div class="palette-content">
          ${tasksInTrack.length > 0
            ? html`
                <div class="section">
                  <h4 class="section-title">
                    In Track (${tasksInTrack.length})
                  </h4>
                  <div class="task-list">
                    ${tasksInTrack.map((task) =>
                      this._renderTaskItem(task, true),
                    )}
                  </div>
                </div>
              `
            : null}
          ${tasksNotInTrack.length > 0
            ? html`
                <div class="section">
                  <h4 class="section-title">
                    Available (${tasksNotInTrack.length})
                  </h4>
                  <div class="task-list">
                    ${tasksNotInTrack.map((task) =>
                      this._renderTaskItem(task, false),
                    )}
                  </div>
                </div>
              `
            : tasksInTrack.length === 0
              ? html`
                  <div class="empty-text">
                    No tasks available. Create tasks in the Day view first.
                  </div>
                `
              : html` <div class="empty-text">No tasks available to add</div> `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-task-palette": TrackTaskPalette;
  }
}
