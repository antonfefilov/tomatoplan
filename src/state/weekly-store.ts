/**
 * Custom reactive store for Weekly State management
 * Provides reactive state updates compatible with Lit components
 *
 * This store derives tasks from taskpoolStore (the canonical task store).
 * Projects and tracks are owned by weeklyStore.
 */

import type { Task } from "../models/task.js";
import type { Project, ProjectColor } from "../models/project.js";
import type { Track } from "../models/track.js";
import {
  createProject,
  updateProject as updateProjectModel,
  completeProject as completeProjectModel,
  archiveProject as archiveProjectModel,
  getCurrentWeekId,
  getNextProjectColor,
} from "../models/project.js";
import {
  createTrack,
  updateTrack as updateTrackModel,
  addTaskToTrack as addTaskToTrackModel,
  removeTaskFromTrack as removeTaskFromTrackModel,
  addEdgeToTrack as addEdgeToTrackModel,
  removeEdgeFromTrack as removeEdgeFromTrackModel,
} from "../models/track.js";
import { wouldCreateCycle } from "../utils/track-graph.js";
import type { WeeklyState } from "../models/weekly-state.js";
import {
  createInitialWeeklyState,
  resetWeeklyStateForNewWeek,
  getWeeklyRemaining,
  isStateCurrentWeek,
  getTotalProjectEstimates,
} from "../models/weekly-state.js";
import { isStale } from "../models/weekly-pool.js";
import { generateId } from "../utils/id.js";
import { validateTaskTitle } from "../utils/validation.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_CAPACITY_IN_MINUTES,
} from "../constants/defaults.js";
import {
  saveWeeklyState,
  loadWeeklyState,
  clearWeeklyState,
} from "./weekly-persistence.js";
import { taskpoolStore } from "./taskpool-store.js";

/** Type for subscriber callback functions */
type Subscriber = (state: WeeklyState) => void;

/** Unsubscribe function returned when subscribing */
type Unsubscribe = () => void;

/** Result type for store actions */
interface ActionResult {
  success: boolean;
  error?: string;
  projectId?: string;
  trackId?: string;
}

/**
 * WeeklyStore - Reactive state store for weekly project planning
 *
 * Implements a simple pub/sub pattern for reactivity:
 * - Components subscribe to state changes
 * - Actions modify state and notify subscribers
 * - Selectors provide computed values
 */
class WeeklyStore {
  private state: WeeklyState;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    // Try to load persisted state, or create initial state
    const persistedState = loadWeeklyState();

    if (persistedState && !isStale(persistedState.pool)) {
      // Use persisted state if it's from current week
      this.state = persistedState;
    } else {
      // Create fresh state for a new week
      const savedDailyCapacity = persistedState?.pool.weeklyCapacity
        ? Math.floor(persistedState.pool.weeklyCapacity / 5)
        : DEFAULT_DAILY_CAPACITY;
      const savedCapacityInMinutes =
        persistedState?.pool.capacityInMinutes ?? DEFAULT_CAPACITY_IN_MINUTES;
      this.state = createInitialWeeklyState(
        savedDailyCapacity,
        savedCapacityInMinutes,
      );
    }

    // Populate tasks from taskpoolStore BEFORE subscribing
    // This ensures tasks are available when tests mock them directly
    this.state = {
      ...this.state,
      tasks: this.getWeeklyTasks(),
    };

    // Subscribe to taskpoolStore to update tasks and notify subscribers of task changes
    taskpoolStore.subscribe(() => {
      this.state = {
        ...this.state,
        tasks: this.getWeeklyTasks(),
      };
      this.notify();
    });
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current state (returns a shallow copy to prevent direct mutation)
   * Tasks are derived from taskpoolStore and stored in state.tasks
   */
  getState(): WeeklyState {
    return {
      ...this.state,
      projects: [...this.state.projects],
      tracks: [...this.state.tracks],
      tasks: [...this.state.tasks],
    };
  }

