/**
 * TomatoPlannerApp - Root app component that wires everything together
 * Main application component connecting all pieces with the store
 */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { plannerStore } from "../../state/planner-store.js";
import { weeklyStore } from "../../state/weekly-store.js";
import { timerStore } from "../../state/timer-store.js";
import { removeProject } from "../../state/project-coordinator.js";
import type { Task } from "../../models/task.js";
import type { Project, ProjectColor } from "../../models/project.js";
import type { TimerStatus } from "../../models/timer-state.js";
import { DEFAULT_DAILY_CAPACITY } from "../../constants/defaults.js";
import "../layout/app-shell.js";
import "../layout/app-header.js";
import "../pool/tomato-pool-panel.js";
import "../task/task-list-panel.js";
import "../task/task-editor-dialog.js";
import "../project/project-list-panel.js";
import "../shared/confirm-dialog.js";

@customElement("tomato-planner-app")
export class TomatoPlannerApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    [role="tabpanel"] {
      display: contents;
    }

    .tab-btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }

    .tab-btn:hover {
      color: #374151;
    }

    .tab-btn.active {
      color: #ef4444;
    }

    .tab-btn.active::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #ef4444;
    }

    .tab-btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }
  `;

  @state()
  private _capacity = DEFAULT_DAILY_CAPACITY;

  @state()
  private _assigned = 0;

  @state()
  private _remaining = DEFAULT_DAILY_CAPACITY;

  @state()
  private _tasks: readonly Task[] = [];

  @state()
  private _currentDate = "";

  @state()
  private _capacityInMinutes = 25;

  @state()
  private _dayStart = "08:00";

  @state()
  private _dayEnd = "18:25";

  @state()
  private _showTaskDialog = false;

  @state()
  private _editingTask: Task | undefined = undefined;

  @state()
  private _showDeleteDialog = false;

  @state()
  private _deletingTaskId: string | undefined = undefined;

  @state()
  private _panelCollapsed = false;

  @state()
  private _timerActiveTaskId: string | null = null;

  @state()
  private _timerStatus: TimerStatus = "idle";

  @state()
  private _timerRemainingSeconds = 0;

  // ============================================
  // View State
  // ============================================

  @state()
  private _activeView: "day" | "week" = "day";

  // ============================================
  // Weekly Planning State
  // ============================================

  @state()
  private _projects: readonly Project[] = [];

  @state()
  private _weeklyCapacity = 0;

  @state()
  private _weekStartDate = "";

  @state()
  private _weekEndDate = "";

  @state()
  private _totalEstimated = 0;

  @state()
  private _totalFinished = 0;

  @state()
  private _projectTaskCounts: Record<string, number> = {};

  @state()
  private _projectProgressData: Record<
    string,
    { finished: number; estimated: number }
  > = {};

  private _unsubscribe: (() => void) | null = null;
  private _timerUnsubscribe: (() => void) | null = null;
  private _weeklyUnsubscribe: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = plannerStore.subscribe((state) => {
      this._capacity = state.pool.dailyCapacity;
      this._assigned = plannerStore.assignedTomatoes;
      this._remaining = plannerStore.remainingTomatoes;
      this._tasks = state.tasks;
      this._currentDate = state.pool.date;
      this._capacityInMinutes = state.pool.capacityInMinutes;
      this._dayStart = state.pool.dayStart;
      this._dayEnd = state.pool.dayEnd;
    });

    this._timerUnsubscribe = timerStore.subscribe((state) => {
      this._timerActiveTaskId = state.activeTaskId;
      this._timerStatus = state.status;
      this._timerRemainingSeconds = state.remainingSeconds;
    });

    this._weeklyUnsubscribe = weeklyStore.subscribe((state) => {
      this._projects = state.projects;

      // Weekly capacity and dates
      this._weeklyCapacity = state.pool.weeklyCapacity;
      this._weekStartDate = state.pool.weekStartDate;
      this._weekEndDate = state.pool.weekEndDate;

      // Compute task counts per project
      const taskCounts: Record<string, number> = {};
      for (const task of state.tasks) {
        if (task.projectId) {
          taskCounts[task.projectId] = (taskCounts[task.projectId] ?? 0) + 1;
        }
      }
      this._projectTaskCounts = taskCounts;

      // Compute progress data per project (finished tomatoes vs estimated)
      const progressData: Record<
        string,
        { finished: number; estimated: number }
      > = {};
      let totalEstimated = 0;
      let totalFinished = 0;

      for (const project of state.projects) {
        // Get tasks for this project
        const projectTasks = state.tasks.filter(
          (t) => t.projectId === project.id,
        );

        // Sum finished tomatoes from tasks
        const finishedTomatoes = projectTasks.reduce(
          (sum, t) => sum + t.finishedTomatoCount,
          0,
        );

        // Use project estimate as the estimated value
        const estimatedTomatoes = project.tomatoEstimate;

        progressData[project.id] = {
          finished: finishedTomatoes,
          estimated: estimatedTomatoes,
        };

        totalEstimated += estimatedTomatoes;
        totalFinished += finishedTomatoes;
      }

      this._projectProgressData = progressData;
      this._totalEstimated = totalEstimated;
      this._totalFinished = totalFinished;
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
    if (this._timerUnsubscribe) {
      this._timerUnsubscribe();
    }
    if (this._weeklyUnsubscribe) {
      this._weeklyUnsubscribe();
    }
  }

  // ============================================
  // Pool Actions
  // ============================================

  private _handleCapacityChange(e: CustomEvent<{ capacity: number }>) {
    plannerStore.setCapacity(e.detail.capacity);
  }

  private _handleDurationChange(e: CustomEvent<{ minutes: number }>) {
    plannerStore.setCapacityInMinutes(e.detail.minutes);
  }

  private _handleDayStartChange(e: CustomEvent<{ time: string }>) {
    plannerStore.setDayStart(e.detail.time);
  }

  private _handleDayEndChange(e: CustomEvent<{ time: string }>) {
    plannerStore.setDayEnd(e.detail.time);
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
    e: CustomEvent<{
      taskId?: string;
      title: string;
      description?: string;
      projectId?: string;
    }>,
  ) {
    const { taskId, title, description, projectId } = e.detail;

    if (taskId) {
      // Edit existing task
      plannerStore.updateTask(taskId, { title, description });
      // Update project assignment
      plannerStore.setTaskProject(taskId, projectId);
    } else {
      // Create new task
      const result = plannerStore.addTask(title, description);
      // Set project assignment if a project was selected
      if (result.success && result.taskId && projectId) {
        plannerStore.setTaskProject(result.taskId, projectId);
      }
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
      // Clear timer if it's running for this task
      timerStore.clearTimerForTask(this._deletingTaskId);
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

  private _handleMarkTomatoFinished(e: CustomEvent<{ taskId: string }>) {
    plannerStore.markTomatoAsFinished(e.detail.taskId);
  }

  private _handleMarkTomatoUnfinished(e: CustomEvent<{ taskId: string }>) {
    plannerStore.markTomatoAsUnfinished(e.detail.taskId);
  }

  private _handleMarkDone(e: CustomEvent<{ taskId: string }>) {
    plannerStore.markTaskDone(e.detail.taskId);
  }

  private _handleReorderTask(
    e: CustomEvent<{ taskId: string; toIndex: number }>,
  ) {
    plannerStore.reorderTask(e.detail.taskId, e.detail.toIndex);
  }

  // ============================================
  // Day Reset
  // ============================================

  private _handleResetDay() {
    // Clear timer on day reset
    timerStore.resetTimer();
    plannerStore.resetDay();
  }

  // ============================================
  // Timer Actions
  // ============================================

  private _handleStartTimer(e: CustomEvent<{ taskId: string }>) {
    timerStore.startTimer(e.detail.taskId);
  }

  private _handlePauseTimer() {
    timerStore.pauseTimer();
  }

  private _handleResumeTimer() {
    timerStore.resumeTimer();
  }

  private _handleResetTimer() {
    timerStore.resetTimer();
  }

  // ============================================
  // Panel Collapse
  // ============================================

  private _handleTogglePanelCollapse() {
    this._panelCollapsed = !this._panelCollapsed;
  }

  // ============================================
  // View Toggle
  // ============================================

  private _handleSwitchToDayView() {
    this._activeView = "day";
  }

  private _handleSwitchToWeekView() {
    this._activeView = "week";
    // Auto-expand panel when switching to Week view to avoid stuck collapsed state
    this._panelCollapsed = false;
  }

  // ============================================
  // Weekly Project Actions
  // ============================================

  private _handleSaveProject(
    e: CustomEvent<{
      projectId?: string;
      title: string;
      description?: string;
      tomatoEstimate: number;
      color: string;
    }>,
  ) {
    const { projectId, title, description, tomatoEstimate, color } = e.detail;

    // Cast color to ProjectColor type (dialog emits valid colors)
    const projectColor = color as ProjectColor;

    if (projectId) {
      // Edit existing project
      weeklyStore.updateProject(projectId, {
        title,
        description,
        tomatoEstimate,
        color: projectColor,
      });
    } else {
      // Create new project
      weeklyStore.addProject(title, description, tomatoEstimate, projectColor);
    }
  }

  private _handleDeleteProject(e: CustomEvent<{ projectId: string }>) {
    // Use coordinator to properly delete project and unassign tasks
    removeProject(e.detail.projectId);
  }

  private _handleSelectProject(_e: CustomEvent<{ projectId: string }>) {
    // Switch to Day view when a project is selected
    this._activeView = "day";
  }

  override render() {
    const isEdit = !!this._editingTask;
    const deleteTask = this._deletingTaskId
      ? this._tasks.find((t) => t.id === this._deletingTaskId)
      : undefined;

    return html`
      <app-shell ?left-panel-collapsed=${this._panelCollapsed}>
        <div slot="tabs" role="tablist">
          <button
            class="tab-btn ${this._activeView === "day" ? "active" : ""}"
            role="tab"
            aria-selected=${this._activeView === "day"}
            aria-controls="day-view"
            @click=${this._handleSwitchToDayView}
          >
            Day
          </button>
          <button
            class="tab-btn ${this._activeView === "week" ? "active" : ""}"
            role="tab"
            aria-selected=${this._activeView === "week"}
            aria-controls="week-view"
            @click=${this._handleSwitchToWeekView}
          >
            Week
          </button>
        </div>

        <app-header
          slot="header"
          .currentDate=${this._currentDate}
          .dayStart=${this._dayStart}
          .dayEnd=${this._dayEnd}
          .capacityInMinutes=${this._capacityInMinutes}
          .dailyCapacity=${this._capacity}
          .showReset=${true}
          @reset-day=${this._handleResetDay}
        ></app-header>

        ${this._activeView === "day"
          ? html`
              <div id="day-view" role="tabpanel" slot="pool-panel">
                <tomato-pool-panel
                  .capacity=${this._capacity}
                  .assigned=${this._assigned}
                  .remaining=${this._remaining}
                  .taskCount=${this._tasks.length}
                  .capacityInMinutes=${this._capacityInMinutes}
                  .dayStart=${this._dayStart}
                  .dayEnd=${this._dayEnd}
                  .collapsed=${this._panelCollapsed}
                  @capacity-change=${this._handleCapacityChange}
                  @duration-change=${this._handleDurationChange}
                  @day-start-change=${this._handleDayStartChange}
                  @day-end-change=${this._handleDayEndChange}
                  @toggle-collapse=${this._handleTogglePanelCollapse}
                ></tomato-pool-panel>
              </div>
            `
          : html`
              <div id="week-view" role="tabpanel" slot="pool-panel">
                <project-list-panel
                  .projects=${this._projects}
                  .weeklyCapacity=${this._weeklyCapacity}
                  .weekStartDate=${this._weekStartDate}
                  .weekEndDate=${this._weekEndDate}
                  .totalEstimated=${this._totalEstimated}
                  .totalFinished=${this._totalFinished}
                  .taskCounts=${this._projectTaskCounts}
                  .progressData=${this._projectProgressData}
                  @save-project=${this._handleSaveProject}
                  @delete-project=${this._handleDeleteProject}
                  @select-project=${this._handleSelectProject}
                ></project-list-panel>
              </div>
            `}

        <task-list-panel
          slot="task-panel"
          .tasks=${this._tasks}
          .remaining=${this._remaining}
          .assigned=${this._assigned}
          .capacityInMinutes=${this._capacityInMinutes}
          .disabled=${false}
          .timerActiveTaskId=${this._timerActiveTaskId}
          .timerStatus=${this._timerStatus}
          .timerRemainingSeconds=${this._timerRemainingSeconds}
          @open-task-dialog=${this._handleOpenTaskDialog}
          @edit-task=${this._handleEditTask}
          @delete-task=${this._handleDeleteTask}
          @add-tomato=${this._handleAddTomato}
          @remove-tomato=${this._handleRemoveTomato}
          @mark-tomato-finished=${this._handleMarkTomatoFinished}
          @mark-tomato-unfinished=${this._handleMarkTomatoUnfinished}
          @reorder-task=${this._handleReorderTask}
          @start-timer=${this._handleStartTimer}
          @pause-timer=${this._handlePauseTimer}
          @resume-timer=${this._handleResumeTimer}
          @reset-timer=${this._handleResetTimer}
          @mark-done=${this._handleMarkDone}
        ></task-list-panel>
      </app-shell>

      <!-- Task Editor Dialog -->
      <task-editor-dialog
        .open=${this._showTaskDialog}
        .task=${this._editingTask}
        .projects=${this._projects}
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
