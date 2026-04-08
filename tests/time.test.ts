/**
 * Tests for time utilities
 */

import { describe, expect, it } from "vitest";
import type { TomatoTimeSlot } from "../src/models/tomato-pool.js";
import {
  calculateDailyCapacityFromSchedule,
  calculateTomatoesRemainingInTimeSlots,
  calculateTomatoesRemainingUntilDayEnd,
  formatMinutesToTime,
  formatTimeEstimate,
  getMinutesBetween,
  isValidTimeString,
  parseTimeToMinutes,
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

describe("calculateTomatoesRemainingUntilDayEnd", () => {
  // Typical day: 08:00 to 18:25 (625 minutes = 25 tomatoes at 25 min each)

  it("should return full capacity before day start", () => {
    // 07:00 (420 minutes) - before 08:00 start
    // Should return floor(625 / 25) = 25
    const result = calculateTomatoesRemainingUntilDayEnd(
      420,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(25);
  });

  it("should return exactly full capacity at day start", () => {
    // 08:00 (480 minutes) - exactly at start
    // Should return (1105 - 480) / 25 = 625 / 25 = 25
    const result = calculateTomatoesRemainingUntilDayEnd(
      480,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(25);
  });

  it("should calculate correctly in middle of day", () => {
    // 12:00 (720 minutes) - 6.5 hours into day
    // Remaining: 1105 - 720 = 385 minutes = 15.4 tomatoes
    const result = calculateTomatoesRemainingUntilDayEnd(
      720,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(15.4);
  });

  it("should calculate correctly near end of day", () => {
    // 18:00 (1080 minutes)
    // Remaining: 1105 - 1080 = 25 minutes = 1 tomato
    const result = calculateTomatoesRemainingUntilDayEnd(
      1080,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(1);
  });

  it("should return 0 at day end", () => {
    // 18:25 (1105 minutes) - exactly at end
    const result = calculateTomatoesRemainingUntilDayEnd(
      1105,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(0);
  });

  it("should return 0 after day end", () => {
    // 20:00 (1200 minutes) - after 18:25 end
    const result = calculateTomatoesRemainingUntilDayEnd(
      1200,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(0);
  });

  it("should return 0 late at night after day end", () => {
    // 23:00 (1380 minutes)
    const result = calculateTomatoesRemainingUntilDayEnd(
      1380,
      "08:00",
      "18:25",
      25,
    );
    expect(result).toBe(0);
  });

  it("should handle different capacity values", () => {
    // With 30-minute tomatoes: 625 / 30 = 20.83...
    const result = calculateTomatoesRemainingUntilDayEnd(
      420, // 07:00
      "08:00",
      "18:25",
      30,
    );
    expect(result).toBe(20); // floor(625/30)
  });

  it("should handle 15-minute tomatoes", () => {
    // With 15-minute tomatoes: 625 / 15 = 41.66...
    const result = calculateTomatoesRemainingUntilDayEnd(
      420, // 07:00
      "08:00",
      "18:25",
      15,
    );
    expect(result).toBe(41); // floor(625/15)
  });

  it("should return null for invalid dayStart", () => {
    const result = calculateTomatoesRemainingUntilDayEnd(
      720,
      "invalid",
      "18:25",
      25,
    );
    expect(result).toBeNull();
  });

  it("should return null for invalid dayEnd", () => {
    const result = calculateTomatoesRemainingUntilDayEnd(
      720,
      "08:00",
      "invalid",
      25,
    );
    expect(result).toBeNull();
  });

  it("should return null for zero capacity", () => {
    const result = calculateTomatoesRemainingUntilDayEnd(
      720,
      "08:00",
      "18:25",
      0,
    );
    expect(result).toBeNull();
  });

  it("should return null for negative capacity", () => {
    const result = calculateTomatoesRemainingUntilDayEnd(
      720,
      "08:00",
      "18:25",
      -5,
    );
    expect(result).toBeNull();
  });

  it("should calculate partial tomato correctly", () => {
    // 18:00 (1080 minutes), 10 minutes remaining = 0.4 tomatoes
    const result = calculateTomatoesRemainingUntilDayEnd(
      1095, // 18:15
      "08:00",
      "18:25",
      25,
    );
    // Remaining: 1105 - 1095 = 10 minutes = 0.4 tomatoes
    expect(result).toBe(0.4);
  });

  it("should handle short day schedules", () => {
    // 09:00 to 12:00 = 180 minutes = 7.2 tomatoes at 25 min
    const result = calculateTomatoesRemainingUntilDayEnd(
      540, // 09:00
      "09:00",
      "12:00",
      25,
    );
    expect(result).toBe(7.2);
  });
});

describe("calculateTomatoesRemainingInTimeSlots", () => {
  // Helper to create slots
  const createSlot = (
    startTime: string,
    endTime: string,
    label?: string,
  ): TomatoTimeSlot => ({
    id: `slot-${startTime}-${endTime}`,
    startTime,
    endTime,
    label,
  });

  describe("single-slot schedule (matches current results)", () => {
    it("should return full capacity before slot start", () => {
      // Slot: 08:00 to 18:25 = 625 minutes = 25 tomatoes at 25 min
      const slots = [createSlot("08:00", "18:25")];
      const result = calculateTomatoesRemainingInTimeSlots(
        420, // 07:00
        slots,
        25,
      );
      expect(result).toBe(25);
    });

    it("should return exactly full capacity at slot start", () => {
      const slots = [createSlot("08:00", "18:25")];
      const result = calculateTomatoesRemainingInTimeSlots(
        480, // 08:00
        slots,
        25,
      );
      expect(result).toBe(25);
    });

    it("should calculate correctly in middle of slot", () => {
      const slots = [createSlot("08:00", "18:25")];
      const result = calculateTomatoesRemainingInTimeSlots(
        720, // 12:00
        slots,
        25,
      );
      expect(result).toBe(15.4);
    });

    it("should return 0 after slot end", () => {
      const slots = [createSlot("08:00", "18:25")];
      const result = calculateTomatoesRemainingInTimeSlots(
        1200, // 20:00
        slots,
        25,
      );
      expect(result).toBe(0);
    });
  });

  describe("disjoint slots", () => {
    // Slots: 09:00-10:00 (60 min) and 14:00-15:00 (60 min)
    // Total: 120 minutes = 4.8 tomatoes at 25 min

    const disjointSlots = [
      createSlot("09:00", "10:00", "Morning"),
      createSlot("14:00", "15:00", "Afternoon"),
    ];

    it("should return full capacity before first slot", () => {
      // 08:00 (480 min) - before both slots
      const result = calculateTomatoesRemainingInTimeSlots(
        480,
        disjointSlots,
        25,
      );
      // Both slots: 60 + 60 = 120 minutes = 4.8 tomatoes
      expect(result).toBe(4.8);
    });

    it("should calculate correctly during first slot", () => {
      // 09:30 (570 min) - 30 min remaining in first slot + full second slot
      const result = calculateTomatoesRemainingInTimeSlots(
        570,
        disjointSlots,
        25,
      );
      // First slot remaining: 10:00 - 09:30 = 30 min
      // Second slot: 60 min
      // Total: 90 min = 3.6 tomatoes
      expect(result).toBe(3.6);
    });

    it("should exclude gap time between slots", () => {
      // 11:00 (660 min) - after first slot, before second slot (in gap)
      const result = calculateTomatoesRemainingInTimeSlots(
        660,
        disjointSlots,
        25,
      );
      // First slot has passed: 0
      // Gap time: NOT counted
      // Second slot: 60 min
      // Total: 60 min = 2.4 tomatoes
      expect(result).toBe(2.4);
    });

    it("should calculate correctly during second slot", () => {
      // 14:30 (870 min) - 30 min remaining in second slot
      const result = calculateTomatoesRemainingInTimeSlots(
        870,
        disjointSlots,
        25,
      );
      // First slot has passed: 0
      // Second slot remaining: 15:00 - 14:30 = 30 min
      // Total: 30 min = 1.2 tomatoes
      expect(result).toBe(1.2);
    });

    it("should return 0 after last slot end", () => {
      // 16:00 (960 min) - after both slots
      const result = calculateTomatoesRemainingInTimeSlots(
        960,
        disjointSlots,
        25,
      );
      expect(result).toBe(0);
    });

    it("should exclude gap when time is exactly at gap start", () => {
      // 10:00 (600 min) - exactly at first slot end (start of gap)
      const result = calculateTomatoesRemainingInTimeSlots(
        600,
        disjointSlots,
        25,
      );
      // First slot done: 0
      // Second slot: 60 min = 2.4 tomatoes
      expect(result).toBe(2.4);
    });

    it("should count from gap end as second slot starts", () => {
      // 14:00 (840 min) - exactly at second slot start
      const result = calculateTomatoesRemainingInTimeSlots(
        840,
        disjointSlots,
        25,
      );
      // First slot done: 0
      // Second slot: 60 min = 2.4 tomatoes
      expect(result).toBe(2.4);
    });
  });

  describe("unsorted slots", () => {
    it("should correctly handle unsorted slot order", () => {
      // Slots intentionally provided in reverse order
      const unsortedSlots = [
        createSlot("14:00", "15:00", "Afternoon"),
        createSlot("09:00", "10:00", "Morning"),
      ];

      // 08:00 - before both slots (should sort internally)
      const result = calculateTomatoesRemainingInTimeSlots(
        480,
        unsortedSlots,
        25,
      );
      // Same as if sorted: 120 min = 4.8 tomatoes
      expect(result).toBe(4.8);

      // 12:00 - in gap (should correctly identify gap after sorting)
      const resultInGap = calculateTomatoesRemainingInTimeSlots(
        720,
        unsortedSlots,
        25,
      );
      // Only second slot remaining: 60 min = 2.4 tomatoes
      expect(resultInGap).toBe(2.4);
    });
  });

  describe("invalid capacity", () => {
    it("should return null for zero capacity", () => {
      const slots = [createSlot("08:00", "18:00")];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, 0);
      expect(result).toBeNull();
    });

    it("should return null for negative capacity", () => {
      const slots = [createSlot("08:00", "18:00")];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, -5);
      expect(result).toBeNull();
    });
  });

  describe("empty and invalid slots", () => {
    it("should return 0 for empty slots array", () => {
      const result = calculateTomatoesRemainingInTimeSlots(480, [], 25);
      expect(result).toBe(0);
    });

    it("should ignore invalid startTime in slots", () => {
      const slots = [
        createSlot("invalid", "18:00"),
        createSlot("08:00", "10:00"), // 120 min (2 hours)
      ];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, 25);
      // Only valid slot: 120 min = 4.8 tomatoes
      expect(result).toBe(4.8);
    });

    it("should ignore invalid endTime in slots", () => {
      const slots = [
        createSlot("08:00", "invalid"),
        createSlot("14:00", "15:00"), // 60 min (1 hour)
      ];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, 25);
      // Only valid slot: 60 min = 2.4 tomatoes
      expect(result).toBe(2.4);
    });

    it("should ignore slots with end <= start", () => {
      const slots = [
        createSlot("10:00", "08:00"), // Invalid: end before start
        createSlot("14:00", "15:00"), // Valid: 60 min (1 hour)
      ];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, 25);
      // Only valid slot: 60 min = 2.4 tomatoes
      expect(result).toBe(2.4);
    });

    it("should return 0 when all slots are invalid", () => {
      const slots = [
        createSlot("invalid", "18:00"),
        createSlot("10:00", "08:00"),
      ];
      const result = calculateTomatoesRemainingInTimeSlots(480, slots, 25);
      expect(result).toBe(0);
    });
  });

  describe("partial tomato behavior", () => {
    it("should preserve partial tomato calculation (decimal result)", () => {
      // Slot: 09:00-09:10 (10 min)
      const slots = [createSlot("09:00", "09:10")];
      const result = calculateTomatoesRemainingInTimeSlots(
        540, // 09:00
        slots,
        25,
      );
      // 10 min / 25 min = 0.4 tomatoes
      expect(result).toBe(0.4);
    });

    it("should calculate partial remaining inside slot", () => {
      // Slot: 09:00-10:00 (60 min)
      const slots = [createSlot("09:00", "10:00")];
      const result = calculateTomatoesRemainingInTimeSlots(
        555, // 09:15
        slots,
        25,
      );
      // 45 min remaining / 25 min = 1.8 tomatoes
      expect(result).toBe(1.8);
    });
  });
});
