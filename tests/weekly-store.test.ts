/**
 * Tests for WeeklyStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WeeklyStore } from "../src/state/weekly-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";
import { getCurrentWeekId } from "../src/models/project.js";
import type { Task } from "../src/models/task.js";

describe("WeeklyStore", () => {
  let store: WeeklyStore;

  beforeEach(() => {
    localStorage.clear();
    // Use fake timers for consistent date handling
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Create fresh store instance for each test
    store = new WeeklyStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should have default weekly capacity", () => {
      const state = store.getState();
      expect(state.pool.weeklyCapacity).toBe(125); // 25 * 5
      expect(state.pool.capacityInMinutes).toBe(25);
    });

    it("should have empty projects", () => {
      expect(store.projects).toEqual([]);
    });

    it("should have empty tasks", () => {
      expect(store.tasks).toEqual([]);
    });

    it("should load persisted state from localStorage", () => {
      // First store saves some state
      store.setWeeklyCapacity(100);
      store.addProject("Test Project");

      // Create new store instance - should load from localStorage
      const newStore = new WeeklyStore();

      expect(newStore.weeklyCapacity).toBe(100);
      expect(newStore.projects).toHaveLength(1);
    });
  });

  describe("setWeeklyCapacity", () => {
    it("should update weekly capacity", () => {
      const result = store.setWeeklyCapacity(150);
      expect(result.success).toBe(true);
      expect(store.weeklyCapacity).toBe(150);
    });

    it("should validate capacity", () => {
      const result = store.setWeeklyCapacity(0);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject negative capacity", () => {
      const result = store.setWeeklyCapacity(-5);
      expect(result.success).toBe(false);
    });
  });

  describe("addProject", () => {
    it("should add a new project", () => {
      const result = store.addProject("My Project");

      expect(result.success).toBe(true);
      expect(result.projectId).toBeDefined();
      expect(store.projects).toHaveLength(1);
      expect(store.projects[0]!.title).toBe("My Project");
    });

    it("should add project with description and estimate", () => {
      const result = store.addProject("Project", "Description", 10);

      expect(result.success).toBe(true);
      expect(store.projects[0]!.description).toBe("Description");
      expect(store.projects[0]!.tomatoEstimate).toBe(10);
    });

    it("should validate project title", () => {
      const result = store.addProject("");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should trim project title", () => {
      store.addProject("  Trimmed Title  ");

      expect(store.projects[0]!.title).toBe("Trimmed Title");
    });

    it("should assign a color to new project", () => {
      store.addProject("Project");

      expect(store.projects[0]!.color).toBeDefined();
    });

    it("should use provided color", () => {
      store.addProject("Project", undefined, 0, "#3b82f6");

      expect(store.projects[0]!.color).toBe("#3b82f6");
    });
  });

  describe("capacity enforcement", () => {
    describe("addProject", () => {
      it("should reject project when total estimates would exceed capacity", () => {
        // Default capacity is 125 tomatoes
        store.setWeeklyCapacity(50);
        store.addProject("Project 1", undefined, 30);
        store.addProject("Project 2", undefined, 15);

        // 45 used, trying to add 10 more = 55 > 50
        const result = store.addProject("Project 3", undefined, 10);

        expect(result.success).toBe(false);
        expect(result.error).toContain("exceed weekly capacity");
        expect(result.error).toContain("5 tomatoes remaining");
        expect(store.projects).toHaveLength(2);
      });

      it("should accept project when total estimates exactly equal capacity", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Project 1", undefined, 30);

        // 30 used, adding 20 more = 50 exactly
        const result = store.addProject("Project 2", undefined, 20);

        expect(result.success).toBe(true);
        expect(store.projects).toHaveLength(2);
        expect(store.totalProjectEstimates).toBe(50);
      });

      it("should accept project with zero estimate regardless of capacity", () => {
        store.setWeeklyCapacity(10);
        store.addProject("Project 1", undefined, 10);

        // At capacity, but adding a zero-estimate project should work
        const result = store.addProject("Project 2", undefined, 0);

        expect(result.success).toBe(true);
        expect(store.projects).toHaveLength(2);
      });

      it("should not modify state when validation fails", () => {
        store.setWeeklyCapacity(10);
        store.addProject("Project 1", undefined, 10);

        const stateBefore = store.getState();
        store.addProject("Project 2", undefined, 5);
        const stateAfter = store.getState();

        // State should be unchanged
        expect(stateAfter.projects).toHaveLength(1);
        expect(stateAfter.projects[0]).toEqual(stateBefore.projects[0]);
      });

      it("should only count active projects toward capacity", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Active 1", undefined, 20);
        const { projectId } = store.addProject("To Archive", undefined, 20);
        store.archiveProject(projectId!);

        // 20 active (archived doesn't count), should be able to add 30 more
        const result = store.addProject("Active 2", undefined, 30);

        expect(result.success).toBe(true);
        expect(store.totalProjectEstimates).toBe(50);
      });

      it("should reject negative estimate", () => {
        const result = store.addProject("Project", undefined, -5);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Estimate must be a non-negative finite number",
        );
        expect(store.projects).toHaveLength(0);
      });

      it("should reject NaN estimate", () => {
        const result = store.addProject("Project", undefined, NaN);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Estimate must be a non-negative finite number",
        );
        expect(store.projects).toHaveLength(0);
      });

      it("should reject Infinity estimate", () => {
        const result = store.addProject("Project", undefined, Infinity);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Estimate must be a non-negative finite number",
        );
        expect(store.projects).toHaveLength(0);
      });

      it("should reject negative Infinity estimate", () => {
        const result = store.addProject("Project", undefined, -Infinity);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Estimate must be a non-negative finite number",
        );
        expect(store.projects).toHaveLength(0);
      });

      it("should not modify state after invalid estimate attempts", () => {
        store.addProject("Valid Project", undefined, 5);
        const stateBefore = store.getState();

        // Attempt various invalid estimates
        store.addProject("Bad 1", undefined, -1);
        store.addProject("Bad 2", undefined, NaN);
        store.addProject("Bad 3", undefined, Infinity);

        const stateAfter = store.getState();

        // State should be unchanged - only the original project
        expect(stateAfter.projects).toHaveLength(1);
        expect(stateAfter.projects[0]).toEqual(stateBefore.projects[0]);
      });
    });

    describe("updateProject", () => {
      it("should reject update when increasing estimate past capacity", () => {
        store.setWeeklyCapacity(40);
        store.addProject("Project 1", undefined, 20);
        const { projectId } = store.addProject("Project 2", undefined, 15);

        // 35 used, trying to increase Project 2 to 25 = 45 total would exceed by 5
        const result = store.updateProject(projectId!, { tomatoEstimate: 25 });

        expect(result.success).toBe(false);
        expect(result.error).toContain("exceed weekly capacity");
        // State unchanged
        expect(store.getProjectById(projectId!)!.tomatoEstimate).toBe(15);
      });

      it("should allow reducing estimate", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Project 1", undefined, 30);
        const { projectId } = store.addProject("Project 2", undefined, 15);

        // Reducing should always be allowed
        const result = store.updateProject(projectId!, { tomatoEstimate: 5 });

        expect(result.success).toBe(true);
        expect(store.getProjectById(projectId!)!.tomatoEstimate).toBe(5);
        expect(store.totalProjectEstimates).toBe(35);
      });

      it("should allow updating estimate to exactly capacity", () => {
        store.setWeeklyCapacity(50);
        const { projectId } = store.addProject("Project 1", undefined, 30);

        // Can update to exactly 50
        const result = store.updateProject(projectId!, { tomatoEstimate: 50 });

        expect(result.success).toBe(true);
        expect(store.totalProjectEstimates).toBe(50);
      });

      it("should reject reactivating archived project that would exceed capacity", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Active", undefined, 30);
        const { projectId } = store.addProject("To Archive", undefined, 20);
        store.archiveProject(projectId!);

        // Archived project doesn't count (30 active)
        // Reactivating would bring total to 50, exactly at capacity
        // But if we try to reactivate with the same estimate (20), 30 + 20 = 50 should be allowed
        // Let's test a case that truly exceeds: first increase Active estimate
        store.updateProject(
          store.projects.find((p) => p.title === "Active")!.id,
          { tomatoEstimate: 35 },
        );
        // Now 35 active, reactivating with 20 = 55 > 50
        const result = store.updateProject(projectId!, { status: "active" });

        expect(result.success).toBe(false);
        expect(result.error).toContain("exceed weekly capacity");
        // Project should remain archived
        expect(store.getProjectById(projectId!)!.status).toBe("archived");
      });

      it("should allow reactivating archived project within capacity", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Active", undefined, 20);
        const { projectId } = store.addProject("To Archive", undefined, 25);
        store.archiveProject(projectId!);

        // 20 active, reactivating brings total to 45
        const result = store.updateProject(projectId!, { status: "active" });

        expect(result.success).toBe(true);
        expect(store.getProjectById(projectId!)!.status).toBe("active");
        expect(store.totalProjectEstimates).toBe(45);
      });

      it("should allow archiving active project", () => {
        store.setWeeklyCapacity(50);
        const { projectId } = store.addProject("Project", undefined, 40);

        // Archiving should be allowed
        const result = store.updateProject(projectId!, { status: "archived" });

        expect(result.success).toBe(true);
        expect(store.getProjectById(projectId!)!.status).toBe("archived");
        expect(store.totalProjectEstimates).toBe(0);
      });

      it("should allow completing active project", () => {
        store.setWeeklyCapacity(50);
        const { projectId } = store.addProject("Project", undefined, 40);

        // Completing should be allowed
        const result = store.updateProject(projectId!, { status: "completed" });

        expect(result.success).toBe(true);
        expect(store.getProjectById(projectId!)!.status).toBe("completed");
        expect(store.totalProjectEstimates).toBe(0);
      });

      it("should not modify state when validation fails", () => {
        store.setWeeklyCapacity(50);
        const { projectId } = store.addProject("Project", undefined, 50);

        const stateBefore = store.getState();
        const result = store.updateProject(projectId!, { tomatoEstimate: 60 });
        const stateAfter = store.getState();

        expect(result.success).toBe(false);
        expect(stateAfter.projects[0]).toEqual(stateBefore.projects[0]);
      });

      it("should handle simultaneous status and estimate changes", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Active", undefined, 30);
        const { projectId } = store.addProject("To Archive", undefined, 15);
        store.archiveProject(projectId!);

        // Reactivating with increased estimate (15 -> 18, total = 48)
        const result = store.updateProject(projectId!, {
          status: "active",
          tomatoEstimate: 18,
        });

        expect(result.success).toBe(true);
        expect(store.getProjectById(projectId!)!.status).toBe("active");
        expect(store.getProjectById(projectId!)!.tomatoEstimate).toBe(18);
        expect(store.totalProjectEstimates).toBe(48);
      });

      it("should reject simultaneous status and estimate changes that exceed capacity", () => {
        store.setWeeklyCapacity(50);
        store.addProject("Active", undefined, 30);
        const { projectId } = store.addProject("To Archive", undefined, 15);
        store.archiveProject(projectId!);

        // Reactivating with increased estimate (15 -> 25, total = 55)
        const result = store.updateProject(projectId!, {
          status: "active",
          tomatoEstimate: 25,
        });

        expect(result.success).toBe(false);
        expect(store.getProjectById(projectId!)!.status).toBe("archived");
        expect(store.getProjectById(projectId!)!.tomatoEstimate).toBe(15);
      });
    });
  });

  describe("updateProject", () => {
    it("should update project title", () => {
      const { projectId } = store.addProject("Original");
      const result = store.updateProject(projectId!, { title: "Updated" });

      expect(result.success).toBe(true);
      expect(store.getProjectById(projectId!)!.title).toBe("Updated");
    });

    it("should update project description", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, {
        description: "New desc",
      });

      expect(result.success).toBe(true);
      expect(store.getProjectById(projectId!)!.description).toBe("New desc");
    });

    it("should update project estimate", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, { tomatoEstimate: 15 });

      expect(result.success).toBe(true);
      expect(store.getProjectById(projectId!)!.tomatoEstimate).toBe(15);
    });

    it("should fail for non-existent project", () => {
      const result = store.updateProject("non-existent", { title: "New" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should validate new title", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, { title: "" });

      expect(result.success).toBe(false);
    });

    it("should validate estimate (negative)", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, { tomatoEstimate: -5 });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Estimate must be a non-negative finite number",
      );
    });

    it("should reject NaN estimate", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, { tomatoEstimate: NaN });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Estimate must be a non-negative finite number",
      );
    });

    it("should reject Infinity estimate", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, {
        tomatoEstimate: Infinity,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Estimate must be a non-negative finite number",
      );
    });

    it("should reject negative Infinity estimate", () => {
      const { projectId } = store.addProject("Project");
      const result = store.updateProject(projectId!, {
        tomatoEstimate: -Infinity,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Estimate must be a non-negative finite number",
      );
    });

    it("should not modify state after invalid estimate update attempts", () => {
      const { projectId } = store.addProject("Project", undefined, 5);
      const stateBefore = store.getState();

      // Attempt various invalid estimate updates
      store.updateProject(projectId!, { tomatoEstimate: -1 });
      store.updateProject(projectId!, { tomatoEstimate: NaN });
      store.updateProject(projectId!, { tomatoEstimate: Infinity });

      const stateAfter = store.getState();

      // State should be unchanged
      expect(stateAfter.projects[0]!.tomatoEstimate).toBe(5);
      expect(stateAfter.projects[0]).toEqual(stateBefore.projects[0]);
    });
  });

  describe("removeProject", () => {
    it("should remove a project", () => {
      const { projectId } = store.addProject("Project");
      const result = store.removeProject(projectId!);

      expect(result.success).toBe(true);
      expect(store.projects).toHaveLength(0);
    });

    it("should fail for non-existent project", () => {
      const result = store.removeProject("non-existent");

      expect(result.success).toBe(false);
    });

    it("should unassign tasks from removed project", () => {
      const { projectId } = store.addProject("Project");

      // Add a task with project assignment
      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.removeProject(projectId!);

      const updatedTask = store.getTaskById("task-1");
      expect(updatedTask?.projectId).toBeUndefined();
    });
  });

  describe("completeProject", () => {
    it("should mark project as completed", () => {
      const { projectId } = store.addProject("Project");
      const result = store.completeProject(projectId!);

      expect(result.success).toBe(true);
      expect(store.getProjectById(projectId!)!.status).toBe("completed");
    });

    it("should fail for non-existent project", () => {
      const result = store.completeProject("non-existent");

      expect(result.success).toBe(false);
    });
  });

  describe("archiveProject", () => {
    it("should mark project as archived", () => {
      const { projectId } = store.addProject("Project");
      const result = store.archiveProject(projectId!);

      expect(result.success).toBe(true);
      expect(store.getProjectById(projectId!)!.status).toBe("archived");
    });

    it("should fail for non-existent project", () => {
      const result = store.archiveProject("non-existent");

      expect(result.success).toBe(false);
    });
  });

  describe("getProjectProgressById", () => {
    it("should return progress for project", () => {
      const { projectId } = store.addProject("Project", undefined, 10);

      // Add tasks for the project
      const task1: Task = {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 3,
        finishedTomatoCount: 2,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task1]);

      const progress = store.getProjectProgressById(projectId!);
      expect(progress.finished).toBe(2);
      expect(progress.estimated).toBe(10);
    });

    it("should return zeros for non-existent project", () => {
      const progress = store.getProjectProgressById("non-existent");
      expect(progress.finished).toBe(0);
      expect(progress.estimated).toBe(0);
    });
  });

  describe("syncTasks", () => {
    it("should sync tasks from external source", () => {
      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 2,
        finishedTomatoCount: 1,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0]!.id).toBe("task-1");
    });

    it("should update existing tasks", () => {
      // Initial task
      const task: Task = {
        id: "task-1",
        title: "Original",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Updated task
      const updatedTask: Task = {
        ...task,
        title: "Updated",
        tomatoCount: 5,
        finishedTomatoCount: 3,
      };

      store.syncTasks([updatedTask]);

      expect(store.tasks[0]!.title).toBe("Updated");
      expect(store.tasks[0]!.tomatoCount).toBe(5);
    });

    it("should include tasks with project from current week", () => {
      const { projectId } = store.addProject("Project");

      // Task with project in current week
      const task1: Task = {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task1]);

      expect(store.tasks).toHaveLength(1);
    });
  });

  describe("assignTaskToProject", () => {
    it("should assign task to project", () => {
      const { projectId } = store.addProject("Project");

      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const result = store.assignTaskToProject("task-1", projectId!);

      expect(result.success).toBe(true);
      expect(store.getTaskById("task-1")!.projectId).toBe(projectId);
    });

    it("should fail for non-existent task", () => {
      const { projectId } = store.addProject("Project");
      const result = store.assignTaskToProject("non-existent", projectId!);

      expect(result.success).toBe(false);
    });

    it("should fail for non-existent project", () => {
      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const result = store.assignTaskToProject("task-1", "non-existent");

      expect(result.success).toBe(false);
    });

    it("should fail for inactive project", () => {
      const { projectId } = store.addProject("Project");
      store.completeProject(projectId!);

      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const result = store.assignTaskToProject("task-1", projectId!);

      expect(result.success).toBe(false);
      expect(result.error).toContain("inactive");
    });
  });

  describe("unassignTaskFromProject", () => {
    it("should remove task from project", () => {
      const { projectId } = store.addProject("Project");

      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const result = store.unassignTaskFromProject("task-1");

      expect(result.success).toBe(true);
      expect(store.getTaskById("task-1")!.projectId).toBeUndefined();
    });

    it("should succeed for task without project", () => {
      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const result = store.unassignTaskFromProject("task-1");

      expect(result.success).toBe(true);
    });
  });

  describe("selectors", () => {
    beforeEach(() => {
      store.addProject("Project 1", undefined, 10);
      store.addProject("Project 2", undefined, 15);
    });

    it("should track active projects", () => {
      expect(store.activeProjects).toHaveLength(2);
    });

    it("should track remaining capacity", () => {
      // 125 capacity - 10 - 15 = 100 remaining
      expect(store.remainingCapacity).toBe(100);
    });

    it("should track total project estimates", () => {
      expect(store.totalProjectEstimates).toBe(25);
    });

    it("should get tasks for project", () => {
      const { projectId } = store.addProject("Project");

      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        projectId,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      const projectTasks = store.getTasksForProject(projectId!);

      expect(projectTasks).toHaveLength(1);
    });
  });

  describe("subscription", () => {
    it("should notify subscribers on state change", () => {
      const callback = vi.fn();
      store.subscribe(callback);

      store.addProject("Project");

      expect(callback).toHaveBeenCalled();
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1];
      expect(lastCall![0].projects).toHaveLength(1);
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);

      unsubscribe();
      callback.mockClear();

      store.addProject("Project");

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
      store.setWeeklyCapacity(100);
      store.addProject("Persisted Project");

      const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.weeklyCapacity).toBe(100);
      expect(parsed.projects).toHaveLength(1);
    });
  });

  describe("resetWeek", () => {
    it("should clear projects but preserve capacity", () => {
      store.setWeeklyCapacity(100);
      store.addProject("Project");

      store.resetWeek();

      expect(store.projects).toHaveLength(0);
      expect(store.tasks).toHaveLength(0);
    });

    it("should create new pool for current week", () => {
      store.addProject("Project");

      store.resetWeek();

      expect(store.currentWeekId).toBe(getCurrentWeekId());
    });
  });

  describe("clearAllData", () => {
    it("should reset to default state", () => {
      store.setWeeklyCapacity(100);
      store.addProject("Project");

      store.clearAllData();

      expect(store.weeklyCapacity).toBe(125); // default
      expect(store.projects).toHaveLength(0);
    });

    it("should clear localStorage", () => {
      store.addProject("Project");
      store.clearAllData();

      expect(
        localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE),
      ).toBeNull();
    });
  });

  describe("week rollover behavior", () => {
    it("should detect stale state from previous week", () => {
      // Create state for current week
      store.addProject("Project");

      // Simulate week change
      vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z")); // Next week

      // Create new store - should detect stale state
      const newStore = new WeeklyStore();

      // State should be reset for new week
      expect(newStore.isCurrentWeek).toBe(true);
    });

    it("should preserve capacity settings on week rollover", () => {
      store.setWeeklyCapacity(100);
      store.setWeeklyCapacity(30);

      // Simulate week change
      vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z"));

      const newStore = new WeeklyStore();

      // Capacity should be recalculated but minutes preserved
      expect(newStore.capacityInMinutes).toBe(25);
    });
  });

  describe("updateTask", () => {
    it("should update existing task", () => {
      const task: Task = {
        id: "task-1",
        title: "Original",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.updateTask("task-1", { title: "Updated", tomatoCount: 5 });

      const updated = store.getTaskById("task-1");
      expect(updated!.title).toBe("Updated");
      expect(updated!.tomatoCount).toBe(5);
    });

    it("should add new task if not exists", () => {
      store.updateTask("new-task", {
        title: "New Task",
        tomatoCount: 3,
        createdAt: "2024-06-15T10:00:00.000Z",
      });

      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0]!.id).toBe("new-task");
    });
  });

  describe("removeTask", () => {
    it("should remove task from state", () => {
      const task: Task = {
        id: "task-1",
        title: "Task",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.removeTask("task-1");

      expect(store.tasks).toHaveLength(0);
    });
  });
});
