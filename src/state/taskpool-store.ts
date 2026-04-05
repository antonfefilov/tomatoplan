/**
 * Custom reactive store for Taskpool State management
 * Provides reactive state updates compatible with Lit components
 * This is the canonical task store for task-day assignments
 */

import type { Task } from "../models/task.js";
import {
  markTomatoAsFinished as markTomatoAsFinishedModel,
  markTomatoAsUnfinished as markTomatoAsUnfinishedModel,
  updateTaskFinishedCount,
  markTaskDone as markTaskDoneModel,
} from "../models/task.js";
import type { TaskpoolState } from "../models/taskpool-state.js";
import {
  isValidDayDate,
  assignTaskToDay as assignTaskToDayHelper,
  unassignTaskFromDay as unassignTaskFromDayHelper,
  getTasksForDay as getTasksForDayHelper,
  removeTaskFromDayBucket,
} from "../models/taskpool-state.js";
import { generateId } from "../utils/id.js";
import { validateTaskTitle, validateTomatoCount } from "../utils/validation.js";
import {
  saveTaskpoolState,
  loadTaskpoolState,
  createInitialTaskpoolState,
  clearTaskpoolState,
  migrateTasksFromPlannerState,
} from "./taskpool-persistence.js";
import { loadPlannerStateForMigration } from "./persistence.js";

/** Type for subscriber callback functions */
type Subscriber = (state: TaskpoolState) => void;

/** Unsubscribe function returned when subscribing */
type Unsubscribe = () => void;

/** Result type for store actions */
interface ActionResult {
  success: boolean;
  error?: string;
  taskId?: string;
}

/** Options for creating a new task */
interface AddTaskOptions {
  /** Optional description */
  description?: string;
  /** Optional project assignment */
  projectId?: string;
  /** Optional track assignment */
  trackId?: string;
  /** Optional day assignment (YYYY-MM-DD) */
  dayDate?: string;
  /** Initial tomato count */
  tomatoCount?: number;
}

/**
 * TaskpoolStore - Reactive state store for canonical task management
 *
 * Implements a simple pub/sub pattern for reactivity:
 * - Components subscribe to state changes
 * - Actions modify state and notify subscribers
 * - Selectors provide computed values
 *
 * This store is the canonical source for tasks and their day assignments.
 */
class TaskpoolStore {
  private state: TaskpoolState;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    // Try to load persisted taskpool state
    const persistedState = loadTaskpoolState();

