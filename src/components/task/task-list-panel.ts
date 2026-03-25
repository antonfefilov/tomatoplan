/**
 * TaskListPanel - Right panel container with add button
 * Main task management panel with header and add task functionality
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import "./task-list.js";
import "./task-editor-dialog.js";
import "../shared/confirm-dialog.js";
import "../shared/empty-state.js";

@customElement("task-list-panel")
export class TaskListPanel extends LitElement {
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
      padding: 16px 20px;
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

    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
  `;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Number })
  remaining = 0;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Object })
  editingTask?: Task;

  @property({ type: String })
  deletingTaskId?: string;

  @property({ type: Boolean })
  showTaskDialog = false;

  @property({ type: Boolean })
  showDeleteDialog = false;

  private _handleAddTask() {
    this.dispatchEvent(
      new CustomEvent("open-task-dialog", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleEditTask(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("edit-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleDeleteTask(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("delete-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleAddTomato(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("add-tomato", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleRemoveTomato(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("remove-tomato", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  override render() {
    const taskCount = this.tasks.length;

    return html`
      <div class="panel-header">
        <div>
          <span class="header-title">Tasks</span>
          ${taskCount > 0
            ? html`<span class="header-count">${taskCount} tasks</span>`
            : null}
        </div>
        <button class="add-btn" @click=${this._handleAddTask}>
          <span>+</span>
          <span>Add Task</span>
        </button>
      </div>

      <div class="panel-content">
        ${taskCount === 0
          ? html`
              <div class="empty-container">
                <div class="empty-icon">📝</div>
                <h3 class="empty-title">No tasks yet</h3>
                <p class="empty-description">
                  Add your first task to start planning your day with tomato
                  assignments.
                </p>
                <button class="add-btn" @click=${this._handleAddTask}>
                  <span>+</span>
                  <span>Add Your First Task</span>
                </button>
              </div>
            `
          : html`
              <task-list
                .tasks=${this.tasks}
                .remaining=${this.remaining}
                .disabled=${this.disabled}
                @edit-task=${this._handleEditTask}
                @delete-task=${this._handleDeleteTask}
                @add-tomato=${this._handleAddTomato}
                @remove-tomato=${this._handleRemoveTomato}
              ></task-list>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-list-panel": TaskListPanel;
  }
}
