/**
 * Storage model for the Tomato Plan
 * Defines the shape of data persisted to localStorage
 */

import type { Task } from "./task.js";
import { STATE_VERSION } from "./planner-state.js";
import { DEFAULT_DAY_START, DEFAULT_DAY_END } from "../constants/defaults.js";

/**
 * Minimal state shape for localStorage persistence
 * Only stores what's needed to reconstruct the full state
 */
export interface PersistedPlannerState {
  /** Daily capacity setting */
  dailyCapacity: number;

  /** Duration of each tomato in minutes */
  capacityInMinutes?: number;

  /** Start of the work day (HH:MM format) */
  dayStart?: string;

  /** End of the work day (HH:MM format) */
  dayEnd?: string;

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
  capacityInMinutes: number,
  tasks: readonly Task[],
  savedDate: string,
  dayStart: string,
  dayEnd: string,
): PersistedPlannerState {
  return {
    dailyCapacity,
    capacityInMinutes,
    dayStart,
    dayEnd,
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
    // capacityInMinutes is optional for backward compatibility
  );
}

/**
 * Migrates an older persisted state to the current version
 */
export function migratePersistedState(
  state: PersistedPlannerState,
): PersistedPlannerState {
  // Apply migrations based on version
  let migrated = { ...state };

  // Version 1 -> 2: Add dayStart and dayEnd
  if (migrated.version < 2) {
    migrated = {
      ...migrated,
      dayStart: migrated.dayStart ?? DEFAULT_DAY_START,
      dayEnd: migrated.dayEnd ?? DEFAULT_DAY_END,
    };
  }

  return {
    ...migrated,
    version: STATE_VERSION,
  };
}
