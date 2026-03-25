/**
 * TaskItem - Individual task with title, description preview, tomato count, and controls
 * A single task card component
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
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

  private _truncateDescription(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }

  override render() {
    const { task, remaining, disabled } = this;

    return html`
      <div class="task-card">
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
          <h3 class="task-title">${task.title}</h3>
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
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-item": TaskItem;
  }
}
