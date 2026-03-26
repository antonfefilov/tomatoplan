/**
 * TomatoPool model for the Tomato Plan
 * Represents the daily capacity of tomatoes (pomodoro sessions) available
 */

export interface TomatoPool {
  /** Maximum number of tomatoes available per day */
  dailyCapacity: number;

  /** Duration of each tomato in minutes */
  capacityInMinutes: number;

  /** Start of the work day (HH:MM format) */
  dayStart: string;

  /** End of the work day (HH:MM format) */
  dayEnd: string;

  /** Date this pool is for (YYYY-MM-DD format) */
  date: string;
}

import {
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
} from "../constants/defaults.js";

/**
 * Creates a new tomato pool for a specific date
 */
export function createTomatoPool(
  dailyCapacity: number,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  date?: string,
  dayStart: string = DEFAULT_DAY_START,
  dayEnd: string = DEFAULT_DAY_END,
): TomatoPool {
  return {
    dailyCapacity,
    capacityInMinutes,
    dayStart,
    dayEnd,
    date: date ?? getDateString(new Date()),
  };
}

/**
 * Converts a Date to a YYYY-MM-DD string
 */
export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Gets today's date as a YYYY-MM-DD string
 */
export function getTodayString(): string {
  return getDateString(new Date());
}

/**
 * Checks if the pool is for today
 */
export function isToday(pool: TomatoPool): boolean {
  return pool.date === getTodayString();
}

/**
 * Checks if the pool is stale (from a previous day)
 */
export function isStale(pool: TomatoPool): boolean {
  return pool.date !== getTodayString();
}
