/**
 * Time formatting utilities
 */

import type { TomatoTimeSlot } from "../models/tomato-pool.js";

/**
 * Formats minutes into human-readable time estimation
 * Returns strings like "25m", "1h 30m", "2h", etc.
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Parses an HH:MM time string to minutes from midnight
 * Returns null if the format is invalid
 */
export function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);

  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight to HH:MM string
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 0 || minutes >= 24 * 60) {
    // Handle out of range by clamping
    const clamped = Math.max(0, Math.min(24 * 60 - 1, minutes));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculates the number of minutes between two times
 * Returns a positive number if end > start, negative otherwise
 */
export function getMinutesBetween(start: string, end: string): number | null {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null) return null;

  return endMinutes - startMinutes;
}

/**
 * Calculates the duration of a single time slot in minutes
 */
export function getTimeSlotDurationMinutes(slot: TomatoTimeSlot): number {
  const minutesBetween = getMinutesBetween(slot.startTime, slot.endTime);

  if (minutesBetween === null || minutesBetween <= 0) {
    return 0;
  }

  return minutesBetween;
}

/**
 * Calculates the total scheduled minutes across all time slots
 */
export function calculateTotalScheduledMinutes(
  slots: TomatoTimeSlot[],
): number {
  return slots.reduce((total, slot) => {
    const duration = getTimeSlotDurationMinutes(slot);
    return total + duration;
  }, 0);
}

/**
 * Calculates the daily capacity based on time slots and tomato duration
 * Returns floor(totalSlotMinutes / capacityInMinutes)
 */
export function calculateDailyCapacityFromSlots(
  slots: TomatoTimeSlot[],
  capacityInMinutes: number,
): number {
  const totalMinutes = calculateTotalScheduledMinutes(slots);

  if (totalMinutes <= 0) {
    return 0;
  }

  if (capacityInMinutes <= 0) {
    return 0;
  }

  return Math.floor(totalMinutes / capacityInMinutes);
}

/**
 * Calculates the daily capacity based on a single time range and tomato duration
 * Returns floor((dayEnd - dayStart) / capacityInMinutes)
 * @deprecated Use calculateDailyCapacityFromSlots instead
 */
export function calculateDailyCapacityFromSchedule(
  dayStart: string,
  dayEnd: string,
  capacityInMinutes: number,
): number {
  const minutesBetween = getMinutesBetween(dayStart, dayEnd);

  if (minutesBetween === null || minutesBetween <= 0) {
    return 0;
  }

  if (capacityInMinutes <= 0) {
    return 0;
  }

  return Math.floor(minutesBetween / capacityInMinutes);
}

/**
 * Validates an HH:MM time string
 */
export function isValidTimeString(time: string): boolean {
  return parseTimeToMinutes(time) !== null;
}

/**
 * Calculates the number of tomatoes remaining until day end
 * Based on the current time and day schedule
 *
 * @param nowMinutes - Current time in minutes from midnight
 * @param dayStart - Day start time in HH:MM format
 * @param dayEnd - Day end time in HH:MM format
 * @param capacityInMinutes - Duration of one tomato in minutes
 * @returns Number of tomatoes remaining (with decimal), or null if invalid inputs
 */
export function calculateTomatoesRemainingUntilDayEnd(
  nowMinutes: number,
  dayStart: string,
  dayEnd: string,
  capacityInMinutes: number,
): number | null {
  const dayStartMinutes = parseTimeToMinutes(dayStart);
  const dayEndMinutes = parseTimeToMinutes(dayEnd);

  if (dayStartMinutes === null || dayEndMinutes === null) {
    return null;
  }

  if (capacityInMinutes <= 0) {
    return null;
  }

  // Before day start: show full scheduled capacity
  if (nowMinutes < dayStartMinutes) {
    return Math.floor((dayEndMinutes - dayStartMinutes) / capacityInMinutes);
  }

  // After day end: show 0
  if (nowMinutes >= dayEndMinutes) {
    return 0;
  }

  // During day: calculate remaining time in tomato units
  const remainingMinutes = dayEndMinutes - nowMinutes;
  return remainingMinutes / capacityInMinutes;
}