    if (persistedState) {
      this.state = persistedState;
    } else {
      // No taskpool state - check for legacy planner tasks to migrate
      this.state = createInitialTaskpoolState();

      const legacyState = loadPlannerStateForMigration();
      if (legacyState && legacyState.tasks.length > 0) {
        // Migrate legacy tasks using the instance method
        this.migrateFromPlannerState(legacyState.tasks, legacyState.savedDate);
      }
    }
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current state (returns a shallow copy to prevent direct mutation)
   */
  getState(): TaskpoolState {
    return {
      ...this.state,
      dayAssignments: new Map(this.state.dayAssignments),
      tasks: new Map(this.state.tasks),
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
  private setState(newState: TaskpoolState): void {
    this.state = newState;
    saveTaskpoolState(newState);
    this.notify();
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Adds a new task to the taskpool
   */
  addTask(
    title: string,
    description?: string,
    options?: AddTaskOptions,
  ): ActionResult {
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Validate tomato count if provided
    if (options?.tomatoCount !== undefined) {
      const countValidation = validateTomatoCount(options.tomatoCount);
      if (!countValidation.valid) {
        return { success: false, error: countValidation.error };
      }
    }

    // Validate dayDate if provided
    if (options?.dayDate !== undefined && !isValidDayDate(options.dayDate)) {
      return {
        success: false,
        error: "Invalid day date format (use YYYY-MM-DD)",
      };
    }

    const taskId = generateId();
    const now = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      description: description?.trim() || options?.description?.trim(),
      tomatoCount: options?.tomatoCount ?? 0,
      finishedTomatoCount: 0,
      projectId: options?.projectId,
      trackId: options?.trackId,
      dayDate: options?.dayDate,
      createdAt: now,
      updatedAt: now,
    };

    // Add task to tasks map
    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, newTask);

    // If dayDate is provided, add to day assignments
    let newDayAssignments = this.state.dayAssignments;
    if (newTask.dayDate) {
      newDayAssignments = new Map(this.state.dayAssignments);
      const currentDayTasks = newDayAssignments.get(newTask.dayDate) ?? [];
      newDayAssignments.set(newTask.dayDate, [...currentDayTasks, taskId]);
    }

    this.setState({
      ...this.state,
      tasks: newTasks,
      dayAssignments: newDayAssignments,
    });

    return { success: true, taskId };
  }

  /**
   * Imports tasks from an external source (e.g., weeklyStore sync).
   * Adds tasks with their existing IDs to the taskpool.
   * This is used for backwards compatibility when tests add tasks via syncTasks.
   */
  importTasks(tasks: readonly Task[]): void {
    const newTasks = new Map(this.state.tasks);
    let newDayAssignments = new Map(this.state.dayAssignments);

    for (const task of tasks) {
      // Validate task
      if (!task.id || !task.title) {
        continue; // Skip invalid tasks
      }

      // Check if task already exists with a different dayDate
      const existingTask = this.state.tasks.get(task.id);
      if (existingTask?.dayDate && existingTask.dayDate !== task.dayDate) {
        // Remove from old day's assignment (with proper empty bucket cleanup)
        newDayAssignments = removeTaskFromDayBucket(
          newDayAssignments,
          existingTask.dayDate,
          task.id,
        );
      }

      // Merge with existing task to preserve local fields
      // Local fields (managed locally): trackId, projectId, finishedTomatoCount
      // Content fields (from import): title, description, tomatoCount, dayDate
      const mergedTask: Task = existingTask
        ? {
            ...task, // Start with imported task data
            // Preserve local fields from existing task
            trackId: existingTask.trackId,
            projectId: existingTask.projectId,
            finishedTomatoCount: existingTask.finishedTomatoCount,
          }
        : { ...task };

      // Add to tasks map
      newTasks.set(task.id, mergedTask);

      // Update day assignments if task has a dayDate
      if (task.dayDate) {
        const currentDayTasks = newDayAssignments.get(task.dayDate) || [];
        if (!currentDayTasks.includes(task.id)) {
          newDayAssignments.set(task.dayDate, [...currentDayTasks, task.id]);
        }
      }
    }

    this.setState({
      ...this.state,
      tasks: newTasks,
      dayAssignments: newDayAssignments,
    });
  }

  /**
   * Updates an existing task's fields
   */
  updateTask(
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "tomatoCount">>,
  ): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (updates.title !== undefined) {
      const validation = validateTaskTitle(updates.title);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    if (updates.tomatoCount !== undefined) {
      const countValidation = validateTomatoCount(updates.tomatoCount);
      if (!countValidation.valid) {
        return { success: false, error: countValidation.error };
      }

      // Ensure finished count doesn't exceed new tomato count
      if (updates.tomatoCount < task.finishedTomatoCount) {
        updates = {
          ...updates,
          tomatoCount: updates.tomatoCount,
        };
        // Note: We don't adjust finishedTomatoCount here automatically
        // The caller should handle this if needed
      }
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      title: updates.title !== undefined ? updates.title.trim() : task.title,
      description:
        updates.description !== undefined
          ? updates.description?.trim() || undefined
          : task.description,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Removes a task from the taskpool
   */
  removeTask(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Remove from tasks map
    const newTasks = new Map(this.state.tasks);
    newTasks.delete(taskId);

    // Remove from day assignments if assigned
    let newDayAssignments = this.state.dayAssignments;
    if (task.dayDate) {
      newDayAssignments = new Map(this.state.dayAssignments);
      const dayTasks = newDayAssignments.get(task.dayDate) ?? [];
      const filtered = dayTasks.filter((id) => id !== taskId);
      if (filtered.length > 0) {
        newDayAssignments.set(task.dayDate, filtered);
      } else {
        newDayAssignments.delete(task.dayDate);
      }
    }

    this.setState({
      ...this.state,
      tasks: newTasks,
      dayAssignments: newDayAssignments,
    });

    return { success: true };
  }

  // ============================================
  // TOMATO MUTATION OPERATIONS
  // ============================================

  /**
   * Assigns one tomato to a task (increments tomatoCount)
   */
  assignTomato(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const newCount = task.tomatoCount + 1;
    const countValidation = validateTomatoCount(newCount);
    if (!countValidation.valid) {
      return { success: false, error: countValidation.error };
    }

    const updatedTask: Task = {
      ...task,
      tomatoCount: newCount,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Removes one tomato from a task (decrements tomatoCount)
   */
  unassignTomato(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.tomatoCount <= 0) {
      return { success: false, error: "No tomatoes assigned to this task" };
    }

    const newCount = task.tomatoCount - 1;
    const updatedTask: Task = {
      ...task,
      tomatoCount: newCount,
      // Adjust finished count if it exceeds new tomato count
      finishedTomatoCount: Math.min(task.finishedTomatoCount, newCount),
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Marks one tomato as finished for the given task
   * Increments finishedTomatoCount; the planned tomatoCount stays unchanged
   */
  markTomatoAsFinished(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = markTomatoAsFinishedModel(task);

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Marks one tomato as unfinished for the given task
   * Decrements finishedTomatoCount (will not go below 0)
   */
  markTomatoAsUnfinished(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.finishedTomatoCount <= 0) {
      return { success: false, error: "No finished tomatoes to unmark" };
    }

    const updatedTask = markTomatoAsUnfinishedModel(task);

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Sets the exact tomato count for a task
   */
  setTomatoCount(taskId: string, count: number): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const validation = validateTomatoCount(count);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const updatedTask: Task = {
      ...task,
      tomatoCount: count,
      finishedTomatoCount: Math.min(task.finishedTomatoCount, count),
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Sets the exact finished tomato count for a task
   * The count can exceed the planned tomato count (actual can be greater than planned)
   */
  setFinishedTomatoCount(taskId: string, count: number): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Validate count is a non-negative integer
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return {
        success: false,
        error: "Finished tomato count must be a non-negative integer",
      };
    }

    const updatedTask = updateTaskFinishedCount(task, count);

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Marks a task as done by setting finishedTomatoCount to at least tomatoCount
   */
  markTaskDone(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = markTaskDoneModel(task);

    // If no change needed, still return success
    if (updatedTask === task) {
      return { success: true };
    }

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  // ============================================
  // PROJECT/TRACK/DAY ASSIGNMENT OPERATIONS
  // ============================================

  /**
   * Sets the project ID for a task
   */
  setTaskProject(taskId: string, projectId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask: Task = {
      ...task,
      projectId,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Removes a task from its project
   */
  unassignTaskFromProject(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!task.projectId) {
      return { success: true }; // Already unassigned
    }

    const updatedTask: Task = {
      ...task,
      projectId: undefined,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Sets the track ID for a task
   */
  setTaskTrack(taskId: string, trackId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask: Task = {
      ...task,
      trackId,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Removes a task from its track
   */
  unassignTaskFromTrack(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!task.trackId) {
      return { success: true }; // Already unassigned
    }

    const updatedTask: Task = {
      ...task,
      trackId: undefined,
      updatedAt: new Date().toISOString(),
    };

    const newTasks = new Map(this.state.tasks);
    newTasks.set(taskId, updatedTask);

    this.setState({
      ...this.state,
      tasks: newTasks,
    });

    return { success: true };
  }

  /**
   * Assigns a task to a specific day
   */
  assignTaskToDay(taskId: string, dayDate: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!isValidDayDate(dayDate)) {
      return {
        success: false,
        error: "Invalid day date format (use YYYY-MM-DD)",
      };
    }

    const newState = assignTaskToDayHelper(this.state, taskId, dayDate);

    this.setState(newState);

    return { success: true };
  }

  /**
   * Removes a task's day assignment
   */
  unassignTaskFromDay(taskId: string): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!task.dayDate) {
      return { success: true }; // Already unassigned
    }

    const newState = unassignTaskFromDayHelper(this.state, taskId);

    this.setState(newState);

    return { success: true };
  }

  /**
   * Reorders a task within its day assignment list
   */
  reorderTask(taskId: string, toIndex: number): ActionResult {
    const task = this.state.tasks.get(taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!task.dayDate) {
      return { success: false, error: "Task is not assigned to a day" };
    }

    const dayTasks = this.state.dayAssignments.get(task.dayDate) ?? [];
    const fromIndex = dayTasks.indexOf(taskId);

    if (fromIndex === -1) {
      return { success: false, error: "Task not found in day assignments" };
    }

    // Validate toIndex
    if (typeof toIndex !== "number" || !Number.isInteger(toIndex)) {
      return {
        success: false,
        error: "Invalid target index: must be an integer",
      };
    }

    if (toIndex < 0 || toIndex >= dayTasks.length) {
      return { success: false, error: "Invalid target index: out of bounds" };
    }

    // No change needed if moving to same position
    if (fromIndex === toIndex) {
      return { success: true };
    }

    // Immutably reorder the array
    const reordered = [...dayTasks];
    const [movedTask] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedTask!);

    // Update day assignments
    const newDayAssignments = new Map(this.state.dayAssignments);
    newDayAssignments.set(task.dayDate, reordered);

    this.setState({
      ...this.state,
      dayAssignments: newDayAssignments,
    });

    return { success: true };
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Unassigns all tasks from a given project
   * Used when a project is deleted
   */
  unassignTasksFromProject(projectId: string): void {
    let hasChanges = false;
    const newTasks = new Map(this.state.tasks);

    for (const [taskId, task] of this.state.tasks) {
      if (task.projectId === projectId) {
        newTasks.set(taskId, {
          ...task,
          projectId: undefined,
          updatedAt: new Date().toISOString(),
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.setState({
        ...this.state,
        tasks: newTasks,
      });
    }
  }

  /**
   * Unassigns all tasks from a given track
   * Used when a track is deleted
   */
  unassignTasksFromTrack(trackId: string): void {
    let hasChanges = false;
    const newTasks = new Map(this.state.tasks);

    for (const [taskId, task] of this.state.tasks) {
      if (task.trackId === trackId) {
        newTasks.set(taskId, {
          ...task,
          trackId: undefined,
          updatedAt: new Date().toISOString(),
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.setState({
        ...this.state,
        tasks: newTasks,
      });
    }
  }

  /**
   * Migrates tasks from legacy planner state to the taskpool
   */
  migrateFromPlannerState(
    tasks: readonly Task[],
    targetDate: string,
  ): ActionResult {
    if (!isValidDayDate(targetDate)) {
      return {
        success: false,
        error: "Invalid target date format (use YYYY-MM-DD)",
      };
    }

    const migratedTasks = migrateTasksFromPlannerState(tasks, targetDate);
    const newTasks = new Map(this.state.tasks);
    let newDayAssignments = new Map(this.state.dayAssignments);

    // Add migrated tasks
    for (const task of migratedTasks) {
      // Check if task already exists with a different dayDate
      const existingTask = this.state.tasks.get(task.id);
      if (existingTask?.dayDate && existingTask.dayDate !== task.dayDate) {
        // Remove from old day's assignment (with proper empty bucket cleanup)
        newDayAssignments = removeTaskFromDayBucket(
          newDayAssignments,
          existingTask.dayDate,
          task.id,
        );
      }

      newTasks.set(task.id, task);

      // Add to day assignments
      if (task.dayDate) {
        const currentDayTasks = newDayAssignments.get(task.dayDate) ?? [];
        if (!currentDayTasks.includes(task.id)) {
          newDayAssignments.set(task.dayDate, [...currentDayTasks, task.id]);
        }
      }
    }

    this.setState({
      ...this.state,
      tasks: newTasks,
      dayAssignments: newDayAssignments,
    });

    return { success: true };
  }

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Sets the active date for the taskpool view
   */
  setActiveDate(date: string): ActionResult {
    if (!isValidDayDate(date)) {
      return { success: false, error: "Invalid date format (use YYYY-MM-DD)" };
    }

    this.setState({
      ...this.state,
      activeDate: date,
    });

    return { success: true };
  }

  /**
   * Clears all persisted state and resets to defaults
   */
  clearAllData(): void {
    clearTaskpoolState();
    this.state = createInitialTaskpoolState();
    this.notify();
  }

  // ============================================
  // SELECTORS
  // ============================================

  /**
   * Gets all tasks as an array
   */
  getAllTasks(): Task[] {
    return Array.from(this.state.tasks.values());
  }

  /**
   * Gets a task by ID
   */
  getTaskById(id: string): Task | undefined {
    return this.state.tasks.get(id);
  }

  /**
   * Gets all tasks assigned to a specific day
   */
  getTasksForDay(dayDate: string): Task[] {
    return getTasksForDayHelper(this.state, dayDate);
  }

  /**
   * Gets tasks for the currently active date
   */
  getTasksForActiveDate(): Task[] {
    return getTasksForDayHelper(this.state, this.state.activeDate);
  }

  /**
   * Gets the active date
   */
  get activeDate(): string {
    return this.state.activeDate;
  }

  /**
   * Gets the total number of tasks
   */
  get taskCount(): number {
    return this.state.tasks.size;
  }

  /**
   * Gets the number of days with assigned tasks
   */
  get daysWithTasks(): number {
    return this.state.dayAssignments.size;
  }

  /**
   * Gets all day dates that have tasks assigned
   */
  getAllDaysWithTasks(): string[] {
    return Array.from(this.state.dayAssignments.keys());
  }

  /**
   * Gets the total tomatoes planned across all tasks
   */
  getTotalPlannedTomatoes(): number {
    let total = 0;
    for (const task of this.state.tasks.values()) {
      total += task.tomatoCount;
    }
    return total;
  }

  /**
   * Gets the total finished tomatoes across all tasks
   */
  getTotalFinishedTomatoes(): number {
    let total = 0;
    for (const task of this.state.tasks.values()) {
      total += task.finishedTomatoCount;
    }
    return total;
  }

  /**
   * Gets tasks assigned to a specific project
   */
  getTasksForProject(projectId: string): Task[] {
    return Array.from(this.state.tasks.values()).filter(
      (t) => t.projectId === projectId,
    );
  }

  /**
   * Gets tasks assigned to a specific track
   */
  getTasksForTrack(trackId: string): Task[] {
    return Array.from(this.state.tasks.values()).filter(
      (t) => t.trackId === trackId,
    );
  }

  /**
   * Gets tasks that are not assigned to any project
   */
  getUnassignedTasks(): Task[] {
    return Array.from(this.state.tasks.values()).filter((t) => !t.projectId);
  }

  /**
   * Gets tasks that are not assigned to any day
   */
  getTasksWithoutDay(): Task[] {
    return Array.from(this.state.tasks.values()).filter((t) => !t.dayDate);
  }

  /**
   * Gets the tomato pool for a specific day (planned and finished counts)
   */
  getDayTomatoPool(dayDate: string): { planned: number; finished: number } {
    const tasks = this.getTasksForDay(dayDate);
    let planned = 0;
    let finished = 0;
    for (const task of tasks) {
      planned += task.tomatoCount;
      finished += task.finishedTomatoCount;
    }
    return { planned, finished };
  }
}

// Export singleton instance
export const taskpoolStore = new TaskpoolStore();

// Export class for testing purposes
export { TaskpoolStore };

// Export types for external use
export type { Subscriber, Unsubscribe, ActionResult, AddTaskOptions };
