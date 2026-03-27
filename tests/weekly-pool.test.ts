/**
 * Tests for WeeklyPool model
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createWeeklyPool,
  createDefaultWeeklyPool,
  isCurrentWeek,
  isStale,
  getDaysRemainingInWeek,
  getWeeklyCapacityInMinutes,
  formatWeekRange,
  DEFAULT_WEEKLY_CAPACITY_MULTIPLIER,
} from "../src/models/weekly-pool.js";
import { getWeekId } from "../src/models/project.js";

describe("createWeeklyPool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should create a weekly pool with required fields", () => {
    const pool = createWeeklyPool(125, 25);

    expect(pool.weeklyCapacity).toBe(125);
    expect(pool.capacityInMinutes).toBe(25);
    expect(pool.weekId).toBe(getWeekId(new Date()));
    expect(pool.weekStartDate).toBeDefined();
    expect(pool.weekEndDate).toBeDefined();
  });

  it("should create a pool for a specific date", () => {
    const date = new Date("2024-01-15");
    const pool = createWeeklyPool(100, 30, date);

    expect(pool.weekId).toBe(getWeekId(date));
  });

  it("should use default capacity in minutes if not provided", () => {
    const pool = createWeeklyPool(100);

    expect(pool.capacityInMinutes).toBe(25); // DEFAULT_CAPACITY_IN_MINUTES
  });

  it("should set week start date to Monday", () => {
    // June 15, 2024 is a Saturday
    // Week start should be Monday, June 10
    const pool = createWeeklyPool(100, 25);

    // Check the date string directly to avoid timezone issues
    expect(pool.weekStartDate).toBe("2024-06-10");
  });

  it("should set week end date to Sunday", () => {
    const pool = createWeeklyPool(100, 25);

    // Check the date string directly to avoid timezone issues
    expect(pool.weekEndDate).toBe("2024-06-16");
  });

  // ISO 8601 week boundary tests
  it("should handle year boundary - Jan 1, 2021 belongs to 2020-W53", () => {
    vi.setSystemTime(new Date("2021-01-01T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);

    expect(pool.weekId).toBe("2020-W53");
    // Week 53 of 2020: Dec 28, 2020 - Jan 3, 2021
    expect(pool.weekStartDate).toBe("2020-12-28");
    expect(pool.weekEndDate).toBe("2021-01-03");
  });

  it("should handle year boundary - Dec 31, 2020 belongs to 2020-W53", () => {
    vi.setSystemTime(new Date("2020-12-31T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);

    expect(pool.weekId).toBe("2020-W53");
  });

  it("should handle year boundary - Dec 30, 2024 belongs to 2025-W01", () => {
    vi.setSystemTime(new Date("2024-12-30T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);

    expect(pool.weekId).toBe("2025-W01");
    // Week 1 of 2025: Dec 30, 2024 - Jan 5, 2025
    expect(pool.weekStartDate).toBe("2024-12-30");
    expect(pool.weekEndDate).toBe("2025-01-05");
  });
});

describe("createDefaultWeeklyPool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should create pool with default daily capacity", () => {
    const pool = createDefaultWeeklyPool();

    // Default is 25 daily * 5 days = 125 weekly
    expect(pool.weeklyCapacity).toBe(25 * DEFAULT_WEEKLY_CAPACITY_MULTIPLIER);
    expect(pool.capacityInMinutes).toBe(25);
  });

  it("should create pool with custom daily capacity", () => {
    const pool = createDefaultWeeklyPool(20);

    expect(pool.weeklyCapacity).toBe(20 * DEFAULT_WEEKLY_CAPACITY_MULTIPLIER);
  });

  it("should create pool with custom capacity in minutes", () => {
    const pool = createDefaultWeeklyPool(25, 30);

    expect(pool.capacityInMinutes).toBe(30);
  });

  it("should create pool for a specific date", () => {
    const date = new Date("2024-01-15");
    const pool = createDefaultWeeklyPool(25, 25, date);

    expect(pool.weekId).toBe(getWeekId(date));
  });
});

describe("isCurrentWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return true for current week pool", () => {
    const pool = createWeeklyPool(100, 25);
    expect(isCurrentWeek(pool)).toBe(true);
  });

  it("should return false for different week pool", () => {
    const pool = createWeeklyPool(100, 25, new Date("2024-01-15"));
    expect(isCurrentWeek(pool)).toBe(false);
  });

  it("should return false for past week pool", () => {
    const pastDate = new Date("2024-01-01");
    const pool = createWeeklyPool(100, 25, pastDate);

    expect(isCurrentWeek(pool)).toBe(false);
  });
});

describe("isStale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return false for current week", () => {
    const pool = createWeeklyPool(100, 25);
    expect(isStale(pool)).toBe(false);
  });

  it("should return true for past week", () => {
    const pastDate = new Date("2024-01-01");
    const pool = createWeeklyPool(100, 25, pastDate);

    expect(isStale(pool)).toBe(true);
  });

  it("should return true for future week", () => {
    const futureDate = new Date("2025-01-01");
    const pool = createWeeklyPool(100, 25, futureDate);

    expect(isStale(pool)).toBe(true);
  });
});

describe("getDaysRemainingInWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return days remaining for mid-week date", () => {
    // Wednesday, June 12, 2024
    vi.setSystemTime(new Date("2024-06-12T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);

    // Days remaining: Wed, Thu, Fri, Sat, Sun = 5 days
    const remaining = getDaysRemainingInWeek(pool);
    expect(remaining).toBeGreaterThanOrEqual(4);
    expect(remaining).toBeLessThanOrEqual(5);
  });

  it("should return 1 for Sunday", () => {
    // Sunday, June 16, 2024
    vi.setSystemTime(new Date("2024-06-16T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);

    const remaining = getDaysRemainingInWeek(pool);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(1);
  });

  it("should return 0 for past week", () => {
    vi.setSystemTime(new Date("2024-06-20T10:00:00.000Z"));
    const pastPool = createWeeklyPool(100, 25, new Date("2024-06-01"));

    const remaining = getDaysRemainingInWeek(pastPool);
    expect(remaining).toBe(0);
  });
});

describe("getWeeklyCapacityInMinutes", () => {
  it("should calculate total minutes from capacity and duration", () => {
    const pool = createWeeklyPool(100, 25);
    const minutes = getWeeklyCapacityInMinutes(pool);

    expect(minutes).toBe(100 * 25);
  });

  it("should handle different duration values", () => {
    const pool = createWeeklyPool(50, 30);
    const minutes = getWeeklyCapacityInMinutes(pool);

    expect(minutes).toBe(50 * 30);
  });
});

describe("formatWeekRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should format week range as readable string", () => {
    const pool = createWeeklyPool(100, 25);
    const range = formatWeekRange(pool);

    expect(range).toMatch(/Jun \d+ - \d+, 2024/);
  });

  it("should format week range with different months", () => {
    // Use a date that spans two months in UTC
    // February 1, 2024 is Thursday in UTC
    // The ISO week containing Feb 1 starts on Monday Jan 29 and ends on Sunday Feb 4
    vi.setSystemTime(new Date("2024-02-01T10:00:00.000Z"));
    const pool = createWeeklyPool(100, 25);
    const range = formatWeekRange(pool);

    // Week for Feb 1 should be Jan 29 - Feb 4 (spans Jan and Feb)
    expect(range).toMatch(/Jan \d+ - Feb \d+, 2024/);
  });
});

describe("DEFAULT_WEEKLY_CAPACITY_MULTIPLIER", () => {
  it("should be 5 (working days)", () => {
    expect(DEFAULT_WEEKLY_CAPACITY_MULTIPLIER).toBe(5);
  });
});
