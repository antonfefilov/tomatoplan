/**
 * TomatoPool model for the Tomato Planner
 * Represents the daily capacity of tomatoes (pomodoro sessions) available
 */

export interface TomatoPool {
  /** Maximum number of tomatoes available per day */
  dailyCapacity: number;

  /** Date this pool is for (YYYY-MM-DD format) */
  date: string;
}

/**
 * Creates a new tomato pool for a specific date
 */
export function createTomatoPool(
  dailyCapacity: number,
  date?: string,
): TomatoPool {
  return {
    dailyCapacity,
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
