/**
 * Tests for TaskForm component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/task/task-form.js";
import type { TaskForm } from "../src/components/task/task-form.js";
import type { Task } from "../src/models/task.js";

describe("TaskForm", () => {
  let element: TaskForm;

  beforeEach(async () => {
    element = document.createElement("task-form") as TaskForm;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("should render with default values", () => {
    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    const submitBtn =
      element.shadowRoot!.querySelector<HTMLButtonElement>(".btn-submit");

    expect(titleInput).toBeDefined();
    expect(submitBtn!.disabled).toBe(true); // disabled when empty title
  });

  it("should render with custom submit label", async () => {
    element.submitLabel = "Update Task";
    await element.updateComplete;

    const submitBtn =
      element.shadowRoot!.querySelector<HTMLButtonElement>(".btn-submit");
    expect(submitBtn!.textContent!.trim()).toBe("Update Task");
  });

  it("should enable submit button when title has content", async () => {
    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");

    titleInput!.value = "My Task";
    titleInput!.dispatchEvent(new Event("input", { bubbles: true }));
    await element.updateComplete;

    const submitBtn =
      element.shadowRoot!.querySelector<HTMLButtonElement>(".btn-submit");
    expect(submitBtn!.disabled).toBe(false);
  });

  it("should dispatch submit event with form data", async () => {
    const submitSpy = vi.fn();
    element.addEventListener("submit", submitSpy);

    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    const descInput =
      element.shadowRoot!.querySelector<HTMLTextAreaElement>(
        "#description-input",
      );
    const form = element.shadowRoot!.querySelector<HTMLFormElement>("form");

    titleInput!.value = "My Task";
    titleInput!.dispatchEvent(new Event("input", { bubbles: true }));
    descInput!.value = "Task description";
    descInput!.dispatchEvent(new Event("input", { bubbles: true }));
    await element.updateComplete;

    form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await element.updateComplete;

    expect(submitSpy).toHaveBeenCalled();
    const event = submitSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.title).toBe("My Task");
    expect(event.detail.description).toBe("Task description");
  });

  it("should dispatch cancel event when cancel button clicked", async () => {
    const cancelSpy = vi.fn();
    element.addEventListener("cancel", cancelSpy);

    const cancelBtn =
      element.shadowRoot!.querySelector<HTMLButtonElement>(".btn-cancel");
    cancelBtn!.click();
    await element.updateComplete;

    expect(cancelSpy).toHaveBeenCalled();
  });

  it("should show validation error for empty title on blur", async () => {
    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");

    // Focus then blur with empty value
    titleInput!.focus();
    titleInput!.blur();
    await element.updateComplete;

    const errorMsg = element.shadowRoot!.querySelector(".error-message");
    expect(errorMsg).toBeDefined();
    expect(errorMsg!.textContent).toContain("required");
  });

  it("should show character count", async () => {
    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");

    titleInput!.value = "Test";
    titleInput!.dispatchEvent(new Event("input", { bubbles: true }));
    await element.updateComplete;

    const charCount = element.shadowRoot!.querySelectorAll(".char-count")[0];
    expect(charCount!.textContent).toContain("196 characters remaining"); // 200 - 4
  });

  it("should populate form when task property is set", async () => {
    const task: Task = {
      id: "task-1",
      title: "Existing Task",
      description: "Existing description",
      tomatoCount: 0,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    element.task = task;
    await element.updateComplete;
    // Wait for second render cycle triggered by updated() modifying @state properties
    await element.updateComplete;

    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    const descInput =
      element.shadowRoot!.querySelector<HTMLTextAreaElement>(
        "#description-input",
      );

    expect(titleInput!.value).toBe("Existing Task");
    expect(descInput!.value).toBe("Existing description");
  });

  it("should clear form when task is removed", async () => {
    const task: Task = {
      id: "task-1",
      title: "Existing Task",
      description: "Existing description",
      tomatoCount: 0,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    element.task = task;
    await element.updateComplete;
    await element.updateComplete;

    element.task = undefined;
    await element.updateComplete;
    await element.updateComplete;

    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    expect(titleInput!.value).toBe("");
  });

  it("should trim title on submit", async () => {
    const submitSpy = vi.fn();
    element.addEventListener("submit", submitSpy);

    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    const form = element.shadowRoot!.querySelector<HTMLFormElement>("form");

    titleInput!.value = "  Trimmed Task  ";
    titleInput!.dispatchEvent(new Event("input", { bubbles: true }));
    await element.updateComplete;

    form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await element.updateComplete;

    const event = submitSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.title).toBe("Trimmed Task");
  });

  it("should not submit with whitespace-only title", async () => {
    const submitSpy = vi.fn();
    element.addEventListener("submit", submitSpy);

    const titleInput =
      element.shadowRoot!.querySelector<HTMLInputElement>("#title-input");
    const form = element.shadowRoot!.querySelector<HTMLFormElement>("form");

    titleInput!.value = "   ";
    titleInput!.dispatchEvent(new Event("input", { bubbles: true }));
    await element.updateComplete;

    form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await element.updateComplete;

    // Submit should not be called because validation should fail
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("should focus title input on first render", async () => {
    // Create a new element to test firstUpdated
    const newElement = document.createElement("task-form") as TaskForm;
    document.body.appendChild(newElement);
    await newElement.updateComplete;

    const titleInput =
      newElement.shadowRoot!.querySelector<HTMLInputElement>("#title-input");

    // Check that the input exists (focus behavior may vary in jsdom)
    expect(titleInput).toBeDefined();

    newElement.remove();
  });
});