  /**
   * Gets weekly tasks derived from taskpoolStore.
   * Filters tasks to only include those relevant to current week's projects.
   */
  private getWeeklyTasks(): Task[] {
    const currentWeekId = getCurrentWeekId();
    const allTasks = taskpoolStore.getAllTasks();

    // Filter tasks to only include those:
    // 1. Without a project (unassigned tasks created this week)
    // 2. With a project from current week
    return allTasks.filter((task) => {
      if (task.projectId) {
        const project = this.state.projects.find(
          (p) => p.id === task.projectId,
        );
        return project && project.weekId === currentWeekId;
      }
      return true;
    });
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  /**
   * Subscribe to state changes
   * Returns an unsubscribe function
   */
  subscribe(callback: Subscriber): Unsubscribe {
    this.subscribers.add(callback);

    // Immediately call with current state
    callback(this.getState());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifies all subscribers of state changes
   */
  private notify(): void {
    const state = this.getState();
    for (const subscriber of this.subscribers) {
      subscriber(state);
    }
  }

  /**
   * Updates state and persists to storage
   */
  private setState(newState: WeeklyState): void {
    this.state = newState;
    saveWeeklyState(newState);
    this.notify();
  }

  // ============================================
  // WEEK CAPACITY ACTIONS
  // ============================================

  /**
   * Sets the weekly tomato capacity
   */
  setWeeklyCapacity(capacity: number): ActionResult {
    if (typeof capacity !== "number" || isNaN(capacity) || capacity < 1) {
      return { success: false, error: "Capacity must be a positive number" };
    }

    this.setState({
      ...this.state,
      pool: {
        ...this.state.pool,
        weeklyCapacity: capacity,
      },
    });

    return { success: true };
  }

  // ============================================
  // PROJECT ACTIONS
  // ============================================

  /**
   * Adds a new project
   * Rejects if the project estimate would exceed weekly capacity
   */
  addProject(
    title: string,
    description?: string,
    tomatoEstimate?: number,
    color?: ProjectColor,
  ): ActionResult {
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Validate tomatoEstimate BEFORE capacity checks to prevent bypass
    if (tomatoEstimate !== undefined) {
      if (
        typeof tomatoEstimate !== "number" ||
        !Number.isFinite(tomatoEstimate) ||
        tomatoEstimate < 0
      ) {
        return {
          success: false,
          error: "Estimate must be a non-negative finite number",
        };
      }
    }

    const estimate = tomatoEstimate ?? 0;
    const currentTotal = getTotalProjectEstimates(this.state);
    const weeklyCapacity = this.state.pool.weeklyCapacity;

    // Check if adding this project would exceed capacity
    if (currentTotal + estimate > weeklyCapacity) {
      const remaining = weeklyCapacity - currentTotal;
      return {
        success: false,
        error: `Project estimates exceed weekly capacity. ${remaining} tomatoes remaining.`,
      };
    }

    const projectId = generateId();
    const weekId = getCurrentWeekId();

    const projectColor =
      color ?? getNextProjectColor(this.state.projects.length);

    const newProject = createProject(projectId, title.trim(), weekId, {
      description: description?.trim(),
      tomatoEstimate: estimate,
      color: projectColor,
    });

    this.setState({
      ...this.state,
      projects: [...this.state.projects, newProject],
    });

    return { success: true, projectId };
  }

  /**
   * Updates an existing project
   * Rejects if the update would cause total active estimates to exceed weekly capacity
   */
  updateProject(
    projectId: string,
    updates: Partial<
      Pick<
        Project,
        "title" | "description" | "tomatoEstimate" | "color" | "status"
      >
    >,
  ): ActionResult {
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (updates.title !== undefined) {
      const validation = validateTaskTitle(updates.title);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    if (updates.tomatoEstimate !== undefined) {
      if (
        typeof updates.tomatoEstimate !== "number" ||
        !Number.isFinite(updates.tomatoEstimate) ||
        updates.tomatoEstimate < 0
      ) {
        return {
          success: false,
          error: "Estimate must be a non-negative finite number",
        };
      }
    }

    // Capacity validation: check if update would exceed weekly capacity
    const weeklyCapacity = this.state.pool.weeklyCapacity;
    const currentTotal = getTotalProjectEstimates(this.state);

    // Calculate the projected total after the update
    // We need to consider:
    // 1. The project's current contribution to the total (if active)
    // 2. The project's new contribution after the update
    const currentProjectContribution =
      project.status === "active" ? project.tomatoEstimate : 0;

    // Determine the new status and estimate after update
    const newStatus = updates.status ?? project.status;
    const newEstimate = updates.tomatoEstimate ?? project.tomatoEstimate;
    const newProjectContribution = newStatus === "active" ? newEstimate : 0;

    // Calculate projected total: remove current contribution, add new contribution
    const projectedTotal =
      currentTotal - currentProjectContribution + newProjectContribution;

    // Only reject if we're exceeding capacity
    if (projectedTotal > weeklyCapacity) {
      const remaining = weeklyCapacity - currentTotal;
      const deficit = projectedTotal - weeklyCapacity;
      return {
        success: false,
        error: `Update would exceed weekly capacity by ${deficit} tomatoes. ${remaining} tomatoes remaining.`,
      };
    }

    const updatedProject = updateProjectModel(project, updates);

    this.setState({
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId ? updatedProject : p,
      ),
    });

    return { success: true };
  }

  /**
   * Removes a project
   *
   * NOTE: For proper project deletion that unassigns planner tasks,
   * use the removeProject function from project-coordinator.ts instead.
   *
   * This method includes defensive task cleanup via taskpoolStore for edge cases
   * where tasks need to be unassigned from the project.
   */
  removeProject(projectId: string): ActionResult {
    const projectIndex = this.state.projects.findIndex(
      (p) => p.id === projectId,
    );

    if (projectIndex === -1) {
      return { success: false, error: "Project not found" };
    }

    // Unassign tasks from this project via taskpoolStore
    taskpoolStore.unassignTasksFromProject(projectId);

    this.setState({
      ...this.state,
      projects: this.state.projects.filter((p) => p.id !== projectId),
    });

    return { success: true };
  }

  /**
   * Marks a project as completed
   */
  completeProject(projectId: string): ActionResult {
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const updatedProject = completeProjectModel(project);

    this.setState({
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId ? updatedProject : p,
      ),
    });

    return { success: true };
  }

  /**
   * Marks a project as archived
   */
  archiveProject(projectId: string): ActionResult {
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const updatedProject = archiveProjectModel(project);

    this.setState({
      ...this.state,
      projects: this.state.projects.map((p) =>
        p.id === projectId ? updatedProject : p,
      ),
    });

    return { success: true };
  }

  /**
   * Increments the tomato estimate for a project by 1
   * Validates capacity constraints before updating
   */
  incrementProjectEstimate(projectId: string): ActionResult {
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.status !== "active") {
      return { success: false, error: "Cannot modify inactive project" };
    }

    const newEstimate = project.tomatoEstimate + 1;
    const weeklyCapacity = this.state.pool.weeklyCapacity;
    const currentTotal = getTotalProjectEstimates(this.state);

    // Calculate projected total: remove current project contribution, add new contribution
    const projectedTotal = currentTotal - project.tomatoEstimate + newEstimate;

    if (projectedTotal > weeklyCapacity) {
      const remaining = weeklyCapacity - currentTotal;
      return {
        success: false,
        error: `Cannot exceed weekly capacity. ${remaining} tomatoes remaining.`,
      };
    }

    return this.updateProject(projectId, { tomatoEstimate: newEstimate });
  }

