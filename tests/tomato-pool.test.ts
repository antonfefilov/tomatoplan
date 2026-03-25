/**
 * Tests for TomatoPool model
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createTomatoPool,
  getDateString,
  getTodayString,
  isToday,
  isStale,
} from "../src/models/tomato-pool.js";

describe("createTomatoPool", () => {
  it("should create pool with required fields", () => {
    const pool = createTomatoPool(10);

    expect(pool.dailyCapacity).toBe(10);
    expect(pool.capacityInMinutes).toBe(25); // default
    expect(pool.date).toBeDefined();
  });

  it("should create pool with custom capacityInMinutes", () => {
    const pool = createTomatoPool(10, 30);

    expect(pool.capacityInMinutes).toBe(30);
  });

  it("should create pool with custom date", () => {
    const pool = createTomatoPool(10, 25, "2024-06-15");

    expect(pool.date).toBe("2024-06-15");
  });

  it("should use today's date when not specified", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));

    const pool = createTomatoPool(10);

    expect(pool.date).toBe("2024-06-15");

    vi.useRealTimers();
  });
});

describe("getDateString", () => {
  it("should convert Date to YYYY-MM-DD format", () => {
    const date = new Date("2024-06-15T12:00:00.000Z");
    expect(getDateString(date)).toBe("2024-06-15");
  });

  it("should handle different timezones consistently", () => {
    const date = new Date("2024-12-31T23:59:59.999Z");
    expect(getDateString(date)).toBe("2024-12-31");
  });

  it("should handle year boundaries", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    expect(getDateString(date)).toBe("2024-01-01");
  });
});

describe("getTodayString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return today's date as YYYY-MM-DD", () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    expect(getTodayString()).toBe("2024-06-15");
  });

  it("should change with system time", () => {
    vi.setSystemTime(new Date("2024-12-25T08:00:00.000Z"));
    expect(getTodayString()).toBe("2024-12-25");
  });
});

describe("isToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true for today's pool", () => {
    const pool = createTomatoPool(10, 25, "2024-06-15");
    expect(isToday(pool)).toBe(true);
  });

  it("should return false for different date", () => {
    const pool = createTomatoPool(10, 25, "2024-06-14");
    expect(isToday(pool)).toBe(false);
  });
});

describe("isStale", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return false for today's pool", () => {
    const pool = createTomatoPool(10, 25, "2024-06-15");
    expect(isStale(pool)).toBe(false);
  });

  it("should return true for past date", () => {
    const pool = createTomatoPool(10, 25, "2024-06-14");
    expect(isStale(pool)).toBe(true);
  });

  it("should return true for future date (different date)", () => {
    const pool = createTomatoPool(10, 25, "2024-06-16");
    expect(isStale(pool)).toBe(true);
  });
});
