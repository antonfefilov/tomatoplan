/**
 * Persistence layer for Taskpool State
 * Handles saving and loading taskpool state from localStorage
 */

import type { TaskpoolState } from "../models/taskpool-state.js";
import type { Task } from "../models/task.js";
import {
  createEmptyTaskpoolState,
  serializeTaskpoolState,
  deserializeTaskpoolState,
  isValidPersistedTaskpoolState,
} from "../models/taskpool-state.js";
import { STORAGE_KEYS } from "../constants/storage-keys.js";

/**
 * Gets today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]!;
}

/**
 * Saves the taskpool state to localStorage
 */
export function saveTaskpoolState(state: TaskpoolState): void {
  const persistedState = serializeTaskpoolState(state);

  try {
    const serialized = JSON.stringify(persistedState);
    localStorage.setItem(STORAGE_KEYS.TASKPOOL_STATE, serialized);
  } catch (error) {
    console.error("Failed to save taskpool state:", error);
  }
}

/**
 * Loads the taskpool state from localStorage
 * Returns null if no state exists or if state is invalid
 */
export function loadTaskpoolState(): TaskpoolState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.TASKPOOL_STATE);

    if (!serialized) {
      return null;
    }

    const parsed: unknown = JSON.parse(serialized);

    if (!isValidPersistedTaskpoolState(parsed)) {
      console.warn("Invalid persisted taskpool state format, discarding");
      return null;
    }

    return deserializeTaskpoolState(parsed);
  } catch (error) {
    console.error("Failed to load taskpool state:", error);
    return null;
  }
}

/**
 * Creates an initial taskpool state with today as the active date
 */
export function createInitialTaskpoolState(): TaskpoolState {
  return createEmptyTaskpoolState(getTodayDateString());
}

/**
 * Clears all persisted taskpool state from localStorage
 */
export function clearTaskpoolState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TASKPOOL_STATE);
  } catch (error) {
    console.error("Failed to clear taskpool state:", error);
  }
}

/**
 * Checks if there's any persisted taskpool state available
 */
export function hasPersistedTaskpoolState(): boolean {
  return localStorage.getItem(STORAGE_KEYS.TASKPOOL_STATE) !== null;
}

/**
 * Migrates tasks from legacy planner state to taskpool format.
 * Used when transitioning from daily planner tasks to taskpool.
 */
export function migrateTasksFromPlannerState(
  tasks: readonly Task[],
  targetDate: string,
): Task[] {
  // Create copies with dayDate assigned
  return tasks.map((task) => ({
    ...task,
    dayDate: targetDate,
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Export helper for backup/download functionality
 */
export function exportTaskpoolState(state: TaskpoolState): string {
  const persistedState = serializeTaskpoolState(state);
  const exportData = {
    ...persistedState,
    exportedAt: new Date().toISOString(),
    appName: "Tomato Plan - Taskpool",
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import helper for restore functionality
 */
export function importTaskpoolState(jsonString: string): {
  success: boolean;
  error?: string;
  state?: TaskpoolState;
} {
  try {
    const parsed: unknown = JSON.parse(jsonString);

    if (!isValidPersistedTaskpoolState(parsed)) {
      return { success: false, error: "Invalid taskpool state format" };
    }

    const state = deserializeTaskpoolState(parsed);
    saveTaskpoolState(state);

    return { success: true, state };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse taskpool state",
    };
  }
}
