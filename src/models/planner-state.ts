/**
 * PlannerState model for the Tomato Plan
 * Contains only the tomato pool configuration and settings.
 * Tasks are now derived from taskpoolStore based on the pool date.
 */

import type { TomatoPool, TomatoTimeSlot } from "./tomato-pool.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
} from "../constants/defaults.js";
import {
  createTomatoPool,
  createDefaultTimeSlot,
  getTodayString,
} from "./tomato-pool.js";
import { calculateDailyCapacityFromSlots } from "../utils/time.js";

export interface PlannerState {
  /** The tomato pool for the current session */
  pool: TomatoPool;

  /** Version for potential migrations */
  readonly version: number;
}

/** Current state version for migrations */
export const STATE_VERSION = 3;

/**
 * Creates the initial planner state with default time slots
 */
export function createInitialPlannerState(
  dailyCapacity: number = DEFAULT_DAILY_CAPACITY,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  timeSlots?: TomatoTimeSlot[],
  // Legacy parameters for backward compatibility
  dayStart?: string,
  dayEnd?: string,
): PlannerState {
  const slots = timeSlots ?? [
    {
      id: createDefaultTimeSlot().id,
      startTime: dayStart ?? DEFAULT_DAY_START,
      endTime: dayEnd ?? DEFAULT_DAY_END,
      label: "Default",
    },
  ];

  return {
    pool: createTomatoPool(
      dailyCapacity,
      capacityInMinutes,
      undefined,
      slots,
      dayStart,
      dayEnd,
    ),
    version: STATE_VERSION,
  };
}

/**
 * Resets the state for a new day
 * Creates a fresh pool with the same capacity settings and time slots
 */
export function resetPlannerStateForNewDay(
  state: PlannerState,
  newCapacity?: number,
  newCapacityInMinutes?: number,
  newTimeSlots?: TomatoTimeSlot[],
): PlannerState {
  return {
    ...state,
    pool: createTomatoPool(
      newCapacity ?? state.pool.dailyCapacity,
      newCapacityInMinutes ?? state.pool.capacityInMinutes,
      getTodayString(),
      newTimeSlots ?? state.pool.timeSlots,
      // Preserve legacy fields if they exist
      state.pool.dayStart,
      state.pool.dayEnd,
    ),
  };
}

/**
 * Recalculates daily capacity based on time slots and duration
 * Returns a new pool with updated dailyCapacity
 */
export function recalculatePoolCapacity(pool: TomatoPool): TomatoPool {
  const newCapacity = calculateDailyCapacityFromSlots(
    pool.timeSlots,
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
