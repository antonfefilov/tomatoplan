/**
 * Custom reactive store for Tomato Plan state management
 * Provides reactive state updates compatible with Lit components
 */

import type { Task } from "../models/task.js";
import {
  markTomatoAsFinished,
  markTomatoAsUnfinished,
  updateTaskFinishedCount,
  markTaskDone as markTaskDoneModel,
} from "../models/task.js";
import type { PlannerState } from "../models/planner-state.js";
import {
  createInitialPlannerState,
  getTotalAssignedTomatoes,
  getRemainingTomatoes,
  isAtCapacity,
  isOverCapacity,
  recalculatePoolCapacity,
} from "../models/planner-state.js";
import { isStale } from "../models/tomato-pool.js";
import { generateId } from "../utils/id.js";
import {
  validateDailyCapacity,
  validateTaskTitle,
  canAssignTomato,
  canUnassignTomato,
  validateTomatoCount,
  validateTimeString,
  validateTimeRange,
} from "../utils/validation.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
} from "../constants/defaults.js";
import { loadState, saveState, clearState } from "./persistence.js";
import { weeklyStore } from "./weekly-store.js";

/** Type for subscriber callback functions */
type Subscriber = (state: PlannerState) => void;

/** Unsubscribe function returned when subscribing */
type Unsubscribe = () => void;

/**
 * PlannerStore - Reactive state store for the Tomato Plan
 *
 * Implements a simple pub/sub pattern for reactivity:
 * - Components subscribe to state changes
 * - Actions modify state and notify subscribers
 * - Selectors provide computed values
 */
class PlannerStore {
  private state: PlannerState;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    // Try to load persisted state, or create initial state
    const persistedState = loadState();

    if (persistedState && !isStale(persistedState.pool)) {
      // Use persisted state if it's from today
      // Handle backward compatibility: default to 25 minutes if not present
      // dayStart and dayEnd default to 08:00 and 18:25 if not present
      const capacityInMinutes =
        persistedState.pool.capacityInMinutes ?? DEFAULT_CAPACITY_IN_MINUTES;
      const dayStart = persistedState.pool.dayStart ?? DEFAULT_DAY_START;
      const dayEnd = persistedState.pool.dayEnd ?? DEFAULT_DAY_END;
      this.state = createInitialPlannerState(
        persistedState.pool.dailyCapacity,
        capacityInMinutes,
        dayStart,
        dayEnd,
      );
      this.state = {
        ...this.state,
        pool: {
          ...persistedState.pool,
          capacityInMinutes,
          dayStart,
          dayEnd,
        },
        tasks: persistedState.tasks,
      };
    } else {
      // Create fresh state for a new day
      const savedCapacity =
        persistedState?.pool.dailyCapacity ?? DEFAULT_DAILY_CAPACITY;
      const savedCapacityInMinutes =
        persistedState?.pool.capacityInMinutes ?? DEFAULT_CAPACITY_IN_MINUTES;
      const savedDayStart = persistedState?.pool.dayStart ?? DEFAULT_DAY_START;
      const savedDayEnd = persistedState?.pool.dayEnd ?? DEFAULT_DAY_END;
      this.state = createInitialPlannerState(
        savedCapacity,
        savedCapacityInMinutes,
        savedDayStart,
        savedDayEnd,
      );
    }
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current state (returns a shallow copy to prevent direct mutation)
   */
  getState(): PlannerState {
    return { ...this.state, tasks: [...this.state.tasks] };
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
   * Also syncs tasks to weekly store
   */
  private setState(newState: PlannerState): void {
    this.state = newState;
    saveState(newState);
    weeklyStore.syncTasks(newState.tasks);
    this.notify();
  }

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Sets the daily tomato capacity
   */
  setCapacity(capacity: number): { success: boolean; error?: string } {
    const validation = validateDailyCapacity(capacity);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.setState({
      ...this.state,
      pool: {
        ...this.state.pool,
        dailyCapacity: capacity,
      },
    });

    return { success: true };
  }

  /**
   * Sets the duration of each tomato in minutes
   * Also recalculates daily capacity based on the new duration
   */
  setCapacityInMinutes(minutes: number): { success: boolean; error?: string } {
    if (typeof minutes !== "number" || minutes < 1 || minutes > 60) {
      return {
        success: false,
        error: "Capacity in minutes must be between 1 and 60",
      };
    }

    const updatedPool = recalculatePoolCapacity({
      ...this.state.pool,
      capacityInMinutes: minutes,
    });

    this.setState({
      ...this.state,
      pool: updatedPool,
    });

    return { success: true };
  }

  /**
   * Sets the day start time (HH:MM format)
   * Recalculates daily capacity based on the new time range
   */
  setDayStart(time: string): { success: boolean; error?: string } {
    const timeValidation = validateTimeString(time);
    if (!timeValidation.valid) {
      return { success: false, error: timeValidation.error };
    }

    const rangeValidation = validateTimeRange(time, this.state.pool.dayEnd);
    if (!rangeValidation.valid) {
      return { success: false, error: rangeValidation.error };
    }

    const updatedPool = recalculatePoolCapacity({
      ...this.state.pool,
      dayStart: time,
    });

    this.setState({
      ...this.state,
      pool: updatedPool,
    });

    return { success: true };
  }

  /**
   * Sets the day end time (HH:MM format)
   * Recalculates daily capacity based on the new time range
   */
  setDayEnd(time: string): { success: boolean; error?: string } {
    const timeValidation = validateTimeString(time);
    if (!timeValidation.valid) {
      return { success: false, error: timeValidation.error };
    }

    const rangeValidation = validateTimeRange(this.state.pool.dayStart, time);
    if (!rangeValidation.valid) {
      return { success: false, error: rangeValidation.error };
    }

    const updatedPool = recalculatePoolCapacity({
      ...this.state.pool,
      dayEnd: time,
    });

    this.setState({
      ...this.state,
      pool: updatedPool,
    });

    return { success: true };
  }

  /**
   * Adds a new task
   */
  addTask(
    title: string,
    description?: string,
  ): { success: boolean; error?: string; taskId?: string } {
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const taskId = generateId();
    const now = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      description: description?.trim(),
      tomatoCount: 0,
      finishedTomatoCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.setState({
      ...this.state,
      tasks: [...this.state.tasks, newTask],
    });

    return { success: true, taskId };
  }

  /**
   * Updates an existing task
   */
  updateTask(
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description">>,
  ): { success: boolean; error?: string } {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    if (updates.title !== undefined) {
      const validation = validateTaskTitle(updates.title);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    const updatedTasks = [...this.state.tasks];
    const existingTask = updatedTasks[taskIndex]!;

    updatedTasks[taskIndex] = {
      ...existingTask,
      ...updates,
      title: updates.title?.trim() ?? existingTask.title,
      description:
        "description" in updates
          ? (updates.description ?? "").trim() || undefined
          : existingTask.description,
      updatedAt: new Date().toISOString(),
    };

    this.setState({
      ...this.state,
      tasks: updatedTasks,
    });

    return { success: true };
  }

  /**
   * Removes a task
   */
  removeTask(taskId: string): { success: boolean; error?: string } {
    const taskIndex = this.state.tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.filter((t) => t.id !== taskId),
    });

    return { success: true };
  }

