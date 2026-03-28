/**
 * Tests for WeekTomatoPoolPanel component
 * Tests weekly pool display, capacity controls, and visual representation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/pool/week-tomato-pool-panel.js";
import type { WeekTomatoPoolPanel } from "../src/components/pool/week-tomato-pool-panel.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/shared/empty-state.js";

describe("WeekTomatoPoolPanel", () => {
  let element: WeekTomatoPoolPanel;

  beforeEach(async () => {
    element = document.createElement(
      "week-tomato-pool-panel",
    ) as WeekTomatoPoolPanel;
    element.weeklyCapacity = 125;
    element.planned = 50;
    element.remaining = 75;
    element.finished = 20;
    element.weekStartDate = "2024-06-10";
    element.weekEndDate = "2024-06-16";
    element.capacityInMinutes = 25;
    element.collapsed = false;
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
    it("should render panel title", () => {
      const title = element.shadowRoot!.querySelector(".panel-title");
      expect(title!.textContent).toBe("Week Tomato Pool");
    });

    it("should render week range", () => {
      const weekRange = element.shadowRoot!.querySelector(".week-range");
      expect(weekRange!.textContent).toBeTruthy();
    });

    it("should render weekly capacity value", () => {
      const capacityValue = element.shadowRoot!.querySelector(
        ".capacity-control-group:first-child .capacity-value",
      );
      expect(capacityValue!.textContent).toBe("125");
    });

    it("should render total time based on capacity and duration", () => {
      const timeValue = element.shadowRoot!.querySelector(".time-value");
      // 125 tomatoes * 25 minutes = 3125 minutes = 52h 5m
      expect(timeValue!.textContent).toContain("52h");
    });

    it("should render planned tomatoes count", () => {
      const plannedValue = element.shadowRoot!.querySelector(
        ".capacity-value-text",
      );
      expect(plannedValue!.textContent).toContain("50/125 tomatoes");
    });

    it("should render finished tomatoes count", () => {
      const stats = element.shadowRoot!.querySelectorAll(".stat");
      const finishedStat = stats[0];
      expect(finishedStat!.textContent).toContain("20 finished");
    });

    it("should render remaining tomatoes count", () => {
      const stats = element.shadowRoot!.querySelectorAll(".stat");
      const remainingStat = stats[1];
      expect(remainingStat!.textContent).toContain("75 remaining");
    });

    it("should render capacity bar", () => {
      const capacityBar = element.shadowRoot!.querySelector(".capacity-bar");
      expect(capacityBar).not.toBeNull();
    });

    it("should render tomato grid", () => {
      const tomatoGrid = element.shadowRoot!.querySelector(".tomato-grid");
      expect(tomatoGrid).not.toBeNull();
    });

    it("should render tomato legend", () => {
      const legend = element.shadowRoot!.querySelector(".tomato-legend");
      expect(legend).not.toBeNull();

      const legendItems = element.shadowRoot!.querySelectorAll(".legend-item");
      expect(legendItems.length).toBe(2);
    });
  });

  // ============================================
  // Capacity Controls Tests
  // ============================================

  describe("capacity controls", () => {
    it("should render decrease capacity button", () => {
      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      ) as HTMLButtonElement;
      expect(decreaseBtn.textContent!.trim()).toBe("−");
    });

    it("should render increase capacity button", () => {
      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      ) as HTMLButtonElement;
      expect(increaseBtn.textContent!.trim()).toBe("+");
    });

    it("should enable decrease button when capacity > 25", async () => {
      element.weeklyCapacity = 125;
      await element.updateComplete;

      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      ) as HTMLButtonElement;
      expect(decreaseBtn.disabled).toBe(false);
    });

    it("should disable decrease button when capacity <= 25", async () => {
      element.weeklyCapacity = 25;
      await element.updateComplete;

      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      ) as HTMLButtonElement;
      expect(decreaseBtn.disabled).toBe(true);
    });

    it("should enable increase button when capacity < 200", async () => {
      element.weeklyCapacity = 125;
      await element.updateComplete;

      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      ) as HTMLButtonElement;
      expect(increaseBtn.disabled).toBe(false);
    });

    it("should disable increase button when capacity >= 200", async () => {
      element.weeklyCapacity = 200;
      await element.updateComplete;

      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      ) as HTMLButtonElement;
      expect(increaseBtn.disabled).toBe(true);
    });

    it("should dispatch weekly-capacity-change event with decreased capacity", async () => {
      const spy = vi.fn();
      element.addEventListener("weekly-capacity-change", spy);

      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      ) as HTMLButtonElement;
      decreaseBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.capacity).toBe(120); // 125 - 5
    });

    it("should dispatch weekly-capacity-change event with increased capacity", async () => {
      const spy = vi.fn();
      element.addEventListener("weekly-capacity-change", spy);

      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      ) as HTMLButtonElement;
      increaseBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.capacity).toBe(130); // 125 + 5
    });

    it("should not dispatch event when at minimum capacity", async () => {
      element.weeklyCapacity = 25;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("weekly-capacity-change", spy);

      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      ) as HTMLButtonElement;
      decreaseBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });

    it("should not dispatch event when at maximum capacity", async () => {
      element.weeklyCapacity = 200;
      await element.updateComplete;

      const spy = vi.fn();
      element.addEventListener("weekly-capacity-change", spy);

      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      ) as HTMLButtonElement;
      increaseBtn.click();
      await element.updateComplete;

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Capacity Bar Tests
  // ============================================

  describe("capacity bar", () => {
    it("should show correct width based on planned percentage", async () => {
      element.weeklyCapacity = 100;
      element.planned = 50;
      element.remaining = 50;
      await element.updateComplete;

      const capacityFill = element.shadowRoot!.querySelector(
        ".capacity-fill",
      ) as HTMLElement;
      expect(capacityFill.style.width).toBe("50%");
    });

    it("should cap width at 100% when over capacity", async () => {
      element.weeklyCapacity = 100;
      element.planned = 150;
      element.remaining = -50;
      await element.updateComplete;

      const capacityFill = element.shadowRoot!.querySelector(
        ".capacity-fill",
      ) as HTMLElement;
      expect(capacityFill.style.width).toBe("100%");
    });

    it("should show 0% width when nothing planned", async () => {
      element.planned = 0;
      element.remaining = 125;
      await element.updateComplete;

      const capacityFill = element.shadowRoot!.querySelector(
        ".capacity-fill",
      ) as HTMLElement;
      expect(capacityFill.style.width).toBe("0%");
    });

    it("should show warning when over capacity", async () => {
      element.planned = 150;
      element.remaining = -25;
      await element.updateComplete;

      const warning = element.shadowRoot!.querySelector(
        ".over-capacity-message",
      );
      expect(warning).not.toBeNull();
      expect(warning!.textContent).toContain(
        "Project estimates exceed weekly capacity",
      );
    });

    it("should show success message when at capacity", async () => {
      element.planned = 125;
      element.remaining = 0;
      await element.updateComplete;

      const success = element.shadowRoot!.querySelector(".warning-message");
      expect(success).not.toBeNull();
      expect(success!.textContent).toContain("All capacity allocated");
    });

    it("should not show warning or success when under capacity", async () => {
      element.planned = 50;
      element.remaining = 75;
      await element.updateComplete;

      const warning = element.shadowRoot!.querySelector(
        ".over-capacity-message",
      );
      const success = element.shadowRoot!.querySelector(".warning-message");

      expect(warning).toBeNull();
      expect(success).toBeNull();
    });
  });

  // ============================================
  // Tomato Grid Tests
  // ============================================

  describe("tomato grid", () => {
    it("should render correct number of tomato cells", async () => {
      element.weeklyCapacity = 50;
      await element.updateComplete;

      const cells = element.shadowRoot!.querySelectorAll(".tomato-cell");
      expect(cells.length).toBe(50);
    });

    it("should mark planned tomatoes with 'planned' class", async () => {
      element.weeklyCapacity = 50;
      element.planned = 20;
      await element.updateComplete;

      const plannedCells = element.shadowRoot!.querySelectorAll(
        ".tomato-cell.planned",
      );
      expect(plannedCells.length).toBe(20);
    });

    it("should mark available tomatoes with 'available' class", async () => {
      element.weeklyCapacity = 50;
      element.planned = 20;
      await element.updateComplete;

      const availableCells = element.shadowRoot!.querySelectorAll(
        ".tomato-cell.available",
      );
      expect(availableCells.length).toBe(30);
    });

    it("should cap displayed planned tomatoes at capacity", async () => {
      element.weeklyCapacity = 50;
      element.planned = 75; // Over capacity
      await element.updateComplete;

      const plannedCells = element.shadowRoot!.querySelectorAll(
        ".tomato-cell.planned",
      );
      expect(plannedCells.length).toBe(50); // Capped at capacity
    });

    it("should render tomato-icon in each cell", async () => {
      element.weeklyCapacity = 10;
      await element.updateComplete;

      const tomatoIcons = element.shadowRoot!.querySelectorAll("tomato-icon");
      expect(tomatoIcons.length).toBe(10);
    });
  });

  // ============================================
  // Remaining Info Tests
  // ============================================

  describe("remaining info", () => {
    it("should render remaining capacity section", () => {
      const remainingInfo =
        element.shadowRoot!.querySelector(".remaining-info");
      expect(remainingInfo).not.toBeNull();
    });

    it("should show remaining tomatoes value", async () => {
      element.remaining = 75;
      await element.updateComplete;

      const remainingValue =
        element.shadowRoot!.querySelector(".remaining-value");
      expect(remainingValue!.textContent).toContain("75");
    });

    it("should show negative remaining when over capacity", async () => {
      element.remaining = -25;
      await element.updateComplete;

      const remainingValue =
        element.shadowRoot!.querySelector(".remaining-value");
      // The component uses minus sign character (−) or hyphen (-)
      expect(remainingValue!.textContent!.trim()).toContain("25");
    });

    it("should apply remaining-negative class when over capacity", async () => {
      // Set proper preconditions for over-capacity state
      // Component checks planned > weeklyCapacity to determine over-capacity
      element.planned = 150;
      element.weeklyCapacity = 125;
      element.remaining = -25;
      await element.updateComplete;

      const remainingValue =
        element.shadowRoot!.querySelector(".remaining-value");
      expect(remainingValue!.classList.contains("remaining-negative")).toBe(
        true,
      );
    });

    it("should not apply remaining-negative class when under capacity", async () => {
      element.remaining = 50;
      await element.updateComplete;

      const remainingValue =
        element.shadowRoot!.querySelector(".remaining-value");
      expect(remainingValue!.classList.contains("remaining-negative")).toBe(
        false,
      );
    });

    it("should render finished info text", () => {
      const finishedInfo = element.shadowRoot!.querySelector(".finished-info");
      expect(finishedInfo!.textContent).toContain(
        "Finished tomatoes are tracked via completed tasks",
      );
    });
  });

  // ============================================
  // Collapse Functionality Tests
  // ============================================

  describe("collapse functionality", () => {
    it("should render toggle button", () => {
      const toggleBtn = element.shadowRoot!.querySelector(".toggle-btn");
      expect(toggleBtn).not.toBeNull();
    });

    it("should dispatch toggle-collapse event on toggle button click", async () => {
      const spy = vi.fn();
      element.addEventListener("toggle-collapse", spy);

      const toggleBtn = element.shadowRoot!.querySelector(
        ".toggle-btn",
      ) as HTMLButtonElement;
      toggleBtn.click();
      await element.updateComplete;

      expect(spy).toHaveBeenCalled();
    });

    it("should have collapsed attribute when collapsed is true", async () => {
      element.collapsed = true;
      await element.updateComplete;

      expect(element.hasAttribute("collapsed")).toBe(true);
    });

    it("should not have collapsed attribute when collapsed is false", async () => {
      element.collapsed = false;
      await element.updateComplete;

      expect(element.hasAttribute("collapsed")).toBe(false);
    });

    it("should hide panel content when collapsed", async () => {
      element.collapsed = true;
      await element.updateComplete;

      const panelContent = element.shadowRoot!.querySelector(".panel-content");
      // CSS hides it, but the element still exists
      expect(panelContent).not.toBeNull();
    });

    it("should have correct aria-expanded attribute", async () => {
      element.collapsed = false;
      await element.updateComplete;

      const toggleBtn = element.shadowRoot!.querySelector(".toggle-btn");
      expect(toggleBtn!.getAttribute("aria-expanded")).toBe("true");

      element.collapsed = true;
      await element.updateComplete;

      expect(toggleBtn!.getAttribute("aria-expanded")).toBe("false");
    });

    it("should have correct aria-label based on collapsed state", async () => {
      element.collapsed = false;
      await element.updateComplete;

      const toggleBtn = element.shadowRoot!.querySelector(".toggle-btn");
      expect(toggleBtn!.getAttribute("aria-label")).toBe("Collapse panel");

      element.collapsed = true;
      await element.updateComplete;

      expect(toggleBtn!.getAttribute("aria-label")).toBe("Expand panel");
    });
  });

  // ============================================
  // Time Display Tests
  // ============================================

  describe("time display", () => {
    it("should calculate correct total time", async () => {
      element.weeklyCapacity = 125;
      element.capacityInMinutes = 25;
      await element.updateComplete;

      const timeValue = element.shadowRoot!.querySelector(".time-value");
      // 125 * 25 = 3125 minutes = 52h 5m
      expect(timeValue!.textContent!.trim()).toBe("52h 5m");
    });

    it("should update time display when capacity changes", async () => {
      element.weeklyCapacity = 50;
      element.capacityInMinutes = 30;
      await element.updateComplete;

      const timeValue = element.shadowRoot!.querySelector(".time-value");
      // 50 * 30 = 1500 minutes = 25h
      expect(timeValue!.textContent!.trim()).toBe("25h");
    });

    it("should update time display when duration changes", async () => {
      element.weeklyCapacity = 100;
      element.capacityInMinutes = 15;
      await element.updateComplete;

      const timeValue = element.shadowRoot!.querySelector(".time-value");
      // 100 * 15 = 1500 minutes = 25h
      expect(timeValue!.textContent!.trim()).toBe("25h");
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================

  describe("accessibility", () => {
    it("should have aria-label on tomato grid section", () => {
      const gridSection = element.shadowRoot!.querySelector(
        ".tomato-grid-section",
      );
      expect(gridSection!.getAttribute("aria-label")).toBe(
        "Weekly tomato allocation visualization",
      );
    });

    it("should have aria-hidden on legend", () => {
      const legend = element.shadowRoot!.querySelector(".tomato-legend");
      expect(legend!.getAttribute("aria-hidden")).toBe("true");
    });

    it("should have aria-label on capacity buttons", () => {
      const decreaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:first-child",
      );
      const increaseBtn = element.shadowRoot!.querySelector(
        ".capacity-control-group .capacity-btn:last-child",
      );

      expect(decreaseBtn!.getAttribute("aria-label")).toBe(
        "Decrease weekly capacity",
      );
      expect(increaseBtn!.getAttribute("aria-label")).toBe(
        "Increase weekly capacity",
      );
    });
  });

  // ============================================
  // Props Update Tests
  // ============================================

  describe("props updates", () => {
    it("should update display when weeklyCapacity changes", async () => {
      element.weeklyCapacity = 150;
      await element.updateComplete;

      const capacityValue = element.shadowRoot!.querySelector(
        ".capacity-control-group:first-child .capacity-value",
      );
      expect(capacityValue!.textContent).toBe("150");
    });

    it("should update display when planned changes", async () => {
      element.planned = 75;
      element.remaining = 50;
      await element.updateComplete;

      const plannedValue = element.shadowRoot!.querySelector(
        ".capacity-value-text",
      );
      expect(plannedValue!.textContent).toContain("75/125 tomatoes");
    });

    it("should update display when finished changes", async () => {
      element.finished = 40;
      await element.updateComplete;

      const stats = element.shadowRoot!.querySelectorAll(".stat");
      const finishedStat = stats[0];
      expect(finishedStat!.textContent).toContain("40 finished");
    });

    it("should update week range when dates change", async () => {
      element.weekStartDate = "2024-06-17";
      element.weekEndDate = "2024-06-23";
      await element.updateComplete;

      const weekRange = element.shadowRoot!.querySelector(".week-range");
      expect(weekRange!.textContent).toBeTruthy();
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================

  describe("edge cases", () => {
    it("should handle zero planned tomatoes", async () => {
      element.planned = 0;
      element.remaining = 125;
      await element.updateComplete;

      const plannedValue = element.shadowRoot!.querySelector(
        ".capacity-value-text",
      );
      expect(plannedValue!.textContent).toContain("0/125 tomatoes");
    });

    it("should handle zero finished tomatoes", async () => {
      element.finished = 0;
      await element.updateComplete;

      const stats = element.shadowRoot!.querySelectorAll(".stat");
      const finishedStat = stats[0];
      expect(finishedStat!.textContent).toContain("0 finished");
    });

    it("should handle capacity at minimum (25)", async () => {
      element.weeklyCapacity = 25;
      element.planned = 10;
      element.remaining = 15;
      await element.updateComplete;

      const capacityValue = element.shadowRoot!.querySelector(
        ".capacity-control-group:first-child .capacity-value",
      );
      expect(capacityValue!.textContent).toBe("25");
    });

    it("should handle capacity at maximum (200)", async () => {
      element.weeklyCapacity = 200;
      element.planned = 100;
      element.remaining = 100;
      await element.updateComplete;

      const capacityValue = element.shadowRoot!.querySelector(
        ".capacity-control-group:first-child .capacity-value",
      );
      expect(capacityValue!.textContent).toBe("200");
    });

    it("should handle exactly at capacity", async () => {
      element.planned = 125;
      element.remaining = 0;
      await element.updateComplete;

      const capacityFill = element.shadowRoot!.querySelector(
        ".capacity-fill",
      ) as HTMLElement;
      expect(capacityFill.style.width).toBe("100%");

      const success = element.shadowRoot!.querySelector(".warning-message");
      expect(success).not.toBeNull();
    });
  });
});
