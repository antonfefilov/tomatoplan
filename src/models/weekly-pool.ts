/**
 * WeeklyPool model for the Tomato Plan
 * Represents the weekly capacity of tomatoes (pomodoro sessions) available
 */

import {
  DEFAULT_CAPACITY_IN_MINUTES,
  DEFAULT_DAILY_CAPACITY,
} from "../constants/defaults.js";
import {
  getWeekId,
  getWeekStart,
  getWeekEnd,
  getDateString,
} from "./project.js";

/** Default weekly capacity multiplier (5 days) */
export const DEFAULT_WEEKLY_CAPACITY_MULTIPLIER = 5;

export interface WeeklyPool {
  /** Maximum number of tomatoes available per week */
  weeklyCapacity: number;

  /** Duration of each tomato in minutes (inherited from daily) */
  capacityInMinutes: number;

  /** Week ID in YYYY-Www format (ISO 8601 week) */
  weekId: string;

  /** Start date of the week (YYYY-MM-DD, Monday) */
  weekStartDate: string;

  /** End date of the week (YYYY-MM-DD, Sunday) */
  weekEndDate: string;
}

/**
 * Creates a new weekly pool for a specific week
 */
export function createWeeklyPool(
  weeklyCapacity: number,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  date?: Date,
): WeeklyPool {
  const targetDate = date ?? new Date();
  const weekStart = getWeekStart(targetDate);
  const weekEnd = getWeekEnd(targetDate);

  return {
    weeklyCapacity,
    capacityInMinutes,
    weekId: getWeekId(targetDate),
    weekStartDate: getDateString(weekStart),
    weekEndDate: getDateString(weekEnd),
  };
}

/**
 * Creates a weekly pool with default capacity based on daily capacity
 */
export function createDefaultWeeklyPool(
  dailyCapacity: number = DEFAULT_DAILY_CAPACITY,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
  date?: Date,
): WeeklyPool {
  const weeklyCapacity = dailyCapacity * DEFAULT_WEEKLY_CAPACITY_MULTIPLIER;
  return createWeeklyPool(weeklyCapacity, capacityInMinutes, date);
}

/**
 * Checks if the pool is for the current week
 */
export function isCurrentWeek(pool: WeeklyPool): boolean {
  return pool.weekId === getWeekId(new Date());
}

/**
 * Checks if the pool is stale (from a previous week)
 */
export function isStale(pool: WeeklyPool): boolean {
  return !isCurrentWeek(pool);
}

/**
 * Gets the number of days remaining in the week (including today)
 */
export function getDaysRemainingInWeek(pool: WeeklyPool): number {
  const today = new Date();
  const weekEnd = new Date(pool.weekEndDate + "T23:59:59");

  if (today > weekEnd) {
    return 0;
  }

  const diffTime = weekEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculates the weekly capacity in minutes
 */
export function getWeeklyCapacityInMinutes(pool: WeeklyPool): number {
  return pool.weeklyCapacity * pool.capacityInMinutes;
}

/**
 * Formats the week range as a human-readable string
 * e.g., "Mar 25 - Mar 31, 2024"
 */
export function formatWeekRange(pool: WeeklyPool): string {
  return formatWeekRangeFromDates(pool.weekStartDate, pool.weekEndDate);
}

/**
 * Formats week range from start and end date strings
 * Reusable utility that doesn't require full WeeklyPool
 */
export function formatWeekRangeFromDates(
  weekStartDate: string,
  weekEndDate: string,
): string {
  if (!weekStartDate || !weekEndDate) return "";
  const startDate = new Date(weekStartDate);
  const endDate = new Date(weekEndDate);

  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}
