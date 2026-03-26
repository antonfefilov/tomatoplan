/**
 * Tests for persistence layer
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  saveState,
  loadState,
  clearState,
  exportState,
  importState,
  hasPersistedState,
} from "../src/state/persistence.js";
import { createInitialPlannerState } from "../src/models/planner-state.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveState and loadState", () => {
    it("should save and load state correctly", () => {
      const state = createInitialPlannerState(10, 25);
      state.tasks = [
        {
          id: "task-1",
          title: "My Task",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      saveState(state);

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.dailyCapacity).toBe(10);
      expect(loaded!.pool.capacityInMinutes).toBe(25);
      expect(loaded!.pool.dayStart).toBe("08:00");
      expect(loaded!.pool.dayEnd).toBe("18:25");
      expect(loaded!.tasks).toHaveLength(1);
      expect(loaded!.tasks[0]!.title).toBe("My Task");
    });

    it("should return null when no state exists", () => {
      const loaded = loadState();
      expect(loaded).toBeNull();
    });

    it("should handle state without capacityInMinutes (backward compatibility)", () => {
      const state = createInitialPlannerState(10, 25);

      // Save with the new format
      saveState(state);

      // Manually remove capacityInMinutes to simulate old data
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.PLANNER_STATE)!,
      );
      delete stored.capacityInMinutes;
      localStorage.setItem(STORAGE_KEYS.PLANNER_STATE, JSON.stringify(stored));

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.capacityInMinutes).toBe(25); // default
    });

    it("should handle state without dayStart/dayEnd (backward compatibility)", () => {
      const state = createInitialPlannerState(10, 25);

      // Save with the new format
      saveState(state);

      // Manually remove dayStart/dayEnd to simulate old data
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.PLANNER_STATE)!,
      );
      delete stored.dayStart;
      delete stored.dayEnd;
      localStorage.setItem(STORAGE_KEYS.PLANNER_STATE, JSON.stringify(stored));

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.dayStart).toBe("08:00"); // default
      expect(loaded!.pool.dayEnd).toBe("18:25"); // default
    });

    it("should save and load custom dayStart/dayEnd", () => {
      const state = createInitialPlannerState(10, 25, "09:00", "17:00");
      saveState(state);

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.dayStart).toBe("09:00");
      expect(loaded!.pool.dayEnd).toBe("17:00");
    });
  });

  describe("clearState", () => {
    it("should remove persisted state", () => {
      const state = createInitialPlannerState(10);
      saveState(state);

      expect(hasPersistedState()).toBe(true);

      clearState();

      expect(hasPersistedState()).toBe(false);
    });

    it("should not throw when no state exists", () => {
      expect(() => clearState()).not.toThrow();
    });
  });

  describe("hasPersistedState", () => {
    it("should return false when no state exists", () => {
      expect(hasPersistedState()).toBe(false);
    });

    it("should return true when state exists", () => {
      const state = createInitialPlannerState(10);
      saveState(state);

      expect(hasPersistedState()).toBe(true);
    });
  });

  describe("exportState", () => {
    it("should export state as formatted JSON", () => {
      const state = createInitialPlannerState(10, 25);
      state.tasks = [
        {
          id: "task-1",
          title: "Task",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const exported = exportState(state);
      const parsed = JSON.parse(exported);

      expect(parsed.dailyCapacity).toBe(10);
      expect(parsed.capacityInMinutes).toBe(25);
      expect(parsed.dayStart).toBe("08:00");
      expect(parsed.dayEnd).toBe("18:25");
      expect(parsed.tasks).toHaveLength(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.appName).toBe("Tomato Plan");
    });

    it("should produce human-readable JSON", () => {
      const state = createInitialPlannerState(10);
      const exported = exportState(state);

      // Should have proper indentation
      expect(exported).toContain("\n");
    });
  });

  describe("importState", () => {
    it("should import valid state", () => {
      const state = createInitialPlannerState(10, 25, "09:00", "17:00");
      state.tasks = [
        {
          id: "task-1",
          title: "Task",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const exported = exportState(state);
      const result = importState(exported);

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.state!.dailyCapacity).toBe(10);
      expect(result.state!.dayStart).toBe("09:00");
      expect(result.state!.dayEnd).toBe("17:00");
      expect(result.state!.tasks).toHaveLength(1);
    });

    it("should save imported state to localStorage", () => {
      const state = createInitialPlannerState(15, 30);
      const exported = exportState(state);

      const result = importState(exported);

      expect(result.success).toBe(true);
      expect(hasPersistedState()).toBe(true);

      const loaded = loadState();
      expect(loaded!.pool.dailyCapacity).toBe(15);
    });

    it("should fail for invalid JSON", () => {
      const result = importState("not valid json");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail for valid JSON but invalid state format", () => {
      const result = importState(JSON.stringify({ foo: "bar" }));

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid state format");
    });

    it("should fail for missing required fields", () => {
      const result = importState(
        JSON.stringify({
          dailyCapacity: 10,
          // missing tasks, savedDate, version
        }),
      );

      expect(result.success).toBe(false);
    });
  });

  describe("persistence integration", () => {
    it("should handle full save/load cycle with tasks", () => {
      const state = createInitialPlannerState(20, 30, "09:00", "17:00");
      state.tasks = [
        {
          id: "task-1",
          title: "Task 1",
          description: "Description 1",
          tomatoCount: 5,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Task 2",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      saveState(state);
      const loaded = loadState();

      expect(loaded!.pool.dailyCapacity).toBe(20);
      expect(loaded!.pool.capacityInMinutes).toBe(30);
      expect(loaded!.pool.dayStart).toBe("09:00");
      expect(loaded!.pool.dayEnd).toBe("17:00");
      expect(loaded!.tasks).toHaveLength(2);
      expect(loaded!.tasks[0]!.title).toBe("Task 1");
      expect(loaded!.tasks[0]!.description).toBe("Description 1");
      expect(loaded!.tasks[0]!.tomatoCount).toBe(5);
      expect(loaded!.tasks[0]!.finishedTomatoCount).toBe(2);
      expect(loaded!.tasks[1]!.title).toBe("Task 2");
    });
  });
});
