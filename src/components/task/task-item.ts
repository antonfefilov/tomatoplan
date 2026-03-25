/**
 * TaskItem - Individual task with title, description preview, tomato count, and controls
 * A single task card component
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import "../tomato/tomato-icon.js";
import "../tomato/tomato-assignment-control.js";
import "../shared/icon-button.js";

// Icons as SVG strings
const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>`;
const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" /></svg>`;

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
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
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

    .task-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .task-description {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 12px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .tomato-count-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #fef2f2;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      color: #ef4444;
    }

    .no-description {
      font-style: italic;
      color: #9ca3af;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #9ca3af;
    }
  `;

  @property({ type: Object })
  task!: Task;

  @property({ type: Number })
  remaining = 0;

  @property({ type: Boolean })
  disabled = false;

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

  private _handleAddTomato() {
    this.dispatchEvent(
      new CustomEvent("add-tomato", {
        bubbles: true,
        composed: true,
        detail: { taskId: this.task.id },
      }),
    );
  }

  private _handleRemoveTomato() {
    this.dispatchEvent(
      new CustomEvent("remove-tomato", {
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

  override render() {
    const { task, remaining, disabled } = this;

    return html`
      <div class="task-card">
        <div class="task-header">
          <h3 class="task-title">${task.title}</h3>
          <div class="task-actions">
            <icon-button label="Edit task" @icon-click=${this._handleEdit}>
              ${editIcon}
            </icon-button>
            <icon-button label="Delete task" @icon-click=${this._handleDelete}>
              ${deleteIcon}
            </icon-button>
          </div>
        </div>

        ${task.description
          ? html`<p class="task-description">
              ${this._truncateDescription(task.description)}
            </p>`
          : null}

        <div class="task-footer">
          <div class="tomato-count-badge">
            <tomato-icon size="16"></tomato-icon>
            <span>${task.tomatoCount}</span>
          </div>
          <tomato-assignment-control
            .count=${task.tomatoCount}
            .remaining=${remaining}
            .disabled=${disabled}
            @add-tomato=${this._handleAddTomato}
            @remove-tomato=${this._handleRemoveTomato}
          ></tomato-assignment-control>
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
