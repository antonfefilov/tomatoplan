/**
 * Taskpool state model for canonical task-day assignments.
 * Provides persistence types and migration helpers for legacy tasks.
 */

import type { Task } from "./task.js";

/**
 * Date string format type (YYYY-MM-DD)
 */
export type DayDateString = string; // Runtime validation via isValidDayDate()

/**
 * Validates that a string is in YYYY-MM-DD format.
 */
export function isValidDayDate(
  date: string | undefined,
): date is DayDateString {
  if (!date) return false;
  // YYYY-MM-DD regex pattern
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(date)) return false;
  // Validate it's a real date
  const parsed = new Date(date + "T00:00:00Z");
  return !isNaN(parsed.getTime());
}

/**
 * Legacy task format (before dayDate was introduced).
 * Used for migration from older persisted data.
 */
export interface LegacyTask {
  readonly id: string;
  title: string;
  description?: string;
  tomatoCount: number;
  finishedTomatoCount: number;
  projectId?: string;
  trackId?: string;
  readonly createdAt: string;
  updatedAt: string;
  // Note: no dayDate field
}

/**
 * Type guard to check if a task is a legacy task (missing dayDate).
 */
export function isLegacyTask(task: Task | LegacyTask): task is LegacyTask {
  return !("dayDate" in task) || task.dayDate === undefined;
}

/**
 * Migrates a legacy task to the current format.
 * The dayDate will be undefined (not assigned to any day).
 */
export function migrateLegacyTask(legacyTask: LegacyTask): Task {
  return {
    ...legacyTask,
    // dayDate is intentionally undefined for migrated tasks
    // They will be assigned to a day by the user or system later
  };
}

/**
 * Migrates an array of tasks, handling both legacy and current formats.
 * Ensures all tasks conform to the current Task interface.
 */
export function migrateTasks(tasks: Array<Task | LegacyTask>): Task[] {
  return tasks.map((task) => {
    // If already has dayDate field (even if undefined), it's current format
    if ("dayDate" in task) {
      return task as Task;
    }
    // Migrate legacy task
    return migrateLegacyTask(task);
  });
}

/**
 * Taskpool persistence state - stores canonical task-day assignments.
 */
export interface TaskpoolState {
  /** Version of the state schema for migration purposes */
  readonly version: number;

  /** Map of day dates to task IDs assigned to that day */
  readonly dayAssignments: Map<string, string[]>;

  /** All tasks indexed by ID */
  readonly tasks: Map<string, Task>;

  /** The current/pinned date for the taskpool view */
  readonly activeDate: string;
}

/** Current schema version for TaskpoolState */
export const TASKPOOL_STATE_VERSION = 1;

/**
 * Creates an empty taskpool state for a given date.
 */
export function createEmptyTaskpoolState(date: string): TaskpoolState {
  return {
    version: TASKPOOL_STATE_VERSION,
    dayAssignments: new Map(),
    tasks: new Map(),
    activeDate: date,
  };
}

/**
 * Persisted format for storage (Maps converted to arrays/objects).
 */
export interface PersistedTaskpoolState {
  readonly version: number;
  readonly dayAssignments: Record<string, string[]>;
  readonly tasks: Array<Task | LegacyTask>;
  readonly activeDate: string;
}

/**
 * Converts TaskpoolState to a JSON-serializable format for persistence.
 */
export function serializeTaskpoolState(
  state: TaskpoolState,
): PersistedTaskpoolState {
  const dayAssignments: Record<string, string[]> = {};
  state.dayAssignments.forEach((taskIds, date) => {
    dayAssignments[date] = taskIds;
  });

  return {
    version: state.version,
    dayAssignments,
    tasks: Array.from(state.tasks.values()),
    activeDate: state.activeDate,
  };
}

/**
 * Converts persisted data back to TaskpoolState.
 * Handles migration from legacy task formats.
 */
export function deserializeTaskpoolState(
  persisted: PersistedTaskpoolState,
): TaskpoolState {
  const dayAssignments = new Map<string, string[]>();
  Object.entries(persisted.dayAssignments).forEach(([date, taskIds]) => {
    dayAssignments.set(date, taskIds);
  });

  // Migrate tasks from legacy format if needed
  const migratedTasks = migrateTasks(persisted.tasks);

  const tasks = new Map<string, Task>();
  migratedTasks.forEach((task) => {
    tasks.set(task.id, task);
  });

  return {
    version: TASKPOOL_STATE_VERSION,
    dayAssignments,
    tasks,
    activeDate: persisted.activeDate,
  };
}

