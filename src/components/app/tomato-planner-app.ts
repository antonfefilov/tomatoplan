/**
 * TomatoPlannerApp - Root app component that wires everything together
 * Main application component connecting all pieces with the store
 */

import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { DEFAULT_DAILY_CAPACITY } from "../../constants/defaults.js";
import type { Project, ProjectColor } from "../../models/project.js";
import {
  getOverallProjectMetrics,
  getProjectProgressMap,
  getProjectTaskCounts,
} from "../../models/project-analytics.js";
import type { Task } from "../../models/task.js";
import { isTaskDone } from "../../models/task.js";
import type { TimerStatus } from "../../models/timer-state.js";
import type { TomatoTimeSlot } from "../../models/tomato-pool.js";
import type { Track } from "../../models/track.js";
import { plannerStore } from "../../state/planner-store.js";
import { removeProject } from "../../state/project-coordinator.js";
import { taskpoolStore } from "../../state/taskpool-store.js";
import { timerStore } from "../../state/timer-store.js";
import { weeklyStore } from "../../state/weekly-store.js";
import "../layout/app-shell.js";
import "../layout/app-header.js";
import type { HeaderModel } from "../layout/app-header.types.js";
import "../pool/tomato-pool-panel.js";
import "../pool/week-tomato-pool-panel.js";
import "../task/task-list-panel.js";
import "../task/task-editor-dialog.js";
import "../task/tasks-pool-panel.js";
import "../task/tasks-view-panel.js";
import type { TasksFilter } from "../task/tasks-pool-panel.js";
import "../project/project-list-panel.js";
import "../project/projects-analytics-panel.js";
import "../track/track-list-panel.js";
import "../track/track-builder-panel.js";
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
  private _timeSlots: TomatoTimeSlot[] = [];

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
  private _activeView: "day" | "week" | "projects" | "tasks" | "tracks" = "day";

  // ============================================
  // Tasks View Filter State
  // ============================================

  @state()
  private _tasksStatusFilter: TasksFilter = "all";

  @state()
  private _tasksProjectFilter: string = "all";

  // ============================================
  // Weekly Planning State
  // ============================================

  @state()
  private _weeklyTasks: readonly Task[] = [];

  @state()
  private _projects: readonly Project[] = [];

  @state()
  private _tracks: readonly Track[] = [];

  @state()
  private _selectedTrackId: string | undefined = undefined;

  @state()
  private _weeklyCapacity = 0;

  @state()
  private _weekStartDate = "";

  @state()
  private _weekEndDate = "";

  @state()
  private _capacityInMinutesWeekly = 25;

  @state()
  private _projectTaskCounts: Record<string, number> = {};

  @state()
  private _projectProgressData: Record<
    string,
    { finished: number; estimated: number }
  > = {};

  @state()
  private _overallMetrics = {
    totalPlanned: 0,
    totalFinished: 0,
    projectCount: 0,
    activeProjectCount: 0,
    completedProjectCount: 0,
    archivedProjectCount: 0,
    remainingCapacity: 0,
    weeklyCapacity: 0,
  };

  @state()
  private _defaultProjectIdForNewTask: string | undefined = undefined;

  @state()
  private _taskDialogError: string | undefined = undefined;

  @state()
  private _slotErrors: Record<string, string[]> = {};

  private _unsubscribe: (() => void) | null = null;
  private _timerUnsubscribe: (() => void) | null = null;
  private _weeklyUnsubscribe: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = plannerStore.subscribe((state) => {
      this._capacity = state.pool.dailyCapacity;
      this._assigned = plannerStore.assignedTomatoes;
      this._remaining = plannerStore.remainingTomatoes;
      this._tasks = plannerStore.tasks;
      this._currentDate = state.pool.date;
      this._capacityInMinutes = state.pool.capacityInMinutes;
      this._timeSlots = state.pool.timeSlots;
    });

    this._timerUnsubscribe = timerStore.subscribe((state) => {
      this._timerActiveTaskId = state.activeTaskId;
      this._timerStatus = state.status;
      this._timerRemainingSeconds = state.remainingSeconds;
    });

    this._weeklyUnsubscribe = weeklyStore.subscribe((state) => {
      this._projects = state.projects;
      this._tracks = state.tracks;
      // Tasks are derived from taskpoolStore (the canonical task store)
      this._weeklyTasks = weeklyStore.tasks;

      // Weekly capacity and dates
      this._weeklyCapacity = state.pool.weeklyCapacity;
      this._weekStartDate = state.pool.weekStartDate;
      this._weekEndDate = state.pool.weekEndDate;
      this._capacityInMinutesWeekly = state.pool.capacityInMinutes;

      // Compute analytics using extracted functions
      // Tasks come from weeklyStore.tasks which is derived from taskpoolStore
      this._projectTaskCounts = getProjectTaskCounts(
        weeklyStore.tasks,
        state.projects,
      );
      this._projectProgressData = getProjectProgressMap(
        weeklyStore.tasks,
        state.projects,
      );
      this._overallMetrics = getOverallProjectMetrics(state);
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

  // ============================================
  // Time Slot Actions
  // ============================================

  private _handleAddSlot(
    e: CustomEvent<{
      startTime: string;
      endTime: string;
      label?: string;
    }>,
  ) {
    const result = plannerStore.addTimeSlot({
      startTime: e.detail.startTime,
      endTime: e.detail.endTime,
      label: e.detail.label,
    });

    if (!result.success) {
      // For add errors, we don't have a slotId, so use a temporary key
      // The user will see the error and can adjust their input
      // We'll clear this on next successful action
      this._slotErrors = {
        ...this._slotErrors,
        _new: [result.error ?? "Failed to add slot"],
      };
    } else {
      // Clear any "new slot" errors on success
      if (this._slotErrors._new) {
        const { _new: _, ...rest } = this._slotErrors;
        this._slotErrors = rest;
      }
    }
  }

  private _handleUpdateSlot(
    e: CustomEvent<{
      slotId: string;
      updates: Partial<TomatoTimeSlot>;
    }>,
  ) {
    const result = plannerStore.updateTimeSlot(
      e.detail.slotId,
      e.detail.updates,
    );

    if (!result.success) {
      // Set error for this specific slot
      this._slotErrors = {
        ...this._slotErrors,
        [e.detail.slotId]: [result.error ?? "Failed to update slot"],
      };
    } else {
      // Clear error for this slot on success
      if (this._slotErrors[e.detail.slotId]) {
        const { [e.detail.slotId]: _, ...rest } = this._slotErrors;
        this._slotErrors = rest;
      }
    }
  }

  private _handleRemoveSlot(e: CustomEvent<{ slotId: string }>) {
    const result = plannerStore.removeTimeSlot(e.detail.slotId);

    if (!result.success) {
      // Set error for this specific slot
      this._slotErrors = {
        ...this._slotErrors,
        [e.detail.slotId]: [result.error ?? "Failed to remove slot"],
      };
    } else {
      // Clear error for this slot on success
      if (this._slotErrors[e.detail.slotId]) {
        const { [e.detail.slotId]: _, ...rest } = this._slotErrors;
        this._slotErrors = rest;
      }
    }
  }

  // ============================================
  // Week Capacity Actions
  // ============================================

  private _handleWeeklyCapacityChange(e: CustomEvent<{ capacity: number }>) {
    weeklyStore.setWeeklyCapacity(e.detail.capacity);
  }

  // ============================================
  // Task Actions
  // ============================================

  private _handleOpenTaskDialog() {
    this._editingTask = undefined;
    this._taskDialogError = undefined;
    this._showTaskDialog = true;
  }

  private _handleEditTask(e: CustomEvent<{ taskId: string }>) {
    const task =
      plannerStore.getTaskById(e.detail.taskId) ??
      weeklyStore.getTaskById(e.detail.taskId);
    if (task) {
      this._editingTask = task;
      this._taskDialogError = undefined;
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
      // First check if task exists in either store
      // plannerStore.getTaskById finds tasks assigned to today
      // weeklyStore.getTaskById finds any task in taskpoolStore
      const plannerTask = plannerStore.getTaskById(taskId);
      const weeklyTask = weeklyStore.getTaskById(taskId);

      if (!plannerTask && !weeklyTask) {
        // Task not found in either store - show error and keep dialog open
        this._taskDialogError = "Task not found. It may have been deleted.";
        return;
      }

      // ATOMIC UPDATE: Validate project assignment BEFORE applying any updates
      // This ensures that if project validation fails, no other fields are mutated
      // Use weeklyStore.assignTaskToProject for validation (checks project exists and is active)
      if (projectId !== undefined) {
        if (projectId) {
          // Assigning to a project - validate first
          const projectResult = weeklyStore.assignTaskToProject(
            taskId,
            projectId,
          );
          if (!projectResult.success) {
            this._taskDialogError =
              projectResult.error ?? "Failed to set project";
            return;
          }
        } else {
          // Unassigning from project - no validation needed, just unassign
          const projectResult = taskpoolStore.unassignTaskFromProject(taskId);
          if (!projectResult.success) {
            this._taskDialogError =
              projectResult.error ?? "Failed to remove project";
            return;
          }
        }
      }

      // Now apply the title/description updates via taskpoolStore
      // (both plannerStore and weeklyStore ultimately use taskpoolStore)
      const updateResult = taskpoolStore.updateTask(taskId, {
        title,
        description,
      });
      if (!updateResult.success) {
        this._taskDialogError = updateResult.error ?? "Failed to update task";
        return;
      }
    } else {
      // Create new task
      // Use taskpoolStore directly for creation to control day assignment
      // When creating from Day view, assign to today; otherwise create unscheduled
      const result =
        this._activeView === "day"
          ? plannerStore.addTask(title, description) // Assigns to today
          : taskpoolStore.addTask(title, description); // Creates without dayDate

      if (!result.success) {
        this._taskDialogError = result.error ?? "Failed to create task";
        return;
      }

      if (result.success && result.taskId) {
        // Set project assignment if a project was selected
        if (projectId) {
          const projectResult = taskpoolStore.setTaskProject(
            result.taskId,
            projectId,
          );
          if (!projectResult.success) {
            this._taskDialogError =
              projectResult.error ?? "Failed to set project";
            return;
          }
        }
      }
    }

    this._closeTaskDialog();
  }

  private _closeTaskDialog() {
    this._showTaskDialog = false;
    this._editingTask = undefined;
    this._defaultProjectIdForNewTask = undefined;
    this._taskDialogError = undefined;
  }

  private _handleDeleteTask(e: CustomEvent<{ taskId: string }>) {
    this._deletingTaskId = e.detail.taskId;
    this._showDeleteDialog = true;
  }

  private _handleConfirmDelete() {
    if (this._deletingTaskId) {
      // Clear timer if it's running for this task
      timerStore.clearTimerForTask(this._deletingTaskId);
      // Always use weeklyStore.removeTask to ensure proper cleanup including track references
      weeklyStore.removeTask(this._deletingTaskId);
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

  private _handleAssignToToday(e: CustomEvent<{ taskId: string }>) {
    plannerStore.assignTaskToToday(e.detail.taskId);
  }

  private _handleRemoveFromDay(e: CustomEvent<{ taskId: string }>) {
    plannerStore.unassignTaskFromDay(e.detail.taskId);
  }

  private _handleReorderTask(
    e: CustomEvent<{ taskId: string; toIndex: number }>,
  ) {
    plannerStore.reorderTask(e.detail.taskId, e.detail.toIndex);
  }

  private _handleAddProjectTask(e: CustomEvent<{ projectId: string }>) {
    this._defaultProjectIdForNewTask = e.detail.projectId;
    this._editingTask = undefined;
    this._showTaskDialog = true;
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
  }

  private _handleSwitchToProjectsView() {
    this._activeView = "projects";
  }

  private _handleSwitchToTracksView() {
    this._activeView = "tracks";
  }

  private _handleSwitchToTasksView() {
    this._activeView = "tasks";
  }

  // ============================================
  // Tasks View Filter Actions
  // ============================================

  private _handleTasksStatusFilterChange(
    e: CustomEvent<{ filter: TasksFilter }>,
  ) {
    this._tasksStatusFilter = e.detail.filter;
  }

  private _handleTasksProjectFilterChange(
    e: CustomEvent<{ projectId: string }>,
  ) {
    this._tasksProjectFilter = e.detail.projectId;
  }

  /**
   * Combines tasks from both daily and weekly stores
   */
  private _getAllTasks(): Task[] {
    // Combine tasks from both stores
    // Daily tasks are from plannerStore, weekly tasks are from weeklyStore
    const allTasks = [...this._tasks, ...this._weeklyTasks];
    // Remove duplicates by ID (tasks might be in both stores)
    const uniqueTasks = allTasks.filter(
      (task, index, self) => index === self.findIndex((t) => t.id === task.id),
    );
    return uniqueTasks;
  }

  // ============================================
  // Track Actions
  // ============================================

  /**
   * Gets all tasks from the main task pool for track building.
   * This is separate from _getAllTasks() which combines daily + weekly stores,
   * because taskpoolStore.getAllTasks() is the canonical source for ALL tasks.
   */
  private _getAllTasksForTracks(): readonly Task[] {
    return taskpoolStore.getAllTasks();
  }

  private _getAvailableTasksForTracks(): readonly Task[] {
    const trackedTaskIds = new Set(
      this._tracks.flatMap((track) => track.taskIds),
    );

    return this._getAllTasksForTracks().filter(
      (task) => !trackedTaskIds.has(task.id),
    );
  }

  private _handleSaveTrack(
    e: CustomEvent<{
      trackId?: string;
      title: string;
      description?: string;
      projectId?: string;
    }>,
  ) {
    const { trackId, title, description, projectId } = e.detail;

    if (trackId) {
      weeklyStore.updateTrack(trackId, { title, description, projectId });
    } else {
      weeklyStore.addTrack(title, description, projectId);
    }
  }

  private _handleDeleteTrack(e: CustomEvent<{ trackId: string }>) {
    weeklyStore.removeTrack(e.detail.trackId);
    // Deselect track if it was selected
    if (this._selectedTrackId === e.detail.trackId) {
      this._selectedTrackId = undefined;
    }
  }

  private _handleSelectTrack(e: CustomEvent<{ trackId: string }>) {
    this._selectedTrackId = e.detail.trackId;
  }

  private _handleAddTaskToTrack(
    e: CustomEvent<{ trackId: string; taskId: string }>,
  ) {
    weeklyStore.addTaskToTrack(e.detail.trackId, e.detail.taskId);
  }

  private _handleRemoveTaskFromTrack(
    e: CustomEvent<{ trackId: string; taskId: string }>,
  ) {
    weeklyStore.removeTaskFromTrack(e.detail.trackId, e.detail.taskId);
  }

  private _handleAddTrackEdge(
    e: CustomEvent<{
      trackId: string;
      sourceTaskId: string;
      targetTaskId: string;
    }>,
  ) {
    weeklyStore.addTrackEdge(
      e.detail.trackId,
      e.detail.sourceTaskId,
      e.detail.targetTaskId,
    );
  }

  private _handleRemoveTrackEdge(
    e: CustomEvent<{
      trackId: string;
      sourceTaskId: string;
      targetTaskId: string;
    }>,
  ) {
    weeklyStore.removeTrackEdge(
      e.detail.trackId,
      e.detail.sourceTaskId,
      e.detail.targetTaskId,
    );
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

  private _handleIncreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    weeklyStore.incrementProjectEstimate(e.detail.projectId);
  }

  private _handleDecreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    weeklyStore.decrementProjectEstimate(e.detail.projectId);
  }

  // ============================================
  // Header Model
  // ============================================

  /**
   * Returns the appropriate HeaderModel based on the active view
   */
  private _getHeaderModel(): HeaderModel {
    const allTasks = this._getAllTasks();

    // Compute dayStart/dayEnd from timeSlots for header display
    const dayStart =
      this._timeSlots.length > 0
        ? (this._timeSlots[0]?.startTime ?? "08:00")
        : "08:00";
    const dayEnd =
      this._timeSlots.length > 0
        ? (this._timeSlots[this._timeSlots.length - 1]?.endTime ?? "18:00")
        : "18:00";

    switch (this._activeView) {
      case "day":
        return {
          view: "day",
          date: this._currentDate,
          dayStart,
          dayEnd,
          capacityInMinutes: this._capacityInMinutes,
          showReset: true,
        };
      case "week":
        return {
          view: "week",
          weekStartDate: this._weekStartDate,
          weekEndDate: this._weekEndDate,
          planned: this._overallMetrics.totalPlanned,
          capacity: this._weeklyCapacity,
        };
      case "projects":
        return {
          view: "projects",
          projectCount: this._overallMetrics.projectCount,
          activeProjectCount: this._overallMetrics.activeProjectCount,
          totalFinished: this._overallMetrics.totalFinished,
          totalPlanned: this._overallMetrics.totalPlanned,
        };
      case "tasks": {
        const doneTasks = allTasks.filter((task) => isTaskDone(task));
        const activeTasks = allTasks.filter((task) => !isTaskDone(task));
        return {
          view: "tasks",
          taskCount: allTasks.length,
          activeTaskCount: activeTasks.length,
          doneTaskCount: doneTasks.length,
        };
      }
      case "tracks": {
        const selectedTrack = this._selectedTrackId
          ? this._tracks.find((t) => t.id === this._selectedTrackId)
          : undefined;
        return {
          view: "tracks",
          trackCount: this._tracks.length,
          selectedTrackTitle: selectedTrack?.title,
        };
      }
    }
  }

  override render() {
    const isEdit = !!this._editingTask;
    const allTasks = this._getAllTasks();
    const deleteTask = this._deletingTaskId
      ? allTasks.find((t) => t.id === this._deletingTaskId)
      : undefined;

    // Calculate remaining capacity for week view
    const weekRemaining =
      this._weeklyCapacity - this._overallMetrics.totalPlanned;

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
          <button
            class="tab-btn ${this._activeView === "projects" ? "active" : ""}"
            role="tab"
            aria-selected=${this._activeView === "projects"}
            aria-controls="projects-view"
            @click=${this._handleSwitchToProjectsView}
          >
            Projects
          </button>
          <button
            class="tab-btn ${this._activeView === "tasks" ? "active" : ""}"
            role="tab"
            aria-selected=${this._activeView === "tasks"}
            aria-controls="tasks-view"
            @click=${this._handleSwitchToTasksView}
          >
            Tasks
          </button>
          <button
            class="tab-btn ${this._activeView === "tracks" ? "active" : ""}"
            role="tab"
            aria-selected=${this._activeView === "tracks"}
            aria-controls="tracks-view"
            @click=${this._handleSwitchToTracksView}
          >
            Tracks
          </button>
        </div>

        <app-header
          slot="header"
          .headerModel=${this._getHeaderModel()}
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
                  .timeSlots=${this._timeSlots}
                  .slotErrors=${this._slotErrors}
                  .collapsed=${this._panelCollapsed}
                  @capacity-change=${this._handleCapacityChange}
                  @duration-change=${this._handleDurationChange}
                  @add-slot=${this._handleAddSlot}
                  @update-slot=${this._handleUpdateSlot}
                  @remove-slot=${this._handleRemoveSlot}
                  @toggle-collapse=${this._handleTogglePanelCollapse}
                ></tomato-pool-panel>
              </div>
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
                .showRemoveFromDay=${true}
                .todayDate=${this._currentDate}
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
                @assign-to-today=${this._handleAssignToToday}
                @remove-from-day=${this._handleRemoveFromDay}
              ></task-list-panel>
            `
          : this._activeView === "week"
            ? html`
                <div id="week-view" role="tabpanel" slot="pool-panel">
                  <week-tomato-pool-panel
                    .weeklyCapacity=${this._weeklyCapacity}
                    .planned=${this._overallMetrics.totalPlanned}
                    .remaining=${weekRemaining}
                    .finished=${this._overallMetrics.totalFinished}
                    .weekStartDate=${this._weekStartDate}
                    .weekEndDate=${this._weekEndDate}
                    .capacityInMinutes=${this._capacityInMinutesWeekly}
                    .collapsed=${this._panelCollapsed}
                    @weekly-capacity-change=${this._handleWeeklyCapacityChange}
                    @toggle-collapse=${this._handleTogglePanelCollapse}
                  ></week-tomato-pool-panel>
                </div>
                <project-list-panel
                  slot="task-panel"
                  .projects=${this._projects}
                  .taskCounts=${this._projectTaskCounts}
                  .progressData=${this._projectProgressData}
                  .maxEstimate=${this._weeklyCapacity}
                  .mode=${"planning"}
                  .tasks=${this._weeklyTasks}
                  .tracks=${this._tracks}
                  @save-project=${this._handleSaveProject}
                  @delete-project=${this._handleDeleteProject}
                  @select-project=${this._handleSelectProject}
                  @increase-project-plan=${this._handleIncreaseProjectPlan}
                  @decrease-project-plan=${this._handleDecreaseProjectPlan}
                ></project-list-panel>
              `
            : this._activeView === "tasks"
              ? html`
                  <div id="tasks-view" role="tabpanel" slot="pool-panel">
                    <tasks-pool-panel
                      .tasks=${this._getAllTasks()}
                      .projects=${this._projects}
                      .statusFilter=${this._tasksStatusFilter}
                      .projectFilter=${this._tasksProjectFilter}
                      .collapsed=${this._panelCollapsed}
                      @toggle-collapse=${this._handleTogglePanelCollapse}
                      @status-filter-change=${this
                        ._handleTasksStatusFilterChange}
                      @project-filter-change=${this
                        ._handleTasksProjectFilterChange}
                    ></tasks-pool-panel>
                  </div>
                  <tasks-view-panel
                    slot="task-panel"
                    .tasks=${this._getAllTasks()}
                    .projects=${this._projects}
                    .statusFilter=${this._tasksStatusFilter}
                    .projectFilter=${this._tasksProjectFilter}
                    .remaining=${this._remaining}
                    .capacityInMinutes=${this._capacityInMinutes}
                    .disabled=${false}
                    .timerActiveTaskId=${this._timerActiveTaskId}
                    .timerStatus=${this._timerStatus}
                    .timerRemainingSeconds=${this._timerRemainingSeconds}
                    .showAssignToToday=${true}
                    .showRemoveFromDay=${true}
                    .todayDate=${this._currentDate}
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
                    @assign-to-today=${this._handleAssignToToday}
                    @remove-from-day=${this._handleRemoveFromDay}
                  ></tasks-view-panel>
                `
              : this._activeView === "tracks"
                ? html`
                    <track-list-panel
                      slot="pool-panel"
                      .tracks=${this._tracks}
                      .tasks=${this._getAllTasksForTracks()}
                      .projects=${this._projects}
                      .selectedTrackId=${this._selectedTrackId}
                      .collapsed=${this._panelCollapsed}
                      @save-track=${this._handleSaveTrack}
                      @delete-track=${this._handleDeleteTrack}
                      @select-track=${this._handleSelectTrack}
                      @toggle-collapse=${this._handleTogglePanelCollapse}
                    ></track-list-panel>
                    <track-builder-panel
                      slot="task-panel"
                      .track=${this._tracks.find(
                        (t) => t.id === this._selectedTrackId,
                      )}
                      .tasks=${this._getAllTasksForTracks()}
                      .availableTasks=${this._getAvailableTasksForTracks()}
                      .projects=${this._projects}
                      @add-task-to-track=${this._handleAddTaskToTrack}
                      @remove-task-from-track=${this._handleRemoveTaskFromTrack}
                      @add-track-edge=${this._handleAddTrackEdge}
                      @remove-track-edge=${this._handleRemoveTrackEdge}
                    ></track-builder-panel>
                  `
                : html`
                    <div id="projects-view" role="tabpanel" slot="pool-panel">
                      <projects-analytics-panel
                        .weeklyCapacity=${this._weeklyCapacity}
                        .totalPlanned=${this._overallMetrics.totalPlanned}
                        .totalFinished=${this._overallMetrics.totalFinished}
                        .projectCount=${this._overallMetrics.projectCount}
                        .activeProjectCount=${this._overallMetrics
                          .activeProjectCount}
                        .completedProjectCount=${this._overallMetrics
                          .completedProjectCount}
                        .archivedProjectCount=${this._overallMetrics
                          .archivedProjectCount}
                        .capacityInMinutes=${this._capacityInMinutesWeekly}
                        .collapsed=${this._panelCollapsed}
                        @toggle-collapse=${this._handleTogglePanelCollapse}
                      ></projects-analytics-panel>
                    </div>
                    <project-list-panel
                      slot="task-panel"
                      .projects=${this._projects}
                      .taskCounts=${this._projectTaskCounts}
                      .progressData=${this._projectProgressData}
                      .maxEstimate=${this._weeklyCapacity}
                      .mode=${"analytics"}
                      .tasks=${this._weeklyTasks}
                      .tracks=${this._tracks}
                      @save-project=${this._handleSaveProject}
                      @delete-project=${this._handleDeleteProject}
                      @select-project=${this._handleSelectProject}
                      @add-project-task=${this._handleAddProjectTask}
                    ></project-list-panel>
                  `}
      </app-shell>

      <!-- Task Editor Dialog -->
      <task-editor-dialog
        .open=${this._showTaskDialog}
        .task=${this._editingTask}
        .projects=${this._projects}
        .isEdit=${isEdit}
        .defaultProjectId=${this._defaultProjectIdForNewTask}
        .error=${this._taskDialogError}
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
