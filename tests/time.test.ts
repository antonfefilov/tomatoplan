/**
 * Tests for time utilities
 */

import { describe, it, expect } from "vitest";
import {
  formatTimeEstimate,
  parseTimeToMinutes,
  formatMinutesToTime,
  getMinutesBetween,
  calculateDailyCapacityFromSchedule,
  isValidTimeString,
} from "../src/utils/time.js";

describe("formatTimeEstimate", () => {
  it("should return 0m for zero or negative", () => {
    expect(formatTimeEstimate(0)).toBe("0m");
    expect(formatTimeEstimate(-5)).toBe("0m");
  });

  it("should format minutes only when less than 60", () => {
    expect(formatTimeEstimate(25)).toBe("25m");
    expect(formatTimeEstimate(45)).toBe("45m");
    expect(formatTimeEstimate(1)).toBe("1m");
    expect(formatTimeEstimate(59)).toBe("59m");
  });

  it("should format hours only for exact hours", () => {
    expect(formatTimeEstimate(60)).toBe("1h");
    expect(formatTimeEstimate(120)).toBe("2h");
    expect(formatTimeEstimate(180)).toBe("3h");
  });

  it("should format hours and minutes combined", () => {
    expect(formatTimeEstimate(75)).toBe("1h 15m");
    expect(formatTimeEstimate(90)).toBe("1h 30m");
    expect(formatTimeEstimate(135)).toBe("2h 15m");
    expect(formatTimeEstimate(200)).toBe("3h 20m");
  });

  it("should handle large values", () => {
    expect(formatTimeEstimate(480)).toBe("8h"); // 8 hours
    expect(formatTimeEstimate(500)).toBe("8h 20m");
  });
});

describe("parseTimeToMinutes", () => {
  it("should parse valid HH:MM format", () => {
    expect(parseTimeToMinutes("08:00")).toBe(480);
    expect(parseTimeToMinutes("12:30")).toBe(750);
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("should parse single digit hours", () => {
    expect(parseTimeToMinutes("8:00")).toBe(480);
    expect(parseTimeToMinutes("9:30")).toBe(570);
  });

  it("should return null for invalid format", () => {
    expect(parseTimeToMinutes("")).toBeNull();
    expect(parseTimeToMinutes("800")).toBeNull();
    expect(parseTimeToMinutes("8:0")).toBeNull();
    expect(parseTimeToMinutes("8-00")).toBeNull();
    expect(parseTimeToMinutes("abc")).toBeNull();
  });

  it("should return null for out of range values", () => {
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("25:00")).toBeNull();
    expect(parseTimeToMinutes("12:60")).toBeNull();
    expect(parseTimeToMinutes("12:99")).toBeNull();
  });
});

describe("formatMinutesToTime", () => {
  it("should format minutes to HH:MM format", () => {
    expect(formatMinutesToTime(480)).toBe("08:00");
    expect(formatMinutesToTime(750)).toBe("12:30");
    expect(formatMinutesToTime(0)).toBe("00:00");
    expect(formatMinutesToTime(1439)).toBe("23:59");
  });

  it("should pad with zeros", () => {
    expect(formatMinutesToTime(60)).toBe("01:00");
    expect(formatMinutesToTime(5)).toBe("00:05");
  });

  it("should clamp out of range values", () => {
    expect(formatMinutesToTime(-1)).toBe("00:00");
    expect(formatMinutesToTime(1440)).toBe("23:59");
    expect(formatMinutesToTime(2000)).toBe("23:59");
  });
});

describe("getMinutesBetween", () => {
  it("should return positive minutes when end > start", () => {
    expect(getMinutesBetween("08:00", "12:00")).toBe(240);
    expect(getMinutesBetween("09:00", "17:00")).toBe(480);
  });

  it("should return negative minutes when start > end", () => {
    expect(getMinutesBetween("12:00", "08:00")).toBe(-240);
  });

  it("should return zero when times are equal", () => {
    expect(getMinutesBetween("08:00", "08:00")).toBe(0);
  });

  it("should return null for invalid time strings", () => {
    expect(getMinutesBetween("invalid", "12:00")).toBeNull();
    expect(getMinutesBetween("08:00", "invalid")).toBeNull();
    expect(getMinutesBetween("", "")).toBeNull();
  });
});

describe("calculateDailyCapacityFromSchedule", () => {
  it("should calculate capacity for typical work day", () => {
    // 8:00 to 18:25 = 625 minutes / 25 min = 25 tomatoes
    expect(calculateDailyCapacityFromSchedule("08:00", "18:25", 25)).toBe(25);
  });

  it("should floor the result", () => {
    // 8:00 to 18:00 = 600 minutes / 25 min = 24 tomatoes
    expect(calculateDailyCapacityFromSchedule("08:00", "18:00", 25)).toBe(24);
  });

  it("should handle different durations", () => {
    // 8:00 to 16:00 = 480 minutes / 30 min = 16 tomatoes
    expect(calculateDailyCapacityFromSchedule("08:00", "16:00", 30)).toBe(16);
    // 8:00 to 16:00 = 480 minutes / 15 min = 32 tomatoes
    expect(calculateDailyCapacityFromSchedule("08:00", "16:00", 15)).toBe(32);
  });

  it("should return 0 when end <= start", () => {
    expect(calculateDailyCapacityFromSchedule("18:00", "08:00", 25)).toBe(0);
    expect(calculateDailyCapacityFromSchedule("08:00", "08:00", 25)).toBe(0);
  });

  it("should return 0 for invalid times", () => {
    expect(calculateDailyCapacityFromSchedule("invalid", "18:00", 25)).toBe(0);
    expect(calculateDailyCapacityFromSchedule("08:00", "invalid", 25)).toBe(0);
  });

  it("should return 0 for invalid duration", () => {
    expect(calculateDailyCapacityFromSchedule("08:00", "18:00", 0)).toBe(0);
    expect(calculateDailyCapacityFromSchedule("08:00", "18:00", -5)).toBe(0);
  });
});

describe("isValidTimeString", () => {
  it("should return true for valid time strings", () => {
    expect(isValidTimeString("08:00")).toBe(true);
    expect(isValidTimeString("12:30")).toBe(true);
    expect(isValidTimeString("00:00")).toBe(true);
    expect(isValidTimeString("23:59")).toBe(true);
    expect(isValidTimeString("9:00")).toBe(true);
  });

  it("should return false for invalid time strings", () => {
    expect(isValidTimeString("")).toBe(false);
    expect(isValidTimeString("800")).toBe(false);
    expect(isValidTimeString("24:00")).toBe(false);
    expect(isValidTimeString("12:60")).toBe(false);
    expect(isValidTimeString("abc")).toBe(false);
  });
});
