/**
 * Tests for TaskpoolStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TaskpoolStore } from "../src/state/taskpool-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";
import type { Task } from "../src/models/task.js";

// Helper to create a fresh store instance for testing
function createTestStore(): TaskpoolStore {
  // Clear any existing state first
  localStorage.removeItem(STORAGE_KEYS.TASKPOOL_STATE);
  return new TaskpoolStore();
}

describe("TaskpoolStore", () => {
  let store: TaskpoolStore;

  beforeEach(() => {
    localStorage.clear();
    store = createTestStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("should create empty state on initialization", () => {
      expect(store.taskCount).toBe(0);
      expect(store.daysWithTasks).toBe(0);
    });

    it("should have a valid active date on initialization", () => {
      const today = new Date().toISOString().split("T")[0]!;
      expect(store.activeDate).toBe(today);
    });
  });

  describe("addTask", () => {
    it("should add a new task with title only", () => {
      const result = store.addTask("Test Task");

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(store.taskCount).toBe(1);

      if (!result.taskId) throw new Error("taskId should be defined");
      const task = store.getTaskById(result.taskId);
      expect(task).toBeDefined();
      if (!task) throw new Error("task should be defined");
      expect(task.title).toBe("Test Task");
      expect(task.tomatoCount).toBe(0);
      expect(task.finishedTomatoCount).toBe(0);
    });

    it("should add a task with description", () => {
      const result = store.addTask("Test Task", "Test description");

      expect(result.success).toBe(true);
      if (!result.taskId) throw new Error("taskId should be defined");
      const task = store.getTaskById(result.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.description).toBe("Test description");
    });

    it("should add a task with options", () => {
      const today = new Date().toISOString().split("T")[0]!;
      const result = store.addTask("Test Task", undefined, {
        projectId: "project-1",
        trackId: "track-1",
        dayDate: today,
        tomatoCount: 3,
        description: "Option description",
      });

      expect(result.success).toBe(true);
      if (!result.taskId) throw new Error("taskId should be defined");
      const task = store.getTaskById(result.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.projectId).toBe("project-1");
      expect(task.trackId).toBe("track-1");
      expect(task.dayDate).toBe(today);
      expect(task.tomatoCount).toBe(3);
      expect(task.description).toBe("Option description");
    });

    it("should reject empty title", () => {
      const result = store.addTask("");
      expect(result.success).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should reject invalid tomato count", () => {
      const result = store.addTask("Test", undefined, {
        tomatoCount: -1,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("should reject invalid day date format", () => {
      const result = store.addTask("Test", undefined, {
        dayDate: "invalid-date",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid day date");
    });

    it("should add task to day assignments when dayDate is provided", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const result = store.addTask("Test Task", undefined, {
        dayDate: today,
      });

      expect(result.success).toBe(true);
      const dayTasks = store.getTasksForDay(today);
      expect(dayTasks.length).toBe(1);
      if (!result.taskId) throw new Error("taskId should be defined");
      expect(dayTasks[0]!.id).toBe(result.taskId);
    });
  });

  describe("updateTask", () => {
    it("should update task title", () => {
      const addResult = store.addTask("Original Title");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.updateTask(addResult.taskId, {
        title: "Updated Title",
      });

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.title).toBe("Updated Title");
    });

    it("should update task description", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.updateTask(addResult.taskId, {
        description: "New description",
      });

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.description).toBe("New description");
    });

    it("should update task tomato count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.updateTask(addResult.taskId, {
        tomatoCount: 5,
      });

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(5);
    });

    it("should reject update for non-existent task", () => {
      const result = store.updateTask("non-existent-id", {
        title: "New Title",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should reject empty title update", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.updateTask(addResult.taskId, {
        title: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeTask", () => {
    it("should remove a task", () => {
      const addResult = store.addTask("Test Task");
      expect(store.taskCount).toBe(1);
      if (!addResult.taskId) throw new Error("taskId should be defined");

      const result = store.removeTask(addResult.taskId);
      expect(result.success).toBe(true);
      expect(store.taskCount).toBe(0);
    });

    it("should remove task from day assignments", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const addResult = store.addTask("Test", undefined, { dayDate: today });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      expect(store.getTasksForDay(today).length).toBe(1);

      store.removeTask(addResult.taskId);
      expect(store.getTasksForDay(today).length).toBe(0);
    });

    it("should reject removal of non-existent task", () => {
      const result = store.removeTask("non-existent-id");
      expect(result.success).toBe(false);
    });
  });

  describe("assignTomato", () => {
    it("should increment tomato count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.assignTomato(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(1);
    });

    it("should increment multiple times", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.assignTomato(addResult.taskId);
      store.assignTomato(addResult.taskId);
      store.assignTomato(addResult.taskId);

      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(3);
    });

    it("should reject for non-existent task", () => {
      const result = store.assignTomato("non-existent-id");
      expect(result.success).toBe(false);
    });
  });

  describe("unassignTomato", () => {
    it("should decrement tomato count", () => {
      const addResult = store.addTask("Test", undefined, { tomatoCount: 2 });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTomato(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(1);
    });

    it("should reject when no tomatoes assigned", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTomato(addResult.taskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No tomatoes");
    });

    it("should adjust finished count if it exceeds new tomato count", () => {
      const addResult = store.addTask("Test", undefined, { tomatoCount: 3 });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.setFinishedTomatoCount(addResult.taskId, 2);
      store.unassignTomato(addResult.taskId); // 2 tomatoes now
      store.unassignTomato(addResult.taskId); // 1 tomato now

      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(1);
      expect(task.finishedTomatoCount).toBe(1); // Adjusted down
    });
  });

  describe("markTomatoAsFinished", () => {
    it("should increment finished tomato count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.markTomatoAsFinished(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(1);
    });

    it("should allow finished count to exceed planned count", () => {
      const addResult = store.addTask("Test", undefined, { tomatoCount: 1 });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.markTomatoAsFinished(addResult.taskId);
      store.markTomatoAsFinished(addResult.taskId);

      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(2);
      expect(task.tomatoCount).toBe(1);
    });
  });

  describe("markTomatoAsUnfinished", () => {
    it("should decrement finished tomato count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.markTomatoAsFinished(addResult.taskId);
      const result = store.markTomatoAsUnfinished(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(0);
    });

    it("should reject when no finished tomatoes", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.markTomatoAsUnfinished(addResult.taskId);

      expect(result.success).toBe(false);
    });
  });

  describe("setTomatoCount", () => {
    it("should set exact tomato count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setTomatoCount(addResult.taskId, 5);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.tomatoCount).toBe(5);
    });

    it("should reject negative count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setTomatoCount(addResult.taskId, -1);

      expect(result.success).toBe(false);
    });
  });

  describe("setFinishedTomatoCount", () => {
    it("should set exact finished count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setFinishedTomatoCount(addResult.taskId, 3);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(3);
    });

    it("should reject negative count", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setFinishedTomatoCount(addResult.taskId, -1);

      expect(result.success).toBe(false);
    });
  });

  describe("markTaskDone", () => {
    it("should set finished count to planned count", () => {
      const addResult = store.addTask("Test", undefined, { tomatoCount: 3 });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.markTaskDone(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(3);
    });

    it("should not change if already done", () => {
      const addResult = store.addTask("Test", undefined, { tomatoCount: 2 });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.setFinishedTomatoCount(addResult.taskId, 5);
      const result = store.markTaskDone(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.finishedTomatoCount).toBe(5); // Unchanged
    });
  });

  describe("setTaskProject", () => {
    it("should assign task to project", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setTaskProject(addResult.taskId, "project-1");

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.projectId).toBe("project-1");
    });

    it("should reject for non-existent task", () => {
      const result = store.setTaskProject("non-existent", "project-1");
      expect(result.success).toBe(false);
    });
  });

  describe("unassignTaskFromProject", () => {
    it("should remove project assignment", () => {
      const addResult = store.addTask("Test", undefined, {
        projectId: "project-1",
      });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTaskFromProject(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.projectId).toBeUndefined();
    });

    it("should succeed for already unassigned task", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTaskFromProject(addResult.taskId);

      expect(result.success).toBe(true);
    });
  });

  describe("setTaskTrack", () => {
    it("should assign task to track", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.setTaskTrack(addResult.taskId, "track-1");

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.trackId).toBe("track-1");
    });
  });

  describe("unassignTaskFromTrack", () => {
    it("should remove track assignment", () => {
      const addResult = store.addTask("Test", undefined, {
        trackId: "track-1",
      });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTaskFromTrack(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.trackId).toBeUndefined();
    });
  });

  describe("assignTaskToDay", () => {
    it("should assign task to a day", () => {
      const addResult = store.addTask("Test");
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.assignTaskToDay(addResult.taskId, today);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.dayDate).toBe(today);
      expect(store.getTasksForDay(today).length).toBe(1);
    });

    it("should reject invalid day date", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.assignTaskToDay(addResult.taskId, "invalid");

      expect(result.success).toBe(false);
    });

    it("should move task from one day to another", () => {
      const addResult = store.addTask("Test", undefined, {
        dayDate: "2025-01-01",
      });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.assignTaskToDay(addResult.taskId, "2025-01-02");

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.dayDate).toBe("2025-01-02");
      expect(store.getTasksForDay("2025-01-01").length).toBe(0);
      expect(store.getTasksForDay("2025-01-02").length).toBe(1);
    });
  });

  describe("unassignTaskFromDay", () => {
    it("should remove day assignment", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const addResult = store.addTask("Test", undefined, { dayDate: today });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTaskFromDay(addResult.taskId);

      expect(result.success).toBe(true);
      const task = store.getTaskById(addResult.taskId);
      if (!task) throw new Error("task should be defined");
      expect(task.dayDate).toBeUndefined();
      expect(store.getTasksForDay(today).length).toBe(0);
    });

    it("should succeed for already unassigned task", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.unassignTaskFromDay(addResult.taskId);

      expect(result.success).toBe(true);
    });
  });

  describe("reorderTask", () => {
    it("should reorder task within day assignments", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const task1 = store.addTask("Task 1", undefined, { dayDate: today });
      const task2 = store.addTask("Task 2", undefined, { dayDate: today });
      const task3 = store.addTask("Task 3", undefined, { dayDate: today });

      // Initial order: [task1, task2, task3]
      const dayTasks = store.getTasksForDay(today);
      if (!task1.taskId || !task2.taskId || !task3.taskId)
        throw new Error("taskId should be defined");
      expect(dayTasks[0]!.id).toBe(task1.taskId);
      expect(dayTasks[1]!.id).toBe(task2.taskId);
      expect(dayTasks[2]!.id).toBe(task3.taskId);

      // Move task1 to index 2 (last position)
      const result = store.reorderTask(task1.taskId, 2);
      expect(result.success).toBe(true);

      const reorderedTasks = store.getTasksForDay(today);
      expect(reorderedTasks[0]!.id).toBe(task2.taskId);
      expect(reorderedTasks[1]!.id).toBe(task3.taskId);
      expect(reorderedTasks[2]!.id).toBe(task1.taskId);
    });

    it("should reject reorder for task not assigned to a day", () => {
      const addResult = store.addTask("Test");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.reorderTask(addResult.taskId, 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not assigned to a day");
    });

    it("should reject invalid index", () => {
      const today = new Date().toISOString().split("T")[0]!;
      const addResult = store.addTask("Test", undefined, { dayDate: today });
      if (!addResult.taskId) throw new Error("taskId should be defined");
      const result = store.reorderTask(addResult.taskId, 99);

      expect(result.success).toBe(false);
      expect(result.error).toContain("out of bounds");
    });
  });

  describe("batch operations", () => {
    it("should unassign all tasks from a project", () => {
      store.addTask("Task 1", undefined, { projectId: "project-1" });
      store.addTask("Task 2", undefined, { projectId: "project-1" });
      store.addTask("Task 3", undefined, { projectId: "project-2" });

      store.unassignTasksFromProject("project-1");

      const project1Tasks = store.getTasksForProject("project-1");
      expect(project1Tasks.length).toBe(0);

      const project2Tasks = store.getTasksForProject("project-2");
      expect(project2Tasks.length).toBe(1);
    });

    it("should unassign all tasks from a track", () => {
      store.addTask("Task 1", undefined, { trackId: "track-1" });
      store.addTask("Task 2", undefined, { trackId: "track-1" });
      store.addTask("Task 3", undefined, { trackId: "track-2" });

      store.unassignTasksFromTrack("track-1");

      const track1Tasks = store.getTasksForTrack("track-1");
      expect(track1Tasks.length).toBe(0);

      const track2Tasks = store.getTasksForTrack("track-2");
      expect(track2Tasks.length).toBe(1);
    });
  });

  describe("setActiveDate", () => {
    it("should change active date", () => {
      const result = store.setActiveDate("2025-01-15");

      expect(result.success).toBe(true);
      expect(store.activeDate).toBe("2025-01-15");
    });

    it("should reject invalid date format", () => {
      const result = store.setActiveDate("invalid");

      expect(result.success).toBe(false);
    });
  });

  describe("selectors", () => {
    beforeEach(() => {
      // Set up some test data
      const today = new Date().toISOString().split("T")[0]!;
      const task1Result = store.addTask("Task 1", undefined, {
        dayDate: today,
        projectId: "project-1",
        tomatoCount: 3,
      });
      if (!task1Result.taskId) throw new Error("taskId should be defined");
      store.setFinishedTomatoCount(task1Result.taskId, 1);
      store.addTask("Task 2", undefined, {
        dayDate: "2025-01-01",
        projectId: "project-1",
        tomatoCount: 2,
      });
      store.addTask("Task 3", undefined, {
        projectId: "project-2",
        tomatoCount: 1,
      });
      store.addTask("Task 4"); // No assignments
    });

    it("should return all tasks", () => {
      const tasks = store.getAllTasks();
      expect(tasks.length).toBe(4);
    });

    it("should return task by ID", () => {
      const allTasks = store.getAllTasks();
      const task = store.getTaskById(allTasks[0]!.id);
      expect(task).toBeDefined();
    });

    it("should return tasks for a specific day", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const dayTasks = store.getTasksForDay(today);
      expect(dayTasks.length).toBe(1);
      expect(dayTasks[0]!.title).toBe("Task 1");
    });

    it("should return tasks for active date", () => {
      // Default active date is today
      const activeTasks = store.getTasksForActiveDate();
      expect(activeTasks.length).toBe(1);
    });

    it("should return all days with tasks", () => {
      const days = store.getAllDaysWithTasks();
      expect(days.length).toBe(2);
    });

    it("should return total planned tomatoes", () => {
      const total = store.getTotalPlannedTomatoes();
      expect(total).toBe(6); // 3 + 2 + 1 + 0
    });

    it("should return total finished tomatoes", () => {
      const total = store.getTotalFinishedTomatoes();
      expect(total).toBe(1);
    });

    it("should return tasks for project", () => {
      const tasks = store.getTasksForProject("project-1");
      expect(tasks.length).toBe(2);
    });

    it("should return unassigned tasks", () => {
      const tasks = store.getUnassignedTasks();
      expect(tasks.length).toBe(1); // Only Task 4
    });

    it("should return tasks without day", () => {
      const tasks = store.getTasksWithoutDay();
      expect(tasks.length).toBe(2); // Task 3 and Task 4
    });

    it("should return day tomato pool", () => {
      const today = new Date().toISOString().split("T")[0]!;
      if (!today) throw new Error("today should be defined");
      const pool = store.getDayTomatoPool(today);
      expect(pool.planned).toBe(3);
      expect(pool.finished).toBe(1);
    });
  });

  describe("subscription", () => {
    it("should notify subscribers on state change", () => {
      const callback = vi.fn();
      store.subscribe(callback);

      // Initial call on subscribe
      expect(callback).toHaveBeenCalledTimes(1);

      // Should be called after adding a task
      store.addTask("Test Task");
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should unsubscribe correctly", () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);

      unsubscribe();
      store.addTask("Test Task");

      // Should only be called once (initial call)
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should support multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      store.subscribe(callback1);
      store.subscribe(callback2);

      store.addTask("Test Task");

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe("persistence", () => {
    it("should persist state to localStorage", () => {
      const addResult = store.addTask("Test Task");
      if (!addResult.taskId) throw new Error("taskId should be defined");
      store.assignTomato(addResult.taskId);

      // Create a new store to load persisted state
      const newStore = new TaskpoolStore();
      const task = newStore.getTaskById(addResult.taskId);

      expect(task).toBeDefined();
      if (!task) throw new Error("task should be defined");
      expect(task.title).toBe("Test Task");
      expect(task.tomatoCount).toBe(1);
    });

    it("should clear all data", () => {
      store.addTask("Test Task");
      store.clearAllData();

      expect(store.taskCount).toBe(0);
      expect(localStorage.getItem(STORAGE_KEYS.TASKPOOL_STATE)).toBeNull();
    });
  });

  describe("migrateFromPlannerState", () => {
    it("should migrate tasks from planner state", () => {
      const legacyTasks: Task[] = [
        {
          id: "task-1",
          title: "Legacy Task 1",
          tomatoCount: 2,
          finishedTomatoCount: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
        {
          id: "task-2",
          title: "Legacy Task 2",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2025-01-01T11:00:00Z",
          updatedAt: "2025-01-01T11:00:00Z",
        },
      ];

      const result = store.migrateFromPlannerState(legacyTasks, "2025-01-15");

      expect(result.success).toBe(true);
      expect(store.taskCount).toBe(2);

      const task1 = store.getTaskById("task-1");
      if (!task1) throw new Error("task should be defined");
      expect(task1.dayDate).toBe("2025-01-15");
    });

    it("should reject invalid target date", () => {
      const legacyTasks: Task[] = [
        {
          id: "task-1",
          title: "Task",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = store.migrateFromPlannerState(legacyTasks, "invalid");

      expect(result.success).toBe(false);
    });
  });

  // Regression tests for empty day bucket cleanup (tomatoplan-ct7)
  describe("empty day bucket cleanup", () => {
    describe("importTasks", () => {
      it("should remove empty day bucket when moving the only task to a different day", () => {
        // Add a task to day A
        const result = store.addTask("Test Task", undefined, {
          dayDate: "2025-01-01",
        });
        if (!result.taskId) throw new Error("taskId should be defined");

        // Verify day A has one task
        expect(store.getTasksForDay("2025-01-01").length).toBe(1);
        expect(store.daysWithTasks).toBe(1);
        expect(store.getAllDaysWithTasks()).toContain("2025-01-01");

        // Import the same task moved to day B
        const movedTask: Task = {
          id: result.taskId,
          title: "Test Task",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          dayDate: "2025-01-02",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.importTasks([movedTask]);

        // Verify day A bucket is removed
        expect(store.getTasksForDay("2025-01-01").length).toBe(0);
        expect(store.daysWithTasks).toBe(1); // Should still be 1 (only day B)
        expect(store.getAllDaysWithTasks()).not.toContain("2025-01-01");
        expect(store.getAllDaysWithTasks()).toContain("2025-01-02");
      });

      it("should remove empty day bucket when importing task with changed dayDate", () => {
        // Add two tasks to day A
        const result1 = store.addTask("Task 1", undefined, {
          dayDate: "2025-01-01",
        });
        const result2 = store.addTask("Task 2", undefined, {
          dayDate: "2025-01-01",
        });
        if (!result1.taskId || !result2.taskId)
          throw new Error("taskId should be defined");

        expect(store.daysWithTasks).toBe(1);

        // Import task 1 moved to day B, task 2 stays on day A
        const movedTask: Task = {
          id: result1.taskId,
          title: "Task 1",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          dayDate: "2025-01-02",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.importTasks([movedTask]);

        // Day A should still have task 2
        expect(store.getTasksForDay("2025-01-01").length).toBe(1);
        expect(store.daysWithTasks).toBe(2); // Both days
        expect(store.getAllDaysWithTasks()).toContain("2025-01-01");
        expect(store.getAllDaysWithTasks()).toContain("2025-01-02");

        // Now move task 2 to day B as well, making day A empty
        const movedTask2: Task = {
          id: result2.taskId,
          title: "Task 2",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          dayDate: "2025-01-02",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.importTasks([movedTask2]);

        // Day A bucket should be removed
        expect(store.getTasksForDay("2025-01-01").length).toBe(0);
        expect(store.daysWithTasks).toBe(1); // Only day B
        expect(store.getAllDaysWithTasks()).not.toContain("2025-01-01");
        expect(store.getAllDaysWithTasks()).toContain("2025-01-02");
      });

      it("should handle unassigning the only task from a day via import", () => {
        // Add a task to day A
        const result = store.addTask("Test Task", undefined, {
          dayDate: "2025-01-01",
        });
        if (!result.taskId) throw new Error("taskId should be defined");

        expect(store.daysWithTasks).toBe(1);

        // Import the task without dayDate (unassigned)
        const unassignedTask: Task = {
          id: result.taskId,
          title: "Test Task",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          dayDate: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.importTasks([unassignedTask]);

        // Day A bucket should be removed
        expect(store.getTasksForDay("2025-01-01").length).toBe(0);
        expect(store.daysWithTasks).toBe(0);
        expect(store.getAllDaysWithTasks()).not.toContain("2025-01-01");
      });
    });

    describe("migrateFromPlannerState", () => {
      it("should remove empty day bucket when re-migrating task to different date", () => {
        // First migration to day A
        const legacyTasks: Task[] = [
          {
            id: "task-1",
            title: "Legacy Task",
            tomatoCount: 2,
            finishedTomatoCount: 0,
            createdAt: "2025-01-01T10:00:00Z",
            updatedAt: "2025-01-01T10:00:00Z",
          },
        ];

        store.migrateFromPlannerState(legacyTasks, "2025-01-01");
        expect(store.daysWithTasks).toBe(1);
        expect(store.getAllDaysWithTasks()).toContain("2025-01-01");

        // Re-migrate to day B (different date)
        const updatedTasks: Task[] = [
          {
            id: "task-1",
            title: "Legacy Task",
            tomatoCount: 2,
            finishedTomatoCount: 0,
            dayDate: "2025-01-02", // Already has dayDate (edge case)
            createdAt: "2025-01-01T10:00:00Z",
            updatedAt: "2025-01-01T10:00:00Z",
          },
        ];

        store.migrateFromPlannerState(updatedTasks, "2025-01-02");

        // Day A bucket should be removed
        expect(store.getTasksForDay("2025-01-01").length).toBe(0);
        expect(store.daysWithTasks).toBe(1);
        expect(store.getAllDaysWithTasks()).not.toContain("2025-01-01");
        expect(store.getAllDaysWithTasks()).toContain("2025-01-02");
      });
    });

    describe("getAllDaysWithTasks", () => {
      it("should not include empty buckets after cleanup", () => {
        // Create multiple days with tasks
        store.addTask("Task 1", undefined, { dayDate: "2025-01-01" });
        store.addTask("Task 2", undefined, { dayDate: "2025-01-02" });
        store.addTask("Task 3", undefined, { dayDate: "2025-01-03" });

        expect(store.daysWithTasks).toBe(3);
        const allDays = store.getAllDaysWithTasks();
        expect(allDays).toContain("2025-01-01");
        expect(allDays).toContain("2025-01-02");
        expect(allDays).toContain("2025-01-03");

        // Move all tasks to a single day via import
        const allTasks = store.getAllTasks();
        const movedTasks = allTasks.map((t) => ({
          ...t,
          dayDate: "2025-01-04",
        }));
        store.importTasks(movedTasks);

        // All previous day buckets should be removed
        expect(store.daysWithTasks).toBe(1);
        const remainingDays = store.getAllDaysWithTasks();
        expect(remainingDays).not.toContain("2025-01-01");
        expect(remainingDays).not.toContain("2025-01-02");
        expect(remainingDays).not.toContain("2025-01-03");
        expect(remainingDays).toContain("2025-01-04");
      });
    });
  });
});