/**
 * Type guard to validate persisted taskpool state structure.
 */
export function isValidPersistedTaskpoolState(
  data: unknown,
): data is PersistedTaskpoolState {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.version !== "number") return false;
  if (typeof obj.activeDate !== "string") return false;
  if (!Array.isArray(obj.tasks)) return false;

  // Validate dayAssignments is an object
  if (!obj.dayAssignments || typeof obj.dayAssignments !== "object")
    return false;

  // Validate dayAssignments values are arrays of strings
  const assignments = obj.dayAssignments as Record<string, unknown>;
  for (const value of Object.values(assignments)) {
    if (!Array.isArray(value)) return false;
    if (!value.every((v) => typeof v === "string")) return false;
  }

  return true;
}

/**
 * Assigns a task to a specific day.
 * Updates both the task's dayDate and the day assignments map.
 */
export function assignTaskToDay(
  state: TaskpoolState,
  taskId: string,
  dayDate: string,
): TaskpoolState {
  const task = state.tasks.get(taskId);
  if (!task) return state;

  // Remove from previous day assignment if exists
  const previousDate = task.dayDate;
  const newDayAssignments = new Map(state.dayAssignments);

  if (previousDate) {
    const previousTasks = newDayAssignments.get(previousDate) ?? [];
    const filtered = previousTasks.filter((id) => id !== taskId);
    if (filtered.length > 0) {
      newDayAssignments.set(previousDate, filtered);
    } else {
      newDayAssignments.delete(previousDate);
    }
  }

  // Add to new day assignment
  const currentDayTasks = newDayAssignments.get(dayDate) ?? [];
  newDayAssignments.set(dayDate, [...currentDayTasks, taskId]);

  // Update task with new dayDate
  const updatedTask: Task = {
    ...task,
    dayDate,
    updatedAt: new Date().toISOString(),
  };

  const newTasks = new Map(state.tasks);
  newTasks.set(taskId, updatedTask);

  return {
    ...state,
    dayAssignments: newDayAssignments,
    tasks: newTasks,
  };
}

/**
 * Removes a task's day assignment.
 */
export function unassignTaskFromDay(
  state: TaskpoolState,
  taskId: string,
): TaskpoolState {
  const task = state.tasks.get(taskId);
  if (!task || !task.dayDate) return state;

  const dayDate = task.dayDate;
  const newDayAssignments = new Map(state.dayAssignments);
  const currentDayTasks = newDayAssignments.get(dayDate) ?? [];
  const filtered = currentDayTasks.filter((id) => id !== taskId);

  if (filtered.length > 0) {
    newDayAssignments.set(dayDate, filtered);
  } else {
    newDayAssignments.delete(dayDate);
  }

  const updatedTask: Task = {
    ...task,
    dayDate: undefined,
    updatedAt: new Date().toISOString(),
  };

  const newTasks = new Map(state.tasks);
  newTasks.set(taskId, updatedTask);

  return {
    ...state,
    dayAssignments: newDayAssignments,
    tasks: newTasks,
  };
}

/**
 * Removes a task ID from a day bucket and deletes the entry if the array becomes empty.
 * This helper ensures proper cleanup of empty day buckets to prevent stale entries.
 *
 * @param dayAssignments - The current day assignments map (will be copied)
 * @param dayDate - The date from which to remove the task
 * @param taskId - The task ID to remove
 * @returns A new Map with the task removed and empty buckets cleaned up
 */
export function removeTaskFromDayBucket(
  dayAssignments: Map<string, string[]>,
  dayDate: string,
  taskId: string,
): Map<string, string[]> {
  const newDayAssignments = new Map(dayAssignments);
  const dayTasks = newDayAssignments.get(dayDate) ?? [];
  const filtered = dayTasks.filter((id) => id !== taskId);

  if (filtered.length > 0) {
    newDayAssignments.set(dayDate, filtered);
  } else {
    // Delete empty bucket to prevent stale entries
    newDayAssignments.delete(dayDate);
  }

  return newDayAssignments;
}

/**
 * Gets all tasks assigned to a specific day.
 */
export function getTasksForDay(state: TaskpoolState, dayDate: string): Task[] {
  const taskIds = state.dayAssignments.get(dayDate) ?? [];
  return taskIds
    .map((id) => state.tasks.get(id))
    .filter((task): task is Task => task !== undefined);
}
