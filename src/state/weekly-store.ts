/**
 * Custom reactive store for Weekly State management
 * Provides reactive state updates compatible with Lit components
 */

import type { Task } from "../models/task.js";
import type { Project, ProjectColor } from "../models/project.js";
import {
  createProject,
  updateProject as updateProjectModel,
  completeProject as completeProjectModel,
  archiveProject as archiveProjectModel,
  getCurrentWeekId,
  getNextProjectColor,
} from "../models/project.js";
import type { WeeklyState } from "../models/weekly-state.js";
import {
  createInitialWeeklyState,
  resetWeeklyStateForNewWeek,
  getProjectProgress,
  getProjectTasks,
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

/** Type for subscriber callback functions */
type Subscriber = (state: WeeklyState) => void;

/** Unsubscribe function returned when subscribing */
type Unsubscribe = () => void;

/** Result type for store actions */
interface ActionResult {
  success: boolean;
  error?: string;
  projectId?: string;
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
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current state (returns a shallow copy to prevent direct mutation)
   */
  getState(): WeeklyState {
    return {
      ...this.state,
      projects: [...this.state.projects],
      tasks: [...this.state.tasks],
    };
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
   * This method includes defensive task cleanup for edge cases where
   * tasks exist in weekly store but not in planner store (e.g., historical data).
   * When called via the coordinator, tasks are already unassigned from planner store
   * and synced here, making this cleanup redundant but harmless.
   */
  removeProject(projectId: string): ActionResult {
    const projectIndex = this.state.projects.findIndex(
      (p) => p.id === projectId,
    );

    if (projectIndex === -1) {
      return { success: false, error: "Project not found" };
    }

    // Defensive cleanup: unassign tasks from this project
    // This handles edge cases where tasks exist here but not in planner store
    const updatedTasks = this.state.tasks.map((t) =>
      t.projectId === projectId
        ? { ...t, projectId: undefined, updatedAt: new Date().toISOString() }
        : t,
    );

    this.setState({
      ...this.state,
      projects: this.state.projects.filter((p) => p.id !== projectId),
      tasks: updatedTasks,
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
   * Assigns a task to a project
   * The task must exist in the weekly store's task list
   */
  assignTaskToProject(taskId: string, projectId: string): ActionResult {
    const task = this.state.tasks.find((t) => t.id === taskId);
    const project = this.state.projects.find((p) => p.id === projectId);

    if (!task) {
      return { success: false, error: "Task not found in weekly state" };
    }

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.status !== "active") {
      return { success: false, error: "Cannot assign to inactive project" };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, projectId, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes a task from its project
   */
  unassignTaskFromProject(taskId: string): ActionResult {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found in weekly state" };
    }

    if (!task.projectId) {
      return { success: true }; // Already unassigned
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, projectId: undefined, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  // ============================================
  // TASK SYNC (from plannerStore)
  // ============================================

  /**
   * Syncs tasks from the daily planner store
   * This is called after any task mutation in the planner store
   */
  syncTasks(tasks: readonly Task[]): void {
    // Filter tasks to only include those created this week
    const currentWeekId = getCurrentWeekId();
    const weekTasks = tasks.filter((t) => {
      // Include tasks that have a project in current week
      if (t.projectId) {
        const project = this.state.projects.find((p) => p.id === t.projectId);
        return project && project.weekId === currentWeekId;
      }
      return true;
    });

    this.setState({
      ...this.state,
      tasks: weekTasks,
    });
  }

  /**
   * Updates a single task in the weekly state
   * Used when a task is updated in the planner store
   */
  updateTask(taskId: string, updates: Partial<Task>): ActionResult {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      // Task doesn't exist in weekly state, add it
      const newTask: Task = {
        id: taskId,
        title: updates.title ?? "",
        description: updates.description,
        tomatoCount: updates.tomatoCount ?? 0,
        finishedTomatoCount: updates.finishedTomatoCount ?? 0,
        projectId: updates.projectId,
        createdAt: updates.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.setState({
        ...this.state,
        tasks: [...this.state.tasks, newTask],
      });

      return { success: true };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes a task from the weekly state
   */
  removeTask(taskId: string): void {
    this.setState({
      ...this.state,
      tasks: this.state.tasks.filter((t) => t.id !== taskId),
    });
  }

  // ============================================
  // WEEK RESET
  // ============================================

  /**
   * Resets the week - clears all projects and tasks
   * Preserves capacity settings
   */
  resetWeek(): void {
    const newState = resetWeeklyStateForNewWeek(this.state);
    this.setState(newState);
  }

  /**
   * Clears all persisted state and resets to defaults
   */
  clearAllData(): void {
    clearWeeklyState();
    this.state = createInitialWeeklyState();
    this.notify();
  }

  // ============================================
  // SELECTORS
  // ============================================

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
   * Gets all projects
   */
  get projects(): readonly Project[] {
    return this.state.projects;
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
   * Gets all tasks
   */
  get tasks(): readonly Task[] {
    return this.state.tasks;
  }

  /**
   * Gets a task by ID
   */
  getTaskById(id: string): Task | undefined {
    return this.state.tasks.find((t) => t.id === id);
  }

  /**
   * Gets tasks for a specific project
   */
  getTasksForProject(projectId: string): readonly Task[] {
    return getProjectTasks(this.state, projectId);
  }

  /**
   * Gets project progress (finished and estimated tomatoes)
   */
  getProjectProgressById(projectId: string): {
    finished: number;
    estimated: number;
  } {
    return getProjectProgress(this.state, projectId);
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
}

// Export singleton instance
export const weeklyStore = new WeeklyStore();

// Export class for testing purposes
export { WeeklyStore };

// Export types for external use
export type { Subscriber, Unsubscribe, ActionResult };
