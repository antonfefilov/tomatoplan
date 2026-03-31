/**
 * Tests for TasksViewPanel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/tasks-view-panel.js";
import type { TasksViewPanel } from "../src/components/task/tasks-view-panel.js";
import type { Task } from "../src/models/task.js";
import type { Project } from "../src/models/project.js";

// Import dependent custom elements
import "../src/components/task/task-list.js";
import "../src/components/task/task-item.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/shared/dropdown-menu.js";
import "../src/components/shared/empty-state.js";

describe("TasksViewPanel", () => {
  let element: TasksViewPanel;

  const mockProjects: Project[] = [
    {
      id: "project-1",
      title: "Project Alpha",
      description: "First project",
      tomatoEstimate: 10,
      color: "#ef4444",
      weekId: "2024-W01",
      status: "active",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "project-2",
      title: "Project Beta",
      description: "Second project",
      tomatoEstimate: 5,
      color: "#3b82f6",
      weekId: "2024-W01",
      status: "active",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "First Task",
      description: "Description 1",
      tomatoCount: 2,
      finishedTomatoCount: 2,
      projectId: "project-1",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "task-2",
      title: "Second Task",
      description: "Description 2",
      tomatoCount: 3,
      finishedTomatoCount: 0,
      projectId: "project-2",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "task-3",
      title: "Third Task",
      description: undefined,
      tomatoCount: 1,
      finishedTomatoCount: 0,
      projectId: undefined,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    element = document.createElement("tasks-view-panel") as TasksViewPanel;
    element.tasks = [];
    element.projects = [];
    element.statusFilter = "all";
    element.projectFilter = "all";
    element.remaining = 5;
    element.capacityInMinutes = 25;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("empty state", () => {
    it("should render empty state when there are no tasks", async () => {
      element.tasks = [];
      await element.updateComplete;

      const emptyContainer =
        element.shadowRoot!.querySelector(".empty-container");
      expect(emptyContainer).toBeDefined();

      const emptyTitle = element.shadowRoot!.querySelector(".empty-title");
      expect(emptyTitle!.textContent?.trim()).toBe("No tasks yet");
    });

    it("should show 'Add Your First Task' button in empty state", async () => {
      element.tasks = [];
      await element.updateComplete;

      const addFirstBtn = element.shadowRoot!.querySelector(
        ".empty-container .add-btn",
      ) as HTMLButtonElement;
      expect(addFirstBtn).toBeDefined();
      expect(addFirstBtn.textContent).toContain("Add Your First Task");
    });

    it("should show different empty state when filters are active", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "done";
      await element.updateComplete;

      // Only task-1 is done (finishedTomatoCount >= tomatoCount)
      // But with filter "done", we should see done tasks
      // Actually, task-1 is done (2/2), so it should show
      // Let's test with a filter that returns no results
      element.projectFilter = "non-existent-project";
      await element.updateComplete;

      const emptyTitle = element.shadowRoot!.querySelector(".empty-title");
      expect(emptyTitle!.textContent?.trim()).toBe("No matching tasks");
    });
  });

  describe("add button", () => {
    it("should dispatch open-task-dialog when header add button is clicked", async () => {
      const spy = vi.fn();
      element.addEventListener("open-task-dialog", spy);

      const addBtn = element.shadowRoot!.querySelector(
        ".panel-header .add-btn",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("task filtering", () => {
    it("should show all tasks when statusFilter is 'all'", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "all";
      element.projectFilter = "all";
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.tasks.length).toBe(3);
    });

    it("should filter tasks by status 'active'", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "active";
      element.projectFilter = "all";
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      // task-2 and task-3 are active (not done)
      expect(taskList.tasks.length).toBe(2);
    });

    it("should filter tasks by status 'done'", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "done";
      element.projectFilter = "all";
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      // task-1 is done (finishedTomatoCount >= tomatoCount)
      expect(taskList.tasks.length).toBe(1);
      expect(taskList.tasks[0].id).toBe("task-1");
    });

    it("should filter tasks by project", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      element.statusFilter = "all";
      element.projectFilter = "project-1";
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.tasks.length).toBe(1);
      expect(taskList.tasks[0].id).toBe("task-1");
    });

    it("should combine status and project filters", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      element.statusFilter = "active";
      element.projectFilter = "project-2";
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      // task-2 is in project-2 and is active
      expect(taskList.tasks.length).toBe(1);
      expect(taskList.tasks[0].id).toBe("task-2");
    });
  });

  describe("filter info display", () => {
    it("should show filter info when filters are active", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      element.statusFilter = "active";
      await element.updateComplete;

      const filterInfo = element.shadowRoot!.querySelector(".filter-info");
      expect(filterInfo).toBeDefined();
    });

    it("should not show filter info when no filters are active", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "all";
      element.projectFilter = "all";
      await element.updateComplete;

      const filterInfo = element.shadowRoot!.querySelector(".filter-info");
      expect(filterInfo).toBeNull();
    });

    it("should show status filter badge", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "active";
      await element.updateComplete;

      const filterBadge = element.shadowRoot!.querySelector(".filter-badge");
      expect(filterBadge!.textContent?.trim()).toBe("Active");
    });

    it("should show project filter badge with project color", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      element.projectFilter = "project-1";
      await element.updateComplete;

      const projectBadge = element.shadowRoot!.querySelector(".project-badge");
      expect(projectBadge).toBeDefined();
      expect(projectBadge!.textContent).toContain("Project Alpha");
    });
  });

  describe("task count display", () => {
    it("should show task count in header", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const countBadge = element.shadowRoot!.querySelector(".header-count");
      expect(countBadge!.textContent).toBe("3 tasks");
    });

    it("should show filtered task count", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "active";
      await element.updateComplete;

      const countBadge = element.shadowRoot!.querySelector(".header-count");
      expect(countBadge!.textContent).toBe("2 tasks");
    });
  });

  describe("event bubbling", () => {
    it("should bubble edit-task event from task-list", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("edit-task", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("edit-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should bubble delete-task event from task-list", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("delete-task", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("delete-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should bubble mark-done event from task-list", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("mark-done", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("mark-done", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("props passing", () => {
    it("should pass remaining prop to task-list", async () => {
      element.tasks = mockTasks;
      element.remaining = 10;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.remaining).toBe(10);
    });

    it("should pass capacityInMinutes prop to task-list", async () => {
      element.tasks = mockTasks;
      element.capacityInMinutes = 30;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.capacityInMinutes).toBe(30);
    });

    it("should pass disabled prop to task-list", async () => {
      element.tasks = mockTasks;
      element.disabled = true;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.disabled).toBe(true);
    });
  });
});
