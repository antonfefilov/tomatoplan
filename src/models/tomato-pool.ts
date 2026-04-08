/**
 * TomatoPool model for the Tomato Plan
 * Represents the daily capacity of tomatoes (pomodoro sessions) available
 */

/**
 * Represents a single time slot for tomato scheduling
 */
export interface TomatoTimeSlot {
  /** Unique identifier for the slot */
  id: string;

  /** Start time of the slot (HH:MM format) */
  startTime: string;

  /** End time of the slot (HH:MM format) */
  endTime: string;

  /** Optional label for the slot (e.g., "Morning", "Afternoon") */
  label?: string;
}

export interface TomatoPool {
  /** Maximum number of tomatoes available per day */
  dailyCapacity: number;

  /** Duration of each tomato in minutes */
  capacityInMinutes: number;

  /** Time slots for the work day */
  timeSlots: TomatoTimeSlot[];

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

  /** Date this pool is for (YYYY-MM-DD format) */
  date: string;
}

import {
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
} from "../constants/defaults.js";
import { generateId } from "../utils/id.js";

/**
 * Creates a default time slot using standard day start/end times
 */
export function createDefaultTimeSlot(): TomatoTimeSlot {
  return {
    id: generateId(),
    startTime: DEFAULT_DAY_START,
    endTime: DEFAULT_DAY_END,
    label: "Default",
  };
}

/**
 * Creates a new tomato pool for a specific date
 * If timeSlots is not provided, creates a default slot using dayStart/dayEnd
 */
export function createTomatoPool(
  dailyCapacity: number,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  date?: string,
  timeSlots?: TomatoTimeSlot[],
  // Legacy parameters for backward compatibility
  dayStart?: string,
  dayEnd?: string,
): TomatoPool {
  // If timeSlots provided, use them
  // Otherwise, create default slot from legacy dayStart/dayEnd or defaults
  const slots: TomatoTimeSlot[] = timeSlots ?? [
    {
      id: generateId(),
      startTime: dayStart ?? DEFAULT_DAY_START,
      endTime: dayEnd ?? DEFAULT_DAY_END,
      label: "Default",
    },
  ];

  return {
    dailyCapacity,
    capacityInMinutes,
    timeSlots: slots,
    // Keep legacy fields for migration compatibility
    dayStart: dayStart ?? DEFAULT_DAY_START,
    dayEnd: dayEnd ?? DEFAULT_DAY_END,
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