  /**
   * Reorders a task to a new position in the list
   * Does not update updatedAt timestamp since reordering is not a content change
   */
  reorderTask(
    taskId: string,
    toIndex: number,
  ): { success: boolean; error?: string } {
    const fromIndex = this.state.tasks.findIndex((t) => t.id === taskId);

    if (fromIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    // Validate toIndex is a finite integer
    if (
      typeof toIndex !== "number" ||
      !Number.isFinite(toIndex) ||
      !Number.isInteger(toIndex)
    ) {
      return {
        success: false,
        error: "Invalid target index: must be an integer",
      };
    }

    // Validate toIndex is within bounds
    if (toIndex < 0 || toIndex >= this.state.tasks.length) {
      return { success: false, error: "Invalid target index: out of bounds" };
    }

    // No change needed if moving to same position
    if (fromIndex === toIndex) {
      return { success: true };
    }

    // Immutably reorder the tasks array
    const tasks = [...this.state.tasks];
    const [movedTask] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, movedTask!);

    // Update state without changing updatedAt on tasks
    this.setState({
      ...this.state,
      tasks,
    });

    return { success: true };
  }

  /**
   * Assigns one tomato to a task
   */
  assignTomato(taskId: string): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const validation = canAssignTomato(this.state, task.tomatoCount);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newCount = task.tomatoCount + 1;
    const countValidation = validateTomatoCount(newCount);
    if (!countValidation.valid) {
      return { success: false, error: countValidation.error };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, tomatoCount: newCount, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Removes one tomato from a task
   */
  unassignTomato(taskId: string): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const validation = canUnassignTomato(task.tomatoCount);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              tomatoCount: task.tomatoCount - 1,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Sets the exact tomato count for a task
   */
  setTomatoCount(
    taskId: string,
    count: number,
  ): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const validation = validateTomatoCount(count);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if we have enough capacity
    const totalAssigned = getTotalAssignedTomatoes(this.state);
    const available =
      this.state.pool.dailyCapacity - totalAssigned + task.tomatoCount;

    if (count > available) {
      return {
        success: false,
        error: `Not enough tomatoes available. Maximum: ${available}`,
      };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, tomatoCount: count, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Marks one tomato as finished for the given task.
   * Only increments finishedTomatoCount; the planned tomatoCount stays unchanged.
   */
  markTomatoAsFinished(taskId: string): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = markTomatoAsFinished(task);

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    });

