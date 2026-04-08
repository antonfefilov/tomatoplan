/**
 * Tests for PlannerState model
 */

import { describe, it, expect } from "vitest";
import {
  createInitialPlannerState,
  resetPlannerStateForNewDay,
  getDailyCapacityInMinutes,
  formatMinutesToHoursMinutes,
  recalculatePoolCapacity,
  STATE_VERSION,
} from "../src/models/planner-state.js";

describe("createInitialPlannerState", () => {
  it("should create state with default capacity", () => {
    const state = createInitialPlannerState();

    expect(state.pool.dailyCapacity).toBe(25);
    expect(state.pool.capacityInMinutes).toBe(25);
    expect(state.pool.dayStart).toBe("08:00");
    expect(state.pool.dayEnd).toBe("18:25");
    expect(state.version).toBe(STATE_VERSION);
  });

  it("should create state with custom capacity", () => {
    const state = createInitialPlannerState(10, 30);

    expect(state.pool.dailyCapacity).toBe(10);
    expect(state.pool.capacityInMinutes).toBe(30);
  });

  it("should create state with custom schedule", () => {
    const state = createInitialPlannerState(
      10,
      25,
      undefined,
      "09:00",
      "17:00",
    );

    expect(state.pool.timeSlots[0]?.startTime).toBe("09:00");
    expect(state.pool.timeSlots[0]?.endTime).toBe("17:00");
  });

  it("should set today's date on pool", () => {
    const state = createInitialPlannerState();
    const today = new Date().toISOString().split("T")[0];

    expect(state.pool.date).toBe(today);
  });
});

describe("resetPlannerStateForNewDay", () => {
  it("should create new pool with same capacity", () => {
    const state = createInitialPlannerState(10);
    const reset = resetPlannerStateForNewDay(state);

    expect(reset.pool.dailyCapacity).toBe(10);
  });

  it("should use new capacity if provided", () => {
    const state = createInitialPlannerState(10);
    const reset = resetPlannerStateForNewDay(state, 15);

    expect(reset.pool.dailyCapacity).toBe(15);
  });

  it("should use new capacityInMinutes if provided", () => {
    const state = createInitialPlannerState(10, 25);
    const reset = resetPlannerStateForNewDay(state, 10, 30);

    expect(reset.pool.capacityInMinutes).toBe(30);
  });

  it("should preserve dayStart and dayEnd if not provided", () => {
    const state = createInitialPlannerState(
      10,
      25,
      undefined,
      "09:00",
      "17:00",
    );
    const reset = resetPlannerStateForNewDay(state);

    expect(reset.pool.timeSlots[0]?.startTime).toBe("09:00");
    expect(reset.pool.timeSlots[0]?.endTime).toBe("17:00");
  });

  it("should use new dayStart and dayEnd if provided", () => {
    const state = createInitialPlannerState(
      10,
      25,
      undefined,
      "08:00",
      "18:00",
    );
    const newSlots = [
      {
        id: "new-slot",
        startTime: "09:00",
        endTime: "17:00",
        label: "Default",
      },
    ];
    const reset = resetPlannerStateForNewDay(state, 10, 25, newSlots);

    expect(reset.pool.timeSlots[0]?.startTime).toBe("09:00");
    expect(reset.pool.timeSlots[0]?.endTime).toBe("17:00");
  });
});

describe("recalculatePoolCapacity", () => {
  it("should calculate capacity based on schedule", () => {
    const pool = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
      timeSlots: [
        {
          id: "slot-1",
          startTime: "08:00",
          endTime: "18:25",
          label: "Default",
        },
      ],
      dayStart: "08:00",
      dayEnd: "18:25",
      date: "2024-06-15",
    };

    const result = recalculatePoolCapacity(pool);

    // 08:00 to 18:25 = 625 minutes / 25 min = 25 tomatoes
    expect(result.dailyCapacity).toBe(25);
  });

  it("should return 0 when schedule is invalid (end <= start)", () => {
    const pool = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
      timeSlots: [
        {
          id: "slot-1",
          startTime: "18:00",
          endTime: "08:00",
          label: "Default",
        },
      ],
      dayStart: "18:00",
      dayEnd: "08:00",
      date: "2024-06-15",
    };

    const result = recalculatePoolCapacity(pool);

    expect(result.dailyCapacity).toBe(0);
  });

  it("should update capacity when duration changes", () => {
    const pool = {
      dailyCapacity: 10,
      capacityInMinutes: 30,
      timeSlots: [
        {
          id: "slot-1",
          startTime: "08:00",
          endTime: "18:00",
          label: "Default",
        },
      ],
      dayStart: "08:00",
      dayEnd: "18:00",
      date: "2024-06-15",
    };

    const result = recalculatePoolCapacity(pool);

    // 08:00 to 18:00 = 600 minutes / 30 min = 20 tomatoes
    expect(result.dailyCapacity).toBe(20);
  });

  it("should preserve other pool properties", () => {
    const pool = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
      timeSlots: [
        {
          id: "slot-1",
          startTime: "08:00",
          endTime: "18:25",
          label: "Default",
        },
      ],
      dayStart: "08:00",
      dayEnd: "18:25",
      date: "2024-06-15",
    };

    const result = recalculatePoolCapacity(pool);

    expect(result.capacityInMinutes).toBe(25);
    expect(result.timeSlots[0]?.startTime).toBe("08:00");
    expect(result.timeSlots[0]?.endTime).toBe("18:25");
    expect(result.date).toBe("2024-06-15");
  });
});

describe("getDailyCapacityInMinutes", () => {
  it("should calculate total minutes from capacity and duration", () => {
    const state = createInitialPlannerState(8, 25);
    expect(getDailyCapacityInMinutes(state)).toBe(200);
  });

  it("should handle different durations", () => {
    const state = createInitialPlannerState(10, 30);
    expect(getDailyCapacityInMinutes(state)).toBe(300);
  });
});

describe("formatMinutesToHoursMinutes", () => {
  it("should format minutes only when less than 60", () => {
    expect(formatMinutesToHoursMinutes(45)).toBe("45m");
    expect(formatMinutesToHoursMinutes(25)).toBe("25m");
  });

  it("should format hours only when exact hours", () => {
    expect(formatMinutesToHoursMinutes(60)).toBe("1h");
    expect(formatMinutesToHoursMinutes(120)).toBe("2h");
  });

  it("should format hours and minutes combined", () => {
    expect(formatMinutesToHoursMinutes(75)).toBe("1h 15m");
    expect(formatMinutesToHoursMinutes(200)).toBe("3h 20m");
  });

  it("should handle zero", () => {
    expect(formatMinutesToHoursMinutes(0)).toBe("0m");
  });
});
