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

      saveState(state);

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.dailyCapacity).toBe(10);
      expect(loaded!.pool.capacityInMinutes).toBe(25);
      expect(loaded!.pool.timeSlots[0]?.startTime).toBe("08:00");
      expect(loaded!.pool.timeSlots[0]?.endTime).toBe("18:25");
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
      expect(loaded!.pool.timeSlots[0]?.startTime).toBe("08:00"); // default
      expect(loaded!.pool.timeSlots[0]?.endTime).toBe("18:25"); // default
    });

    it("should save and load custom timeSlots", () => {
      const customSlots = [
        {
          id: "custom-slot",
          startTime: "09:00",
          endTime: "17:00",
          label: "Custom",
        },
      ];
      const state = createInitialPlannerState(10, 25, customSlots);
      saveState(state);

      const loaded = loadState();

      expect(loaded).not.toBeNull();
      expect(loaded!.pool.timeSlots[0]?.startTime).toBe("09:00");
      expect(loaded!.pool.timeSlots[0]?.endTime).toBe("17:00");
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

      const exported = exportState(state);
      const parsed = JSON.parse(exported);

      expect(parsed.dailyCapacity).toBe(10);
      expect(parsed.capacityInMinutes).toBe(25);
      expect(parsed.timeSlots).toBeDefined();
      expect(parsed.timeSlots[0]?.startTime).toBe("08:00");
      expect(parsed.timeSlots[0]?.endTime).toBe("18:25");
      // Tasks are now saved as empty array (managed separately by taskpoolStore)
      expect(parsed.tasks).toHaveLength(0);
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
      const customSlots = [
        {
          id: "custom-slot",
          startTime: "09:00",
          endTime: "17:00",
          label: "Custom",
        },
      ];
      const state = createInitialPlannerState(10, 25, customSlots);

      const exported = exportState(state);
      const result = importState(exported);

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.state!.dailyCapacity).toBe(10);
      expect(result.state!.timeSlots?.[0]?.startTime).toBe("09:00");
      expect(result.state!.timeSlots?.[0]?.endTime).toBe("17:00");
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
    it("should handle full save/load cycle", () => {
      const customSlots = [
        {
          id: "custom-slot",
          startTime: "09:00",
          endTime: "17:00",
          label: "Custom",
        },
      ];
      const state = createInitialPlannerState(20, 30, customSlots);

      saveState(state);
      const loaded = loadState();

      expect(loaded!.pool.dailyCapacity).toBe(20);
      expect(loaded!.pool.capacityInMinutes).toBe(30);
      expect(loaded!.pool.timeSlots[0]?.startTime).toBe("09:00");
      expect(loaded!.pool.timeSlots[0]?.endTime).toBe("17:00");
    });
  });
});
