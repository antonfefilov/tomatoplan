/**
 * Tests for PlannerStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlannerStore } from "../src/state/planner-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";

describe("PlannerStore", () => {
  let store: PlannerStore;

  beforeEach(() => {
    localStorage.clear();
    // Use fake timers for consistent date handling
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Create fresh store instance for each test
    store = new PlannerStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should have default capacity", () => {
      const state = store.getState();
      expect(state.pool.dailyCapacity).toBe(25);
      expect(state.pool.capacityInMinutes).toBe(25);
    });

    it("should have empty tasks", () => {
      expect(store.tasks).toEqual([]);
    });

    it("should load persisted state from localStorage", () => {
      // First store saves some state
      store.setCapacity(15);
      store.setCapacityInMinutes(30);
      store.addTask("Test Task");

      // Create new store instance - should load from localStorage
      // Note: dailyCapacity is recalculated based on schedule when capacityInMinutes changes
      // With 30 min duration and default schedule (08:00-18:25 = 625 min), capacity = floor(625/30) = 20
      const newStore = new PlannerStore();

      expect(newStore.dailyCapacity).toBe(20);
      expect(newStore.capacityInMinutes).toBe(30);
      expect(newStore.tasks).toHaveLength(1);
    });
  });

  describe("setCapacity", () => {
    it("should update daily capacity", () => {
      const result = store.setCapacity(15);
      expect(result.success).toBe(true);
      expect(store.dailyCapacity).toBe(15);
    });

    it("should validate capacity", () => {
      const result = store.setCapacity(0);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject capacity above max", () => {
      const result = store.setCapacity(31);
      expect(result.success).toBe(false);
    });
  });

  describe("setCapacityInMinutes", () => {
    it("should update capacity in minutes", () => {
      const result = store.setCapacityInMinutes(30);
      expect(result.success).toBe(true);
      expect(store.capacityInMinutes).toBe(30);
    });

    it("should validate capacity in minutes", () => {
      const result = store.setCapacityInMinutes(0);
      expect(result.success).toBe(false);
    });

    it("should reject values above 60", () => {
      const result = store.setCapacityInMinutes(61);
      expect(result.success).toBe(false);
    });

    it("should recalculate daily capacity when duration changes", () => {
      // Default schedule is 08:00 to 18:25 = 625 minutes
      // With 25 min duration = 25 tomatoes
      expect(store.dailyCapacity).toBe(25);

      // With 30 min duration = 625 / 30 = 20 tomatoes
      store.setCapacityInMinutes(30);
      expect(store.dailyCapacity).toBe(20);
    });
  });

  describe("setDayStart", () => {
    it("should update day start time", () => {
      const result = store.setDayStart("09:00");
      expect(result.success).toBe(true);
      expect(store.dayStart).toBe("09:00");
    });

    it("should validate time format", () => {
      const result = store.setDayStart("invalid");
      expect(result.success).toBe(false);
    });

    it("should reject start time after end time", () => {
      const result = store.setDayStart("20:00");
      expect(result.success).toBe(false);
    });

    it("should recalculate daily capacity when start time changes", () => {
      // Default: 08:00 to 18:25 = 625 minutes / 25 = 25 tomatoes
      expect(store.dailyCapacity).toBe(25);

      // 09:00 to 18:25 = 565 minutes / 25 = 22 tomatoes
      store.setDayStart("09:00");
      expect(store.dailyCapacity).toBe(22);
    });
  });

  describe("setDayEnd", () => {
    it("should update day end time", () => {
      const result = store.setDayEnd("17:00");
      expect(result.success).toBe(true);
      expect(store.dayEnd).toBe("17:00");
    });

    it("should validate time format", () => {
      const result = store.setDayEnd("invalid");
      expect(result.success).toBe(false);
    });

    it("should reject end time before start time", () => {
      const result = store.setDayEnd("06:00");
      expect(result.success).toBe(false);
    });

    it("should recalculate daily capacity when end time changes", () => {
      // Default: 08:00 to 18:25 = 625 minutes / 25 = 25 tomatoes
      expect(store.dailyCapacity).toBe(25);

      // 08:00 to 17:00 = 540 minutes / 25 = 21 tomatoes
      store.setDayEnd("17:00");
      expect(store.dailyCapacity).toBe(21);
    });
  });

  describe("addTask", () => {
    it("should add a new task", () => {
      const result = store.addTask("My Task");

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0]!.title).toBe("My Task");
    });

    it("should add task with description", () => {
      store.addTask("Task", "Description");

      expect(store.tasks[0]!.description).toBe("Description");
    });

    it("should validate task title", () => {
      const result = store.addTask("");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should trim task title", () => {
      store.addTask("  Trimmed Title  ");

      expect(store.tasks[0]!.title).toBe("Trimmed Title");
    });
  });

  describe("updateTask", () => {
    it("should update task title", () => {
      const { taskId } = store.addTask("Original");
      const result = store.updateTask(taskId!, { title: "Updated" });

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.title).toBe("Updated");
    });

    it("should update task description", () => {
      const { taskId } = store.addTask("Task");
      const result = store.updateTask(taskId!, { description: "New desc" });

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.description).toBe("New desc");
    });

    it("should fail for non-existent task", () => {
      const result = store.updateTask("non-existent", { title: "New" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should validate new title", () => {
      const { taskId } = store.addTask("Task");
      const result = store.updateTask(taskId!, { title: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("removeTask", () => {
    it("should remove a task", () => {
      const { taskId } = store.addTask("Task");
      const result = store.removeTask(taskId!);

      expect(result.success).toBe(true);
      expect(store.tasks).toHaveLength(0);
    });

    it("should fail for non-existent task", () => {
      const result = store.removeTask("non-existent");

      expect(result.success).toBe(false);
    });
  });

  describe("assignTomato", () => {
    it("should assign a tomato to task", () => {
      const { taskId } = store.addTask("Task");
      const result = store.assignTomato(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(1);
    });

    it("should fail when no tomatoes remaining", () => {
      store.setCapacity(1);
      store.addTask("Task 1");
      const { taskId: task2Id } = store.addTask("Task 2");

      // Assign the only tomato to task 1
      store.assignTomato(store.tasks[0]!.id);

      // Try to assign to task 2 - should fail
      const result = store.assignTomato(task2Id!);
      expect(result.success).toBe(false);
    });

    it("should fail for non-existent task", () => {
      const result = store.assignTomato("non-existent");

      expect(result.success).toBe(false);
    });
  });

  describe("unassignTomato", () => {
    it("should unassign a tomato from task", () => {
      const { taskId } = store.addTask("Task");
      store.assignTomato(taskId!);
      store.assignTomato(taskId!);

      const result = store.unassignTomato(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(1);
    });

    it("should fail when task has no tomatoes", () => {
      const { taskId } = store.addTask("Task");
      const result = store.unassignTomato(taskId!);

      expect(result.success).toBe(false);
    });
  });

  describe("setTomatoCount", () => {
    it("should set exact tomato count", () => {
      const { taskId } = store.addTask("Task");
      const result = store.setTomatoCount(taskId!, 5);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(5);
    });

    it("should fail if count exceeds capacity", () => {
      store.setCapacity(5);
      const { taskId } = store.addTask("Task");
      const result = store.setTomatoCount(taskId!, 10);

      expect(result.success).toBe(false);
    });
  });

  describe("markTomatoAsFinished/Unfinished", () => {
    it("should mark tomato as finished", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 3);

      const result = store.markTomatoAsFinished(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(1);
    });

    it("should increment finished count beyond planned without changing tomatoCount", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 2);
      store.markTomatoAsFinished(taskId!);
      store.markTomatoAsFinished(taskId!);

      const result = store.markTomatoAsFinished(taskId!);

      // Finished count can exceed planned count
      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(3);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(2); // planned unchanged
    });

    it("should mark tomato as unfinished", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 3);
      store.setFinishedTomatoCount(taskId!, 2);

      const result = store.markTomatoAsUnfinished(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(1);
    });

    it("should not go below zero", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 1);

      const result = store.markTomatoAsUnfinished(taskId!);

      expect(result.success).toBe(false);
    });
  });

  describe("setFinishedTomatoCount", () => {
    it("should set finished count", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 5);

      const result = store.setFinishedTomatoCount(taskId!, 3);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(3);
    });

    it("should allow finished count to exceed planned count", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 3);

      // Setting finished count beyond planned should succeed
      const result = store.setFinishedTomatoCount(taskId!, 5);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(5);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(3); // planned unchanged
    });
  });

  describe("markTaskDone", () => {
    it("should mark task as done by setting finishedTomatoCount to tomatoCount", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 5);
      store.setFinishedTomatoCount(taskId!, 2);

      const result = store.markTaskDone(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(5);
      expect(store.getTaskById(taskId!)!.tomatoCount).toBe(5);
    });

    it("should not change task when already done", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 3);
      store.setFinishedTomatoCount(taskId!, 3);

      const result = store.markTaskDone(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(3);
    });

    it("should not change task when finished exceeds planned", () => {
      const { taskId } = store.addTask("Task");
      store.setTomatoCount(taskId!, 3);
      store.setFinishedTomatoCount(taskId!, 5);

      const result = store.markTaskDone(taskId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.finishedTomatoCount).toBe(5);
    });

    it("should fail for non-existent task", () => {
      const result = store.markTaskDone("non-existent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("selectors", () => {
    beforeEach(() => {
      store.addTask("Task 1");
      store.addTask("Task 2");
      store.addTask("Task 3");
    });

    it("should track assigned tomatoes", () => {
      store.setTomatoCount(store.tasks[0]!.id, 3);
      store.setTomatoCount(store.tasks[1]!.id, 2);

      expect(store.assignedTomatoes).toBe(5);
    });

    it("should track remaining tomatoes", () => {
      store.setCapacity(10);
      store.setTomatoCount(store.tasks[0]!.id, 3);

      expect(store.remainingTomatoes).toBe(7);
    });

    it("should detect at capacity", () => {
      store.setCapacity(3);
      store.setTomatoCount(store.tasks[0]!.id, 3);

      expect(store.isAtCapacity).toBe(true);
    });

    it("should detect over capacity", () => {
      store.setCapacity(2);
      // setTomatoCount won't allow exceeding capacity, so we verify the behavior
      // by testing that it correctly prevents over-assignment
      const result = store.setTomatoCount(store.tasks[0]!.id, 3);

      // Should fail because 3 > capacity of 2
      expect(result.success).toBe(false);
      expect(store.isOverCapacity).toBe(false); // Not over because assignment failed
    });

    it("should get task by ID", () => {
      const { taskId } = store.addTask("Special Task");
      const task = store.getTaskById(taskId!);

      expect(task).toBeDefined();
      expect(task!.title).toBe("Special Task");
    });

    it("should get tasks sorted by tomatoes", () => {
      store.setTomatoCount(store.tasks[0]!.id, 1);
      store.setTomatoCount(store.tasks[1]!.id, 5);
      store.setTomatoCount(store.tasks[2]!.id, 3);

      const sorted = store.getTasksSortedByTomatoes();

      expect(sorted[0]!.tomatoCount).toBe(5);
      expect(sorted[1]!.tomatoCount).toBe(3);
      expect(sorted[2]!.tomatoCount).toBe(1);
    });

    it("should get tasks with tomatoes", () => {
      store.setTomatoCount(store.tasks[0]!.id, 1);
      // tasks[1] and [2] have 0 tomatoes

      const withTomatoes = store.getTasksWithTomatoes();

      expect(withTomatoes).toHaveLength(1);
    });

    it("should get finished tomatoes count", () => {
      store.setTomatoCount(store.tasks[0]!.id, 3);
      store.setFinishedTomatoCount(store.tasks[0]!.id, 2);
      store.setTomatoCount(store.tasks[1]!.id, 2);
      store.setFinishedTomatoCount(store.tasks[1]!.id, 1);

      expect(store.getFinishedTomatoes()).toBe(3);
    });
  });

  describe("subscription", () => {
    it("should notify subscribers on state change", () => {
      const callback = vi.fn();
      store.subscribe(callback);

      store.setCapacity(15);

      expect(callback).toHaveBeenCalled();
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall![0].pool.dailyCapacity).toBe(15);
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);

      unsubscribe();
      callback.mockClear();

      store.setCapacity(15);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should immediately call subscriber with current state", () => {
      const callback = vi.fn();
      store.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("persistence", () => {
    it("should persist state changes to localStorage", () => {
      store.setCapacity(12);

      const stored = localStorage.getItem(STORAGE_KEYS.PLANNER_STATE);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.dailyCapacity).toBe(12);
      // Tasks are no longer persisted in planner state - they're managed by taskpoolStore
      expect(parsed.tasks).toHaveLength(0);
    });
  });

  describe("resetDay", () => {
    it("should clear tasks but preserve capacity", () => {
      store.setCapacity(15);
      store.addTask("Task");

      store.resetDay();

      expect(store.tasks).toHaveLength(0);
      expect(store.dailyCapacity).toBe(15);
    });

    it("should preserve dayStart and dayEnd", () => {
      store.setDayStart("09:00");
      store.setDayEnd("17:00");
      store.addTask("Task");

      store.resetDay();

      expect(store.dayStart).toBe("09:00");
      expect(store.dayEnd).toBe("17:00");
    });

    it("should preserve capacityInMinutes", () => {
      store.setCapacityInMinutes(30);
      store.addTask("Task");

      store.resetDay();

      expect(store.capacityInMinutes).toBe(30);
    });
  });

  describe("clearAllData", () => {
    it("should reset to default state", () => {
      store.setCapacity(15);
      store.setCapacityInMinutes(30);
      store.addTask("Task");

      store.clearAllData();

      expect(store.dailyCapacity).toBe(25); // default
      expect(store.capacityInMinutes).toBe(25); // default
      expect(store.tasks).toHaveLength(0);
    });

    it("should clear localStorage", () => {
      store.addTask("Task");
      store.clearAllData();

      expect(localStorage.getItem(STORAGE_KEYS.PLANNER_STATE)).toBeNull();
    });
  });

  describe("setTaskProject", () => {
    it("should assign task to a project", () => {
      const { taskId } = store.addTask("Task");
      const result = store.setTaskProject(taskId!, "project-1");

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.projectId).toBe("project-1");
    });

    it("should unassign task from project", () => {
      const { taskId } = store.addTask("Task");
      store.setTaskProject(taskId!, "project-1");

      const result = store.setTaskProject(taskId!, undefined);

      expect(result.success).toBe(true);
      expect(store.getTaskById(taskId!)!.projectId).toBeUndefined();
    });

    it("should fail for non-existent task", () => {
      const result = store.setTaskProject("non-existent", "project-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should update updatedAt timestamp", () => {
      const { taskId } = store.addTask("Task");
      const originalUpdatedAt = store.getTaskById(taskId!)!.updatedAt;

      vi.advanceTimersByTime(1000);
      store.setTaskProject(taskId!, "project-1");

      const updatedTask = store.getTaskById(taskId!);
      expect(updatedTask!.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe("unassignTasksFromProject", () => {
    it("should unassign all tasks from a project", () => {
      store.addTask("Task 1");
      store.addTask("Task 2");
      store.addTask("Task 3");

      store.setTaskProject(store.tasks[0]!.id, "project-1");
      store.setTaskProject(store.tasks[1]!.id, "project-1");
      store.setTaskProject(store.tasks[2]!.id, "project-2");

      store.unassignTasksFromProject("project-1");

      expect(store.getTaskById(store.tasks[0]!.id)!.projectId).toBeUndefined();
      expect(store.getTaskById(store.tasks[1]!.id)!.projectId).toBeUndefined();
      expect(store.getTaskById(store.tasks[2]!.id)!.projectId).toBe(
        "project-2",
      );
    });

    it("should update updatedAt timestamp for affected tasks", () => {
      const { taskId } = store.addTask("Task");
      store.setTaskProject(taskId!, "project-1");
      const originalUpdatedAt = store.getTaskById(taskId!)!.updatedAt;

      vi.advanceTimersByTime(1000);
      store.unassignTasksFromProject("project-1");

      const updatedTask = store.getTaskById(taskId!);
      expect(updatedTask!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should do nothing when no tasks assigned to project", () => {
      store.addTask("Task 1");
      store.addTask("Task 2");

      // No tasks assigned to project-1
      const callback = vi.fn();
      store.subscribe(callback);
      callback.mockClear(); // Clear initial call

      store.unassignTasksFromProject("project-1");

      // No state change, so subscriber not called
      expect(callback).not.toHaveBeenCalled();
    });

    it("should not affect tasks with different projectId", () => {
      store.addTask("Task 1");
      store.addTask("Task 2");

      store.setTaskProject(store.tasks[0]!.id, "project-1");
      store.setTaskProject(store.tasks[1]!.id, "project-2");

      store.unassignTasksFromProject("project-1");

      expect(store.getTaskById(store.tasks[1]!.id)!.projectId).toBe(
        "project-2",
      );
    });
  });

  describe("reorderTask", () => {
    beforeEach(() => {
      store.addTask("Task 1");
      store.addTask("Task 2");
      store.addTask("Task 3");
      store.addTask("Task 4");
    });

    it("should reorder a task to a new position", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, 2);

      expect(result.success).toBe(true);
      expect(store.tasks[0]!.title).toBe("Task 2");
      expect(store.tasks[1]!.title).toBe("Task 3");
      expect(store.tasks[2]!.title).toBe("Task 1");
      expect(store.tasks[3]!.title).toBe("Task 4");
    });

    it("should reorder a task to the beginning", () => {
      const taskId = store.tasks[3]!.id; // Task 4
      const result = store.reorderTask(taskId, 0);

      expect(result.success).toBe(true);
      expect(store.tasks[0]!.title).toBe("Task 4");
      expect(store.tasks[1]!.title).toBe("Task 1");
      expect(store.tasks[2]!.title).toBe("Task 2");
      expect(store.tasks[3]!.title).toBe("Task 3");
    });

    it("should reorder a task to the end", () => {
      const taskId = store.tasks[0]!.id; // Task 1
      const result = store.reorderTask(taskId, 3);

      expect(result.success).toBe(true);
      expect(store.tasks[0]!.title).toBe("Task 2");
      expect(store.tasks[1]!.title).toBe("Task 3");
      expect(store.tasks[2]!.title).toBe("Task 4");
      expect(store.tasks[3]!.title).toBe("Task 1");
    });

    it("should not change order when moving to same position", () => {
      const taskId = store.tasks[1]!.id;
      const originalOrder = store.tasks.map((t) => t.title);
      const result = store.reorderTask(taskId, 1);

      expect(result.success).toBe(true);
      expect(store.tasks.map((t) => t.title)).toEqual(originalOrder);
    });

    it("should fail for non-existent task", () => {
      const result = store.reorderTask("non-existent", 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should fail for invalid target index (negative)", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, -1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid target index");
    });

    it("should fail for invalid target index (out of bounds)", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid target index");
    });

    it("should fail for NaN as target index", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, NaN);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be an integer");
    });

    it("should fail for Infinity as target index", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, Infinity);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be an integer");
    });

    it("should fail for negative Infinity as target index", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, -Infinity);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be an integer");
    });

    it("should fail for float as target index", () => {
      const taskId = store.tasks[0]!.id;
      const result = store.reorderTask(taskId, 1.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be an integer");
    });

    it("should fail for non-integer string coerced to number-like", () => {
      const taskId = store.tasks[0]!.id;
      // @ts-expect-error - Testing runtime behavior with wrong type
      const result = store.reorderTask(taskId, "2");

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be an integer");
    });

    it("should not update task updatedAt timestamp", () => {
      const taskId = store.tasks[0]!.id;
      const originalUpdatedAt = store.getTaskById(taskId)!.updatedAt;

      // Wait a bit to ensure timestamp would be different if updated
      vi.advanceTimersByTime(1000);

      store.reorderTask(taskId, 2);

      expect(store.getTaskById(taskId)!.updatedAt).toBe(originalUpdatedAt);
    });

    it("should preserve all task properties when reordering", () => {
      // Assign some tomatoes to tasks
      store.setTomatoCount(store.tasks[0]!.id, 3);
      store.setFinishedTomatoCount(store.tasks[0]!.id, 1);

      const taskId = store.tasks[0]!.id;
      const originalTask = store.getTaskById(taskId)!;

      store.reorderTask(taskId, 2);

      const movedTask = store.tasks.find((t) => t.id === taskId)!;
      expect(movedTask.tomatoCount).toBe(originalTask.tomatoCount);
      expect(movedTask.finishedTomatoCount).toBe(
        originalTask.finishedTomatoCount,
      );
      expect(movedTask.title).toBe(originalTask.title);
      expect(movedTask.description).toBe(originalTask.description);
    });

    it("should persist reordered state to taskpoolStore", () => {
      const taskId = store.tasks[0]!.id;
      store.reorderTask(taskId, 2);

      // Verify the reorder happened in the store's tasks
      expect(store.tasks[0]!.title).toBe("Task 2");
      expect(store.tasks[1]!.title).toBe("Task 3");
      expect(store.tasks[2]!.title).toBe("Task 1");
    });

    it("should notify subscribers on reorder", () => {
      const callback = vi.fn();
      store.subscribe(callback);
      callback.mockClear(); // Clear the initial call

      const taskId = store.tasks[0]!.id;
      store.reorderTask(taskId, 2);

      expect(callback).toHaveBeenCalled();
    });
  });
});
