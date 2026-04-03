/**
 * Tests for validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateDailyCapacity,
  validateCapacityInMinutes,
  canAssignTomato,
  canUnassignTomato,
  validateTomatoCount,
  canSetTomatoCount,
  validateTaskTitle,
  combineValidations,
  validateTimeString,
  validateTimeRange,
} from "../src/utils/validation.js";
import type { Task } from "../src/models/task.js";

describe("validateDailyCapacity", () => {
  it("should return valid for capacity within bounds", () => {
    const result = validateDailyCapacity(10);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return valid for minimum capacity", () => {
    const result = validateDailyCapacity(1);
    expect(result.valid).toBe(true);
  });

  it("should return valid for maximum capacity", () => {
    const result = validateDailyCapacity(30);
    expect(result.valid).toBe(true);
  });

  it("should return invalid for capacity below minimum", () => {
    const result = validateDailyCapacity(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 1");
  });

  it("should return invalid for capacity above maximum", () => {
    const result = validateDailyCapacity(31);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed 30");
  });

  it("should return invalid for non-integer capacity", () => {
    const result = validateDailyCapacity(10.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("whole number");
  });

  it("should return invalid for NaN", () => {
    const result = validateDailyCapacity(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid number");
  });
});

describe("validateCapacityInMinutes", () => {
  it("should return valid for duration within bounds", () => {
    const result = validateCapacityInMinutes(25);
    expect(result.valid).toBe(true);
  });

  it("should return valid for minimum duration", () => {
    const result = validateCapacityInMinutes(5);
    expect(result.valid).toBe(true);
  });

  it("should return valid for maximum duration", () => {
    const result = validateCapacityInMinutes(60);
    expect(result.valid).toBe(true);
  });

  it("should return invalid for duration below minimum", () => {
    const result = validateCapacityInMinutes(4);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 5 minutes");
  });

  it("should return invalid for duration above maximum", () => {
    const result = validateCapacityInMinutes(61);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed 60 minutes");
  });

  it("should return invalid for non-integer", () => {
    const result = validateCapacityInMinutes(25.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("whole number");
  });
});

describe("canAssignTomato", () => {
  it("should return valid when tomatoes are available", () => {
    const tasks: Task[] = [];
    const dailyCapacity = 10;
    const result = canAssignTomato(tasks, dailyCapacity, 0);
    expect(result.valid).toBe(true);
  });

  it("should return invalid when no tomatoes remaining", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    const dailyCapacity = 1;
    const result = canAssignTomato(tasks, dailyCapacity, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No tomatoes remaining");
  });
});

describe("canUnassignTomato", () => {
  it("should return valid when tomatoes are assigned", () => {
    const result = canUnassignTomato(5);
    expect(result.valid).toBe(true);
  });

  it("should return invalid when no tomatoes assigned", () => {
    const result = canUnassignTomato(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No tomatoes assigned");
  });
});

describe("validateTomatoCount", () => {
  it("should return valid for zero count", () => {
    const result = validateTomatoCount(0);
    expect(result.valid).toBe(true);
  });

  it("should return valid for positive count", () => {
    const result = validateTomatoCount(10);
    expect(result.valid).toBe(true);
  });

  it("should return invalid for negative count", () => {
    const result = validateTomatoCount(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot be negative");
  });

  it("should return invalid for non-integer", () => {
    const result = validateTomatoCount(5.5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("whole number");
  });

  it("should return invalid for count above max capacity", () => {
    const result = validateTomatoCount(31);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed daily capacity");
  });
});

describe("canSetTomatoCount", () => {
  it("should return valid when enough tomatoes available", () => {
    const tasks: Task[] = [];
    const dailyCapacity = 10;
    const result = canSetTomatoCount(tasks, dailyCapacity, "task-1", 5);
    expect(result.valid).toBe(true);
  });

  it("should return invalid when not enough tomatoes available", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "task-2",
        title: "Task 2",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    const dailyCapacity = 5;
    // task-1 already has 3, total assigned is 5, capacity is 5
    // trying to set task-1 to 6 would exceed capacity
    const result = canSetTomatoCount(tasks, dailyCapacity, "task-1", 6);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Not enough tomatoes");
  });

  it("should account for current task tomatoes when reassigning", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 5,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    const dailyCapacity = 10;
    // task-1 has 5, capacity is 10, can set up to 10 (not more)
    const result = canSetTomatoCount(tasks, dailyCapacity, "task-1", 10);
    expect(result.valid).toBe(true);
  });
});

describe("validateTaskTitle", () => {
  it("should return valid for normal title", () => {
    const result = validateTaskTitle("My Task");
    expect(result.valid).toBe(true);
  });

  it("should return invalid for empty title", () => {
    const result = validateTaskTitle("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot be empty");
  });

  it("should return invalid for whitespace-only title", () => {
    const result = validateTaskTitle("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot be empty");
  });

  it("should return invalid for title over 200 characters", () => {
    const longTitle = "a".repeat(201);
    const result = validateTaskTitle(longTitle);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed 200 characters");
  });

  it("should return valid for title with exactly 200 characters", () => {
    const maxTitle = "a".repeat(200);
    const result = validateTaskTitle(maxTitle);
    expect(result.valid).toBe(true);
  });
});

describe("combineValidations", () => {
  it("should return valid when all validations pass", () => {
    const result = combineValidations(
      { valid: true },
      { valid: true },
      { valid: true },
    );
    expect(result.valid).toBe(true);
  });

  it("should return invalid with combined errors when any validation fails", () => {
    const result = combineValidations(
      { valid: true },
      { valid: false, error: "Error 1" },
      { valid: false, error: "Error 2" },
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Error 1. Error 2");
  });

  it("should return valid for empty input", () => {
    const result = combineValidations();
    expect(result.valid).toBe(true);
  });
});

describe("validateTimeString", () => {
  it("should return valid for correct HH:MM format", () => {
    expect(validateTimeString("08:00").valid).toBe(true);
    expect(validateTimeString("12:30").valid).toBe(true);
    expect(validateTimeString("00:00").valid).toBe(true);
    expect(validateTimeString("23:59").valid).toBe(true);
  });

  it("should return valid for single digit hour", () => {
    expect(validateTimeString("8:00").valid).toBe(true);
    expect(validateTimeString("9:30").valid).toBe(true);
  });

  it("should return invalid for wrong format", () => {
    expect(validateTimeString("").valid).toBe(false);
    expect(validateTimeString("800").valid).toBe(false);
    expect(validateTimeString("8:0").valid).toBe(false);
    expect(validateTimeString("abc").valid).toBe(false);
  });

  it("should return invalid for out of range hours", () => {
    expect(validateTimeString("24:00").valid).toBe(false);
    expect(validateTimeString("25:00").valid).toBe(false);
  });

  it("should return invalid for out of range minutes", () => {
    expect(validateTimeString("12:60").valid).toBe(false);
    expect(validateTimeString("12:99").valid).toBe(false);
  });
});

describe("validateTimeRange", () => {
  it("should return valid when end > start", () => {
    expect(validateTimeRange("08:00", "18:00").valid).toBe(true);
    expect(validateTimeRange("09:00", "17:30").valid).toBe(true);
  });

  it("should return invalid when end <= start", () => {
    const result1 = validateTimeRange("18:00", "08:00");
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain("before");

    const result2 = validateTimeRange("12:00", "12:00");
    expect(result2.valid).toBe(false);
  });

  it("should return invalid for invalid time strings", () => {
    expect(validateTimeRange("invalid", "18:00").valid).toBe(false);
    expect(validateTimeRange("08:00", "invalid").valid).toBe(false);
  });
});