    return { success: true };
  }

  /**
   * Marks one tomato as unfinished for the given task
   */
  markTomatoAsUnfinished(taskId: string): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Check if there are finished tomatoes to unmark
    if (task.finishedTomatoCount <= 0) {
      return {
        success: false,
        error: "No finished tomatoes to unmark.",
      };
    }

    const updatedTask = markTomatoAsUnfinished(task);

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    });

    return { success: true };
  }

  /**
   * Sets the exact finished tomato count for a task.
   * The count can exceed the planned tomato count (actual/factual can be greater than planned).
   */
  setFinishedTomatoCount(
    taskId: string,
    count: number,
  ): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Validate count is a non-negative number
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return {
        success: false,
        error: "Finished tomato count must be a non-negative integer.",
      };
    }

    const updatedTask = updateTaskFinishedCount(task, count);

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    });

    return { success: true };
  }

  /**
   * Marks a task as done by setting finishedTomatoCount to at least tomatoCount.
   * This is a one-way convenience action - if finished already >= planned, no change.
   */
  markTaskDone(taskId: string): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = markTaskDoneModel(task);

    // If no change needed, still return success
    if (updatedTask === task) {
      return { success: true };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    });

    return { success: true };
  }

  /**
   * Sets the project ID for a task
   * Pass undefined to unassign from project
   */
  setTaskProject(
    taskId: string,
    projectId: string | undefined,
  ): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
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
   * Sets the track ID for a task
   * Pass undefined to unassign from track
   */
  setTaskTrack(
    taskId: string,
    trackId: string | undefined,
  ): { success: boolean; error?: string } {
    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, trackId, updatedAt: new Date().toISOString() }
          : t,
      ),
    });

    return { success: true };
  }

  /**
   * Unassigns all tasks from a given project
   * Used when a project is deleted to ensure tasks don't reference a non-existent project
   */
  unassignTasksFromProject(projectId: string): void {
    const tasksToUpdate = this.state.tasks.filter(
      (t) => t.projectId === projectId,
    );

    if (tasksToUpdate.length === 0) {
      return; // No tasks to update
    }

    this.setState({
      ...this.state,
      tasks: this.state.tasks.map((t) =>
        t.projectId === projectId
          ? { ...t, projectId: undefined, updatedAt: new Date().toISOString() }
          : t,
      ),
    });
  }

  /**
   * Resets the day - clears all tasks and refreshes the pool
   * Preserves dayStart, dayEnd, and capacityInMinutes from the current state
   */
  resetDay(): void {
    const newState = createInitialPlannerState(
      this.state.pool.dailyCapacity,
      this.state.pool.capacityInMinutes,
      this.state.pool.dayStart,
      this.state.pool.dayEnd,
    );
    this.setState(newState);
  }

  /**
   * Clears all persisted state and resets to defaults
   */
  clearAllData(): void {
    clearState();
    this.state = createInitialPlannerState(DEFAULT_DAILY_CAPACITY);
    this.notify();
  }

  // ============================================
  // SELECTORS
  // ============================================

  /**
   * Gets the total number of tomatoes assigned across all tasks
   */
  get assignedTomatoes(): number {
    return getTotalAssignedTomatoes(this.state);
  }

  /**
   * Gets the number of tomatoes remaining for assignment
   */
  get remainingTomatoes(): number {
    return getRemainingTomatoes(this.state);
  }

  /**
   * Checks if all tomatoes have been assigned
   */
  get isAtCapacity(): boolean {
    return isAtCapacity(this.state);
  }

  /**
   * Checks if tomatoes have been over-assigned
   */
  get isOverCapacity(): boolean {
    return isOverCapacity(this.state);
  }

  /**
   * Gets the daily capacity
   */
  get dailyCapacity(): number {
    return this.state.pool.dailyCapacity;
  }

  /**
   * Gets the capacity per tomato in minutes
   */
  get capacityInMinutes(): number {
    return this.state.pool.capacityInMinutes;
  }

  /**
   * Gets the day start time (HH:MM format)
   */
  get dayStart(): string {
    return this.state.pool.dayStart;
  }

  /**
   * Gets the day end time (HH:MM format)
   */
  get dayEnd(): string {
    return this.state.pool.dayEnd;
  }

  /**
   * Gets the current date string
   */
  get currentDate(): string {
    return this.state.pool.date;
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
   * Gets tasks sorted by tomato count (descending)
   */
  getTasksSortedByTomatoes(): readonly Task[] {
    return [...this.state.tasks].sort((a, b) => b.tomatoCount - a.tomatoCount);
  }

  /**
   * Gets tasks that have at least one tomato assigned
   */
  getTasksWithTomatoes(): readonly Task[] {
    return this.state.tasks.filter((t) => t.tomatoCount > 0);
  }

  /**
   * Gets the number of tasks
   */
  get taskCount(): number {
    return this.state.tasks.length;
  }

  /**
   * Gets the total number of finished tomatoes across all tasks
   */
  getFinishedTomatoes(): number {
    return this.state.tasks.reduce(
      (total, task) => total + task.finishedTomatoCount,
      0,
    );
  }

  /**
   * Gets tasks that have at least one finished tomato
   */
  getTasksWithFinishedTomatoes(): readonly Task[] {
    return this.state.tasks.filter((t) => t.finishedTomatoCount > 0);
  }
}

// Export singleton instance
export const plannerStore = new PlannerStore();

// Export class for testing purposes
export { PlannerStore };

// Export types for external use
export type { Subscriber, Unsubscribe };
