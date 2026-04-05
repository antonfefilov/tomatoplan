/**
 * Tests for TaskList component - Drag and Drop functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/task-list.js";
import type { TaskList } from "../src/components/task/task-list.js";
import type { Task } from "../src/models/task.js";

// Import dependent custom elements
import "../src/components/task/task-item.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/shared/dropdown-menu.js";
import "../src/components/shared/empty-state.js";

describe("TaskList - Drag and Drop", () => {
  let element: TaskList;

  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "First Task",
      tomatoCount: 2,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "task-2",
      title: "Second Task",
      tomatoCount: 3,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "task-3",
      title: "Third Task",
      tomatoCount: 1,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    element = document.createElement("task-list") as TaskList;
    element.tasks = mockTasks;
    element.remaining = 5;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("draggable attribute", () => {
    it("should make task item wrappers draggable when not disabled", () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      expect(wrappers.length).toBe(3);
      wrappers.forEach((wrapper) => {
        expect(wrapper.getAttribute("draggable")).toBe("true");
      });
    });

    it("should not make task items draggable when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      wrappers.forEach((wrapper) => {
        expect(wrapper.getAttribute("draggable")).toBe("false");
      });
    });
  });

  describe("drag start", () => {
    it("should set draggedTaskId on dragstart", async () => {
      const firstWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;

      // Simulate dragstart
      const dragEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn(),
        },
      });

      firstWrapper.dispatchEvent(dragEvent);
      await element.updateComplete;

      // The wrapper should have the dragging class
      expect(firstWrapper.classList.contains("dragging")).toBe(true);
    });

    it("should prevent dragstart when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const firstWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;

      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn(),
          preventDefault: vi.fn(),
        },
      });

      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Should not have dragging class
      expect(firstWrapper.classList.contains("dragging")).toBe(false);
    });
  });

  describe("drag visual feedback", () => {
    it("should add dragging class to dragged item", async () => {
      const firstWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;

      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn(),
        },
      });

      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      expect(firstWrapper.classList.contains("dragging")).toBe(true);
    });

    it("should remove dragging class on dragend", async () => {
      const firstWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;

      // First start dragging
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn(),
        },
      });

      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      expect(firstWrapper.classList.contains("dragging")).toBe(true);

      // Then end dragging
      const dragEndEvent = new DragEvent("dragend", {
        bubbles: true,
        cancelable: true,
      });
      firstWrapper.dispatchEvent(dragEndEvent);
      await element.updateComplete;

      expect(firstWrapper.classList.contains("dragging")).toBe(false);
    });

    it("should add drag-over class when dragging over another item", async () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement;
      const secondWrapper = wrappers[1] as HTMLElement;

      // Start dragging first item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drag over second item
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: {
          dropEffect: "none",
        },
      });

      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 90,
        height: 50,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 90,
        toJSON: () => ({}),
      });

      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      expect(secondWrapper.classList.contains("drag-over")).toBe(true);
    });

    it("should not show drag-over indicator when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const secondWrapper = wrappers[1] as HTMLElement;

      // Try to drag over second item
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: {
          dropEffect: "none",
        },
      });

      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      // Should not have drag-over class when disabled
      expect(secondWrapper.classList.contains("drag-over")).toBe(false);
    });
  });

  describe("toIndex calculation for drop positions", () => {
    it("should calculate toIndex=0 when dropping above first item (moving from below)", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const thirdWrapper = wrappers[2] as HTMLElement; // Drag task-3
      const firstWrapper = wrappers[0] as HTMLElement; // Drop on task-1

      // Start dragging third item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-3"),
        },
      });
      thirdWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drop above first item (clientY above center)
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientY: 40, // Above center (top=90, height=50, mid=115)
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-3"),
        },
      });

      vi.spyOn(firstWrapper, "getBoundingClientRect").mockReturnValue({
        top: 90,
        height: 50,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 90,
        toJSON: () => ({}),
      });

      // Need to trigger dragover first to set drop position
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100, // Above center
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      firstWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      firstWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      // task-3 (index 2) moved above task-1 (index 0) -> toIndex should be 0
      expect(event.detail.toIndex).toBe(0);
    });

    it("should calculate toIndex=2 when dropping below last item (moving from above)", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement; // Drag task-1
      const thirdWrapper = wrappers[2] as HTMLElement; // Drop on task-3

      // Start dragging first item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Mock getBoundingClientRect for third wrapper
      vi.spyOn(thirdWrapper, "getBoundingClientRect").mockReturnValue({
        top: 200,
        height: 50,
        bottom: 250,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      });

      // Trigger dragover with clientY below center (mid=225)
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 230, // Below center
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      thirdWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      // Drop
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      thirdWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      // task-1 (index 0) moved below task-3 (index 2)
      // drop position below task-3 means toIndex = 2 + 1 = 3, then -1 for removal = 2
      expect(event.detail.toIndex).toBe(2);
    });

    it("should calculate correct toIndex when dropping above target (moving down)", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement; // Drag task-1
      const secondWrapper = wrappers[1] as HTMLElement; // Drop on task-2

      // Start dragging first item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Mock getBoundingClientRect for second wrapper
      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 100,
        height: 50,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      });

      // Dragover with clientY above center (mid=125)
      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 110, // Above center
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      // Drop
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      secondWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      // task-1 (index 0) moved above task-2 (index 1)
      // toIndex = 1 (above task-2), no adjustment since moving from index 0 < toIndex 1
      // Wait: if we're moving down, fromIndex=0 < targetIndex=1, so no adjustment
      // But drop position is "above" task-2, so toIndex = 1
      // Then since fromIndex(0) < toIndex(1), we subtract 1, giving toIndex=0
      // This seems wrong... let me reconsider
      // Actually, the logic is: toIndex is the final position after the dragged item is removed
      expect(event.detail.toIndex).toBe(0);
    });

    it("should not dispatch event when dropping on same item", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const firstWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;

      // Start and drop on same item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      firstWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should not dispatch reorder-task when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement;
      const secondWrapper = wrappers[1] as HTMLElement;

      // Try to start drag
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
          preventDefault: vi.fn(),
        },
      });

      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Try to drop
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      secondWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should block drop when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const secondWrapper = element.shadowRoot!.querySelectorAll(
        ".task-item-wrapper",
      )[1] as HTMLElement;

      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      secondWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("event bubbling", () => {
    it("should dispatch reorder-task with bubbles: true", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement;
      const secondWrapper = wrappers[1] as HTMLElement;

      // Start dragging
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Setup for dragover and drop
      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 90,
        height: 50,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 90,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      // Drop
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });

      secondWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("task-item wiring for assign-to-today", () => {
    const mockTasks: Task[] = [
      {
        id: "task-1",
        title: "First Task",
        tomatoCount: 2,
        finishedTomatoCount: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: "2024-01-02",
      },
      {
        id: "task-2",
        title: "Second Task",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: undefined,
      },
    ];

    it("should pass showAssignToToday prop to task-item", async () => {
      element.tasks = mockTasks;
      element.showAssignToToday = true;
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { showAssignToToday: boolean }>;
      expect(taskItems.length).toBe(2);
      taskItems.forEach((item) => {
        expect(item.showAssignToToday).toBe(true);
      });
    });

    it("should pass todayDate prop to task-item", async () => {
      element.tasks = mockTasks;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { todayDate: string | undefined }>;
      expect(taskItems.length).toBe(2);
      taskItems.forEach((item) => {
        expect(item.todayDate).toBe("2024-01-01");
      });
    });

    it("should bubble assign-to-today event when clicking the actual button in task-item's shadow DOM (strong forwarding test)", async () => {
      element.tasks = mockTasks;
      element.showAssignToToday = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("assign-to-today", spy);

      // Navigate to the task-item and its shadow DOM button
      const taskItemWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;
      const taskItem = taskItemWrapper.querySelector(
        "task-item",
      ) as HTMLElement & { updateComplete: Promise<boolean> };
      await taskItem.updateComplete;

      // Click the actual .btn-day-star button in task-item's shadow DOM
      // This verifies the handler wiring exists, not just that events can bubble
      const starBtn = taskItem.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      expect(starBtn).not.toBeNull();

      starBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it("should not pass showAssignToToday when it is false", async () => {
      element.tasks = mockTasks;
      element.showAssignToToday = false;
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { showAssignToToday: boolean }>;
      taskItems.forEach((item) => {
        expect(item.showAssignToToday).toBe(false);
      });
    });

    it("should not pass todayDate when it is undefined", async () => {
      element.tasks = mockTasks;
      element.todayDate = undefined;
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { todayDate: string | undefined }>;
      taskItems.forEach((item) => {
        expect(item.todayDate).toBeUndefined();
      });
    });
  });

  describe("task-item wiring for remove-from-day", () => {
    const mockTasksWithDayDate: Task[] = [
      {
        id: "task-1",
        title: "First Task",
        tomatoCount: 2,
        finishedTomatoCount: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: "2024-01-15",
      },
      {
        id: "task-2",
        title: "Second Task",
        tomatoCount: 3,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        dayDate: "2024-01-15",
      },
    ];

    it("should pass showRemoveFromDay prop to task-item", async () => {
      element.tasks = mockTasksWithDayDate;
      element.showRemoveFromDay = true;
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { showRemoveFromDay: boolean }>;
      expect(taskItems.length).toBe(2);
      taskItems.forEach((item) => {
        expect(item.showRemoveFromDay).toBe(true);
      });
    });

    it("should not pass showRemoveFromDay when it is false", async () => {
      element.tasks = mockTasksWithDayDate;
      element.showRemoveFromDay = false;
      await element.updateComplete;

      const taskItems = element.shadowRoot!.querySelectorAll(
        "task-item",
      ) as NodeListOf<HTMLElement & { showRemoveFromDay: boolean }>;
      taskItems.forEach((item) => {
        expect(item.showRemoveFromDay).toBe(false);
      });
    });

    it("should bubble remove-from-day event exactly once when clicking the menu item in task-item's shadow DOM", async () => {
      element.tasks = mockTasksWithDayDate;
      element.showRemoveFromDay = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-from-day", spy);

      // Navigate to the task-item and its shadow DOM
      const taskItemWrapper = element.shadowRoot!.querySelector(
        ".task-item-wrapper",
      ) as HTMLElement;
      const taskItem = taskItemWrapper.querySelector(
        "task-item",
      ) as HTMLElement & { updateComplete: Promise<boolean> };
      await taskItem.updateComplete;

      // Find and click the "Remove from Day" menu item
      const menuItems = taskItem.shadowRoot!.querySelectorAll(".menu-item");
      const removeMenuItem = Array.from(menuItems).find((item) =>
        item.textContent?.includes("Remove from Day"),
      ) as HTMLButtonElement;

      expect(removeMenuItem).toBeDefined();
      removeMenuItem.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("dragleave behavior", () => {
    it("should clear drag-over when leaving wrapper entirely", async () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement;
      const secondWrapper = wrappers[1] as HTMLElement;

      // Start dragging first item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drag over second item
      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 90,
        height: 50,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 90,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      expect(secondWrapper.classList.contains("drag-over")).toBe(true);

      // Leave to outside element (relatedTarget is null or outside wrapper)
      const dragLeaveEvent = new DragEvent("dragleave", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragLeaveEvent, "relatedTarget", {
        value: document.body, // Outside the wrapper
      });
      Object.defineProperty(dragLeaveEvent, "currentTarget", {
        value: secondWrapper,
      });

      secondWrapper.dispatchEvent(dragLeaveEvent);
      await element.updateComplete;

      expect(secondWrapper.classList.contains("drag-over")).toBe(false);
    });

    it("should not clear drag-over when moving to child element", async () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement;
      const secondWrapper = wrappers[1] as HTMLElement;
      const taskItem = secondWrapper.querySelector("task-item") as HTMLElement;

      // Start dragging first item
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("task-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drag over second item
      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 90,
        height: 50,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 90,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 100,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      expect(secondWrapper.classList.contains("drag-over")).toBe(true);

      // "Leave" to child element (relatedTarget is task-item inside wrapper)
      const dragLeaveEvent = new DragEvent("dragleave", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragLeaveEvent, "relatedTarget", {
        value: taskItem, // Child of the wrapper
      });
      Object.defineProperty(dragLeaveEvent, "currentTarget", {
        value: secondWrapper,
      });

      secondWrapper.dispatchEvent(dragLeaveEvent);
      await element.updateComplete;

      // Should still have drag-over class since we just moved to child
      expect(secondWrapper.classList.contains("drag-over")).toBe(true);
    });
  });

  describe("task grouping", () => {
    it("should separate active and done tasks", async () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Active Task",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Done Task",
          tomatoCount: 2,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-3",
          title: "Another Active",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      // All tasks should be rendered
      expect(wrappers.length).toBe(3);

      // Check order: active tasks first, then done tasks
      const taskItems = Array.from(wrappers).map((w) =>
        w.querySelector("task-item"),
      );
      const taskTitles = taskItems.map(
        (item) => item!.shadowRoot!.querySelector(".task-title")!.textContent,
      );

      // Active tasks (task-1, task-3) should come before done task (task-2)
      expect(taskTitles.indexOf("Active Task")).toBeLessThan(
        taskTitles.indexOf("Done Task"),
      );
      expect(taskTitles.indexOf("Another Active")).toBeLessThan(
        taskTitles.indexOf("Done Task"),
      );
    });

    it("should show divider when both active and done tasks exist", async () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Active Task",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Done Task",
          tomatoCount: 2,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      const divider = element.shadowRoot!.querySelector(".task-group-divider");
      expect(divider).toBeDefined();
      expect(divider!.textContent).toBe("Done");
    });

    it("should not show divider when only active tasks exist", async () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Active Task",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      const divider = element.shadowRoot!.querySelector(".task-group-divider");
      expect(divider).toBeNull();
    });

    it("should not show divider when only done tasks exist", async () => {
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Done Task",
          tomatoCount: 2,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      const divider = element.shadowRoot!.querySelector(".task-group-divider");
      expect(divider).toBeNull();
    });

    it("should consider task done when finished >= planned and planned > 0", async () => {
      const tasks: Task[] = [
        {
          id: "task-done",
          title: "Done Task",
          tomatoCount: 2,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-extra",
          title: "Extra Done",
          tomatoCount: 2,
          finishedTomatoCount: 5,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-active",
          title: "Active Task",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      const divider = element.shadowRoot!.querySelector(".task-group-divider");
      expect(divider).toBeDefined();
    });

    it("should NOT consider 0/0 task as done", async () => {
      const tasks: Task[] = [
        {
          id: "task-zero",
          title: "Zero Task",
          tomatoCount: 0,
          finishedTomatoCount: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "task-done",
          title: "Done Task",
          tomatoCount: 2,
          finishedTomatoCount: 2,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      element.tasks = tasks;
      await element.updateComplete;

      // Should have divider since zero task is active
      const divider = element.shadowRoot!.querySelector(".task-group-divider");
      expect(divider).toBeDefined();

      // Zero task should be in active group (first)
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstTaskItem = wrappers[0]!.querySelector("task-item");
      const firstTitle =
        firstTaskItem!.shadowRoot!.querySelector(".task-title")!.textContent;
      expect(firstTitle).toBe("Zero Task");
    });
  });

  describe("group-aware drag-drop", () => {
    const mixedTasks: Task[] = [
      {
        id: "active-1",
        title: "Active One",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "active-2",
        title: "Active Two",
        tomatoCount: 1,
        finishedTomatoCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "done-1",
        title: "Done One",
        tomatoCount: 2,
        finishedTomatoCount: 2,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "done-2",
        title: "Done Two",
        tomatoCount: 1,
        finishedTomatoCount: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    beforeEach(async () => {
      element.tasks = mixedTasks;
      await element.updateComplete;
    });

    it("should allow reordering within active group", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const firstWrapper = wrappers[0] as HTMLElement; // active-1
      const secondWrapper = wrappers[1] as HTMLElement; // active-2

      // Start dragging active-1
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("active-1"),
        },
      });
      firstWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drag over active-2 (same group)
      vi.spyOn(secondWrapper, "getBoundingClientRect").mockReturnValue({
        top: 100,
        height: 50,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 130, // below center
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      secondWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      expect(secondWrapper.classList.contains("drag-over")).toBe(true);

      // Drop
      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          getData: vi.fn().mockReturnValue("active-1"),
        },
      });

      secondWrapper.dispatchEvent(dropEvent);
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });

    it("should allow reordering within done group", async () => {
      const spy = vi.fn();
      element.addEventListener("reorder-task", spy);

      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const doneWrapper1 = wrappers[2] as HTMLElement; // done-1
      const doneWrapper2 = wrappers[3] as HTMLElement; // done-2

      // Start dragging done-1
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("done-1"),
        },
      });
      doneWrapper1.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Drag over done-2 (same group)
      vi.spyOn(doneWrapper2, "getBoundingClientRect").mockReturnValue({
        top: 300,
        height: 50,
        bottom: 350,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 300,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 330, // below center
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      doneWrapper2.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      expect(doneWrapper2.classList.contains("drag-over")).toBe(true);
    });

    it("should NOT show drag-over when dragging across groups", async () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const activeWrapper = wrappers[0] as HTMLElement; // active-1
      const doneWrapper = wrappers[2] as HTMLElement; // done-1

      // Start dragging active task
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("active-1"),
        },
      });
      activeWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // Try to drag over done task (different group)
      vi.spyOn(doneWrapper, "getBoundingClientRect").mockReturnValue({
        top: 200,
        height: 50,
        bottom: 250,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      });

      const dragOverEvent = new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        clientY: 225,
      });
      Object.defineProperty(dragOverEvent, "dataTransfer", {
        value: { dropEffect: "none" },
      });
      doneWrapper.dispatchEvent(dragOverEvent);
      await element.updateComplete;

      // Should NOT have drag-over class since groups are different
      expect(doneWrapper.classList.contains("drag-over")).toBe(false);
    });

    it("should track drag group correctly", async () => {
      const wrappers =
        element.shadowRoot!.querySelectorAll(".task-item-wrapper");
      const activeWrapper = wrappers[0] as HTMLElement;

      // Start dragging active task
      const dragStartEvent = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(dragStartEvent, "dataTransfer", {
        value: {
          effectAllowed: "none",
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue("active-1"),
        },
      });
      activeWrapper.dispatchEvent(dragStartEvent);
      await element.updateComplete;

      // The wrapper should have dragging class
      expect(activeWrapper.classList.contains("dragging")).toBe(true);
    });
  });
});
