/**
 * Tests for DayStarIcon component
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../src/components/shared/day-star-icon.js";
import type { DayStarIcon } from "../src/components/shared/day-star-icon.js";

describe("DayStarIcon", () => {
  let element: DayStarIcon;

  beforeEach(async () => {
    element = document.createElement("day-star-icon") as DayStarIcon;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("should render an SVG element", () => {
    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.classList.contains("star-icon")).toBe(true);
  });

  it("should have default size of 20", async () => {
    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("20");
    expect(svg!.getAttribute("height")).toBe("20");
  });

  it("should render outline star when filled is false", async () => {
    element.filled = false;
    await element.updateComplete;

    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("fill")).toBe("transparent");
    expect(svg!.getAttribute("stroke")).toBe("#facc15");
    expect(svg!.getAttribute("stroke-width")).toBe("1.5");
  });

  it("should render filled star when filled is true", async () => {
    element.filled = true;
    await element.updateComplete;

    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("fill")).toBe("#facc15");
    expect(svg!.getAttribute("stroke")).toBe("#facc15");
    expect(svg!.getAttribute("stroke-width")).toBe("0");
  });

  it("should update size when size property changes", async () => {
    element.size = 24;
    await element.updateComplete;

    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("width")).toBe("24");
    expect(svg!.getAttribute("height")).toBe("24");
  });

  it("should use bright yellow color (#facc15) for star", async () => {
    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute("stroke")).toBe("#facc15");
  });

  it("should render star path", async () => {
    const svg = element.shadowRoot!.querySelector("svg");
    expect(svg).not.toBeNull();
    const path = svg!.querySelector("path");
    expect(path).not.toBeNull();
    expect(path!.getAttribute("d")).toContain("M12 2"); // Star path starts at top point
  });
});
