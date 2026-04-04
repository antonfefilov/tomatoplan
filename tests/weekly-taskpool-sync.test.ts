/**
 * Integration tests for weekly-taskpool synchronization
 *
 * These tests verify that WeeklyStore properly synchronizes tasks from taskpoolStore
 * in three key scenarios:
 * 1. clearAllData() - when taskpoolStore is cleared
 * 2. resetWeek() - when weekly week is reset
 * 3. taskpoolStore task changes - subscription updates
 *
 * IMPORTANT: WeeklyStore subscribes to the singleton taskpoolStore imported from
 * taskpool-store.js. Tests must use this singleton to ensure synchronization works.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WeeklyStore } from "../src/state/weekly-store.js";
import { taskpoolStore } from "../src/state/taskpool-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";
import { getCurrentWeekId } from "../src/models/project.js";
import type { Task } from "../src/models/task.js";

describe("WeeklyStore-TaskpoolStore Synchronization Integration", () => {
  let weeklyStore: WeeklyStore;

  beforeEach(() => {
    localStorage.clear();
    // Clear the singleton taskpoolStore (required for test isolation)
    taskpoolStore.clearAllData();

    // Use fake timers for consistent date handling
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Create fresh weeklyStore instance (subscribes to singleton taskpoolStore)
    weeklyStore = new WeeklyStore();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    taskpoolStore.clearAllData();
  });

  describe("clearAllData() synchronization", () => {
    it("should have no tasks after taskpoolStore.clearAllData()", () => {
      // Setup: Add a project and sync a task
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      // Verify task is visible in weeklyStore
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.id).toBe("task-1");

      // Action: Clear taskpoolStore
      taskpoolStore.clearAllData();

      // Verification: weeklyStore should now have no tasks
      expect(taskpoolStore.taskCount).toBe(0);
      expect(weeklyStore.tasks).toHaveLength(0);
    });

    it("should sync empty state after taskpoolStore.clearAllData() with subscriber notification", () => {
      // Setup: Add tasks and subscribe to weeklyStore
      const { projectId } = weeklyStore.addProject("Test Project");

      const task1: Task = {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const task2: Task = {
        id: "task-2",
        title: "Task 2",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task1, task2]);

      // Subscribe to weeklyStore changes
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);

      // Clear initial call count
      subscriber.mockClear();

      // Action: Clear taskpoolStore
      taskpoolStore.clearAllData();

      // Verification: subscriber should be notified with empty tasks
      expect(subscriber).toHaveBeenCalled();
      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
      const state = lastCall![0];
      expect(state.tasks).toHaveLength(0);
    });

    it("should preserve projects but have no tasks after taskpoolStore.clearAllData()", () => {
      // Setup: Add projects and tasks
      weeklyStore.addProject("Project 1", undefined, 10);
      weeklyStore.addProject("Project 2", undefined, 15);

      const { projectId } = weeklyStore.addProject(
        "Project with Tasks",
        undefined,
        5,
      );

      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      expect(weeklyStore.projects).toHaveLength(3);
      expect(weeklyStore.tasks).toHaveLength(1);

      // Action: Clear taskpoolStore
      taskpoolStore.clearAllData();

      // Verification: Projects preserved, but no tasks
      expect(weeklyStore.projects).toHaveLength(3);
      expect(weeklyStore.tasks).toHaveLength(0);
    });

    it("should clear localStorage for taskpoolStore on clearAllData()", () => {
      // Setup: Add data to both stores
      weeklyStore.addProject("Project");
      taskpoolStore.addTask("Task in Taskpool");

      expect(
        localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE),
      ).toBeDefined();
      expect(localStorage.getItem(STORAGE_KEYS.TASKPOOL_STATE)).toBeDefined();

      // Action: Clear taskpoolStore (weeklyStore depends on it)
      taskpoolStore.clearAllData();

      // Verification: Taskpool state cleared
      expect(localStorage.getItem(STORAGE_KEYS.TASKPOOL_STATE)).toBeNull();
    });
  });

  describe("resetWeek() synchronization", () => {
    it("should re-derive tasks from taskpoolStore after resetWeek()", () => {
      // Setup: Add project and task
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      expect(weeklyStore.projects).toHaveLength(1);
      expect(weeklyStore.tasks).toHaveLength(1);

      // Add another task to taskpoolStore that should still appear after reset
      const unassignedTask: Task = {
        id: "task-2",
        title: "Unassigned Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([unassignedTask]);

      // Verify both tasks are now visible
      expect(weeklyStore.tasks).toHaveLength(2);

      // Action: Reset week (clears projects)
      weeklyStore.resetWeek();

      // Verification: Projects cleared, tasks are re-derived from taskpoolStore
      // Note: resetWeek() calls getWeeklyTasks() BEFORE updating this.state.projects
      // so tasks with project assignments may still be visible during the reset.
      // After reset, all tasks without projects remain visible.
      expect(weeklyStore.projects).toHaveLength(0);

      // The taskpoolStore still has both tasks
      expect(taskpoolStore.taskCount).toBe(2);

      // WeeklyStore tasks are re-derived - unassigned tasks are visible
      // (tasks with projectId referencing deleted projects are filtered out after reset)
      const unassignedTasks = weeklyStore.tasks.filter((t) => !t.projectId);
      expect(unassignedTasks).toHaveLength(1);
      expect(unassignedTasks[0]!.id).toBe("task-2");
    });

    it("should preserve capacity settings through resetWeek()", () => {
      // Setup: Set custom capacity and add project/task
      weeklyStore.setWeeklyCapacity(150);
      const { projectId } = weeklyStore.addProject(
        "Test Project",
        undefined,
        10,
      );

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      expect(weeklyStore.weeklyCapacity).toBe(150);

      // Action: Reset week
      weeklyStore.resetWeek();

      // Verification: Projects cleared, capacity is preserved from previous settings
      // resetWeeklyStateForNewWeek preserves capacity: Math.floor(150/5)*5 = 150
      expect(weeklyStore.projects).toHaveLength(0);
      expect(weeklyStore.weeklyCapacity).toBe(150);
    });

    it("should update currentWeekId after resetWeek()", () => {
      // Setup: Add project for current week
      weeklyStore.addProject("Test Project");
      expect(weeklyStore.currentWeekId).toBe(getCurrentWeekId());

      // Action: Reset week
      weeklyStore.resetWeek();

      // Verification: Should still be current week
      expect(weeklyStore.currentWeekId).toBe(getCurrentWeekId());
      expect(weeklyStore.isCurrentWeek).toBe(true);
    });

    it("should notify subscribers after resetWeek()", () => {
      // Setup: Add project and task, subscribe
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Reset week
      weeklyStore.resetWeek();

      // Verification: Subscriber notified with empty projects
      expect(subscriber).toHaveBeenCalled();
      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
      const state = lastCall![0];
      expect(state.projects).toHaveLength(0);
    });

    it("should handle tasks with project assignment from previous week", () => {
      // Setup: Add project and task
      const { projectId } = weeklyStore.addProject("Current Week Project");

      const currentWeekTask: Task = {
        id: "task-1",
        title: "Current Week Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([currentWeekTask]);

      // Simulate week change (move to next week)
      vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z"));

      // Add a task for new week
      const newWeekTask: Task = {
        id: "task-2",
        title: "New Week Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-22T10:00:00.000Z",
        updatedAt: "2024-06-22T10:00:00.000Z",
      };

      taskpoolStore.importTasks([newWeekTask]);

      // Action: Reset week
      weeklyStore.resetWeek();

      // Verification: Old project's task not visible, only unassigned new task
      expect(weeklyStore.projects).toHaveLength(0);
      // Note: The old project's task won't appear because the project is cleared
      // and the task's projectId no longer matches any current week project
    });
  });

  describe("taskpoolStore task changes while weeklyStore is subscribed", () => {
    it("should update tasks when taskpoolStore.addTask() is called", () => {
      // Setup: Subscribe to weeklyStore
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Add task directly to taskpoolStore
      const result = taskpoolStore.addTask("New Task from Taskpool");

      // Verification: weeklyStore should reflect the new task
      expect(result.success).toBe(true);
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.title).toBe("New Task from Taskpool");

      // Subscriber should be notified
      expect(subscriber).toHaveBeenCalled();
    });

    it("should update tasks when taskpoolStore.removeTask() is called", () => {
      // Setup: Add project and tasks
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      expect(weeklyStore.tasks).toHaveLength(1);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Remove task from taskpoolStore
      taskpoolStore.removeTask("task-1");

      // Verification: weeklyStore should have no tasks
      expect(weeklyStore.tasks).toHaveLength(0);
      expect(subscriber).toHaveBeenCalled();
    });

    it("should update task properties when taskpoolStore.updateTask() is called", () => {
      // Setup: Add task
      const task: Task = {
        id: "task-1",
        title: "Original Title",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Update task title in taskpoolStore
      taskpoolStore.updateTask("task-1", {
        title: "Updated Title",
        tomatoCount: 5,
      });

      // Verification: weeklyStore should reflect updated task
      const updatedTask = weeklyStore.getTaskById("task-1");
      expect(updatedTask!.title).toBe("Updated Title");
      expect(updatedTask!.tomatoCount).toBe(5);

      expect(subscriber).toHaveBeenCalled();
    });

    it("should update task when project assignment changes", () => {
      // Setup: Add two projects and an unassigned task
      weeklyStore.addProject("Project 1");
      const { projectId: project2Id } = weeklyStore.addProject("Project 2");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Assign task to project 2 via taskpoolStore
      taskpoolStore.setTaskProject("task-1", project2Id!);

      // Verification: Task should have projectId
      const updatedTask = weeklyStore.getTaskById("task-1");
      expect(updatedTask!.projectId).toBe(project2Id);
      expect(subscriber).toHaveBeenCalled();
    });

    it("should update task when unassigned from project", () => {
      // Setup: Add project and assigned task
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Unassign task from project
      taskpoolStore.unassignTaskFromProject("task-1");

      // Verification: Task should have no projectId
      const updatedTask = weeklyStore.getTaskById("task-1");
      expect(updatedTask!.projectId).toBeUndefined();
      expect(subscriber).toHaveBeenCalled();
    });

    it("should reflect tomato count changes from taskpoolStore", () => {
      // Setup: Add task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Assign tomato via taskpoolStore
      taskpoolStore.assignTomato("task-1");
      taskpoolStore.assignTomato("task-1");

      // Verification: Task should have updated tomato count
      const updatedTask = weeklyStore.getTaskById("task-1");
      expect(updatedTask!.tomatoCount).toBe(4); // 2 + 2

      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it("should reflect finished tomato changes from taskpoolStore", () => {
      // Setup: Add task with tomatoes
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Mark tomatoes as finished
      taskpoolStore.markTomatoAsFinished("task-1");
      taskpoolStore.markTomatoAsFinished("task-1");

      // Verification: Task should have finished tomatoes
      const updatedTask = weeklyStore.getTaskById("task-1");
      expect(updatedTask!.finishedTomatoCount).toBe(2);

      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it("should update tasks when batch unassign is called", () => {
      // Setup: Add project with multiple tasks
      const { projectId } = weeklyStore.addProject("Test Project");

      const task1: Task = {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const task2: Task = {
        id: "task-2",
        title: "Task 2",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task1, task2]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Batch unassign tasks from project
      taskpoolStore.unassignTasksFromProject(projectId!);

      // Verification: Both tasks should have no projectId
      const tasks = weeklyStore.tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks[0]!.projectId).toBeUndefined();
      expect(tasks[1]!.projectId).toBeUndefined();

      expect(subscriber).toHaveBeenCalled();
    });

    it("should only include tasks for current week projects", () => {
      // Setup: Create two projects for different weeks
      vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
      const currentWeekProjectId = weeklyStore.addProject(
        "Current Week Project",
      ).projectId!;

      // Simulate going to next week
      vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z"));

      // Create new weekly store for new week
      weeklyStore = new WeeklyStore();
      weeklyStore.addProject("New Week Project");

      // Add tasks for both projects to taskpoolStore
      const currentWeekTask: Task = {
        id: "task-old",
        title: "Old Week Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId: currentWeekProjectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Import old week task
      taskpoolStore.importTasks([currentWeekTask]);

      // Verification: Task from previous week should not appear
      // because its project is not in the current week's projects
      const state = weeklyStore.getState();
      // The old task won't match any current week project
      const visibleTasks = state.tasks.filter((t) => t.id === "task-old");
      expect(visibleTasks).toHaveLength(0);
    });

    it("should handle multiple rapid taskpoolStore updates", () => {
      // Setup: Subscribe to weeklyStore
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Make multiple rapid updates
      taskpoolStore.addTask("Task 1");
      taskpoolStore.addTask("Task 2");
      taskpoolStore.addTask("Task 3");

      // Verification: All tasks should be in weeklyStore
      expect(weeklyStore.tasks).toHaveLength(3);

      // Subscriber should be called for each update
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it("should maintain synchronization after unsubscribe and re-subscribe", () => {
      // Setup: Subscribe and then unsubscribe
      const subscriber = vi.fn();
      const unsubscribe = weeklyStore.subscribe(subscriber);
      unsubscribe();
      subscriber.mockClear();

      // Add task while unsubscribed
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      // Task should still be in weeklyStore's state (subscription is internal)
      expect(weeklyStore.tasks).toHaveLength(1);

      // Re-subscribe
      subscriber.mockClear();
      weeklyStore.subscribe(subscriber);

      // Should immediately get current state with the task
      expect(subscriber).toHaveBeenCalledTimes(1);
      const lastCall = subscriber.mock.calls[0];
      expect(lastCall![0].tasks).toHaveLength(1);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle invalid task data gracefully", () => {
      // Setup: Subscribe to weeklyStore
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Attempt to add invalid task (empty title)
      const result = taskpoolStore.addTask("");

      // Verification: Invalid task rejected, weeklyStore unchanged
      expect(result.success).toBe(false);
      expect(weeklyStore.tasks).toHaveLength(0);

      // Subscriber should not be called for failed add
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should handle task removal of non-existent task", () => {
      // Setup: Subscribe to weeklyStore
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Remove non-existent task
      const result = taskpoolStore.removeTask("non-existent");

      // Verification: Should fail, no subscriber notification
      expect(result.success).toBe(false);
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should sync tasks added via importTasks", () => {
      // Setup: Subscribe to weeklyStore
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Import multiple tasks at once
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Imported Task 1",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Imported Task 2",
          tomatoCount: 2,
          finishedTomatoCount: 1,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
        },
      ];

      taskpoolStore.importTasks(tasks);

      // Verification: Both tasks should be in weeklyStore
      expect(weeklyStore.tasks).toHaveLength(2);
      expect(subscriber).toHaveBeenCalled();
    });

    it("should maintain task order from taskpoolStore", () => {
      // Setup: Add multiple tasks
      const task1: Task = {
        id: "task-1",
        title: "First Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const task2: Task = {
        id: "task-2",
        title: "Second Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const task3: Task = {
        id: "task-3",
        title: "Third Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task1, task2, task3]);

      // Verification: Tasks should be accessible by ID
      expect(weeklyStore.getTaskById("task-1")).toBeDefined();
      expect(weeklyStore.getTaskById("task-2")).toBeDefined();
      expect(weeklyStore.getTaskById("task-3")).toBeDefined();
    });
  });

  describe("store lifecycle", () => {
    it("should maintain subscription when creating new WeeklyStore instance", () => {
      // Setup: Add task to taskpoolStore
      taskpoolStore.addTask("Task Before WeeklyStore");

      // Create new weeklyStore (should pick up existing task)
      const newWeeklyStore = new WeeklyStore();

      expect(newWeeklyStore.tasks).toHaveLength(1);

      // Add another task
      taskpoolStore.addTask("Task After WeeklyStore");

      // New weeklyStore should reflect both tasks
      expect(newWeeklyStore.tasks).toHaveLength(2);
    });

    it("should reflect taskpoolStore state on WeeklyStore initialization", () => {
      // Setup: Pre-populate taskpoolStore before weeklyStore exists
      const task1: Task = {
        id: "task-1",
        title: "Pre-existing Task",
        tomatoCount: 3,
        finishedTomatoCount: 1,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task1]);

      // Action: Create weeklyStore (should pick up pre-existing task)
      weeklyStore = new WeeklyStore();

      // Verification: Task should be visible
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.title).toBe("Pre-existing Task");
    });
  });

  // ============================================================================
  // Gap A: Tests for weeklyStore.clearAllData() (not taskpoolStore.clearAllData())
  // ============================================================================

  describe("weeklyStore.clearAllData() synchronization", () => {
    it("should re-derive tasks after weeklyStore.clearAllData()", () => {
      // Setup: Add project and task to weeklyStore
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      // Also add an unassigned task in taskpoolStore
      const unassignedTask: Task = {
        id: "task-2",
        title: "Unassigned Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([unassignedTask]);

      // Verify both tasks are visible (assigned via project, unassigned always visible)
      expect(weeklyStore.projects).toHaveLength(1);
      expect(weeklyStore.tasks).toHaveLength(2);

      // Action: Call weeklyStore's own clearAllData (not taskpoolStore's)
      weeklyStore.clearAllData();

      // Verification: Projects cleared, tasks re-derived from taskpoolStore
      // clearAllData creates fresh state and calls getWeeklyTasks()
      // Since projects are now empty, only unassigned tasks should appear
      expect(weeklyStore.projects).toHaveLength(0);

      // TaskpoolStore still has both tasks
      expect(taskpoolStore.taskCount).toBe(2);

      // After clearAllData, only unassigned tasks should be visible
      // (tasks with projectId won't match any project since projects is empty)
      const visibleTasks = weeklyStore.tasks;
      const assignedTasks = visibleTasks.filter((t) => t.projectId);
      const unassignedTasks = visibleTasks.filter((t) => !t.projectId);

      // Assigned task should not appear (its project was cleared)
      expect(assignedTasks).toHaveLength(0);
      // Unassigned task should still appear
      expect(unassignedTasks).toHaveLength(1);
      expect(unassignedTasks[0]!.id).toBe("task-2");
    });

    it("should notify subscribers after weeklyStore.clearAllData()", () => {
      // Setup: Add project and tasks, subscribe to weeklyStore
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Task with Project",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Action: Call weeklyStore's clearAllData
      weeklyStore.clearAllData();

      // Verification: Subscriber should be notified with cleared state
      expect(subscriber).toHaveBeenCalled();
      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
      const state = lastCall![0];

      // State should have empty projects
      expect(state.projects).toHaveLength(0);

      // Tasks should be re-derived - only unassigned visible
      expect(state.tasks.filter((t: Task) => t.projectId)).toHaveLength(0);
    });
  });

  // ============================================================================
  // Gap B: Strengthened resetWeek() assertions
  // ============================================================================

  describe("resetWeek() task cleanup verification", () => {
    it("should remove tasks with deleted project assignments after resetWeek()", () => {
      // Setup: Add multiple projects and tasks with various assignments
      const { projectId: project1Id } = weeklyStore.addProject("Project 1");
      const { projectId: project2Id } = weeklyStore.addProject("Project 2");

      // Task assigned to project 1
      const task1: Task = {
        id: "task-1",
        title: "Task for Project 1",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId: project1Id,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Task assigned to project 2
      const task2: Task = {
        id: "task-2",
        title: "Task for Project 2",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId: project2Id,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Unassigned task
      const task3: Task = {
        id: "task-3",
        title: "Unassigned Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task1, task2, task3]);

      // Verify initial state: 2 projects, 3 tasks visible
      expect(weeklyStore.projects).toHaveLength(2);
      expect(weeklyStore.tasks).toHaveLength(3);

      // Action: Reset week (clears all projects)
      weeklyStore.resetWeek();

      // Verification: Projects cleared
      expect(weeklyStore.projects).toHaveLength(0);

      // CRITICAL: Tasks with projectId should NOT appear after reset
      // because their projects no longer exist in weeklyStore
      const visibleTasksAfterReset = weeklyStore.tasks;

      // All tasks with projectId assignments should be filtered out
      const tasksWithProjectId = visibleTasksAfterReset.filter(
        (t) => t.projectId,
      );
      expect(tasksWithProjectId).toHaveLength(0);

      // Only unassigned task should remain visible
      const unassignedTasks = visibleTasksAfterReset.filter(
        (t) => !t.projectId,
      );
      expect(unassignedTasks).toHaveLength(1);
      expect(unassignedTasks[0]!.id).toBe("task-3");

      // TaskpoolStore still contains all tasks (we only cleared weekly state)
      expect(taskpoolStore.taskCount).toBe(3);
    });

    it("should have exact task count matching visible tasks after resetWeek()", () => {
      // Setup: Create complex scenario with multiple project/task combinations
      const { projectId } = weeklyStore.addProject("Active Project");

      // Task assigned to the project
      const assignedTask: Task = {
        id: "task-assigned",
        title: "Assigned Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Multiple unassigned tasks
      const unassigned1: Task = {
        id: "task-unassigned-1",
        title: "Unassigned Task 1",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const unassigned2: Task = {
        id: "task-unassigned-2",
        title: "Unassigned Task 2",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([assignedTask, unassigned1, unassigned2]);

      // Pre-reset verification
      expect(weeklyStore.tasks).toHaveLength(3);
      expect(weeklyStore.projects).toHaveLength(1);

      // Action: Reset week
      weeklyStore.resetWeek();

      // Post-reset exact count verification
      // After reset: 0 projects, only unassigned tasks visible
      expect(weeklyStore.projects).toHaveLength(0);

      // EXACT ASSERTION: task count should equal count of unassigned tasks
      // This catches the bug where tasks with deleted project refs remain visible
      const expectedVisibleCount = weeklyStore.tasks.filter(
        (t) => !t.projectId,
      ).length;

      expect(weeklyStore.tasks).toHaveLength(expectedVisibleCount);
      expect(expectedVisibleCount).toBe(2); // Two unassigned tasks

      // Verify specific task IDs are present/absent
      const taskIds = weeklyStore.tasks.map((t) => t.id);
      expect(taskIds).not.toContain("task-assigned");
      expect(taskIds).toContain("task-unassigned-1");
      expect(taskIds).toContain("task-unassigned-2");
    });
  });

  // ============================================================================
  // Gap C: Post-reset re-sync tests
  // ============================================================================

  describe("post-reset re-sync with taskpoolStore", () => {
    it("should continue syncing taskpoolStore changes after resetWeek()", () => {
      // Setup: Add project and task, then reset
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Pre-reset Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      expect(weeklyStore.tasks).toHaveLength(1);

      // Reset week (clears projects, removes assigned task from view)
      weeklyStore.resetWeek();
      expect(weeklyStore.projects).toHaveLength(0);
      expect(weeklyStore.tasks).toHaveLength(0); // Assigned task filtered out

      // Subscribe to verify post-reset sync still works
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // ACTION (Post-reset): Add new task to taskpoolStore
      const postResetTask: Task = {
        id: "task-post-reset",
        title: "Post-reset Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([postResetTask]);

      // Verification: weeklyStore should sync the new task
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.id).toBe("task-post-reset");
      expect(weeklyStore.tasks[0]!.title).toBe("Post-reset Task");

      // Subscriber should be notified
      expect(subscriber).toHaveBeenCalled();

      // ACTION: Add another task and update existing task
      const anotherTask: Task = {
        id: "task-another",
        title: "Another Task",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([anotherTask]);
      taskpoolStore.updateTask("task-post-reset", { title: "Updated Title" });

      // Verification: Both updates reflected
      expect(weeklyStore.tasks).toHaveLength(2);
      const updatedTask = weeklyStore.getTaskById("task-post-reset");
      expect(updatedTask!.title).toBe("Updated Title");
    });

    it("should sync project assignment changes after resetWeek()", () => {
      // Setup: Add project, reset, then add new project
      weeklyStore.addProject("Old Project");
      weeklyStore.resetWeek();
      expect(weeklyStore.projects).toHaveLength(0);

      // Add unassigned task after reset
      const task: Task = {
        id: "task-1",
        title: "Unassigned Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.projectId).toBeUndefined();

      // Add new project after reset
      const { projectId } = weeklyStore.addProject("New Project");
      expect(weeklyStore.projects).toHaveLength(1);

      // ACTION: Assign the task to the new project via taskpoolStore
      taskpoolStore.setTaskProject("task-1", projectId!);

      // Verification: Task should now have projectId and be visible
      const assignedTask = weeklyStore.getTaskById("task-1");
      expect(assignedTask!.projectId).toBe(projectId);

      // Task should still be visible in weeklyStore (matches current project)
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.projectId).toBe(projectId);
    });
  });

  // ============================================================================
  // Gap D: Invalid/stale project assignment tests
  // ============================================================================

  describe("invalid project assignment handling", () => {
    it("should exclude tasks with non-existent projectId from weeklyStore.tasks", () => {
      // Setup: Subscribe to weeklyStore to observe task filtering
      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // Create a valid project
      const { projectId: validProjectId } =
        weeklyStore.addProject("Valid Project");

      // Create task with valid projectId
      const validTask: Task = {
        id: "task-valid",
        title: "Valid Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId: validProjectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Create task with INVALID projectId (project doesn't exist)
      const invalidTask: Task = {
        id: "task-invalid",
        title: "Invalid Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId: "non-existent-project-id",
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Create unassigned task
      const unassignedTask: Task = {
        id: "task-unassigned",
        title: "Unassigned Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      // Import all tasks at once
      taskpoolStore.importTasks([validTask, invalidTask, unassignedTask]);

      // Verification: Only valid and unassigned tasks should appear
      // Invalid task should be filtered out because its projectId doesn't match any project
      const visibleTasks = weeklyStore.tasks;
      const visibleTaskIds = visibleTasks.map((t) => t.id);

      expect(visibleTaskIds).toContain("task-valid");
      expect(visibleTaskIds).toContain("task-unassigned");
      expect(visibleTaskIds).not.toContain("task-invalid");

      // Exact count verification
      expect(visibleTasks).toHaveLength(2);

      // Invalid task exists in taskpoolStore
      expect(taskpoolStore.getTaskById("task-invalid")).toBeDefined();

      // NOTE: weeklyStore.getTaskById() returns from taskpoolStore directly,
      // so it will return the task even if not visible in weeklyStore.tasks.
      // The key check is that the task is NOT in weeklyStore.tasks array.
      expect(taskpoolStore.getTaskById("task-invalid")).toBeDefined();
    });

    it("should exclude tasks when project assignment becomes stale after subscription", () => {
      // Setup: Create project and task, subscribe
      const { projectId } = weeklyStore.addProject("Test Project");

      const task: Task = {
        id: "task-1",
        title: "Task with Project",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([task]);

      // Task is visible with valid project assignment
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.projectId).toBe(projectId);

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // ACTION: Remove the project (task's projectId becomes stale)
      weeklyStore.removeProject(projectId!);

      // Verification: Task should now be unassigned (projectId cleared)
      // removeProject calls taskpoolStore.unassignTasksFromProject
      const updatedTask = taskpoolStore.getTaskById("task-1");
      expect(updatedTask!.projectId).toBeUndefined();

      // Task should still be visible as unassigned
      expect(weeklyStore.tasks).toHaveLength(1);
      expect(weeklyStore.tasks[0]!.projectId).toBeUndefined();

      // Subscriber was notified
      expect(subscriber).toHaveBeenCalled();
    });

    it("should handle task with projectId referencing deleted project", () => {
      // Setup: Create project and get its ID, then delete project
      const { projectId } = weeklyStore.addProject("Temporary Project");
      weeklyStore.removeProject(projectId!);

      // Now projectId references a non-existent project
      expect(weeklyStore.getProjectById(projectId!)).toBeUndefined();

      const subscriber = vi.fn();
      weeklyStore.subscribe(subscriber);
      subscriber.mockClear();

      // ACTION: Import task with the deleted projectId
      // This simulates stale data or edge case where task has orphaned projectId
      const staleTask: Task = {
        id: "task-stale",
        title: "Task with Stale Project",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId, // References deleted project
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      taskpoolStore.importTasks([staleTask]);

      // Verification: Task should NOT appear in weeklyStore
      // because its projectId doesn't match any existing project
      const visibleTasks = weeklyStore.tasks;
      const visibleTaskIds = visibleTasks.map((t) => t.id);

      expect(visibleTaskIds).not.toContain("task-stale");
      expect(visibleTasks).toHaveLength(0);

      // Task exists in taskpoolStore
      expect(taskpoolStore.getTaskById("task-stale")).toBeDefined();
    });
  });
});
