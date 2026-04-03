/**
 * Migration and Regression Tests for Taskpool Architecture
 *
 * These tests verify the new taskpool-based architecture:
 * 1. Tasks survive resetDay() - tasks are no longer deleted
 * 2. Tasks created in Day view are assigned to today
 * 3. Tasks created in Tasks view are NOT assigned to a day
 * 4. Migration from old planner state format
 *
 * IMPORTANT: taskpoolStore is a singleton. Tests must clear its state properly.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { taskpoolStore } from "../src/state/taskpool-store.js";
import { plannerStore } from "../src/state/planner-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";
import { getTodayString } from "../src/models/tomato-pool.js";
import type { Task } from "../src/models/task.js";

describe("Migration and Regression Tests", () => {
  beforeEach(() => {
    // Clear all persisted state before each test
    localStorage.removeItem(STORAGE_KEYS.TASKPOOL_STATE);
    localStorage.removeItem(STORAGE_KEYS.PLANNER_STATE);
    // Clear the taskpool store's internal state
    taskpoolStore.clearAllData();
    // Also reset plannerStore to get fresh date
    plannerStore.clearAllData();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Task survives resetDay()", () => {
    it("should NOT delete tasks when resetDay is called", () => {
      const today = getTodayString();

      // Add a task assigned to today via taskpool
      const result = taskpoolStore.addTask("Test Task", "Description", {
        dayDate: today,
        tomatoCount: 3,
      });
      expect(result.success).toBe(true);

      // Verify task exists in today's tasks
      const dayTasks = taskpoolStore.getTasksForDay(today);
      expect(dayTasks.length).toBe(1);
      expect(dayTasks[0]!.title).toBe("Test Task");

      // Now simulate what resetDay does - it calls unassignTaskFromDay
      if (!result.taskId) throw new Error("taskId should be defined");
      const unassignResult = taskpoolStore.unassignTaskFromDay(result.taskId);
      expect(unassignResult.success).toBe(true);

      // Task should still exist in taskpool (just unassigned from day)
      const task = taskpoolStore.getTaskById(result.taskId);
      expect(task).toBeDefined();
      expect(task!.title).toBe("Test Task");

      // But it should no longer appear in today's tasks
      const dayTasksAfterReset = taskpoolStore.getTasksForDay(today);
      expect(dayTasksAfterReset.length).toBe(0);

      // The task still exists in the overall taskpool
      expect(taskpoolStore.taskCount).toBe(1);
    });

    it("should preserve task data after multiple resetDay operations", () => {
      const today = getTodayString();
      const yesterday = "2024-01-01";

      // Add task to yesterday
      const result1 = taskpoolStore.addTask("Yesterday Task", undefined, {
        dayDate: yesterday,
      });
      expect(result1.success).toBe(true);

      // Add task to today
      const result2 = taskpoolStore.addTask("Today Task", undefined, {
        dayDate: today,
      });
      expect(result2.success).toBe(true);

      // Simulate resetDay for yesterday (unassign from that day)
      if (!result1.taskId) throw new Error("taskId should be defined");
      taskpoolStore.unassignTaskFromDay(result1.taskId);

      // Simulate resetDay for today (unassign from today)
      if (!result2.taskId) throw new Error("taskId should be defined");
      taskpoolStore.unassignTaskFromDay(result2.taskId);

      // Both tasks should still exist
      expect(taskpoolStore.taskCount).toBe(2);

      // Yesterday's task should not appear in yesterday's view anymore
      expect(taskpoolStore.getTasksForDay(yesterday).length).toBe(0);

      // Today's task should not appear in today's view anymore
      expect(taskpoolStore.getTasksForDay(today).length).toBe(0);

      // But if we query all tasks (unassigned), both should exist
      const allTasks = taskpoolStore.getAllTasks();
      expect(allTasks.length).toBe(2);
    });
  });

  describe("Task created in Day view is assigned to today", () => {
    it("should assign dayDate when task is created via plannerStore", () => {
      const today = getTodayString();

      // Add task via plannerStore (simulating Day view behavior)
      const result = plannerStore.addTask("Day View Task");
      expect(result.success).toBe(true);

      // The task should be assigned to today in taskpool
      if (!result.taskId) throw new Error("taskId should be defined");
      const task = taskpoolStore.getTaskById(result.taskId);
      expect(task).toBeDefined();
      expect(task!.dayDate).toBe(today);

      // The task should appear in today's tasks
      const todayTasks = taskpoolStore.getTasksForDay(today);
      expect(todayTasks.length).toBe(1);
      expect(todayTasks[0]!.title).toBe("Day View Task");
    });

    it("should assign to specific day when created via taskpool for that day", () => {
      const targetDate = "2024-06-15";

      // Create a taskpool store with a task assigned to specific date
      const result = taskpoolStore.addTask("Dated Task", undefined, {
        dayDate: targetDate,
      });
      expect(result.success).toBe(true);

      // Task should appear in that day's tasks
      const datedTasks = taskpoolStore.getTasksForDay(targetDate);
      expect(datedTasks.length).toBe(1);
      expect(datedTasks[0]!.title).toBe("Dated Task");
    });
  });

  describe("Task created in Tasks view is NOT assigned to a day", () => {
    it("should create task without dayDate when added directly to taskpool", () => {
      // Add task without specifying dayDate (simulating Tasks view behavior)
      const result = taskpoolStore.addTask("Unassigned Task", "No day");
      expect(result.success).toBe(true);

      // Task should exist
      if (!result.taskId) throw new Error("taskId should be defined");
      const task = taskpoolStore.getTaskById(result.taskId);
      expect(task).toBeDefined();

      // Task should NOT have dayDate assigned
      expect(task!.dayDate).toBeUndefined();

      // Task should NOT appear in any day's task list
      const today = getTodayString();
      expect(taskpoolStore.getTasksForDay(today).length).toBe(0);
    });

    it("should allow assigning dayDate later", () => {
      // Create task without dayDate
      const result = taskpoolStore.addTask("Later Assignment Task");
      expect(result.success).toBe(true);

      if (!result.taskId) throw new Error("taskId should be defined");

      // Initially no dayDate
      const task1 = taskpoolStore.getTaskById(result.taskId);
      expect(task1!.dayDate).toBeUndefined();

      // Assign to a day
      const assignResult = taskpoolStore.assignTaskToDay(
        result.taskId,
        "2024-06-15",
      );
      expect(assignResult.success).toBe(true);

      // Now should have dayDate
      const task2 = taskpoolStore.getTaskById(result.taskId);
      expect(task2!.dayDate).toBe("2024-06-15");

      // Should appear in that day's tasks
      const dayTasks = taskpoolStore.getTasksForDay("2024-06-15");
      expect(dayTasks.length).toBe(1);
      expect(dayTasks[0]!.id).toBe(result.taskId);
    });
  });

  describe("Migration from old planner state", () => {
    it("should migrate tasks from legacy format to taskpool", () => {
      const today = getTodayString();

      // Create some legacy-style tasks (old planner tasks)
      const legacyTasks: Task[] = [
        {
          id: "legacy-1",
          title: "Legacy Task 1",
          description: "From old planner",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "legacy-2",
          title: "Legacy Task 2",
          description: "Another old task",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
      ];

      // Migrate using the taskpool's migration function
      const migrateResult = taskpoolStore.migrateFromPlannerState(
        legacyTasks,
        today,
      );
      expect(migrateResult.success).toBe(true);

      // Tasks should now be in the taskpool assigned to today
      const dayTasks = taskpoolStore.getTasksForDay(today);
      expect(dayTasks.length).toBe(2);

      // Verify task data is preserved
      const migratedTask1 = dayTasks.find((t) => t.id === "legacy-1");
      expect(migratedTask1).toBeDefined();
      expect(migratedTask1!.title).toBe("Legacy Task 1");
      expect(migratedTask1!.tomatoCount).toBe(3);
      expect(migratedTask1!.finishedTomatoCount).toBe(1);
      expect(migratedTask1!.dayDate).toBe(today);
    });

    it("should preserve tasks in taskpoolStore across operations", () => {
      const today = getTodayString();

      // Create tasks in taskpool
      const result1 = taskpoolStore.addTask("Task 1", "First task", {
        dayDate: today,
        tomatoCount: 3,
      });
      expect(result1.success).toBe(true);

      const result2 = taskpoolStore.addTask("Task 2", "Second task", {
        dayDate: today,
        tomatoCount: 2,
      });
      expect(result2.success).toBe(true);

      // Verify both tasks exist
      expect(taskpoolStore.taskCount).toBe(2);

      // Get state and verify tasks are there
      const state = taskpoolStore.getState();
      expect(state.tasks.size).toBe(2);

      // Verify tasks can be retrieved
      if (!result1.taskId) throw new Error("taskId should be defined");
      if (!result2.taskId) throw new Error("taskId should be defined");
      expect(taskpoolStore.getTaskById(result1.taskId)).toBeDefined();
      expect(taskpoolStore.getTaskById(result2.taskId)).toBeDefined();
    });
  });

  describe("Backward compatibility for plannerStore delegation", () => {
    it("should delegate addTask to taskpoolStore", () => {
      const today = getTodayString();

      // Add via plannerStore
      const result = plannerStore.addTask("Delegated Task");
      expect(result.success).toBe(true);

      // Task should be in taskpool
      if (!result.taskId) throw new Error("taskId should be defined");
      const task = taskpoolStore.getTaskById(result.taskId);
      expect(task).toBeDefined();
      expect(task!.title).toBe("Delegated Task");
      expect(task!.dayDate).toBe(today); // Assigned to current day
    });

    it("should delegate removeTask to taskpoolStore for today's tasks", () => {
      const today = getTodayString();

      // Add a task via taskpool assigned to today
      const addResult = taskpoolStore.addTask("To Be Removed", undefined, {
        dayDate: today,
      });
      expect(addResult.success).toBe(true);

      if (!addResult.taskId) throw new Error("taskId should be defined");
      expect(taskpoolStore.taskCount).toBe(1);

      // Remove via plannerStore (which delegates to taskpoolStore)
      const removeResult = plannerStore.removeTask(addResult.taskId);
      expect(removeResult.success).toBe(true);

      // Task should be gone
      expect(taskpoolStore.taskCount).toBe(0);
    });

    it("should derive tasks from taskpoolStore", () => {
      const today = getTodayString();

      // Add tasks directly to taskpool assigned to today
      taskpoolStore.addTask("Pool Task 1", undefined, { dayDate: today });
      taskpoolStore.addTask("Pool Task 2", undefined, { dayDate: today });

      // plannerStore.tasks should reflect taskpool's tasks for today
      const plannerTasks = plannerStore.tasks;
      expect(plannerTasks.length).toBe(2);
    });
  });
});

describe("resetDay behavior regression tests", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.TASKPOOL_STATE);
    localStorage.removeItem(STORAGE_KEYS.PLANNER_STATE);
    taskpoolStore.clearAllData();
    plannerStore.clearAllData();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("resetDay should unassign tasks from day, not delete them", () => {
    const today = getTodayString();

    // Create a task assigned to today
    const result = taskpoolStore.addTask("Reset Day Test", undefined, {
      dayDate: today,
      tomatoCount: 4,
    });
    expect(result.success).toBe(true);
    if (!result.taskId) throw new Error("taskId should be defined");

    // Verify task is assigned
    expect(taskpoolStore.getTasksForDay(today).length).toBe(1);

    // Simulate resetDay - unassign from today
    taskpoolStore.unassignTaskFromDay(result.taskId);

    // Task should still exist (not deleted)
    expect(taskpoolStore.taskCount).toBe(1);
    const task = taskpoolStore.getTaskById(result.taskId);
    expect(task).toBeDefined();
    expect(task!.title).toBe("Reset Day Test");

    // But task should no longer be assigned to today
    expect(taskpoolStore.getTasksForDay(today).length).toBe(0);

    // dayDate should now be undefined
    expect(task!.dayDate).toBeUndefined();
  });

  it("resetDay preserves task tomatoes and description", () => {
    const today = getTodayString();

    const result = taskpoolStore.addTask(
      "Preserved Task",
      "Important description",
      {
        dayDate: today,
        tomatoCount: 7,
      },
    );
    expect(result.success).toBe(true);
    if (!result.taskId) throw new Error("taskId should be defined");

    // Set finished tomato count
    taskpoolStore.setFinishedTomatoCount(result.taskId, 3);

    // Unassign from day (resetDay simulation)
    taskpoolStore.unassignTaskFromDay(result.taskId);

    // Verify all task properties are preserved
    const task = taskpoolStore.getTaskById(result.taskId);
    expect(task!.title).toBe("Preserved Task");
    expect(task!.description).toBe("Important description");
    expect(task!.tomatoCount).toBe(7);
    expect(task!.finishedTomatoCount).toBe(3);
    expect(task!.dayDate).toBeUndefined(); // Only dayDate changes
  });
});
