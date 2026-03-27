/**
 * Tests for Project Coordinator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { plannerStore } from "../src/state/planner-store.js";
import { weeklyStore } from "../src/state/weekly-store.js";
import { removeProject } from "../src/state/project-coordinator.js";

describe("Project Coordinator", () => {
  beforeEach(() => {
    localStorage.clear();
    // Use fake timers for consistent date handling
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Clear both singleton stores
    plannerStore.clearAllData();
    weeklyStore.clearAllData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("removeProject", () => {
    it("should remove project and unassign tasks from planner store", () => {
      // Create project in weekly store
      const { projectId } = weeklyStore.addProject("Test Project");

      // Create task in planner store with project assignment
      const { taskId } = plannerStore.addTask("Task 1");
      plannerStore.setTaskProject(taskId!, projectId!);

      // Verify initial state
      expect(plannerStore.getTaskById(taskId!)!.projectId).toBe(projectId);
      expect(weeklyStore.projects).toHaveLength(1);

      // Remove project via coordinator
      const result = removeProject(projectId!);

      expect(result.success).toBe(true);
      expect(weeklyStore.projects).toHaveLength(0);
      expect(plannerStore.getTaskById(taskId!)!.projectId).toBeUndefined();
    });

    it("should sync task unassignment to weekly store", () => {
      const { projectId } = weeklyStore.addProject("Test Project");
      const { taskId } = plannerStore.addTask("Task 1");
      plannerStore.setTaskProject(taskId!, projectId!);

      // Remove project via coordinator
      removeProject(projectId!);

      // Weekly store task should also be unassigned (synced from planner)
      const weeklyTask = weeklyStore.getTaskById(taskId!);
      expect(weeklyTask?.projectId).toBeUndefined();
    });

    it("should unassign multiple tasks from the project", () => {
      const { projectId } = weeklyStore.addProject("Test Project");

      const { taskId: task1 } = plannerStore.addTask("Task 1");
      const { taskId: task2 } = plannerStore.addTask("Task 2");
      const { taskId: task3 } = plannerStore.addTask("Task 3");

      plannerStore.setTaskProject(task1!, projectId!);
      plannerStore.setTaskProject(task2!, projectId!);
      plannerStore.setTaskProject(task3!, "other-project");

      removeProject(projectId!);

      expect(plannerStore.getTaskById(task1!)!.projectId).toBeUndefined();
      expect(plannerStore.getTaskById(task2!)!.projectId).toBeUndefined();
      expect(plannerStore.getTaskById(task3!)!.projectId).toBe("other-project");
    });

    it("should fail for non-existent project", () => {
      const result = removeProject("non-existent-project");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should do nothing when no tasks assigned to project", () => {
      const { projectId } = weeklyStore.addProject("Empty Project");

      // No tasks assigned
      const result = removeProject(projectId!);

      expect(result.success).toBe(true);
      expect(weeklyStore.projects).toHaveLength(0);
    });

    it("should update updatedAt timestamp on affected tasks", () => {
      const { projectId } = weeklyStore.addProject("Test Project");
      const { taskId } = plannerStore.addTask("Task 1");
      plannerStore.setTaskProject(taskId!, projectId!);

      const originalUpdatedAt = plannerStore.getTaskById(taskId!)!.updatedAt;

      vi.advanceTimersByTime(1000);

      removeProject(projectId!);

      const updatedTask = plannerStore.getTaskById(taskId!);
      expect(updatedTask!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should preserve task content when unassigning", () => {
      const { projectId } = weeklyStore.addProject("Test Project");
      const { taskId } = plannerStore.addTask("Important Task");
      plannerStore.setTaskProject(taskId!, projectId!);
      plannerStore.assignTomato(taskId!);
      plannerStore.assignTomato(taskId!);

      removeProject(projectId!);

      const task = plannerStore.getTaskById(taskId!);
      expect(task!.title).toBe("Important Task");
      expect(task!.tomatoCount).toBe(2);
    });
  });
});
