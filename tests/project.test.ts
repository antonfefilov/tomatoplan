/**
 * Tests for Project model
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProject,
  updateProject,
  archiveProject,
  completeProject,
  getCurrentWeekId,
  getWeekId,
  getNextProjectColor,
  PROJECT_COLORS,
  isProjectActive,
  isProjectCompleted,
  getWeekStart,
  getWeekEnd,
} from "../src/models/project.js";

describe("createProject", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00.000Z"));
  });

  it("should create a project with required fields", () => {
    const project = createProject("proj-123", "My Project", "2024-W24");

    expect(project.id).toBe("proj-123");
    expect(project.title).toBe("My Project");
    expect(project.weekId).toBe("2024-W24");
    expect(project.tomatoEstimate).toBe(0);
    expect(project.status).toBe("active");
    expect(project.createdAt).toBe("2024-06-15T10:30:00.000Z");
    expect(project.updatedAt).toBe("2024-06-15T10:30:00.000Z");
  });

  it("should create a project with optional fields", () => {
    const project = createProject("proj-123", "My Project", "2024-W24", {
      description: "Project description",
      tomatoEstimate: 10,
      color: "#ef4444",
    });

    expect(project.description).toBe("Project description");
    expect(project.tomatoEstimate).toBe(10);
    expect(project.color).toBe("#ef4444");
  });

  it("should trim title and description", () => {
    const project = createProject("proj-123", "  My Project  ", "2024-W24", {
      description: "  Description  ",
    });

    expect(project.title).toBe("My Project");
    expect(project.description).toBe("Description");
  });

  it("should create a project without description when not provided", () => {
    const project = createProject("proj-123", "My Project", "2024-W24");
    expect(project.description).toBeUndefined();
  });
});

describe("updateProject", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00.000Z"));
  });

  it("should update title", () => {
    const project = createProject("proj-1", "Original", "2024-W24");
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));

    const updated = updateProject(project, { title: "Updated" });

    expect(updated.title).toBe("Updated");
    expect(updated.updatedAt).toBe("2024-06-15T12:00:00.000Z");
  });

  it("should update description", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const updated = updateProject(project, { description: "New description" });

    expect(updated.description).toBe("New description");
  });

  it("should update tomatoEstimate", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const updated = updateProject(project, { tomatoEstimate: 15 });

    expect(updated.tomatoEstimate).toBe(15);
  });

  it("should update color", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const updated = updateProject(project, { color: "#3b82f6" });

    expect(updated.color).toBe("#3b82f6");
  });

  it("should update status", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const updated = updateProject(project, { status: "completed" });

    expect(updated.status).toBe("completed");
  });

  it("should trim title and description on update", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const updated = updateProject(project, {
      title: "  New Title  ",
      description: "  New Description  ",
    });

    expect(updated.title).toBe("New Title");
    expect(updated.description).toBe("New Description");
  });

  it("should clear description when set to empty", () => {
    const project = createProject("proj-1", "Project", "2024-W24", {
      description: "Old description",
    });
    const updated = updateProject(project, { description: "" });

    expect(updated.description).toBeUndefined();
  });

  it("should preserve other fields when partially updating", () => {
    const project = createProject("proj-1", "Project", "2024-W24", {
      description: "Description",
      tomatoEstimate: 10,
      color: "#ef4444",
    });

    const updated = updateProject(project, { title: "New Title" });

    expect(updated.description).toBe("Description");
    expect(updated.tomatoEstimate).toBe(10);
    expect(updated.color).toBe("#ef4444");
    expect(updated.weekId).toBe("2024-W24");
    expect(updated.status).toBe("active");
  });
});

describe("completeProject", () => {
  it("should mark project as completed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00.000Z"));

    const project = createProject("proj-1", "Project", "2024-W24");
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));

    const completed = completeProject(project);

    expect(completed.status).toBe("completed");
    expect(completed.updatedAt).toBe("2024-06-15T12:00:00.000Z");
  });
});

describe("archiveProject", () => {
  it("should mark project as archived", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00.000Z"));

    const project = createProject("proj-1", "Project", "2024-W24");
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));

    const archived = archiveProject(project);

    expect(archived.status).toBe("archived");
    expect(archived.updatedAt).toBe("2024-06-15T12:00:00.000Z");
  });
});

describe("isProjectActive", () => {
  it("should return true for active project", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    expect(isProjectActive(project)).toBe(true);
  });

  it("should return false for completed project", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const completed = completeProject(project);
    expect(isProjectActive(completed)).toBe(false);
  });

  it("should return false for archived project", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const archived = archiveProject(project);
    expect(isProjectActive(archived)).toBe(false);
  });
});

describe("isProjectCompleted", () => {
  it("should return true for completed project", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    const completed = completeProject(project);
    expect(isProjectCompleted(completed)).toBe(true);
  });

  it("should return false for active project", () => {
    const project = createProject("proj-1", "Project", "2024-W24");
    expect(isProjectCompleted(project)).toBe(false);
  });
});

describe("getCurrentWeekId", () => {
  it("should return the current week ID", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T00:00:00.000Z"));

    const weekId = getCurrentWeekId();

    // June 15, 2024 should be week 24 of 2024
    expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    expect(weekId).toBe("2024-W24");
  });
});

describe("getWeekId", () => {
  it("should return correct week ID for a mid-year date", () => {
    // June 15, 2024 is in week 24 of 2024
    const date = new Date("2024-06-15");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2024-W24");
  });

  it("should return correct week ID for Monday of week 1", () => {
    // January 1, 2024 is Monday of week 1
    const date = new Date("2024-01-01");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2024-W01");
  });

  // ISO 8601 year boundary edge cases
  it("should handle 2021-01-01 as week 53 of 2020", () => {
    // January 1, 2021 is Friday, belongs to week 53 of 2020
    const date = new Date("2021-01-01");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2020-W53");
  });

  it("should handle 2022-01-01 as week 52 of 2021", () => {
    // January 1, 2022 is Saturday, belongs to week 52 of 2021
    const date = new Date("2022-01-01");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2021-W52");
  });

  it("should handle 2018-12-31 as week 1 of 2019", () => {
    // December 31, 2018 is Monday, belongs to week 1 of 2019
    const date = new Date("2018-12-31");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2019-W01");
  });

  it("should handle 2024-12-30 as week 1 of 2025", () => {
    // December 30, 2024 is Monday, belongs to week 1 of 2025
    const date = new Date("2024-12-30");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2025-W01");
  });

  it("should handle 2020-12-31 as week 53 of 2020", () => {
    // December 31, 2020 is Thursday, belongs to week 53 of 2020
    const date = new Date("2020-12-31");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2020-W53");
  });

  it("should handle 2016-01-03 as week 53 of 2015", () => {
    // January 3, 2016 is Sunday, belongs to week 53 of 2015
    const date = new Date("2016-01-03");
    const weekId = getWeekId(date);

    expect(weekId).toBe("2015-W53");
  });

  it("should use YYYY-Www format", () => {
    const date = new Date("2024-06-15");
    const weekId = getWeekId(date);

    expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getWeekStart", () => {
  it("should return Monday of the week", () => {
    // Wednesday, June 12, 2024 (UTC)
    const date = new Date("2024-06-12T00:00:00.000Z");
    const weekStart = getWeekStart(date);

    // Should be Monday, June 10, 2024 (UTC)
    expect(weekStart.getUTCDay()).toBe(1); // Monday
    expect(weekStart.getUTCDate()).toBe(10);
  });

  it("should return same Monday if date is Monday", () => {
    const date = new Date("2024-06-10T00:00:00.000Z"); // Monday (UTC)
    const weekStart = getWeekStart(date);

    expect(weekStart.getUTCDate()).toBe(10);
  });

  it("should return previous Monday if date is Sunday", () => {
    const date = new Date("2024-06-16T00:00:00.000Z"); // Sunday (UTC)
    const weekStart = getWeekStart(date);

    expect(weekStart.getUTCDay()).toBe(1); // Monday
    expect(weekStart.getUTCDate()).toBe(10);
  });
});

describe("getWeekEnd", () => {
  it("should return Sunday of the week", () => {
    // Wednesday, June 12, 2024 (UTC)
    const date = new Date("2024-06-12T00:00:00.000Z");
    const weekEnd = getWeekEnd(date);

    // Should be Sunday, June 16, 2024 (UTC)
    expect(weekEnd.getUTCDay()).toBe(0); // Sunday
    expect(weekEnd.getUTCDate()).toBe(16);
  });

  it("should return same Sunday if date is Sunday", () => {
    const date = new Date("2024-06-16T00:00:00.000Z"); // Sunday (UTC)
    const weekEnd = getWeekEnd(date);

    expect(weekEnd.getUTCDay()).toBe(0); // Sunday
    expect(weekEnd.getUTCDate()).toBe(16);
  });
});

describe("getNextProjectColor", () => {
  it("should return first color for zero count", () => {
    const color = getNextProjectColor(0);
    expect(color).toBe(PROJECT_COLORS[0]);
  });

  it("should return second color for count 1", () => {
    const color = getNextProjectColor(1);
    expect(color).toBe(PROJECT_COLORS[1]);
  });

  it("should cycle through colors", () => {
    const color1 = getNextProjectColor(10);
    expect(color1).toBe(PROJECT_COLORS[0]); // 10 % 10 = 0

    const color2 = getNextProjectColor(11);
    expect(color2).toBe(PROJECT_COLORS[1]); // 11 % 10 = 1
  });

  it("should return colors from predefined list", () => {
    for (let i = 0; i < 20; i++) {
      const color = getNextProjectColor(i);
      expect(PROJECT_COLORS).toContain(color);
    }
  });
});

describe("PROJECT_COLORS", () => {
  it("should have 10 predefined colors", () => {
    expect(PROJECT_COLORS.length).toBe(10);
  });

  it("should contain valid hex color strings", () => {
    for (const color of PROJECT_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
