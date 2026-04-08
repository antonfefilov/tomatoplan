/**
 * Validation helpers for tomato assignment
 */

import type { Task } from "../models/task.js";
import type { TomatoTimeSlot } from "../models/tomato-pool.js";
import {
  MIN_DAILY_CAPACITY,
  MAX_DAILY_CAPACITY,
  MIN_CAPACITY_IN_MINUTES,
  MAX_CAPACITY_IN_MINUTES,
} from "../constants/defaults.js";
import { parseTimeToMinutes } from "./time.js";

/** Result of a validation check */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;
}

/**
 * Computes total assigned tomatoes from a task list
 */
export function getTotalAssignedTomatoes(tasks: readonly Task[]): number {
  return tasks.reduce((sum, task) => sum + task.tomatoCount, 0);
}

/**
 * Computes remaining tomatoes from a task list and daily capacity
 */
export function getRemainingTomatoes(
  tasks: readonly Task[],
  dailyCapacity: number,
): number {
  return dailyCapacity - getTotalAssignedTomatoes(tasks);
}

/**
 * Validates that a daily capacity value is within acceptable bounds
 */
export function validateDailyCapacity(capacity: number): ValidationResult {
  if (typeof capacity !== "number" || Number.isNaN(capacity)) {
    return { valid: false, error: "Capacity must be a valid number" };
  }

  if (capacity < MIN_DAILY_CAPACITY) {
    return {
      valid: false,
      error: `Capacity must be at least ${MIN_DAILY_CAPACITY}`,
    };
  }

  if (capacity > MAX_DAILY_CAPACITY) {
    return {
      valid: false,
      error: `Capacity cannot exceed ${MAX_DAILY_CAPACITY}`,
    };
  }

  if (!Number.isInteger(capacity)) {
    return { valid: false, error: "Capacity must be a whole number" };
  }

  return { valid: true };
}

/**
 * Validates that a capacityInMinutes (tomato duration) value is within acceptable bounds
 */
export function validateCapacityInMinutes(minutes: number): ValidationResult {
  if (typeof minutes !== "number" || Number.isNaN(minutes)) {
    return { valid: false, error: "Duration must be a valid number" };
  }

  if (!Number.isInteger(minutes)) {
    return { valid: false, error: "Duration must be a whole number" };
  }

  if (minutes < MIN_CAPACITY_IN_MINUTES) {
    return {
      valid: false,
      error: `Duration must be at least ${MIN_CAPACITY_IN_MINUTES} minutes`,
    };
  }

  if (minutes > MAX_CAPACITY_IN_MINUTES) {
    return {
      valid: false,
      error: `Duration cannot exceed ${MAX_CAPACITY_IN_MINUTES} minutes`,
    };
  }

  return { valid: true };
}

/**
 * Validates that a tomato assignment is possible
 */
export function canAssignTomato(
  tasks: readonly Task[],
  dailyCapacity: number,
  _currentCount: number,
): ValidationResult {
  const remaining = getRemainingTomatoes(tasks, dailyCapacity);

  if (remaining <= 0) {
    return {
      valid: false,
      error:
        "No tomatoes remaining. Increase capacity or remove assignments from other tasks.",
    };
  }

  return { valid: true };
}

/**
 * Validates that a task can have tomatoes removed
 */
export function canUnassignTomato(currentCount: number): ValidationResult {
  if (currentCount <= 0) {
    return { valid: false, error: "No tomatoes assigned to this task" };
  }

  return { valid: true };
}

/**
 * Validates a tomato count for a specific task
 */
export function validateTomatoCount(count: number): ValidationResult {
  if (typeof count !== "number" || Number.isNaN(count)) {
    return { valid: false, error: "Tomato count must be a valid number" };
  }

  if (count < 0) {
    return { valid: false, error: "Tomato count cannot be negative" };
  }

  if (!Number.isInteger(count)) {
    return { valid: false, error: "Tomato count must be a whole number" };
  }

  if (count > MAX_DAILY_CAPACITY) {
    return {
      valid: false,
      error: `Tomato count cannot exceed daily capacity of ${MAX_DAILY_CAPACITY}`,
    };
  }

  return { valid: true };
}

/**
 * Validates that setting a specific tomato count is possible
 */
