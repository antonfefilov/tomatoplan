/**
 * TaskList - List container for tasks with empty state handling
 * Renders a list of task items
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import "./task-item.js";
import "../shared/empty-state.js";

@customElement("task-list")
export class TaskList extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-container {
      padding: 24px;
    }
  `;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Number })
  remaining = 0;

  @property({ type: Boolean })
  disabled = false;

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
    if (this.tasks.length === 0) {
      return html`
        <div class="empty-container">
          <empty-state
            icon="📋"
            title="No tasks yet"
            description="Add your first task to start planning your day"
          ></empty-state>
        </div>
      `;
    }

    return html`
      <div class="task-list">
        ${this.tasks.map(
          (task) => html`
            <task-item
              .task=${task}
              .remaining=${this.remaining}
              .disabled=${this.disabled}
              @edit-task=${this._handleEditTask}
              @delete-task=${this._handleDeleteTask}
              @add-tomato=${this._handleAddTomato}
              @remove-tomato=${this._handleRemoveTomato}
            ></task-item>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-list": TaskList;
  }
}
