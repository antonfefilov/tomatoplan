/**
 * Tests for TaskListPanel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/task-list-panel.js";
import type { TaskListPanel } from "../src/components/task/task-list-panel.js";
import type { Task } from "../src/models/task.js";

// Import dependent custom elements
import "../src/components/task/task-list.js";
import "../src/components/task/task-item.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/shared/dropdown-menu.js";
import "../src/components/shared/empty-state.js";

describe("TaskListPanel", () => {
  let element: TaskListPanel;

  beforeEach(async () => {
    element = document.createElement("task-list-panel") as TaskListPanel;
    element.tasks = [];
    element.remaining = 5;
    element.assigned = 0;
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
      expect(emptyTitle!.textContent).toBe("No tasks yet");

      const emptyDescription =
        element.shadowRoot!.querySelector(".empty-description");
      expect(emptyDescription!.textContent).toContain("Add your first task");
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

    it("should dispatch open-task-dialog from empty state button", async () => {
      element.tasks = [];
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("open-task-dialog", spy);

      const addFirstBtn = element.shadowRoot!.querySelector(
        ".empty-container .add-btn",
      ) as HTMLButtonElement;
      addFirstBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("task list rendering", () => {
    const mockTasks: Task[] = [
      {
        id: "task-1",
        title: "First Task",
        description: "Description 1",
        tomatoCount: 2,
        finishedTomatoCount: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "task-2",
        title: "Second Task",
        description: undefined,
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    it("should render task-list when tasks exist", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list");
      expect(taskList).toBeDefined();
    });

    it("should pass tasks prop to task-list", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.tasks).toEqual(mockTasks);
    });

    it("should pass remaining prop to task-list", async () => {
      element.tasks = mockTasks;
      element.remaining = 10;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.remaining).toBe(10);
    });

    it("should pass disabled prop to task-list", async () => {
      element.tasks = mockTasks;
      element.disabled = true;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.disabled).toBe(true);
    });

    it("should pass capacityInMinutes prop to task-list", async () => {
      element.tasks = mockTasks;
      element.capacityInMinutes = 30;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.capacityInMinutes).toBe(30);
    });

    it("should render task-list with tomato and timer UI visible", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.showTomatoUi).toBe(true);
      expect(taskList.showTimerUi).toBe(true);
    });

    it("should show task count in header when tasks exist", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;

      const countBadge = element.shadowRoot!.querySelector(".header-count");
      expect(countBadge!.textContent).toBe("2 tasks");
    });

    it("should not show task count badge when no tasks", async () => {
      element.tasks = [];
      await element.updateComplete;

      const countBadge = element.shadowRoot!.querySelector(".header-count");
      expect(countBadge).toBeNull();
    });

    it("should show assigned time display when tomatoes are assigned", async () => {
      element.tasks = mockTasks;
      element.assigned = 5;
      element.capacityInMinutes = 25;
      await element.updateComplete;

      const timeDisplay = element.shadowRoot!.querySelector(
        ".header-time-display",
      );
      expect(timeDisplay).toBeDefined();
      expect(timeDisplay!.textContent).toContain("2h 5m");
    });

    it("should not show time display when no tomatoes assigned", async () => {
      element.tasks = mockTasks;
      element.assigned = 0;
      await element.updateComplete;

      const timeDisplay = element.shadowRoot!.querySelector(
        ".header-time-display",
      );
      expect(timeDisplay).toBeNull();
    });
  });

  describe("event bubbling", () => {
    const mockTask: Task = {
      id: "task-1",
      title: "Test Task",
      description: "Description",
      tomatoCount: 2,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should bubble edit-task event from task-list", async () => {
      element.tasks = [mockTask];
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("edit-task", spy);

      // Get the task-list and dispatch edit-task from it
      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("edit-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should bubble delete-task event from task-list", async () => {
      element.tasks = [mockTask];
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
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should bubble mark-tomato-finished event from task-list", async () => {
      element.tasks = [mockTask];
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("mark-tomato-finished", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("mark-tomato-finished", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should bubble mark-tomato-unfinished event from task-list", async () => {
      element.tasks = [mockTask];
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("mark-tomato-unfinished", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("mark-tomato-unfinished", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should bubble reorder-task event from task-list", async () => {
      element.tasks = [mockTask];
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("reorder-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1", toIndex: 0 },
        }),
      );

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.detail.toIndex).toBe(0);
    });
  });

  describe("disabled state", () => {
    it("should pass disabled state to child task-list", async () => {
      element.tasks = [
        {
          id: "task-1",
          title: "Task",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];
      element.disabled = true;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.disabled).toBe(true);
    });
  });

  describe("showRemoveFromDay prop passthrough", () => {
    const mockTasksWithDayDate: Task[] = [
      {
        id: "task-1",
        title: "First Task",
        description: "Description 1",
        tomatoCount: 2,
        finishedTomatoCount: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: "2024-01-15",
      },
      {
        id: "task-2",
        title: "Second Task",
        description: undefined,
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: "2024-01-15",
      },
    ];

    it("should pass showRemoveFromDay prop to task-list when true", async () => {
      element.tasks = mockTasksWithDayDate;
      element.showRemoveFromDay = true;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.showRemoveFromDay).toBe(true);
    });

    it("should pass showRemoveFromDay prop to task-list when false", async () => {
      element.tasks = mockTasksWithDayDate;
      element.showRemoveFromDay = false;
      await element.updateComplete;

      const taskList = element.shadowRoot!.querySelector("task-list") as any;
      expect(taskList.showRemoveFromDay).toBe(false);
    });
  });

  describe("remove-from-day event bubbling", () => {
    const mockTaskWithDayDate: Task = {
      id: "task-1",
      title: "Test Task",
      description: "Description",
      tomatoCount: 2,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      dayDate: "2024-01-15",
    };

    it("should bubble remove-from-day event from task-list exactly once", async () => {
      element.tasks = [mockTaskWithDayDate];
      element.showRemoveFromDay = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-from-day", spy);

      // Get the task-list and dispatch remove-from-day from it
      const taskList = element.shadowRoot!.querySelector("task-list")!;
      taskList.dispatchEvent(
        new CustomEvent("remove-from-day", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });
});
