/**
 * Tests for TomatoAssignmentControl component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/tomato/tomato-assignment-control.js";
import type { TomatoAssignmentControl } from "../src/components/tomato/tomato-assignment-control.js";

describe("TomatoAssignmentControl", () => {
  let element: TomatoAssignmentControl;

  beforeEach(async () => {
    element = document.createElement(
      "tomato-assignment-control",
    ) as TomatoAssignmentControl;
    element.count = 2;
    element.maxCount = 20;
    element.remaining = 5;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("should render with initial count", () => {
    const countSpan = element.shadowRoot!.querySelector(".count");
    expect(countSpan!.textContent).toBe("2");
  });

  it("should render count with has-value class when count > 0", async () => {
    element.count = 3;
    await element.updateComplete;

    const countSpan = element.shadowRoot!.querySelector(".count");
    expect(countSpan!.classList.contains("has-value")).toBe(true);
  });

  it("should render count without has-value class when count is 0", async () => {
    element.count = 0;
    await element.updateComplete;

    const countSpan = element.shadowRoot!.querySelector(".count");
    expect(countSpan!.classList.contains("has-value")).toBe(false);
  });

  it("should dispatch add-tomato event when add button is clicked", async () => {
    const spy = vi.fn();
    element.addEventListener("add-tomato", spy);

    const addBtn = element.shadowRoot!.querySelector(
      ".btn-add",
    ) as HTMLButtonElement;
    addBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0]![0] as CustomEvent;
    expect(event.detail.currentCount).toBe(2);
  });

  it("should dispatch remove-tomato event when remove button is clicked", async () => {
    const spy = vi.fn();
    element.addEventListener("remove-tomato", spy);

    const removeBtn = element.shadowRoot!.querySelector(
      ".btn-remove",
    ) as HTMLButtonElement;
    removeBtn.click();
    await element.updateComplete;

    expect(spy).toHaveBeenCalled();
    const event = spy.mock.calls[0]![0] as CustomEvent;
    expect(event.detail.currentCount).toBe(2);
  });

  describe("event propagation", () => {
    it("should stop propagation of native click event on add button", async () => {
      const parentClickSpy = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("click", parentClickSpy);

      parent.appendChild(element);
      document.body.appendChild(parent);
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      // The custom event should still be dispatched
      expect(parentClickSpy).not.toHaveBeenCalled();

      parent.remove();
    });

    it("should stop propagation of native click event on remove button", async () => {
      const parentClickSpy = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("click", parentClickSpy);

      parent.appendChild(element);
      document.body.appendChild(parent);
      await element.updateComplete;

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      removeBtn.click();
      await element.updateComplete;

      // The native click should not bubble to parent
      expect(parentClickSpy).not.toHaveBeenCalled();

      parent.remove();
    });

    it("should still dispatch custom add-tomato event that bubbles", async () => {
      const customEventSpy = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("add-tomato", customEventSpy);

      parent.appendChild(element);
      document.body.appendChild(parent);
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      // The custom event should still bubble up
      expect(customEventSpy).toHaveBeenCalled();

      parent.remove();
    });

    it("should still dispatch custom remove-tomato event that bubbles", async () => {
      const customEventSpy = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("remove-tomato", customEventSpy);

      parent.appendChild(element);
      document.body.appendChild(parent);
      await element.updateComplete;

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      removeBtn.click();
      await element.updateComplete;

      // The custom event should still bubble up
      expect(customEventSpy).toHaveBeenCalled();

      parent.remove();
    });

    it("should stop propagation even when action is prevented by guard clause", async () => {
      element.disabled = true;
      await element.updateComplete;

      const parentClickSpy = vi.fn();
      const parent = document.createElement("div");
      parent.addEventListener("click", parentClickSpy);

      parent.appendChild(element);
      document.body.appendChild(parent);
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      // Even though the button is disabled, if somehow clicked, propagation should stop
      expect(parentClickSpy).not.toHaveBeenCalled();

      parent.remove();
    });
  });

  describe("disabled state", () => {
    it("should disable add button when component is disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.disabled).toBe(true);
    });

    it("should disable remove button when component is disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      expect(removeBtn.disabled).toBe(true);
    });

    it("should not dispatch add-tomato event when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("add-tomato", spy);

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should not dispatch remove-tomato event when disabled", async () => {
      element.disabled = true;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-tomato", spy);

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      removeBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("add button constraints", () => {
    it("should disable add button when count reaches maxCount", async () => {
      element.count = 20;
      element.maxCount = 20;
      element.remaining = 5;
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.disabled).toBe(true);
    });

    it("should disable add button when remaining is 0", async () => {
      element.remaining = 0;
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.disabled).toBe(true);
    });

    it("should not dispatch add-tomato event when count is at maxCount", async () => {
      element.count = 20;
      element.maxCount = 20;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("add-tomato", spy);

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should not dispatch add-tomato event when remaining is 0", async () => {
      element.remaining = 0;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("add-tomato", spy);

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      addBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should enable add button when constraints allow adding", async () => {
      element.count = 5;
      element.maxCount = 20;
      element.remaining = 3;
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.disabled).toBe(false);
    });
  });

  describe("remove button constraints", () => {
    it("should disable remove button when count is 0", async () => {
      element.count = 0;
      await element.updateComplete;

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      expect(removeBtn.disabled).toBe(true);
    });

    it("should not dispatch remove-tomato event when count is 0", async () => {
      element.count = 0;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("remove-tomato", spy);

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      removeBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should enable remove button when count > 0", async () => {
      element.count = 1;
      await element.updateComplete;

      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      expect(removeBtn.disabled).toBe(false);
    });
  });

  describe("showCount property", () => {
    it("should show count by default", () => {
      const countSpan = element.shadowRoot!.querySelector(".count");
      expect(countSpan).not.toBeNull();
    });

    it("should hide count when showCount is false", async () => {
      element.showCount = false;
      await element.updateComplete;

      const countSpan = element.shadowRoot!.querySelector(".count");
      expect(countSpan).toBeNull();
    });

    it("should still render buttons when showCount is false", async () => {
      element.showCount = false;
      await element.updateComplete;

      const addBtn = element.shadowRoot!.querySelector(".btn-add");
      const removeBtn = element.shadowRoot!.querySelector(".btn-remove");
      expect(addBtn).not.toBeNull();
      expect(removeBtn).not.toBeNull();
    });
  });

  describe("accessibility", () => {
    it("should have aria-label on add button", () => {
      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.getAttribute("aria-label")).toBe("Add tomato");
    });

    it("should have aria-label on remove button", () => {
      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      expect(removeBtn.getAttribute("aria-label")).toBe("Remove tomato");
    });

    it("should have title attribute on add button", () => {
      const addBtn = element.shadowRoot!.querySelector(
        ".btn-add",
      ) as HTMLButtonElement;
      expect(addBtn.getAttribute("title")).toBe("Add tomato");
    });

    it("should have title attribute on remove button", () => {
      const removeBtn = element.shadowRoot!.querySelector(
        ".btn-remove",
      ) as HTMLButtonElement;
      expect(removeBtn.getAttribute("title")).toBe("Remove tomato");
    });
  });
});
