/**
 * PlannerState model for the Tomato Plan
 * Contains only the tomato pool configuration and settings.
 * Tasks are now derived from taskpoolStore based on the pool date.
 */

import type { TomatoPool } from "./tomato-pool.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
} from "../constants/defaults.js";
import { createTomatoPool, getTodayString } from "./tomato-pool.js";
import { calculateDailyCapacityFromSchedule } from "../utils/time.js";

export interface PlannerState {
  /** The tomato pool for the current session */
  pool: TomatoPool;

  /** Version for potential migrations */
  readonly version: number;
}

/** Current state version for migrations */
export const STATE_VERSION = 2;

/**
 * Creates the initial planner state
 */
export function createInitialPlannerState(
  dailyCapacity: number = DEFAULT_DAILY_CAPACITY,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  dayStart: string = DEFAULT_DAY_START,
  dayEnd: string = DEFAULT_DAY_END,
): PlannerState {
  return {
    pool: createTomatoPool(
      dailyCapacity,
      capacityInMinutes,
      undefined,
      dayStart,
      dayEnd,
    ),
    version: STATE_VERSION,
  };
}

/**
 * Resets the state for a new day
 * Creates a fresh pool with the same capacity settings
 */
export function resetPlannerStateForNewDay(
  state: PlannerState,
  newCapacity?: number,
  newCapacityInMinutes?: number,
  newDayStart?: string,
  newDayEnd?: string,
): PlannerState {
  return {
    ...state,
    pool: createTomatoPool(
      newCapacity ?? state.pool.dailyCapacity,
      newCapacityInMinutes ?? state.pool.capacityInMinutes,
      getTodayString(),
      newDayStart ?? state.pool.dayStart,
      newDayEnd ?? state.pool.dayEnd,
    ),
  };
}

/**
 * Recalculates daily capacity based on schedule and duration
 * Returns a new pool with updated dailyCapacity
 */
export function recalculatePoolCapacity(pool: TomatoPool): TomatoPool {
  const newCapacity = calculateDailyCapacityFromSchedule(
    pool.dayStart,
    pool.dayEnd,
    pool.capacityInMinutes,
  );

  return {
    ...pool,
    dailyCapacity: newCapacity,
  };
}

/**
 * Computed value: Total daily capacity in minutes
 */
export function getDailyCapacityInMinutes(state: PlannerState): number {
  return state.pool.dailyCapacity * state.pool.capacityInMinutes;
}

/**
 * Formats minutes into a human-readable hours/minutes string
 * e.g., 200 minutes -> "3h 20m"
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
