/**
 * Tests for TasksPoolPanel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/tasks-pool-panel.js";
import type { TasksPoolPanel } from "../src/components/task/tasks-pool-panel.js";
import type { Task } from "../src/models/task.js";
import type { Project } from "../src/models/project.js";

describe("TasksPoolPanel", () => {
  let element: TasksPoolPanel;

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
    element = document.createElement("tasks-pool-panel") as TasksPoolPanel;
    element.tasks = [];
    element.projects = [];
    element.statusFilter = "all";
    element.projectFilter = "all";
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("statistics display", () => {
    it("should show total task count", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const statValues = element.shadowRoot!.querySelectorAll(".stat-value");
      expect(statValues[0]!.textContent).toBe("3"); // Total
    });

    it("should show active task count", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const statValues = element.shadowRoot!.querySelectorAll(".stat-value");
      expect(statValues[1]!.textContent).toBe("2"); // Active (task-2, task-3)
    });

    it("should show done task count", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const statValues = element.shadowRoot!.querySelectorAll(".stat-value");
      expect(statValues[2]!.textContent).toBe("1"); // Done (task-1)
    });

    it("should update statistics when tasks change", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      let statValues = element.shadowRoot!.querySelectorAll(".stat-value");
      expect(statValues[0]!.textContent).toBe("3");

      // Add a new task
      element.tasks = [
        ...mockTasks,
        {
          id: "task-4",
          title: "Fourth Task",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      await element.updateComplete;

      statValues = element.shadowRoot!.querySelectorAll(".stat-value");
      expect(statValues[0]!.textContent).toBe("4");
    });
  });

  describe("status filter", () => {
    it("should render status filter buttons", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const filterButtons = element.shadowRoot!.querySelectorAll(".filter-btn");
      expect(filterButtons.length).toBe(3); // All, Active, Done
    });

    it("should highlight active status filter", async () => {
      element.tasks = mockTasks;
      element.statusFilter = "active";
      await element.updateComplete;

      const activeBtn = element.shadowRoot!.querySelector(".filter-btn.active");
      expect(activeBtn!.textContent).toContain("Active");
    });

    it("should dispatch status-filter-change event when filter clicked", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("status-filter-change", spy);

      const activeBtn = Array.from(
        element.shadowRoot!.querySelectorAll(".filter-btn"),
      ).find((btn) => btn.textContent?.includes("Active"));
      (activeBtn as HTMLElement).click();

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.filter).toBe("active");
    });
  });

  describe("project filter", () => {
    it("should render project filter select", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      await element.updateComplete;

      const select = element.shadowRoot!.querySelector(
        ".project-filter-select",
      );
      expect(select).toBeDefined();
    });

    it("should show 'All Projects' option", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      await element.updateComplete;

      const select = element.shadowRoot!.querySelector(
        ".project-filter-select",
      ) as HTMLSelectElement;
      expect(select.options[0]!.value).toBe("all");
      expect(select.options[0]!.textContent).toBe("All Projects");
    });

    it("should list all projects", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      await element.updateComplete;

      const select = element.shadowRoot!.querySelector(
        ".project-filter-select",
      ) as HTMLSelectElement;
      expect(select.options.length).toBe(3); // All + 2 projects
    });

    it("should dispatch project-filter-change event when selection changes", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("project-filter-change", spy);

      const select = element.shadowRoot!.querySelector(
        ".project-filter-select",
      ) as HTMLSelectElement;
      select.value = "project-1";
      select.dispatchEvent(new Event("change"));

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("project-1");
    });

    it("should pre-select current project filter", async () => {
      element.tasks = mockTasks;
      element.projects = mockProjects;
      element.projectFilter = "project-2";
      await element.updateComplete;

      const select = element.shadowRoot!.querySelector(
        ".project-filter-select",
      ) as HTMLSelectElement;
      expect(select.value).toBe("project-2");
    });
  });

  describe("summary section", () => {
    it("should show total tomatoes", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const summaryValues =
        element.shadowRoot!.querySelectorAll(".summary-value");
      expect(summaryValues[0]!.textContent).toContain("6"); // 2+3+1
    });

    it("should show finished tomatoes", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const summaryValues =
        element.shadowRoot!.querySelectorAll(".summary-value");
      expect(summaryValues[1]!.textContent).toContain("2"); // 2+0+0
    });

    it("should show completion percentage", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const summaryValues =
        element.shadowRoot!.querySelectorAll(".summary-value");
      // 2 finished / 6 total = 33%
      expect(summaryValues[2]!.textContent?.trim()).toBe("33%");
    });

    it("should show 0% when no tomatoes", async () => {
      element.tasks = [
        {
          id: "task-1",
          title: "No tomatoes",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      await element.updateComplete;

      const summaryValues =
        element.shadowRoot!.querySelectorAll(".summary-value");
      expect(summaryValues[2]!.textContent?.trim()).toBe("0%");
    });
  });

  describe("collapse functionality", () => {
    it("should dispatch toggle-collapse event when button clicked", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("toggle-collapse", spy);

      const toggleBtn = element.shadowRoot!.querySelector(
        ".toggle-btn",
      ) as HTMLButtonElement;
      toggleBtn.click();

      expect(spy).toHaveBeenCalled();
    });

    it("should reflect collapsed attribute", async () => {
      element.tasks = mockTasks;
      element.collapsed = true;
      await element.updateComplete;

      expect(element.hasAttribute("collapsed")).toBe(true);
    });
  });
});