  /**
   * Decrements the tomato estimate for a project by 1
   * Never allows negative estimates
   */
  decrementProjectEstimate(projectId: string): ActionResult {
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.status !== "active") {
      return { success: false, error: "Cannot modify inactive project" };
    }

    if (project.tomatoEstimate <= 0) {
      return { success: false, error: "Estimate cannot be negative" };
    }

    const newEstimate = project.tomatoEstimate - 1;
    return this.updateProject(projectId, { tomatoEstimate: newEstimate });
  }

  // ============================================
  // TASK ASSIGNMENT ACTIONS
  // ============================================

  /**
   * Assigns a task to a project via taskpoolStore.
   * The task must exist in taskpoolStore.
   */
  assignTaskToProject(taskId: string, projectId: string): ActionResult {
    const task = taskpoolStore.getTaskById(taskId);
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!task) {
      return { success: false, error: "Task not found in taskpoolStore" };
    }

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.status !== "active") {
      return { success: false, error: "Cannot assign to inactive project" };
    }

    // Delegate to taskpoolStore for the actual update
    return taskpoolStore.setTaskProject(taskId, projectId);
  }

  /**
   * Removes a task from its project via taskpoolStore.
   */
  unassignTaskFromProject(taskId: string): ActionResult {
    const task = taskpoolStore.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found in taskpoolStore" };
    }

    if (!task.projectId) {
      return { success: true }; // Already unassigned
    }

    // Delegate to taskpoolStore for the actual update
    return taskpoolStore.unassignTaskFromProject(taskId);
  }

  // ============================================
  // TASK SYNC (from plannerStore)
  // ============================================

  /**
   * Syncs tasks from the daily planner store.
   *
   * DEPRECATED: This method imports tasks into taskpoolStore for backwards
   * compatibility with tests. New code should use taskpoolStore directly.
   */
  syncTasks(tasks: readonly Task[]): void {
    // Import tasks into taskpoolStore (the canonical task store)
    taskpoolStore.importTasks(tasks);
  }

  /**
   * Updates a single task in the weekly state.
   *
   * DEPRECATED: Task updates should go through taskpoolStore directly.
   * This method exists for backwards compatibility but just re-derives from taskpoolStore.
   */
  updateTask(taskId: string, updates: Partial<Task>): ActionResult {
    // Delegate to taskpoolStore for the actual update
    const task = taskpoolStore.getTaskById(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (updates.title !== undefined) {
      const result = taskpoolStore.updateTask(taskId, { title: updates.title });
      if (!result.success) {
        return result; // Propagate failure
      }
    }
    if (updates.description !== undefined) {
      const result = taskpoolStore.updateTask(taskId, {
        description: updates.description,
      });
      if (!result.success) {
        return result; // Propagate failure
      }
    }
    if (updates.tomatoCount !== undefined) {
      const result = taskpoolStore.setTomatoCount(taskId, updates.tomatoCount);
      if (!result.success) {
        return result; // Propagate failure
      }
    }

    // Re-derivation happens via subscription notification
    return { success: true };
  }

  /**
   * Removes a task from the weekly state.
   *
   * DEPRECATED: Task removal should go through taskpoolStore directly.
   * This method exists for backwards compatibility.
   */
  removeTask(taskId: string): void {
    // Delegate to taskpoolStore for the actual removal
    taskpoolStore.removeTask(taskId);
    // Also remove from any tracks (via taskpoolStore unassign)
    taskpoolStore.unassignTaskFromTrack(taskId);
    // Clean up track references to this task
    this.cleanupTaskFromTracks(taskId);
  }

  /**
   * Removes a task ID from all track taskIds arrays and cleans up edges.
   * Called when a task is deleted to prevent stale references.
   */
  cleanupTaskFromTracks(taskId: string): void {
    const updatedTracks = this.state.tracks.map((track) => ({
      ...track,
      taskIds: track.taskIds.filter((id) => id !== taskId),
      edges: track.edges.filter(
        (edge) => edge.sourceTaskId !== taskId && edge.targetTaskId !== taskId,
      ),
    }));

    this.setState({
      ...this.state,
      tracks: updatedTracks,
    });
  }

  // ============================================
  // TRACK ACTIONS
  // ============================================

  /**
   * Adds a new track
   */
  addTrack(
    title: string,
    description?: string,
    projectId?: string,
  ): ActionResult {
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trackId = generateId();
    const newTrack = createTrack(trackId, title.trim(), {
      description: description?.trim(),
      projectId,
    });

    this.setState({
      ...this.state,
      tracks: [...this.state.tracks, newTrack],
    });

    return { success: true, trackId };
  }

  /**
   * Updates an existing track
   */
  updateTrack(
    trackId: string,
    updates: Partial<Pick<Track, "title" | "description" | "projectId">>,
  ): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    if (updates.title !== undefined) {
      const validation = validateTaskTitle(updates.title);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    const updatedTrack = updateTrackModel(track, updates);

    this.setState({
      ...this.state,
      tracks: this.state.tracks.map((t) =>
        t.id === trackId ? updatedTrack : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes a track
   * Clears trackId from all tasks that belong to this track via taskpoolStore
   */
  removeTrack(trackId: string): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    // Clear trackId from tasks that belong to this track via taskpoolStore
    for (const taskId of track.taskIds) {
      taskpoolStore.unassignTaskFromTrack(taskId);
    }

    this.setState({
      ...this.state,
      tracks: this.state.tracks.filter((t) => t.id !== trackId),
    });

    return { success: true };
  }

  /**
   * Adds a task to a track
   * Updates the track's taskIds and the task's trackId via taskpoolStore
   */
  addTaskToTrack(trackId: string, taskId: string): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);
    const task = taskpoolStore.getTaskById(taskId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Check if task is already in a different track
    if (task.trackId && task.trackId !== trackId) {
      return {
        success: false,
        error: "Task is already assigned to another track",
      };
    }

    // Update task's trackId via taskpoolStore
    taskpoolStore.setTaskTrack(taskId, trackId);

    // Update track's taskIds
    const updatedTrack = addTaskToTrackModel(track, taskId);

    this.setState({
      ...this.state,
      tracks: this.state.tracks.map((t) =>
        t.id === trackId ? updatedTrack : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes a task from a track
   * Updates the track (removes task and edges) and clears task's trackId via taskpoolStore
   */
  removeTaskFromTrack(trackId: string, taskId: string): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    if (!track.taskIds.includes(taskId)) {
      return { success: true }; // Task not in track, nothing to do
    }

    // Clear task's trackId via taskpoolStore
    taskpoolStore.unassignTaskFromTrack(taskId);

    // Update track (removes task and all edges involving this task)
    const updatedTrack = removeTaskFromTrackModel(track, taskId);

    this.setState({
      ...this.state,
      tracks: this.state.tracks.map((t) =>
        t.id === trackId ? updatedTrack : t,
      ),
    });

    return { success: true };
  }

  /**
   * Adds an edge (dependency) between two tasks in a track
   * Validates that both tasks are in the track and that the edge wouldn't create a cycle
   */
  addTrackEdge(
    trackId: string,
    sourceTaskId: string,
    targetTaskId: string,
  ): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    // Verify both tasks are in the track
    if (!track.taskIds.includes(sourceTaskId)) {
      return { success: false, error: "Source task is not in this track" };
    }

    if (!track.taskIds.includes(targetTaskId)) {
      return { success: false, error: "Target task is not in this track" };
    }

    // Check for cycle
    if (wouldCreateCycle(track, sourceTaskId, targetTaskId)) {
      return {
        success: false,
        error: "Adding this edge would create a cycle",
      };
    }

    const updatedTrack = addEdgeToTrackModel(track, sourceTaskId, targetTaskId);

    this.setState({
      ...this.state,
      tracks: this.state.tracks.map((t) =>
        t.id === trackId ? updatedTrack : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes an edge (dependency) from a track
   */
  removeTrackEdge(
    trackId: string,
    sourceTaskId: string,
    targetTaskId: string,
  ): ActionResult {
    const track = this.state.tracks.find((t) => t.id === trackId);

    if (!track) {
      return { success: false, error: "Track not found" };
    }

    const updatedTrack = removeEdgeFromTrackModel(
      track,
      sourceTaskId,
      targetTaskId,
    );

    this.setState({
      ...this.state,
      tracks: this.state.tracks.map((t) =>
        t.id === trackId ? updatedTrack : t,
      ),
    });

    return { success: true };
  }

  // ============================================
  // WEEK RESET
  // ============================================

  /**
   * Resets the week - clears all projects and tasks
   * Preserves capacity settings
   */
  resetWeek(): void {
    const newState = {
      ...resetWeeklyStateForNewWeek(this.state),
      tasks: this.getWeeklyTasks(),
    };
    this.setState(newState);
  }

  /**
   * Clears all persisted state and resets to defaults
   */
  clearAllData(): void {
    clearWeeklyState();
    this.state = {
      ...createInitialWeeklyState(),
      tasks: this.getWeeklyTasks(),
    };
    this.notify();
  }

  // ============================================
  // SELECTORS
  // ============================================

  /**
   * SELECTOR IMMUTABILITY CONTRACT
   * ==============================
   * All array-returning getters (projects, tasks, tracks) return defensive
   * shallow copies to prevent external mutation of internal state.
   *
   * IMPORTANT:
   * - Returned arrays are snapshots and should be treated as read-only
   * - Copies are shallow - nested entities (Project, Task, Track objects) remain mutable
   * - All writes must go through store actions (addProject, updateProject, etc.)
   * - Direct mutation of returned objects may cause inconsistent state
   *
   * For deep immutability, consumers should create their own deep copies.
   */

  /**
   * Gets the weekly capacity
   */
  get weeklyCapacity(): number {
    return this.state.pool.weeklyCapacity;
  }

  /**
   * Gets the capacity per tomato in minutes
   */
  get capacityInMinutes(): number {
    return this.state.pool.capacityInMinutes;
  }

  /**
   * Gets the current week ID
   */
  get currentWeekId(): string {
    return this.state.pool.weekId;
  }

  /**
   * Gets all projects (defensive copy)
   */
  get projects(): readonly Project[] {
    return [...this.state.projects];
  }

  /**
   * Gets all active projects
   */
  get activeProjects(): readonly Project[] {
    return this.state.projects.filter((p) => p.status === "active");
  }

  /**
   * Gets a project by ID
   */
  getProjectById(id: string): Project | undefined {
    return this.state.projects.find((p) => p.id === id);
  }

  /**
   * Gets all tasks (cached in state, derived from taskpoolStore)
   */
  get tasks(): readonly Task[] {
    return [...this.state.tasks];
  }

  /**
   * Gets a task by ID (derived from taskpoolStore)
   */
  getTaskById(id: string): Task | undefined {
    return taskpoolStore.getTaskById(id);
  }

  /**
   * Gets tasks for a specific project
   * Tasks are derived from taskpoolStore (the canonical task store)
   */
  getTasksForProject(projectId: string): readonly Task[] {
    return taskpoolStore.getTasksForProject(projectId);
  }

  /**
   * Gets project progress (finished and estimated tomatoes)
   * Tasks are derived from taskpoolStore (the canonical task store)
   */
  getProjectProgressById(projectId: string): {
    finished: number;
    estimated: number;
  } {
    const project = this.state.projects.find((p) => p.id === projectId);
    if (!project) {
      return { finished: 0, estimated: 0 };
    }

    const tasks = taskpoolStore.getTasksForProject(projectId);
    const finished = tasks.reduce((sum, t) => sum + t.finishedTomatoCount, 0);

    return {
      finished,
      estimated: project.tomatoEstimate,
    };
  }

  /**
   * Gets remaining weekly capacity
   */
  get remainingCapacity(): number {
    return getWeeklyRemaining(this.state);
  }

  /**
   * Gets total project estimates
   */
  get totalProjectEstimates(): number {
    return getTotalProjectEstimates(this.state);
  }

  /**
   * Gets the number of projects
   */
  get projectCount(): number {
    return this.state.projects.length;
  }

  /**
   * Gets the number of active projects
   */
  get activeProjectCount(): number {
    return this.state.projects.filter((p) => p.status === "active").length;
  }

  /**
   * Checks if state is for current week
   */
  get isCurrentWeek(): boolean {
    return isStateCurrentWeek(this.state);
  }

  /**
   * Gets week start date string
   */
  get weekStartDate(): string {
    return this.state.pool.weekStartDate;
  }

  /**
   * Gets week end date string
   */
  get weekEndDate(): string {
    return this.state.pool.weekEndDate;
  }

  // ============================================
  // TRACK SELECTORS
  // ============================================

  /**
   * Gets all tracks (defensive copy)
   */
  get tracks(): readonly Track[] {
    return [...this.state.tracks];
  }

  /**
   * Gets the number of tracks
   */
  get trackCount(): number {
    return this.state.tracks.length;
  }

  /**
   * Gets a track by ID
   */
  getTrackById(id: string): Track | undefined {
    return this.state.tracks.find((t) => t.id === id);
  }

  /**
   * Gets tracks for a specific project
   */
  getTracksForProject(projectId: string): readonly Track[] {
    return this.state.tracks.filter((t) => t.projectId === projectId);
  }

  /**
   * Gets tasks for a specific track
   * Tasks are derived from taskpoolStore (the canonical task store)
   */
  getTasksForTrack(trackId: string): readonly Task[] {
    return taskpoolStore.getTasksForTrack(trackId);
  }

  /**
   * Gets tasks that don't belong to any track
   * Tasks are derived from taskpoolStore (the canonical task store)
   */
  getUntrackedTasks(): readonly Task[] {
    return taskpoolStore.getAllTasks().filter((t) => !t.trackId);
  }
}

// Export singleton instance
export const weeklyStore = new WeeklyStore();

// Export class for testing purposes
export { WeeklyStore };

// Export types for external use
export type { Subscriber, Unsubscribe, ActionResult };