export function canSetTomatoCount(
  tasks: readonly Task[],
  dailyCapacity: number,
  taskId: string,
  newCount: number,
): ValidationResult {
  const currentTask = tasks.find((t) => t.id === taskId);
  const currentCount = currentTask?.tomatoCount ?? 0;
  const totalAssigned = getTotalAssignedTomatoes(tasks);
  const availableForReassignment = dailyCapacity - totalAssigned + currentCount;

  if (newCount > availableForReassignment) {
    const remaining = availableForReassignment - currentCount;
    return {
      valid: false,
      error: `Not enough tomatoes. You have ${remaining} available.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a task title
 */
export function validateTaskTitle(title: string): ValidationResult {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Task title cannot be empty" };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: "Task title cannot exceed 200 characters" };
  }

  return { valid: true };
}

/**
 * Validates a single time slot
 * Returns an array of error messages (empty if valid)
 */
export function validateTimeSlot(slot: TomatoTimeSlot): string[] {
  const errors: string[] = [];

  // Validate ID exists
  if (!slot.id || slot.id.trim() === "") {
    errors.push("Time slot must have an ID");
  }

  // Validate start time format
  const startMinutes = parseTimeToMinutes(slot.startTime);
  if (startMinutes === null) {
    errors.push(
      `Invalid start time format "${slot.startTime}". Use HH:MM (e.g., 09:00)`,
    );
  }

  // Validate end time format
  const endMinutes = parseTimeToMinutes(slot.endTime);
  if (endMinutes === null) {
    errors.push(
      `Invalid end time format "${slot.endTime}". Use HH:MM (e.g., 17:00)`,
    );
  }

  // Validate start < end
  if (startMinutes !== null && endMinutes !== null) {
    if (startMinutes >= endMinutes) {
      errors.push(
        `Start time must be before end time (${slot.startTime} -> ${slot.endTime})`,
      );
    }
  }

  return errors;
}

/**
 * Validates that time slots do not overlap
 * Returns an array of error messages (empty if valid)
 */
export function validateNonOverlappingTimeSlots(
  slots: TomatoTimeSlot[],
): string[] {
  const errors: string[] = [];

  // Sort slots by start time for easier overlap detection
  const sortedSlots = [...slots].sort((a, b) => {
    const aStart = parseTimeToMinutes(a.startTime) ?? 0;
    const bStart = parseTimeToMinutes(b.startTime) ?? 0;
    return aStart - bStart;
  });

  // Check each pair of consecutive slots for overlap
  for (let i = 0; i < sortedSlots.length - 1; i++) {
    const current = sortedSlots[i];
    const next = sortedSlots[i + 1];

    if (!current || !next) continue;

    const currentEnd = parseTimeToMinutes(current.endTime);
    const nextStart = parseTimeToMinutes(next.startTime);

    if (currentEnd !== null && nextStart !== null) {
      if (currentEnd > nextStart) {
        errors.push(
          `Time slots overlap: "${current.startTime}-${current.endTime}" and "${next.startTime}-${next.endTime}"`,
        );
      }
    }
  }

  return errors;
}

/**
 * Validates an HH:MM time string
 */
export function validateTimeString(time: string): ValidationResult {
  const minutes = parseTimeToMinutes(time);

  if (minutes === null) {
    return {
      valid: false,
      error: "Invalid time format. Use HH:MM (e.g., 09:00)",
    };
  }

  return { valid: true };
}

/**
 * Validates that day start is before day end
 * @deprecated Use validateTimeSlot and validateNonOverlappingTimeSlots instead
 */
export function validateTimeRange(
  dayStart: string,
  dayEnd: string,
): ValidationResult {
  const startMinutes = parseTimeToMinutes(dayStart);
  const endMinutes = parseTimeToMinutes(dayEnd);

  if (startMinutes === null) {
    return { valid: false, error: "Invalid day start time format" };
  }

  if (endMinutes === null) {
    return { valid: false, error: "Invalid day end time format" };
  }

  if (startMinutes >= endMinutes) {
    return { valid: false, error: "Day start must be before day end" };
  }

  return { valid: true };
}

/**
 * Combines multiple validation results
 */
export function combineValidations(
  ...results: ValidationResult[]
): ValidationResult {
  const failures = results.filter((r) => !r.valid);

  if (failures.length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    error: failures.map((f) => f.error).join(". "),
  };
}
