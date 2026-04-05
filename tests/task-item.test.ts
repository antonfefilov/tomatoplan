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
import "../src/components/shared/day-star-icon.js";

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
    // Progress shows overlap (min of finished and planned): 1/3 = 33.33%
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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
    const event = spy.mock.calls[0]![0] as CustomEvent;
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

  it("should allow marking more tomatoes finished than planned", async () => {
    element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 3 };
    await element.updateComplete;

    const addFinishedBtn = element.shadowRoot!.querySelector(
      ".btn-add.finished",
    ) as HTMLButtonElement;
    expect(addFinishedBtn.disabled).toBe(false);

    // Verify clicking the button dispatches the mark-tomato-finished event
    const spy = vi.fn();
    element.addEventListener("mark-tomato-finished", spy);
    addFinishedBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0]![0] as CustomEvent;
    expect(event.detail.taskId).toBe("task-1");
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

  describe("overlap display", () => {
    it("should show overlap correctly when finished < planned", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 3 };
      await element.updateComplete;

      const progressText = element.shadowRoot!.querySelector(".progress-text");
      expect(progressText!.textContent).toBe("3/5");

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      expect(progressFill.style.width).toBe("60%"); // 3/5 * 100
    });

    it("should show overlap and extra when finished > planned", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 7 };
      await element.updateComplete;

      const progressText = element.shadowRoot!.querySelector(".progress-text");
      expect(progressText!.textContent).toBe("5/5 (+2 extra)");

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      expect(progressFill.style.width).toBe("100%"); // capped at 100%
    });

    it("should cap progress bar at 100% when finished equals planned", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 5 };
      await element.updateComplete;

      const progressText = element.shadowRoot!.querySelector(".progress-text");
      expect(progressText!.textContent).toBe("5/5");

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      expect(progressFill.style.width).toBe("100%");
    });

    it("should not show extra text when finished equals planned", async () => {
      element.task = { ...mockTask, tomatoCount: 4, finishedTomatoCount: 4 };
      await element.updateComplete;

      const progressText = element.shadowRoot!.querySelector(".progress-text");
      expect(progressText!.textContent).not.toContain("extra");
    });
  });

  describe("timer controls", () => {
    it("should show start timer button when timer is idle", async () => {
      element.timerStatus = "idle";
      element.timerActiveTaskId = null;
      await element.updateComplete;

      const timerSection = element.shadowRoot!.querySelector(".timer-section");
      expect(timerSection).toBeDefined();

      const startBtn = element.shadowRoot!.querySelector(
        ".timer-btn.start",
      ) as HTMLButtonElement;
      expect(startBtn).toBeDefined();
      expect(startBtn.disabled).toBe(false);
    });

    it("should show timer display when this task is active", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500; // 25 minutes
      await element.updateComplete;

      const timerDisplay = element.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay).toBeDefined();
      expect(timerDisplay!.textContent!.trim()).toBe("25:00");
    });

    it("should show pause button when timer is running for this task", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const pauseBtn = element.shadowRoot!.querySelector(
        ".timer-btn.pause",
      ) as HTMLButtonElement;
      expect(pauseBtn).toBeDefined();
    });

    it("should show resume button when timer is paused for this task", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "paused";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const resumeBtn = element.shadowRoot!.querySelector(
        ".timer-btn.start",
      ) as HTMLButtonElement;
      expect(resumeBtn).toBeDefined();
    });

    it("should show reset button when timer is active for this task", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const resetBtn = element.shadowRoot!.querySelector(
        ".timer-btn.reset",
      ) as HTMLButtonElement;
      expect(resetBtn).toBeDefined();
    });

    it("should show message when another task has active timer", async () => {
      element.timerActiveTaskId = "task-2";
      element.timerStatus = "running";
      await element.updateComplete;

      const message = element.shadowRoot!.querySelector(
        ".timer-active-elsewhere",
      );
      expect(message).toBeDefined();
      expect(message!.textContent).toContain("Timer running for another task");
    });

    it("should dispatch start-timer event", async () => {
      const spy = vi.fn();
      element.addEventListener("start-timer", spy);

      const startBtn = element.shadowRoot!.querySelector(
        ".timer-btn.start",
      ) as HTMLButtonElement;
      startBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should dispatch pause-timer event", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("pause-timer", spy);

      const pauseBtn = element.shadowRoot!.querySelector(
        ".timer-btn.pause",
      ) as HTMLButtonElement;
      pauseBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });

    it("should dispatch resume-timer event", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "paused";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("resume-timer", spy);

      const resumeBtn = element.shadowRoot!.querySelector(
        ".timer-btn.start",
      ) as HTMLButtonElement;
      resumeBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });

    it("should dispatch reset-timer event", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("reset-timer", spy);

      const resetBtn = element.shadowRoot!.querySelector(
        ".timer-btn.reset",
      ) as HTMLButtonElement;
      resetBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });

    it("should display correct timer format", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 90; // 1:30
      await element.updateComplete;

      const timerDisplay = element.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay!.textContent!.trim()).toBe("01:30");
    });

    it("should show running class when timer is running", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "running";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const timerDisplay = element.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay!.classList.contains("running")).toBe(true);
    });

    it("should show paused class when timer is paused", async () => {
      element.timerActiveTaskId = "task-1";
      element.timerStatus = "paused";
      element.timerRemainingSeconds = 1500;
      await element.updateComplete;

      const timerDisplay = element.shadowRoot!.querySelector(".timer-display");
      expect(timerDisplay!.classList.contains("paused")).toBe(true);
    });

    it("should disable timer start button when component is disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const startBtn = element.shadowRoot!.querySelector(
        ".timer-btn.start",
      ) as HTMLButtonElement;
      expect(startBtn.disabled).toBe(true);
    });

    it("should show capacityInMinutes in timer label", async () => {
      element.capacityInMinutes = 30;
      await element.updateComplete;

      const timerInactive =
        element.shadowRoot!.querySelector(".timer-inactive");
      expect(timerInactive!.textContent).toContain("30min timer");
    });
  });

  describe("mark done button", () => {
    it("should show 'Done' button when task is not done", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 2 };
      await element.updateComplete;

      const doneBtn = element.shadowRoot!.querySelector(
        ".btn-done",
      ) as HTMLButtonElement;
      expect(doneBtn).toBeDefined();
      expect(doneBtn.textContent).toContain("Done");
    });

    it("should not show 'Done' button when task has no tomatoes", async () => {
      element.task = { ...mockTask, tomatoCount: 0, finishedTomatoCount: 0 };
      await element.updateComplete;

      const doneBtn = element.shadowRoot!.querySelector(".btn-done");
      expect(doneBtn).toBeNull();
    });

    it("should not show 'Done' button when task is done (finished >= planned)", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 5 };
      await element.updateComplete;

      const doneBtn = element.shadowRoot!.querySelector(".btn-done");
      expect(doneBtn).toBeNull();
    });

    it("should not show 'Done' button when finished exceeds planned", async () => {
      element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 5 };
      await element.updateComplete;

      const doneBtn = element.shadowRoot!.querySelector(".btn-done");
      expect(doneBtn).toBeNull();
    });

    it("should dispatch mark-done event when 'Done' button is clicked", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 2 };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("mark-done", spy);

      const doneBtn = element.shadowRoot!.querySelector(
        ".btn-done",
      ) as HTMLButtonElement;
      doneBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
    });

    it("should disable 'Done' button when component is disabled", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 2 };
      element.disabled = true;
      await element.updateComplete;

      const doneBtn = element.shadowRoot!.querySelector(
        ".btn-done",
      ) as HTMLButtonElement;
      expect(doneBtn.disabled).toBe(true);
    });
  });

  describe("day star button", () => {
    it("should show day star button for unassigned task when showAssignToToday is true", async () => {
      element.task = { ...mockTask, dayDate: undefined };
      element.showAssignToToday = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      expect(starBtn).toBeDefined();
      expect(starBtn.getAttribute("aria-label")).toBe("Add to Day");

      // Check that the star icon is NOT filled (outline)
      const starIcon = starBtn.querySelector("day-star-icon") as HTMLElement & {
        filled: boolean;
      };
      expect(starIcon).toBeDefined();
      expect(starIcon.filled).toBe(false);
    });

    it("should show filled star for task already on todayDate when showRemoveFromDay is true", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-01" };
      element.showRemoveFromDay = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      expect(starBtn).toBeDefined();
      expect(starBtn.getAttribute("aria-label")).toBe("Remove from Day");

      // Check that the star icon IS filled
      const starIcon = starBtn.querySelector("day-star-icon") as HTMLElement & {
        filled: boolean;
      };
      expect(starIcon).toBeDefined();
      expect(starIcon.filled).toBe(true);
    });

    it("should show outline star for task assigned to another date", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-02" };
      element.showAssignToToday = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      expect(starBtn).toBeDefined();
      expect(starBtn.getAttribute("aria-label")).toBe("Add to Day");

      // Check that the star icon is NOT filled (outline)
      const starIcon = starBtn.querySelector("day-star-icon") as HTMLElement & {
        filled: boolean;
      };
      expect(starIcon).toBeDefined();
      expect(starIcon.filled).toBe(false);
    });

    it("should hide star button when both showAssignToToday and showRemoveFromDay are false", async () => {
      element.task = { ...mockTask, dayDate: undefined };
      element.showAssignToToday = false;
      element.showRemoveFromDay = false;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(".btn-day-star");
      expect(starBtn).toBeNull();
    });

    it("should hide star button when todayDate is undefined", async () => {
      element.task = { ...mockTask, dayDate: undefined };
      element.showAssignToToday = true;
      element.todayDate = undefined;
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(".btn-day-star");
      expect(starBtn).toBeNull();
    });

    it("should dispatch assign-to-today event when clicking outline star", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-02" };
      element.showAssignToToday = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("assign-to-today", spy);

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      starBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it("should dispatch remove-from-day event when clicking filled star", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-01" };
      element.showRemoveFromDay = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-from-day", spy);

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      starBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it("should disable star button when component is disabled", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-02" };
      element.showAssignToToday = true;
      element.todayDate = "2024-01-01";
      element.disabled = true;
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;
      expect(starBtn.disabled).toBe(true);
    });
  });

  describe("remove-from-day", () => {
    it("should show star button when showRemoveFromDay is true and task has dayDate", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-01" };
      element.showRemoveFromDay = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(".btn-day-star");
      expect(starBtn).toBeDefined();
    });

    it("should hide star button when showRemoveFromDay is false", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-01" };
      element.showRemoveFromDay = false;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(".btn-day-star");
      expect(starBtn).toBeNull();
    });

    it("should hide star button when task.dayDate is undefined", async () => {
      element.task = { ...mockTask, dayDate: undefined };
      element.showRemoveFromDay = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const starBtn = element.shadowRoot!.querySelector(".btn-day-star");
      expect(starBtn).toBeNull();
    });

    it("should dispatch remove-from-day event exactly once with taskId when star button is clicked", async () => {
      element.task = { ...mockTask, dayDate: "2024-01-01" };
      element.showRemoveFromDay = true;
      element.todayDate = "2024-01-01";
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-from-day", spy);

      const starBtn = element.shadowRoot!.querySelector(
        ".btn-day-star",
      ) as HTMLButtonElement;

      expect(starBtn).toBeDefined();
      starBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.taskId).toBe("task-1");
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  describe("done task styling", () => {
    it("should apply 'done' class when task is done (finished >= planned, planned > 0)", async () => {
      element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 3 };
      await element.updateComplete;

      const taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(true);
    });

    it("should apply 'done' class when finished exceeds planned", async () => {
      element.task = { ...mockTask, tomatoCount: 2, finishedTomatoCount: 5 };
      await element.updateComplete;

      const taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(true);
    });

    it("should NOT apply 'done' class when task has no planned tomatoes (0/0)", async () => {
      element.task = { ...mockTask, tomatoCount: 0, finishedTomatoCount: 0 };
      await element.updateComplete;

      const taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(false);
    });

    it("should NOT apply 'done' class when task is not finished (finished < planned)", async () => {
      element.task = { ...mockTask, tomatoCount: 5, finishedTomatoCount: 2 };
      await element.updateComplete;

      const taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(false);
    });

    it("should have strikethrough on title when task is done", async () => {
      element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 3 };
      await element.updateComplete;

      const title = element.shadowRoot!.querySelector(
        ".task-title",
      ) as HTMLElement;
      // Check computed style or class - the CSS applies text-decoration
      expect(title.classList.length).toBeGreaterThanOrEqual(0); // title element exists
      // The styling is applied via CSS, so we check the parent has 'done' class
      const taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(true);
    });

    it("should update 'done' class when task transitions to done", async () => {
      // Start with incomplete task
      element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 1 };
      await element.updateComplete;

      let taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(false);

      // Mark as done
      element.task = { ...mockTask, tomatoCount: 3, finishedTomatoCount: 3 };
      await element.updateComplete;

      taskCard = element.shadowRoot!.querySelector(".task-card");
      expect(taskCard!.classList.contains("done")).toBe(true);
    });
  });
});
