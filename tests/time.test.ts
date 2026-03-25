/**
 * Tests for time utilities
 */

import { describe, it, expect } from "vitest";
import { formatTimeEstimate } from "../src/utils/time.js";

describe("formatTimeEstimate", () => {
  it("should return 0m for zero or negative", () => {
    expect(formatTimeEstimate(0)).toBe("0m");
    expect(formatTimeEstimate(-5)).toBe("0m");
  });

  it("should format minutes only when less than 60", () => {
    expect(formatTimeEstimate(25)).toBe("25m");
    expect(formatTimeEstimate(45)).toBe("45m");
    expect(formatTimeEstimate(1)).toBe("1m");
    expect(formatTimeEstimate(59)).toBe("59m");
  });

  it("should format hours only for exact hours", () => {
    expect(formatTimeEstimate(60)).toBe("1h");
    expect(formatTimeEstimate(120)).toBe("2h");
    expect(formatTimeEstimate(180)).toBe("3h");
  });

  it("should format hours and minutes combined", () => {
    expect(formatTimeEstimate(75)).toBe("1h 15m");
    expect(formatTimeEstimate(90)).toBe("1h 30m");
    expect(formatTimeEstimate(135)).toBe("2h 15m");
    expect(formatTimeEstimate(200)).toBe("3h 20m");
  });

  it("should handle large values", () => {
    expect(formatTimeEstimate(480)).toBe("8h"); // 8 hours
    expect(formatTimeEstimate(500)).toBe("8h 20m");
  });
});
