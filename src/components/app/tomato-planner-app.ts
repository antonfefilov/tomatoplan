/**
 * TomatoPlannerApp - Root app component that wires everything together
 * Main application component connecting all pieces with the store
 */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { plannerStore } from "../../state/planner-store.js";
import type { Task } from "../../models/task.js";
import "../layout/app-shell.js";
import "../layout/app-header.js";
import "../pool/tomato-pool-panel.js";
import "../task/task-list-panel.js";
import "../task/task-editor-dialog.js";
import "../shared/confirm-dialog.js";

@customElement("tomato-planner-app")
export class TomatoPlannerApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100vh;
    }
  `;

  @state()
  private _capacity = 8;

  @state()
  private _assigned = 0;

  @state()
  private _remaining = 8;

  @state()
  private _tasks: readonly Task[] = [];

  @state()
  private _currentDate = "";

  @state()
  private _capacityInMinutes = 25;

  @state()
  private _showTaskDialog = false;

  @state()
  private _editingTask: Task | undefined = undefined;

  @state()
  private _showDeleteDialog = false;

  @state()
  private _deletingTaskId: string | undefined = undefined;

  private _unsubscribe: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = plannerStore.subscribe((state) => {
      this._capacity = state.pool.dailyCapacity;
      this._assigned = plannerStore.assignedTomatoes;
      this._remaining = plannerStore.remainingTomatoes;
      this._tasks = state.tasks;
      this._currentDate = state.pool.date;
      this._capacityInMinutes = state.pool.capacityInMinutes;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  // ============================================
  // Pool Actions
  // ============================================

  private _handleCapacityChange(e: CustomEvent<{ capacity: number }>) {
    plannerStore.setCapacity(e.detail.capacity);
  }

  // ============================================
  // Task Actions
  // ============================================

  private _handleOpenTaskDialog() {
    this._editingTask = undefined;
    this._showTaskDialog = true;
  }

  private _handleEditTask(e: CustomEvent<{ taskId: string }>) {
    const task = plannerStore.getTaskById(e.detail.taskId);
    if (task) {
      this._editingTask = task;
      this._showTaskDialog = true;
    }
  }

  private _handleSaveTask(
    e: CustomEvent<{ taskId?: string; title: string; description?: string }>,
  ) {
    const { taskId, title, description } = e.detail;

    if (taskId) {
      // Edit existing task
      plannerStore.updateTask(taskId, { title, description });
    } else {
      // Create new task
      plannerStore.addTask(title, description);
    }

    this._closeTaskDialog();
  }

  private _closeTaskDialog() {
    this._showTaskDialog = false;
    this._editingTask = undefined;
  }

  private _handleDeleteTask(e: CustomEvent<{ taskId: string }>) {
    this._deletingTaskId = e.detail.taskId;
    this._showDeleteDialog = true;
  }

  private _handleConfirmDelete() {
    if (this._deletingTaskId) {
      plannerStore.removeTask(this._deletingTaskId);
    }
    this._closeDeleteDialog();
  }

  private _closeDeleteDialog() {
    this._showDeleteDialog = false;
    this._deletingTaskId = undefined;
  }

  // ============================================
  // Tomato Assignment Actions
  // ============================================

  private _handleAddTomato(e: CustomEvent<{ taskId: string }>) {
    plannerStore.assignTomato(e.detail.taskId);
  }

  private _handleRemoveTomato(e: CustomEvent<{ taskId: string }>) {
    plannerStore.unassignTomato(e.detail.taskId);
  }

  // ============================================
  // Day Reset
  // ============================================

  private _handleResetDay() {
    plannerStore.resetDay();
  }

  override render() {
    const isEdit = !!this._editingTask;
    const deleteTask = this._deletingTaskId
      ? this._tasks.find((t) => t.id === this._deletingTaskId)
      : undefined;

    return html`
      <app-shell>
        <app-header
          slot="header"
          .currentDate=${this._currentDate}
          .showReset=${true}
          @reset-day=${this._handleResetDay}
        ></app-header>

        <tomato-pool-panel
          slot="pool-panel"
          .capacity=${this._capacity}
          .assigned=${this._assigned}
          .remaining=${this._remaining}
          .taskCount=${this._tasks.length}
          .capacityInMinutes=${this._capacityInMinutes}
          @capacity-change=${this._handleCapacityChange}
        ></tomato-pool-panel>

        <task-list-panel
          slot="task-panel"
          .tasks=${this._tasks}
          .remaining=${this._remaining}
          .assigned=${this._assigned}
          .capacityInMinutes=${this._capacityInMinutes}
          .disabled=${false}
          @open-task-dialog=${this._handleOpenTaskDialog}
          @edit-task=${this._handleEditTask}
          @delete-task=${this._handleDeleteTask}
          @add-tomato=${this._handleAddTomato}
          @remove-tomato=${this._handleRemoveTomato}
        ></task-list-panel>
      </app-shell>

      <!-- Task Editor Dialog -->
      <task-editor-dialog
        .open=${this._showTaskDialog}
        .task=${this._editingTask}
        .isEdit=${isEdit}
        @save=${this._handleSaveTask}
        @cancel=${this._closeTaskDialog}
      ></task-editor-dialog>

      <!-- Delete Confirmation Dialog -->
      <confirm-dialog
        .open=${this._showDeleteDialog}
        title="Delete Task"
        .message=${deleteTask
          ? `Are you sure you want to delete "${deleteTask.title}"? This will also remove ${deleteTask.tomatoCount} assigned tomatoes.`
          : "Are you sure you want to delete this task?"}
        confirmText="Delete"
        @confirm=${this._handleConfirmDelete}
        @cancel=${this._closeDeleteDialog}
      ></confirm-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tomato-planner-app": TomatoPlannerApp;
  }
}
