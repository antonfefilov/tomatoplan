/**
 * Tests for PlannerState model
 */

import { describe, it, expect } from "vitest";
import {
  createInitialPlannerState,
  resetPlannerStateForNewDay,
  getTotalAssignedTomatoes,
  getRemainingTomatoes,
  isAtCapacity,
  isOverCapacity,
  getDailyCapacityInMinutes,
  getTotalAssignedMinutes,
  formatMinutesToHoursMinutes,
  recalculatePoolCapacity,
  STATE_VERSION,
} from "../src/models/planner-state.js";
import type { Task } from "../src/models/task.js";

describe("createInitialPlannerState", () => {
  it("should create state with default capacity", () => {
    const state = createInitialPlannerState();

    expect(state.pool.dailyCapacity).toBe(25);
    expect(state.pool.capacityInMinutes).toBe(25);
    expect(state.pool.dayStart).toBe("08:00");
    expect(state.pool.dayEnd).toBe("18:25");
    expect(state.tasks).toEqual([]);
    expect(state.version).toBe(STATE_VERSION);
  });

  it("should create state with custom capacity", () => {
    const state = createInitialPlannerState(10, 30);

    expect(state.pool.dailyCapacity).toBe(10);
    expect(state.pool.capacityInMinutes).toBe(30);
  });

  it("should create state with custom schedule", () => {
    const state = createInitialPlannerState(10, 25, "09:00", "17:00");

    expect(state.pool.dayStart).toBe("09:00");
    expect(state.pool.dayEnd).toBe("17:00");
  });

  it("should set today's date on pool", () => {
    const state = createInitialPlannerState();
    const today = new Date().toISOString().split("T")[0];

    expect(state.pool.date).toBe(today);
  });
});

describe("resetPlannerStateForNewDay", () => {
  it("should reset tasks and create new pool", () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Task",
        tomatoCount: 5,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    const state = {
      ...createInitialPlannerState(10),
      tasks,
    };

    const reset = resetPlannerStateForNewDay(state);

    expect(reset.tasks).toEqual([]);
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
    const state = createInitialPlannerState(10, 25, "09:00", "17:00");
    const reset = resetPlannerStateForNewDay(state);

    expect(reset.pool.dayStart).toBe("09:00");
    expect(reset.pool.dayEnd).toBe("17:00");
  });

  it("should use new dayStart and dayEnd if provided", () => {
    const state = createInitialPlannerState(10, 25, "08:00", "18:00");
    const reset = resetPlannerStateForNewDay(state, 10, 25, "09:00", "17:00");

    expect(reset.pool.dayStart).toBe("09:00");
    expect(reset.pool.dayEnd).toBe("17:00");
  });
});

describe("recalculatePoolCapacity", () => {
  it("should calculate capacity based on schedule", () => {
    const pool = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
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
      dayStart: "08:00",
      dayEnd: "18:25",
      date: "2024-06-15",
    };

    const result = recalculatePoolCapacity(pool);

    expect(result.capacityInMinutes).toBe(25);
    expect(result.dayStart).toBe("08:00");
    expect(result.dayEnd).toBe("18:25");
    expect(result.date).toBe("2024-06-15");
  });
});

describe("getTotalAssignedTomatoes", () => {
  it("should return 0 for empty tasks", () => {
    const state = createInitialPlannerState();
    expect(getTotalAssignedTomatoes(state)).toBe(0);
  });

  it("should sum tomato counts across tasks", () => {
    const state = {
      ...createInitialPlannerState(),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "2",
          title: "B",
          tomatoCount: 5,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "3",
          title: "C",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(getTotalAssignedTomatoes(state)).toBe(10);
  });
});

describe("getRemainingTomatoes", () => {
  it("should return full capacity when no tasks", () => {
    const state = createInitialPlannerState(10);
    expect(getRemainingTomatoes(state)).toBe(10);
  });

  it("should return capacity minus assigned", () => {
    const state = {
      ...createInitialPlannerState(10),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "2",
          title: "B",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(getRemainingTomatoes(state)).toBe(5);
  });

  it("should return negative when over capacity", () => {
    const state = {
      ...createInitialPlannerState(5),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 7,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(getRemainingTomatoes(state)).toBe(-2);
  });
});

describe("isAtCapacity", () => {
  it("should return false when tomatoes remain", () => {
    const state = {
      ...createInitialPlannerState(10),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 5,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isAtCapacity(state)).toBe(false);
  });

  it("should return true when exactly at capacity", () => {
    const state = {
      ...createInitialPlannerState(10),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 10,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isAtCapacity(state)).toBe(true);
  });

  it("should return true when over capacity", () => {
    const state = {
      ...createInitialPlannerState(5),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 7,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isAtCapacity(state)).toBe(true);
  });
});

describe("isOverCapacity", () => {
  it("should return false when under capacity", () => {
    const state = {
      ...createInitialPlannerState(10),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 5,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isOverCapacity(state)).toBe(false);
  });

  it("should return false when exactly at capacity", () => {
    const state = {
      ...createInitialPlannerState(10),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 10,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isOverCapacity(state)).toBe(false);
  });

  it("should return true when over capacity", () => {
    const state = {
      ...createInitialPlannerState(5),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 7,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(isOverCapacity(state)).toBe(true);
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

describe("getTotalAssignedMinutes", () => {
  it("should return 0 for no tasks", () => {
    const state = createInitialPlannerState(10, 25);
    expect(getTotalAssignedMinutes(state)).toBe(0);
  });

  it("should calculate assigned minutes", () => {
    const state = {
      ...createInitialPlannerState(10, 25),
      tasks: [
        {
          id: "1",
          title: "A",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "2",
          title: "B",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Task[],
    };

    expect(getTotalAssignedMinutes(state)).toBe(125); // 5 * 25
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
