/**
 * PlannerState model for the Tomato Planner
 * Combines the tomato pool and tasks into a single state object
 */

import type { Task } from "./task.js";
import type { TomatoPool } from "./tomato-pool.js";
import { DEFAULT_DAILY_CAPACITY } from "../constants/defaults.js";
import { createTomatoPool, getTodayString } from "./tomato-pool.js";

export interface PlannerState {
  /** The tomato pool for the current session */
  pool: TomatoPool;

  /** List of tasks for the day */
  tasks: readonly Task[];

  /** Version for potential migrations */
  readonly version: number;
}

/** Current state version for migrations */
export const STATE_VERSION = 1;

/**
 * Creates the initial planner state
 */
export function createInitialPlannerState(
  dailyCapacity: number = DEFAULT_DAILY_CAPACITY,
): PlannerState {
  return {
    pool: createTomatoPool(dailyCapacity),
    tasks: [],
    version: STATE_VERSION,
  };
}

/**
 * Resets the state for a new day
 * Creates a fresh pool with the same capacity but clears tasks
 */
export function resetPlannerStateForNewDay(
  state: PlannerState,
  newCapacity?: number,
): PlannerState {
  return {
    ...state,
    pool: createTomatoPool(
      newCapacity ?? state.pool.dailyCapacity,
      getTodayString(),
    ),
    tasks: [],
  };
}

/**
 * Computed value: Total tomatoes assigned across all tasks
 */
export function getTotalAssignedTomatoes(state: PlannerState): number {
  return state.tasks.reduce((sum, task) => sum + task.tomatoCount, 0);
}

/**
 * Computed value: Remaining tomatoes available for assignment
 */
export function getRemainingTomatoes(state: PlannerState): number {
  return state.pool.dailyCapacity - getTotalAssignedTomatoes(state);
}

/**
 * Computed value: Whether all tomatoes have been assigned
 */
export function isAtCapacity(state: PlannerState): boolean {
  return getRemainingTomatoes(state) <= 0;
}

/**
 * Computed value: Whether any tomatoes have been over-assigned
 */
export function isOverCapacity(state: PlannerState): boolean {
  return getRemainingTomatoes(state) < 0;
}
