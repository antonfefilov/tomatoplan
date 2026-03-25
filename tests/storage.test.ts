/**
 * Tests for Storage model
 */

import { describe, it, expect } from "vitest";
import {
  createPersistedState,
  isValidPersistedState,
  migratePersistedState,
} from "../src/models/storage.js";
import { STATE_VERSION } from "../src/models/planner-state.js";

describe("createPersistedState", () => {
  it("should create a persisted state with all fields", () => {
    const tasks = [
      {
        id: "task-1",
        title: "Task",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    const state = createPersistedState(10, 25, tasks, "2024-06-15");

    expect(state.dailyCapacity).toBe(10);
    expect(state.capacityInMinutes).toBe(25);
    expect(state.tasks).toEqual(tasks);
    expect(state.savedDate).toBe("2024-06-15");
    expect(state.version).toBe(STATE_VERSION);
  });

  it("should handle empty tasks array", () => {
    const state = createPersistedState(10, 25, [], "2024-06-15");
    expect(state.tasks).toEqual([]);
  });
});

describe("isValidPersistedState", () => {
  it("should return true for valid state", () => {
    const data = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
      tasks: [],
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(true);
  });

  it("should return true without capacityInMinutes (backward compatibility)", () => {
    const data = {
      dailyCapacity: 10,
      tasks: [],
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isValidPersistedState(null)).toBe(false);
  });

  it("should return false for non-object", () => {
    expect(isValidPersistedState("string")).toBe(false);
    expect(isValidPersistedState(123)).toBe(false);
    expect(isValidPersistedState(undefined)).toBe(false);
  });

  it("should return false for missing dailyCapacity", () => {
    const data = {
      tasks: [],
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(false);
  });

  it("should return false for non-positive dailyCapacity", () => {
    const data = {
      dailyCapacity: 0,
      tasks: [],
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(false);
  });

  it("should return false for missing tasks", () => {
    const data = {
      dailyCapacity: 10,
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(false);
  });

  it("should return false for non-array tasks", () => {
    const data = {
      dailyCapacity: 10,
      tasks: {},
      savedDate: "2024-06-15",
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(false);
  });

  it("should return false for missing savedDate", () => {
    const data = {
      dailyCapacity: 10,
      tasks: [],
      version: 1,
    };

    expect(isValidPersistedState(data)).toBe(false);
  });

  it("should return false for missing version", () => {
    const data = {
      dailyCapacity: 10,
      tasks: [],
      savedDate: "2024-06-15",
    };

    expect(isValidPersistedState(data)).toBe(false);
  });
});

describe("migratePersistedState", () => {
  it("should return state with current version", () => {
    const state = {
      dailyCapacity: 10,
      capacityInMinutes: 25,
      tasks: [],
      savedDate: "2024-06-15",
      version: 1,
    };

    const migrated = migratePersistedState(state);

    expect(migrated.version).toBe(STATE_VERSION);
  });

  it("should preserve all fields during migration", () => {
    const state = {
      dailyCapacity: 10,
      capacityInMinutes: 30,
      tasks: [
        {
          id: "1",
          title: "Task",
          tomatoCount: 5,
          finishedTomatoCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ],
      savedDate: "2024-06-15",
      version: 0,
    };

    const migrated = migratePersistedState(state);

    expect(migrated.dailyCapacity).toBe(10);
    expect(migrated.capacityInMinutes).toBe(30);
    expect(migrated.tasks).toHaveLength(1);
    expect(migrated.savedDate).toBe("2024-06-15");
  });
});
