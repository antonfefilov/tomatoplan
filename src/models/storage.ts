/**
 * Storage model for the Tomato Plan
 * Defines the shape of data persisted to localStorage
 */

import type { Task } from "./task.js";
import type { TomatoTimeSlot } from "./tomato-pool.js";
import { STATE_VERSION } from "./planner-state.js";
import {
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
  DEFAULT_CAPACITY_IN_MINUTES,
} from "../constants/defaults.js";
import { generateId } from "../utils/id.js";

/**
 * Minimal state shape for localStorage persistence
 * Only stores what's needed to reconstruct the full state
 */
export interface PersistedPlannerState {
  /** Daily capacity setting */
  dailyCapacity: number;

  /** Duration of each tomato in minutes */
  capacityInMinutes?: number;

  /** Time slots for the work day */
  timeSlots?: TomatoTimeSlot[];

  /**
   * @deprecated Use timeSlots instead. Kept for migration compatibility.
   * Start of the work day (HH:MM format)
   */
  dayStart?: string;

  /**
   * @deprecated Use timeSlots instead. Kept for migration compatibility.
   * End of the work day (HH:MM format)
   */
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
  timeSlots: TomatoTimeSlot[],
): PersistedPlannerState {
  return {
    dailyCapacity,
    capacityInMinutes,
    timeSlots,
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
    typeof obj.dailyCapacity === "number" &&
    obj.dailyCapacity > 0 &&
    Array.isArray(obj.tasks) &&
    typeof obj.savedDate === "string" &&
    typeof obj.version === "number"
    // capacityInMinutes is optional for backward compatibility
    // timeSlots is optional for backward compatibility
    // dayStart and dayEnd are optional for backward compatibility
  );
}

/**
 * Converts legacy dayStart/dayEnd to a single time slot
 */
function convertLegacyToTimeSlot(
  dayStart?: string,
  dayEnd?: string,
): TomatoTimeSlot {
  return {
    id: generateId(),
    startTime: dayStart ?? DEFAULT_DAY_START,
    endTime: dayEnd ?? DEFAULT_DAY_END,
    label: "Default",
  };
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

  // Version 2 -> 3: Convert dayStart/dayEnd to timeSlots
  if (migrated.version < 3) {
    // If timeSlots don't exist, convert legacy dayStart/dayEnd
    if (!migrated.timeSlots || migrated.timeSlots.length === 0) {
      const legacySlot = convertLegacyToTimeSlot(
        migrated.dayStart,
        migrated.dayEnd,
      );
      migrated = {
        ...migrated,
        timeSlots: [legacySlot],
      };
    }
  }

  return {
    ...migrated,
    version: STATE_VERSION,
  };
}

/**
 * Normalizes a persisted state to ensure all fields are present
 * Used after loading to fill in any missing optional fields with defaults
 */
export function normalizePersistedState(
  state: PersistedPlannerState,
): PersistedPlannerState {
  return {
    ...state,
    capacityInMinutes: state.capacityInMinutes ?? DEFAULT_CAPACITY_IN_MINUTES,
    timeSlots: state.timeSlots ?? [
      convertLegacyToTimeSlot(state.dayStart, state.dayEnd),
    ],
    dayStart: state.dayStart ?? DEFAULT_DAY_START,
    dayEnd: state.dayEnd ?? DEFAULT_DAY_END,
  };
}
