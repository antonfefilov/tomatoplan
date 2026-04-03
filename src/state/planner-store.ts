/**
 * Custom reactive store for Tomato Plan state management
 * Provides reactive state updates compatible with Lit components
 *
 * This store is now a thin layer over taskpoolStore for task management.
 * It maintains pool/capacity/date settings and derives today's tasks from taskpoolStore.
 */

import type { Task } from "../models/task.js";
import type { PlannerState } from "../models/planner-state.js";
import {
  createInitialPlannerState,
  recalculatePoolCapacity,
} from "../models/planner-state.js";
import { isStale } from "../models/tomato-pool.js";
import {
  validateDailyCapacity,
  validateTaskTitle,
  canAssignTomato,
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
import { taskpoolStore } from "./taskpool-store.js";
import { getTodayString } from "../models/tomato-pool.js";

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
 *
 * This store maintains pool/capacity/date settings and delegates
 * all task operations to taskpoolStore.
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

    // Subscribe to taskpoolStore to sync task changes
    // Keep reference alive for potential cleanup (though singleton lives for app lifetime)
    taskpoolStore.subscribe(() => {
      this.notify();
    });
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current state (returns a shallow copy to prevent direct mutation)
   */
  getState(): PlannerState {
    return { ...this.state };
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
  private setState(newState: PlannerState): void {
    this.state = newState;
    saveState(newState);
    this.notify();
  }

  /**
   * Gets today's tasks from taskpoolStore
   */
  private getTodayTasks(): Task[] {
    return taskpoolStore.getTasksForDay(this.state.pool.date);
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
   * Adds a new task and assigns it to today
   */
  addTask(
    title: string,
    description?: string,
  ): { success: boolean; error?: string; taskId?: string } {
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create task in taskpoolStore, assigned to today
    const result = taskpoolStore.addTask(title, description, {
      dayDate: this.state.pool.date,
    });

    return result;
  }

  /**
   * Updates an existing task
   */
  updateTask(
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description">>,
  ): { success: boolean; error?: string } {
    // Verify task exists in today's tasks
    const task = this.getTaskById(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.updateTask(taskId, updates);
  }

  /**
   * Removes a task
   */
  removeTask(taskId: string): { success: boolean; error?: string } {
    // Verify task exists in today's tasks
    const task = this.getTaskById(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.removeTask(taskId);
  }

  /**
   * Reorders a task to a new position in the list
   * Does not update updatedAt timestamp since reordering is not a content change
   */
  reorderTask(
    taskId: string,
    toIndex: number,
  ): { success: boolean; error?: string } {
    const fromIndex = this.tasks.findIndex((t) => t.id === taskId);

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
    if (toIndex < 0 || toIndex >= this.tasks.length) {
      return { success: false, error: "Invalid target index: out of bounds" };
    }

    // No change needed if moving to same position
    if (fromIndex === toIndex) {
      return { success: true };
    }

    return taskpoolStore.reorderTask(taskId, toIndex);
  }

  /**
   * Assigns one tomato to a task
   */
  assignTomato(taskId: string): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Check capacity before delegating to taskpool
    const validation = canAssignTomato(
      this.tasks,
      this.state.pool.dailyCapacity,
      task.tomatoCount,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return taskpoolStore.assignTomato(taskId);
  }

  /**
   * Removes one tomato from a task
   */
  unassignTomato(taskId: string): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.unassignTomato(taskId);
  }

  /**
   * Sets the exact tomato count for a task
   */
  setTomatoCount(
    taskId: string,
    count: number,
  ): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const validation = validateTomatoCount(count);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if we have enough capacity
    const totalAssigned = this.assignedTomatoes;
    const available =
      this.state.pool.dailyCapacity - totalAssigned + task.tomatoCount;

    if (count > available) {
      return {
        success: false,
        error: `Not enough tomatoes available. Maximum: ${available}`,
      };
    }

    return taskpoolStore.setTomatoCount(taskId, count);
  }

  /**
   * Marks one tomato as finished for the given task.
   * Only increments finishedTomatoCount; the planned tomatoCount stays unchanged.
   */
  markTomatoAsFinished(taskId: string): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.markTomatoAsFinished(taskId);
  }

  /**
   * Marks one tomato as unfinished for the given task
   */
  markTomatoAsUnfinished(taskId: string): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.markTomatoAsUnfinished(taskId);
  }

  /**
   * Sets the exact finished tomato count for a task.
   * The count can exceed the planned tomato count (actual/factual can be greater than planned).
   */
  setFinishedTomatoCount(
    taskId: string,
    count: number,
  ): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.setFinishedTomatoCount(taskId, count);
  }

  /**
   * Marks a task as done by setting finishedTomatoCount to at least tomatoCount.
   * This is a one-way convenience action - if finished already >= planned, no change.
   */
  markTaskDone(taskId: string): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    return taskpoolStore.markTaskDone(taskId);
  }

  /**
   * Sets the project ID for a task
   * Pass undefined to unassign from project
   */
  setTaskProject(
    taskId: string,
    projectId: string | undefined,
  ): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (projectId === undefined) {
      return taskpoolStore.unassignTaskFromProject(taskId);
    }
    return taskpoolStore.setTaskProject(taskId, projectId);
  }

  /**
   * Sets the track ID for a task
   * Pass undefined to unassign from track
   */
  setTaskTrack(
    taskId: string,
    trackId: string | undefined,
  ): { success: boolean; error?: string } {
    const task = this.getTaskById(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (trackId === undefined) {
      return taskpoolStore.unassignTaskFromTrack(taskId);
    }
    return taskpoolStore.setTaskTrack(taskId, trackId);
  }

  /**
   * Unassigns all tasks from a given project
   * Used when a project is deleted to ensure tasks don't reference a non-existent project
   */
  unassignTasksFromProject(projectId: string): void {
    // Find today's tasks assigned to this project and unassign them
    const todayTasks = this.tasks.filter((t) => t.projectId === projectId);
    for (const task of todayTasks) {
      taskpoolStore.unassignTaskFromProject(task.id);
    }
  }

  /**
   * Resets the day - unassigns all tasks from today and refreshes the pool
   * Tasks are NOT deleted - they stay in taskpoolStore, just unassigned from today
   * Preserves dayStart, dayEnd, and capacityInMinutes from the current state
   */
  resetDay(): void {
    // Get all tasks assigned to current day
    const todayTasks = taskpoolStore.getTasksForDay(this.state.pool.date);

    // Unassign them from today (they stay in taskpoolStore)
    for (const task of todayTasks) {
      taskpoolStore.unassignTaskFromDay(task.id);
    }

    // Create new pool with same settings but new date
    const newState = createInitialPlannerState(
      this.state.pool.dailyCapacity,
      this.state.pool.capacityInMinutes,
      this.state.pool.dayStart,
      this.state.pool.dayEnd,
    );

    // Update pool date to today
    this.state = {
      ...this.state,
      pool: {
        ...newState.pool,
        date: getTodayString(),
      },
    };

    saveState(this.state);
    this.notify();
  }

  /**
   * Clears all persisted state and resets to defaults
   */
  clearAllData(): void {
    clearState();
    taskpoolStore.clearAllData();
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
    return this.tasks.reduce((sum, task) => sum + task.tomatoCount, 0);
  }

  /**
   * Gets the number of tomatoes remaining for assignment
   */
  get remainingTomatoes(): number {
    return this.state.pool.dailyCapacity - this.assignedTomatoes;
  }

  /**
   * Checks if all tomatoes have been assigned
   */
  get isAtCapacity(): boolean {
    return this.remainingTomatoes <= 0;
  }

  /**
   * Checks if tomatoes have been over-assigned
   */
  get isOverCapacity(): boolean {
    return this.remainingTomatoes < 0;
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
   * Gets all tasks for today (derived from taskpoolStore)
   */
  get tasks(): readonly Task[] {
    return this.getTodayTasks();
  }

  /**
   * Gets a task by ID from today's tasks
   */
  getTaskById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  /**
   * Gets tasks sorted by tomato count (descending)
   */
  getTasksSortedByTomatoes(): readonly Task[] {
    return [...this.tasks].sort((a, b) => b.tomatoCount - a.tomatoCount);
  }

  /**
   * Gets tasks that have at least one tomato assigned
   */
  getTasksWithTomatoes(): readonly Task[] {
    return this.tasks.filter((t) => t.tomatoCount > 0);
  }

  /**
   * Gets the number of tasks
   */
  get taskCount(): number {
    return this.tasks.length;
  }

  /**
   * Gets the total number of finished tomatoes across all tasks
   */
  getFinishedTomatoes(): number {
    return this.tasks.reduce(
      (total, task) => total + task.finishedTomatoCount,
      0,
    );
  }

  /**
   * Gets tasks that have at least one finished tomato
   */
  getTasksWithFinishedTomatoes(): readonly Task[] {
    return this.tasks.filter((t) => t.finishedTomatoCount > 0);
  }
}

// Export singleton instance
export const plannerStore = new PlannerStore();

// Export class for testing purposes
export { PlannerStore };

// Export types for external use
export type { Subscriber, Unsubscribe };
