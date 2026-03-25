/**
 * Storage model for the Tomato Plan
 * Defines the shape of data persisted to localStorage
 */

import type { Task } from "./task.js";
import { STATE_VERSION } from "./planner-state.js";

/**
 * Minimal state shape for localStorage persistence
 * Only stores what's needed to reconstruct the full state
 */
export interface PersistedPlannerState {
  /** Daily capacity setting */
  dailyCapacity: number;

  /** Tasks for the current day */
  tasks: readonly Task[];

  /** Date this state was saved (YYYY-MM-DD) */
  savedDate: string;

  /** Version for migration compatibility */
  version: number;
}

/**
 * Result of loading state from storage
 */
export interface LoadResult {
  /** The loaded state, if successful */
  state: PersistedPlannerState | null;

  /** Error message if loading failed */
  error?: string;

  /** Whether the loaded state needs migration */
  needsMigration: boolean;
}

/**
 * Creates a persisted state from the current planner state
 */
export function createPersistedState(
  dailyCapacity: number,
  tasks: readonly Task[],
  savedDate: string,
): PersistedPlannerState {
  return {
    dailyCapacity,
    tasks,
    savedDate,
    version: STATE_VERSION,
  };
}

/**
 * Validates that a persisted state has the required fields
 */
export function isValidPersistedState(
  data: unknown,
): data is PersistedPlannerState {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj["dailyCapacity"] === "number" &&
    obj["dailyCapacity"] > 0 &&
    Array.isArray(obj["tasks"]) &&
    typeof obj["savedDate"] === "string" &&
    typeof obj["version"] === "number"
  );
}

/**
 * Migrates an older persisted state to the current version
 */
export function migratePersistedState(
  state: PersistedPlannerState,
): PersistedPlannerState {
  // Currently at version 1, no migrations needed yet
  // Future migrations would check state.version and apply transformations
  return {
    ...state,
    version: STATE_VERSION,
  };
}
