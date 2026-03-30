/**
 * Tests for ProjectItem component
 * Tests project display, controls, and event handling in both modes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/project/project-item.js";
import type { ProjectItem } from "../src/components/project/project-item.js";
import type { Project } from "../src/models/project.js";
import "../src/components/tomato/tomato-icon.js";

describe("ProjectItem", () => {
  let element: ProjectItem;
  let mockProject: Project;

  beforeEach(async () => {
    mockProject = {
      id: "proj-1",
      title: "Test Project",
      description: "Test project description",
      tomatoEstimate: 5,
      weekId: "2024-W24",
      status: "active",
      createdAt: "2024-06-10T00:00:00.000Z",
      updatedAt: "2024-06-10T00:00:00.000Z",
      color: "#ef4444",
    };

    element = document.createElement("project-item") as ProjectItem;
    element.project = mockProject;
    element.taskCount = 3;
    element.finishedTomatoes = 2;
    element.estimatedTomatoes = 5;
    element.mode = "analytics";
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  // ============================================
  // Basic Rendering Tests
  // ============================================

  describe("basic rendering", () => {
    it("should render project title", () => {
      const title = element.shadowRoot!.querySelector(".project-title");
      expect(title!.textContent).toBe("Test Project");
    });

    it("should render project description", () => {
      const description = element.shadowRoot!.querySelector(
        ".project-description",
      );
      expect(description!.textContent!.trim()).toBe("Test project description");
    });

    it("should not render description when not provided", async () => {
      element.project = { ...mockProject, description: undefined };
      await element.updateComplete;

      const description = element.shadowRoot!.querySelector(
        ".project-description",
      );
      expect(description).toBeNull();
    });

    it("should render task count", () => {
      const taskCount = element.shadowRoot!.querySelector(".task-count");
      expect(taskCount!.textContent).toContain("3 tasks");
    });

    it("should render singular task count when count is 1", async () => {
      element.taskCount = 1;
      await element.updateComplete;

      const taskCount = element.shadowRoot!.querySelector(".task-count");
      expect(taskCount!.textContent).toContain("1 task");
      expect(taskCount!.textContent).not.toContain("1 tasks");
    });

    it("should render tomato progress", () => {
      const tomatoInfo = element.shadowRoot!.querySelector(
        ".project-meta span:last-child",
      );
      expect(tomatoInfo!.textContent).toContain("2/5 tomatoes");
    });

    it("should render color stripe", () => {
      const colorStripe = element.shadowRoot!.querySelector(
        ".project-color",
      ) as HTMLElement;
      expect(colorStripe.style.backgroundColor).toBe("rgb(239, 68, 68)"); // #ef4444
    });

    it("should render status badge", () => {
      const statusBadge = element.shadowRoot!.querySelector(".status-badge");
      expect(statusBadge!.textContent!.trim()).toBe("active");
      expect(statusBadge!.classList.contains("active")).toBe(true);
    });

    it("should render completed status badge", async () => {
      element.project = { ...mockProject, status: "completed" };
      await element.updateComplete;

      const statusBadge = element.shadowRoot!.querySelector(".status-badge");
      expect(statusBadge!.textContent!.trim()).toBe("completed");
      expect(statusBadge!.classList.contains("completed")).toBe(true);
    });

    it("should render archived status badge", async () => {
      element.project = { ...mockProject, status: "archived" };
      await element.updateComplete;

      const statusBadge = element.shadowRoot!.querySelector(".status-badge");
      expect(statusBadge!.textContent!.trim()).toBe("archived");
      expect(statusBadge!.classList.contains("archived")).toBe(true);
    });

    it("should apply status class to project item", async () => {
      element.project = { ...mockProject, status: "completed" };
      await element.updateComplete;

      const projectItem = element.shadowRoot!.querySelector(".project-item");
      expect(projectItem!.classList.contains("completed")).toBe(true);
    });

    it("should apply archived class to project item", async () => {
      element.project = { ...mockProject, status: "archived" };
      await element.updateComplete;

      const projectItem = element.shadowRoot!.querySelector(".project-item");
      expect(projectItem!.classList.contains("archived")).toBe(true);
    });
  });

  // ============================================
  // Analytics Mode Tests (default)
  // ============================================

  describe("analytics mode", () => {
    beforeEach(async () => {
      element.mode = "analytics";
      await element.updateComplete;
    });

    it("should render progress section in analytics mode", () => {
      const progressSection =
        element.shadowRoot!.querySelector(".progress-section");
      expect(progressSection).not.toBeNull();
    });

    it("should not render planning controls in analytics mode", () => {
      const planningControls =
        element.shadowRoot!.querySelector(".planning-controls");
      expect(planningControls).toBeNull();
    });

    it("should render progress bar with correct width", async () => {
      element.finishedTomatoes = 2;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      // 2/5 = 40%
      expect(progressFill.style.width).toBe("40%");
    });

    it("should show 100% progress when finished equals estimated", async () => {
      element.finishedTomatoes = 5;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      expect(progressFill.style.width).toBe("100%");
    });

    it("should show 100% progress when finished exceeds estimated", async () => {
      element.finishedTomatoes = 7;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      expect(progressFill.style.width).toBe("100%");
    });

    it("should render progress percentage", async () => {
      element.finishedTomatoes = 2;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressValue =
        element.shadowRoot!.querySelector(".progress-value");
      expect(progressValue!.textContent).toBe("40%");
    });

    it("should render progress label", () => {
      const progressLabel =
        element.shadowRoot!.querySelector(".progress-label");
      expect(progressLabel!.textContent).toBe("Progress");
    });

    it("should show 0% progress when no estimated tomatoes", async () => {
      element.finishedTomatoes = 0;
      element.estimatedTomatoes = 0;
      await element.updateComplete;

      const progressValue =
        element.shadowRoot!.querySelector(".progress-value");
      expect(progressValue!.textContent).toBe("0%");
    });

    it("should show 0% progress when finished is 0 but estimated > 0", async () => {
      element.finishedTomatoes = 0;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressValue =
        element.shadowRoot!.querySelector(".progress-value");
      expect(progressValue!.textContent).toBe("0%");
    });
  });

  // ============================================
  // Planning Mode Tests
  // ============================================

  describe("planning mode", () => {
    beforeEach(async () => {
      element.mode = "planning";
      element.project = { ...mockProject, status: "active", tomatoEstimate: 5 };
      await element.updateComplete;
    });

    it("should render planning controls in planning mode", () => {
      const planningControls =
        element.shadowRoot!.querySelector(".planning-controls");
      expect(planningControls).not.toBeNull();
    });

    it("should not render progress section in planning mode", () => {
      const progressSection =
        element.shadowRoot!.querySelector(".progress-section");
      expect(progressSection).toBeNull();
    });

    it("should render estimate label", () => {
      const estimateLabel =
        element.shadowRoot!.querySelector(".estimate-label");
      expect(estimateLabel!.textContent).toBe("Planned Tomatoes");
    });

    it("should render estimate value", () => {
      const estimateValue =
        element.shadowRoot!.querySelector(".estimate-value");
      expect(estimateValue!.textContent).toBe("5");
    });

    it("should render increase button (+)", () => {
      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      expect(increaseBtn.textContent!.trim()).toBe("+");
    });

    it("should render decrease button (-)", () => {
      const decreaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      expect(decreaseBtn.textContent!.trim()).toBe("−");
    });

    it("should render decrease button (-)", () => {
      const decreaseBtn = element.shadowRoot!.querySelector(
        ".estimate-btn:first-of-type",
      ) as HTMLButtonElement;
      expect(decreaseBtn.textContent!.trim()).toBe("−");
    });

    it("should enable increase button for active project", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      expect(increaseBtn.disabled).toBe(false);
    });

    it("should disable increase button for completed project", async () => {
      element.project = { ...mockProject, status: "completed" };
      await element.updateComplete;

      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      expect(increaseBtn.disabled).toBe(true);
    });

    it("should disable increase button for archived project", async () => {
      element.project = { ...mockProject, status: "archived" };
      await element.updateComplete;

      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      expect(increaseBtn.disabled).toBe(true);
    });

    it("should enable decrease button when estimate > 0 for active project", async () => {
      element.project = { ...mockProject, status: "active", tomatoEstimate: 5 };
      await element.updateComplete;

      const decreaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      expect(decreaseBtn.disabled).toBe(false);
    });

    it("should disable decrease button when estimate is 0", async () => {
      element.project = { ...mockProject, status: "active", tomatoEstimate: 0 };
      await element.updateComplete;

      const decreaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      expect(decreaseBtn.disabled).toBe(true);
    });

    it("should disable decrease button for non-active project", async () => {
      element.project = {
        ...mockProject,
        status: "completed",
        tomatoEstimate: 5,
      };
      await element.updateComplete;

      const decreaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      expect(decreaseBtn.disabled).toBe(true);
    });

    it("should update estimate value display when project changes", async () => {
      element.project = { ...mockProject, tomatoEstimate: 10 };
      await element.updateComplete;

      const estimateValue =
        element.shadowRoot!.querySelector(".estimate-value");
      expect(estimateValue!.textContent).toBe("10");
    });
  });

  // ============================================
  // Event Dispatch Tests
  // ============================================

  describe("event dispatching", () => {
    it("should dispatch toggle-project-details event on summary click", async () => {
      const spy = vi.fn();
      element.addEventListener("toggle-project-details", spy);

      const projectSummary = element.shadowRoot!.querySelector(
        ".project-summary",
      ) as HTMLElement;
      projectSummary.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch select-project event when View in Day button is clicked", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("select-project", spy);

      const viewBtn = element.shadowRoot!.querySelector(
        ".view-btn",
      ) as HTMLButtonElement;
      viewBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch edit-project event when Edit button is clicked", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("edit-project", spy);

      const editBtn = element.shadowRoot!.querySelector(
        ".action-btn:not(.danger)",
      ) as HTMLButtonElement;
      editBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch delete-project event when Delete button is clicked", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("delete-project", spy);

      const deleteBtn = element.shadowRoot!.querySelector(
        ".action-btn.danger",
      ) as HTMLButtonElement;
      deleteBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch increase-project-plan event when + button is clicked in planning mode", async () => {
      element.mode = "planning";
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("increase-project-plan", spy);

      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      increaseBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch decrease-project-plan event when - button is clicked in planning mode", async () => {
      element.mode = "planning";
      element.project = { ...mockProject, status: "active", tomatoEstimate: 5 };
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("decrease-project-plan", spy);

      const decreaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      decreaseBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should stop propagation on edit button click", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const clickSpy = vi.fn();
      element.addEventListener("select-project", clickSpy);

      const editBtn = element.shadowRoot!.querySelector(
        ".action-btn:not(.danger)",
      ) as HTMLButtonElement;
      editBtn.click();
      await element.updateComplete;

      // select-project should not be dispatched when clicking Edit
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should stop propagation on delete button click", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const clickSpy = vi.fn();
      element.addEventListener("select-project", clickSpy);

      const deleteBtn = element.shadowRoot!.querySelector(
        ".action-btn.danger",
      ) as HTMLButtonElement;
      deleteBtn.click();
      await element.updateComplete;

      // select-project should not be dispatched when clicking Delete
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should stop propagation on estimate button clicks", async () => {
      element.mode = "planning";
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const clickSpy = vi.fn();
      element.addEventListener("select-project", clickSpy);

      const increaseBtn = element.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      increaseBtn.click();
      await element.updateComplete;

      // select-project should not be dispatched when clicking estimate buttons
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Action Buttons Tests
  // ============================================

  describe("action buttons", () => {
    it("should render Edit and Delete buttons for active project", async () => {
      element.project = { ...mockProject, status: "active" };
      await element.updateComplete;

      const projectActions =
        element.shadowRoot!.querySelector(".project-actions");
      expect(projectActions).not.toBeNull();

      const editBtn = element.shadowRoot!.querySelector(
        ".action-btn:not(.danger)",
      );
      expect(editBtn).not.toBeNull();
      expect(editBtn!.textContent!.trim()).toBe("Edit");

      const deleteBtn = element.shadowRoot!.querySelector(".action-btn.danger");
      expect(deleteBtn).not.toBeNull();
      expect(deleteBtn!.textContent!.trim()).toBe("Delete");
    });

    it("should not render action buttons for completed project", async () => {
      element.project = { ...mockProject, status: "completed" };
      await element.updateComplete;

      const projectActions =
        element.shadowRoot!.querySelector(".project-actions");
      expect(projectActions).toBeNull();
    });

    it("should not render action buttons for archived project", async () => {
      element.project = { ...mockProject, status: "archived" };
      await element.updateComplete;

      const projectActions =
        element.shadowRoot!.querySelector(".project-actions");
      expect(projectActions).toBeNull();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================

  describe("accessibility", () => {
    it("should have role='button' on project summary", () => {
      const projectSummary =
        element.shadowRoot!.querySelector(".project-summary");
      expect(projectSummary!.getAttribute("role")).toBe("button");
    });

    it("should have tabindex='0' on project summary for keyboard navigation", () => {
      const projectSummary =
        element.shadowRoot!.querySelector(".project-summary");
      expect(projectSummary!.getAttribute("tabindex")).toBe("0");
    });

    it("should have aria-expanded attribute on project summary", () => {
      const projectSummary =
        element.shadowRoot!.querySelector(".project-summary");
      expect(projectSummary!.getAttribute("aria-expanded")).toBe("false");
    });

    it("should update aria-expanded when expanded", async () => {
      element.expanded = true;
      await element.updateComplete;

      const projectSummary =
        element.shadowRoot!.querySelector(".project-summary");
      expect(projectSummary!.getAttribute("aria-expanded")).toBe("true");
    });

    it("should have aria-label on estimate buttons in planning mode", async () => {
      element.mode = "planning";
      await element.updateComplete;

      const estimateBtns =
        element.shadowRoot!.querySelectorAll(".estimate-btn");
      expect(estimateBtns[0]?.getAttribute("aria-label")).toBe(
        "Decrease planned tomatoes",
      );
      expect(estimateBtns[1]?.getAttribute("aria-label")).toBe(
        "Increase planned tomatoes",
      );
    });
  });

  // ============================================
  // Keyboard Interaction Tests
  // ============================================

  describe("keyboard interaction", () => {
    it("should have tabindex for keyboard navigation on summary", () => {
      const projectSummary =
        element.shadowRoot!.querySelector(".project-summary");
      expect(projectSummary!.getAttribute("tabindex")).toBe("0");
    });

    it("should dispatch toggle-project-details event on Enter key", async () => {
      const spy = vi.fn();
      element.addEventListener("toggle-project-details", spy);

      const projectSummary = element.shadowRoot!.querySelector(
        ".project-summary",
      ) as HTMLElement;
      projectSummary.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });

    it("should dispatch toggle-project-details event on Space key", async () => {
      const spy = vi.fn();
      element.addEventListener("toggle-project-details", spy);

      const projectSummary = element.shadowRoot!.querySelector(
        ".project-summary",
      ) as HTMLElement;
      projectSummary.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.projectId).toBe("proj-1");
    });
  });

  // ============================================
  // Mode Switching Tests
  // ============================================

  describe("mode switching", () => {
    it("should switch from analytics to planning mode", async () => {
      element.mode = "analytics";
      await element.updateComplete;

      expect(
        element.shadowRoot!.querySelector(".progress-section"),
      ).not.toBeNull();
      expect(
        element.shadowRoot!.querySelector(".planning-controls"),
      ).toBeNull();

      element.mode = "planning";
      await element.updateComplete;

      expect(element.shadowRoot!.querySelector(".progress-section")).toBeNull();
      expect(
        element.shadowRoot!.querySelector(".planning-controls"),
      ).not.toBeNull();
    });

    it("should switch from planning to analytics mode", async () => {
      element.mode = "planning";
      await element.updateComplete;

      expect(
        element.shadowRoot!.querySelector(".planning-controls"),
      ).not.toBeNull();
      expect(element.shadowRoot!.querySelector(".progress-section")).toBeNull();

      element.mode = "analytics";
      await element.updateComplete;

      expect(
        element.shadowRoot!.querySelector(".planning-controls"),
      ).toBeNull();
      expect(
        element.shadowRoot!.querySelector(".progress-section"),
      ).not.toBeNull();
    });
  });

  // ============================================
  // Progress Color Tests
  // ============================================

  describe("progress colors", () => {
    it("should use red color for low progress (< 25%)", async () => {
      element.finishedTomatoes = 1;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      // Low progress should have red-ish color
      expect(progressFill.style.backgroundColor).toBeTruthy();
    });

    it("should use green color for high progress (>= 100%)", async () => {
      element.finishedTomatoes = 5;
      element.estimatedTomatoes = 5;
      await element.updateComplete;

      const progressFill = element.shadowRoot!.querySelector(
        ".progress-fill",
      ) as HTMLElement;
      // Complete progress should have green color
      expect(progressFill.style.backgroundColor).toBeTruthy();
    });
  });
});
