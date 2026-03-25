/**
 * Custom reactive store for Tomato Plan state management
 * Provides reactive state updates compatible with Lit components
 */

import type { Task } from "../models/task.js";
import type { PlannerState } from "../models/planner-state.js";
import {
  createInitialPlannerState,
  getTotalAssignedTomatoes,
  getRemainingTomatoes,
  isAtCapacity,
  isOverCapacity,
} from "../models/planner-state.js";
import { isStale } from "../models/tomato-pool.js";
import { generateId } from "../utils/id.js";
import {
  validateDailyCapacity,
  validateTaskTitle,
  canAssignTomato,
  canUnassignTomato,
  validateTomatoCount,
} from "../utils/validation.js";
import { DEFAULT_DAILY_CAPACITY } from "../constants/defaults.js";
import { loadState, saveState, clearState } from "./persistence.js";

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
      this.state = createInitialPlannerState(persistedState.pool.dailyCapacity);
      this.state = {
        ...this.state,
        pool: persistedState.pool,
        tasks: persistedState.tasks,
      };
    } else {
      // Create fresh state for a new day
      const savedCapacity =
        persistedState?.pool.dailyCapacity ?? DEFAULT_DAILY_CAPACITY;
      this.state = createInitialPlannerState(savedCapacity);
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
   */
  private setState(newState: PlannerState): void {
    this.state = newState;
    saveState(newState);
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
        updates.description !== undefined
          ? updates.description?.trim()
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
   * Resets the day - clears all tasks and refreshes the pool
   */
  resetDay(): void {
    const newState = createInitialPlannerState(this.state.pool.dailyCapacity);
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
}

// Export singleton instance
export const plannerStore = new PlannerStore();

// Export class for testing purposes
export { PlannerStore };

// Export types for external use
export type { Subscriber, Unsubscribe };
