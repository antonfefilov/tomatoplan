/**
 * Tests for TaskItem component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/task-item.js";
import type { TaskItem } from "../src/components/task/task-item.js";
import type { Task } from "../src/models/task.js";

// Import dependent custom elements
import "../src/components/tomato/tomato-icon.js";
import "../src/components/shared/dropdown-menu.js";

describe("TaskItem", () => {
  let element: TaskItem;
  let mockTask: Task;

  beforeEach(async () => {
    mockTask = {
      id: "task-1",
      title: "Test Task",
      description: "Test description",
      tomatoCount: 3,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    element = document.createElement("task-item") as TaskItem;
    element.task = mockTask;
    element.remaining = 5;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("should render task title", () => {
    const title = element.shadowRoot!.querySelector(".task-title");
    expect(title!.textContent).toBe("Test Task");
  });

  it("should render task description", () => {
    const description = element.shadowRoot!.querySelector(".task-description");
    expect(description!.textContent).toContain("Test description");
  });

  it("should render tomato count", () => {
    const countSpan = element.shadowRoot!.querySelector(
      ".tomato-control-wrapper span",
    );
    expect(countSpan!.textContent).toBe("3");
  });

  it("should render finished tomato count", () => {
    const finishedControl = element.shadowRoot!.querySelector(
      ".finished-control-wrapper",
    );
    const countSpan = finishedControl!.querySelectorAll("span")[1];
    expect(countSpan!.textContent).toBe("1");
  });

  it("should show progress bar when tomatoes assigned", () => {
    const progressBar = element.shadowRoot!.querySelector(".progress-bar");
    expect(progressBar).toBeDefined();

    const progressFill = element.shadowRoot!.querySelector(
      ".progress-fill",
    ) as HTMLElement;
    expect(progressFill.style.width).toBe("33.33333333333333%"); // 1/3 * 100
  });

  it("should dispatch add-tomato event", async () => {
    const spy = vi.fn();
    element.addEventListener("add-tomato", spy);

    const addBtn = element.shadowRoot!.querySelector(
      ".btn-add:not(.finished)",
    ) as HTMLButtonElement;
    addBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should dispatch remove-tomato event", async () => {
    const spy = vi.fn();
    element.addEventListener("remove-tomato", spy);

    const removeBtn = element.shadowRoot!.querySelector(
      ".btn-remove:not(.finished)",
    ) as HTMLButtonElement;
    removeBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should dispatch mark-tomato-finished event", async () => {
    const spy = vi.fn();
    element.addEventListener("mark-tomato-finished", spy);

    const addFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-add.finished",
    ) as HTMLButtonElement;
    addFinishedBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should dispatch mark-tomato-unfinished event", async () => {
    const spy = vi.fn();
    element.addEventListener("mark-tomato-unfinished", spy);

    const removeFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-remove.finished",
    ) as HTMLButtonElement;
    removeFinishedBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should dispatch edit-task event", async () => {
    const spy = vi.fn();
    element.addEventListener("edit-task", spy);

    const editBtn = element.shadowRoot!.querySelector(
      ".menu-item:not(.danger)",
    ) as HTMLButtonElement;
    editBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should dispatch delete-task event", async () => {
    const spy = vi.fn();
    element.addEventListener("delete-task", spy);

    const deleteBtn = element.shadowRoot!.querySelector(
      ".menu-item.danger",
    ) as HTMLButtonElement;
    deleteBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
  });

  it("should disable add tomato button when no remaining", async () => {
    element.remaining = 0;
    await element.updateComplete;

    const addBtn = element.shadowRoot!.querySelector(
      ".btn-add:not(.finished)",
    ) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it("should disable remove tomato button when count is zero", async () => {
    element.task = { ...mockTask, tomatoCount: 0 };
    await element.updateComplete;

    const removeBtn = element.shadowRoot!.querySelector(
      ".btn-remove:not(.finished)",
    ) as HTMLButtonElement;
    expect(removeBtn.disabled).toBe(true);
  });

  it("should disable mark finished button when all tomatoes finished", async () => {
    element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 3 };
    await element.updateComplete;

    const addFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-add.finished",
    ) as HTMLButtonElement;
    expect(addFinishedBtn.disabled).toBe(true);
  });

  it("should disable mark unfinished button when no finished tomatoes", async () => {
    element.task = { ...mockTask, finishedTomatoCount: 0 };
    await element.updateComplete;

    const removeFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-remove.finished",
    ) as HTMLButtonElement;
    expect(removeFinishedBtn.disabled).toBe(true);
  });

  it("should disable tomato control buttons when disabled prop is true", async () => {
    element.disabled = true;
    await element.updateComplete;

    // Check the main control buttons (not dropdown menu buttons)
    const removeBtn = element.shadowRoot!.querySelector(
      ".btn-remove:not(.finished)",
    ) as HTMLButtonElement;
    const addBtn = element.shadowRoot!.querySelector(
      ".btn-add:not(.finished)",
    ) as HTMLButtonElement;
    const removeFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-remove.finished",
    ) as HTMLButtonElement;
    const addFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-add.finished",
    ) as HTMLButtonElement;

    expect(removeBtn.disabled).toBe(true);
    expect(addBtn.disabled).toBe(true);
    expect(removeFinishedBtn.disabled).toBe(true);
    expect(addFinishedBtn.disabled).toBe(true);
  });

  it("should not render description when not provided", async () => {
    element.task = { ...mockTask, description: undefined };
    await element.updateComplete;

    const description = element.shadowRoot!.querySelector(".task-description");
    expect(description).toBeNull();
  });

  it("should truncate long description", async () => {
    const longDesc = "a".repeat(150);
    element.task = { ...mockTask, description: longDesc };
    await element.updateComplete;

    const description = element.shadowRoot!.querySelector(".task-description");
    // The description should be truncated, not showing the full 150 characters
    const renderedText = description!.textContent!;
    // Either truncated with ... or using CSS line-clamp
    expect(renderedText.length).toBeLessThan(longDesc.length);
  });

  it("should show time estimation", async () => {
    element.task = { ...mockTask, tomatoCount: 2 };
    element.capacityInMinutes = 25;
    await element.updateComplete;

    const estimation = element.shadowRoot!.querySelector(".task-estimation");
    expect(estimation!.textContent).toBe("50m");
  });

  it("should update display when task changes", async () => {
    element.task = { ...mockTask, tomatoCount: 5, title: "Updated Task" };
    await element.updateComplete;

    const title = element.shadowRoot!.querySelector(".task-title");
    expect(title!.textContent).toBe("Updated Task");

    const countSpan = element.shadowRoot!.querySelector(
      ".tomato-control-wrapper span",
    );
    expect(countSpan!.textContent).toBe("5");
  });

  it("should show controls-label when no tomatoes assigned", async () => {
    element.task = { ...mockTask, tomatoCount: 0 };
    await element.updateComplete;

    const controlsLabel = element.shadowRoot!.querySelector(".controls-label");
    expect(controlsLabel).toBeDefined();
    expect(controlsLabel!.textContent).toBe("done");
  });
});
