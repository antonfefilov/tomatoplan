import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TaskpoolStore } from "../src/state/taskpool-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";
import type { Task } from "../src/models/task.js";

function seedLegacyPlannerState(savedDate: string, tasks: unknown[]): void {
  localStorage.setItem(
    STORAGE_KEYS.PLANNER_STATE,
    JSON.stringify({
      dailyCapacity: 8,
      capacityInMinutes: 25,
      tasks,
      savedDate,
      version: 1,
    }),
  );
}

function makeLegacyTask(id: string, title: string): Task {
  return {
    id,
    title,
    tomatoCount: 2,
    finishedTomatoCount: 0,
    createdAt: "2025-01-01T10:00:00.000Z",
    updatedAt: "2025-01-01T10:00:00.000Z",
  };
}

describe("TaskpoolStore startup migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("test_taskpool_startup_migration_empty_legacy_tasks_keeps_store_empty", () => {
    seedLegacyPlannerState("2025-03-10", []);

    const store = new TaskpoolStore();

    expect(store.taskCount).toBe(0);
    expect(store.getTasksForDay("2025-03-10")).toHaveLength(0);
  });

  it("test_taskpool_startup_migration_partial_invalid_legacy_tasks_migrates_valid_subset", () => {
    const savedDate = "2025-03-11";
    const validTask = makeLegacyTask("legacy-valid", "Legacy Valid");
    const invalidMissingId = {
      ...makeLegacyTask("tmp", "Missing id"),
      id: "",
    };

    seedLegacyPlannerState(savedDate, [validTask, invalidMissingId]);

    const store = new TaskpoolStore();

    expect(store.taskCount).toBe(1);
    expect(store.getTaskById("legacy-valid")?.title).toBe("Legacy Valid");
    expect(store.getTasksForDay(savedDate).map((task) => task.id)).toEqual([
      "legacy-valid",
    ]);
  });

  it("test_taskpool_startup_migration_duplicate_legacy_task_ids_deduplicates_by_id", () => {
    const savedDate = "2025-03-12";
    const firstVersion = makeLegacyTask("legacy-dup", "First version");
    const secondVersion = {
      ...makeLegacyTask("legacy-dup", "Second version"),
      description: "Most recent duplicate should win",
    };
    const uniqueTask = makeLegacyTask("legacy-unique", "Unique task");

    seedLegacyPlannerState(savedDate, [
      firstVersion,
      secondVersion,
      uniqueTask,
    ]);

    const store = new TaskpoolStore();
    const migratedIds = store.getTasksForDay(savedDate).map((task) => task.id);

    expect(store.taskCount).toBe(2);
    expect(migratedIds).toHaveLength(2);
    expect(migratedIds.filter((id) => id === "legacy-dup")).toHaveLength(1);
    expect(store.getTaskById("legacy-dup")?.title).toBe("Second version");
    expect(store.getTaskById("legacy-dup")?.description).toBe(
      "Most recent duplicate should win",
    );
  });
});
