/**
 * TaskList - List container for tasks with empty state handling
 * Renders a list of task items with drag-and-drop reordering support
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import type { TimerStatus } from "../../models/timer-state.js";
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

    .task-item-wrapper {
      position: relative;
    }

    .task-item-wrapper.dragging {
      opacity: 0.5;
    }

    .task-item-wrapper.drag-over {
      position: relative;
    }

    .task-item-wrapper.drag-over::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: -6px;
      height: 3px;
      background: #ef4444;
      border-radius: 2px;
    }

    .task-item-wrapper.drag-over-bottom::before {
      top: auto;
      bottom: -6px;
    }
  `;

  @property({ type: Array })
  tasks: readonly Task[] = [];

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

  @state()
  private _draggedTaskId: string | null = null;

  @state()
  private _dragOverTaskId: string | null = null;

  @state()
  private _dropPosition: "above" | "below" = "above";

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

  // ============================================
  // Drag and Drop Handlers
  // ============================================

  private _handleDragStart(e: DragEvent, taskId: string) {
    // Prevent drag when disabled
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    this._draggedTaskId = taskId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", taskId);
    }
  }

  private _handleDragEnd() {
    this._draggedTaskId = null;
    this._dragOverTaskId = null;
  }

  private _handleDragOver(e: DragEvent, taskId: string) {
    // Prevent drop when disabled
    if (this.disabled) {
      return;
    }

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    if (taskId !== this._draggedTaskId) {
      // Determine drop position based on mouse Y position relative to element center
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      this._dropPosition = e.clientY < midY ? "above" : "below";
      this._dragOverTaskId = taskId;
    }
  }

  private _handleDragLeave(e: DragEvent) {
    // Only clear drag-over state when actually leaving the wrapper element,
    // not when entering a child element (which also triggers dragleave)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;

    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      // Still within the wrapper, don't clear
      return;
    }

    this._dragOverTaskId = null;
  }

  private _handleDrop(e: DragEvent, targetTaskId: string) {
    e.preventDefault();

    // Prevent drop when disabled
    if (this.disabled) {
      this._draggedTaskId = null;
      this._dragOverTaskId = null;
      return;
    }

    if (!this._draggedTaskId || this._draggedTaskId === targetTaskId) {
      this._draggedTaskId = null;
      this._dragOverTaskId = null;
      return;
    }

    // Calculate the target index
    const targetIndex = this.tasks.findIndex((t) => t.id === targetTaskId);
    const draggedIndex = this.tasks.findIndex(
      (t) => t.id === this._draggedTaskId,
    );

    if (targetIndex === -1 || draggedIndex === -1) {
      this._draggedTaskId = null;
      this._dragOverTaskId = null;
      return;
    }

    // Adjust target index based on drop position
    let toIndex = targetIndex;
    if (this._dropPosition === "below") {
      toIndex = targetIndex + 1;
    }
    // If dragging down, we need to account for the removed element
    if (draggedIndex < toIndex) {
      toIndex -= 1;
    }

    // Dispatch reorder event
    this.dispatchEvent(
      new CustomEvent("reorder-task", {
        bubbles: true,
        composed: true,
        detail: { taskId: this._draggedTaskId, toIndex },
      }),
    );

    this._draggedTaskId = null;
    this._dragOverTaskId = null;
  }

  private _getDragClasses(taskId: string): string {
    const classes: string[] = ["task-item-wrapper"];
    if (taskId === this._draggedTaskId) {
      classes.push("dragging");
    }
    if (taskId === this._dragOverTaskId) {
      classes.push("drag-over");
      if (this._dropPosition === "below") {
        classes.push("drag-over-bottom");
      }
    }
    return classes.join(" ");
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
            <div
              class=${this._getDragClasses(task.id)}
              draggable=${!this.disabled}
              @dragstart=${(e: DragEvent) => this._handleDragStart(e, task.id)}
              @dragend=${this._handleDragEnd}
              @dragover=${(e: DragEvent) => this._handleDragOver(e, task.id)}
              @dragleave=${this._handleDragLeave}
              @drop=${(e: DragEvent) => this._handleDrop(e, task.id)}
            >
              <task-item
                .task=${task}
                .remaining=${this.remaining}
                .disabled=${this.disabled}
                .capacityInMinutes=${this.capacityInMinutes}
                .timerActiveTaskId=${this.timerActiveTaskId}
                .timerStatus=${this.timerStatus}
                .timerRemainingSeconds=${this.timerRemainingSeconds}
                @edit-task=${this._handleEditTask}
                @delete-task=${this._handleDeleteTask}
                @mark-tomato-finished=${this._handleMarkTomatoFinished}
                @mark-tomato-unfinished=${this._handleMarkTomatoUnfinished}
                @start-timer=${this._handleStartTimer}
                @pause-timer=${this._handlePauseTimer}
                @resume-timer=${this._handleResumeTimer}
                @reset-timer=${this._handleResetTimer}
              ></task-item>
            </div>
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
