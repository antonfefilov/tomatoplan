/**
 * Tests for project-analytics module
 */

import { describe, it, expect } from "vitest";
import type { Task } from "../src/models/task.js";
import type { Project } from "../src/models/project.js";
import {
  getProjectTaskCounts,
  getProjectProgressMap,
  getOverallProjectMetrics,
  getProjectProgressPercent,
  getProgressColor,
  getCapacityColor,
  isOverCapacity,
  getCapacityUsagePercent,
  formatMinutesToHoursMinutes,
} from "../src/models/project-analytics.js";
import type { WeeklyState } from "../src/models/weekly-state.js";

const mockProjects: Project[] = [
  {
    id: "project-1",
    title: "Project 1",
    tomatoEstimate: 10,
    status: "active",
    weekId: "2024-W24",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "project-2",
    title: "Project 2",
    tomatoEstimate: 15,
    status: "active",
    weekId: "2024-W24",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "project-3",
    title: "Project 3",
    tomatoEstimate: 5,
    status: "completed",
    weekId: "2024-W24",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "project-4",
    title: "Project 4",
    tomatoEstimate: 8,
    status: "archived",
    weekId: "2024-W24",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Task 1",
    tomatoCount: 3,
    finishedTomatoCount: 2,
    projectId: "project-1",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Task 2",
    tomatoCount: 2,
    finishedTomatoCount: 1,
    projectId: "project-1",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "task-3",
    title: "Task 3",
    tomatoCount: 5,
    finishedTomatoCount: 3,
    projectId: "project-2",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
  {
    id: "task-4",
    title: "Task 4",
    tomatoCount: 1,
    finishedTomatoCount: 0,
    projectId: "project-3",
    createdAt: "2024-06-10T10:00:00.000Z",
    updatedAt: "2024-06-10T10:00:00.000Z",
  },
];

describe("getProjectTaskCounts", () => {
  it("should return correct task counts per project", () => {
    const counts = getProjectTaskCounts(mockTasks, mockProjects);

    expect(counts["project-1"]).toBe(2);
    expect(counts["project-2"]).toBe(1);
    expect(counts["project-3"]).toBe(1);
    expect(counts["project-4"]).toBe(0);
  });

  it("should return empty object for empty projects", () => {
    const counts = getProjectTaskCounts(mockTasks, []);
    expect(counts).toEqual({});
  });

  it("should return zeros for projects with no tasks", () => {
    const counts = getProjectTaskCounts([], mockProjects);

    expect(counts["project-1"]).toBe(0);
    expect(counts["project-2"]).toBe(0);
  });
});

describe("getProjectProgressMap", () => {
  it("should return progress data per project", () => {
    const progress = getProjectProgressMap(mockTasks, mockProjects);

    // Project 1: 2 + 1 = 3 finished, 10 estimated
    expect(progress["project-1"]).toEqual({ finished: 3, estimated: 10 });

    // Project 2: 3 finished, 15 estimated
    expect(progress["project-2"]).toEqual({ finished: 3, estimated: 15 });

    // Project 3: 0 finished, 5 estimated
    expect(progress["project-3"]).toEqual({ finished: 0, estimated: 5 });

    // Project 4: 0 finished, 8 estimated
    expect(progress["project-4"]).toEqual({ finished: 0, estimated: 8 });
  });

  it("should return empty object for empty projects", () => {
    const progress = getProjectProgressMap(mockTasks, []);
    expect(progress).toEqual({});
  });
});

describe("getOverallProjectMetrics", () => {
  it("should return correct overall metrics", () => {
    const state: WeeklyState = {
      pool: {
        weeklyCapacity: 100,
        capacityInMinutes: 25,
        weekId: "2024-W24",
        weekStartDate: "2024-06-10",
        weekEndDate: "2024-06-16",
      },
      projects: mockProjects,
      tasks: mockTasks,
      tracks: [],
      version: 2,
    };

    const metrics = getOverallProjectMetrics(state);

    // Only active projects count toward planned
    expect(metrics.totalPlanned).toBe(25); // 10 + 15 (only active)
    expect(metrics.totalFinished).toBe(6); // 3 + 3 from tasks
    expect(metrics.projectCount).toBe(4);
    expect(metrics.activeProjectCount).toBe(2);
    expect(metrics.completedProjectCount).toBe(1);
    expect(metrics.archivedProjectCount).toBe(1);
    expect(metrics.remainingCapacity).toBe(75); // 100 - 25
    expect(metrics.weeklyCapacity).toBe(100);
  });

  it("should handle empty state", () => {
    const state: WeeklyState = {
      pool: {
        weeklyCapacity: 125,
        capacityInMinutes: 25,
        weekId: "2024-W24",
        weekStartDate: "2024-06-10",
        weekEndDate: "2024-06-16",
      },
      projects: [],
      tasks: [],
      tracks: [],
      version: 2,
    };

    const metrics = getOverallProjectMetrics(state);

    expect(metrics.totalPlanned).toBe(0);
    expect(metrics.totalFinished).toBe(0);
    expect(metrics.projectCount).toBe(0);
    expect(metrics.activeProjectCount).toBe(0);
    expect(metrics.remainingCapacity).toBe(125);
  });
});

describe("getProjectProgressPercent", () => {
  it("should calculate progress percentage", () => {
    expect(getProjectProgressPercent(5, 10)).toBe(50);
    expect(getProjectProgressPercent(7, 10)).toBe(70);
    expect(getProjectProgressPercent(10, 10)).toBe(100);
  });

  it("should cap at 100%", () => {
    expect(getProjectProgressPercent(15, 10)).toBe(100);
  });

  it("should return 0 for zero estimated", () => {
    expect(getProjectProgressPercent(5, 0)).toBe(0);
  });
});

describe("getProgressColor", () => {
  it("should return green for 100% or more", () => {
    expect(getProgressColor(100)).toBe("#22c55e");
    expect(getProgressColor(110)).toBe("#22c55e");
  });

  it("should return lime for 75-99%", () => {
    expect(getProgressColor(75)).toBe("#84cc16");
    expect(getProgressColor(80)).toBe("#84cc16");
    expect(getProgressColor(99)).toBe("#84cc16");
  });

  it("should return amber for 50-74%", () => {
    expect(getProgressColor(50)).toBe("#f59e0b");
    expect(getProgressColor(60)).toBe("#f59e0b");
    expect(getProgressColor(74)).toBe("#f59e0b");
  });

  it("should return project color or red for less than 50%", () => {
    expect(getProgressColor(40)).toBe("#ef4444");
    expect(getProgressColor(30, "#3b82f6")).toBe("#3b82f6");
  });
});

describe("getCapacityColor", () => {
  it("should return red for over 100%", () => {
    expect(getCapacityColor(110)).toBe("#ef4444");
    expect(getCapacityColor(150)).toBe("#ef4444");
  });

  it("should return amber for 90-100%", () => {
    expect(getCapacityColor(90)).toBe("#f59e0b");
    expect(getCapacityColor(95)).toBe("#f59e0b");
    expect(getCapacityColor(100)).toBe("#f59e0b");
  });

  it("should return lime for 70-89%", () => {
    expect(getCapacityColor(70)).toBe("#84cc16");
    expect(getCapacityColor(80)).toBe("#84cc16");
    expect(getCapacityColor(89)).toBe("#84cc16");
  });

  it("should return green for less than 70%", () => {
    expect(getCapacityColor(50)).toBe("#22c55e");
    expect(getCapacityColor(0)).toBe("#22c55e");
  });
});

describe("isOverCapacity", () => {
  it("should return true when planned exceeds capacity", () => {
    expect(isOverCapacity(110, 100)).toBe(true);
  });

  it("should return false when planned equals capacity", () => {
    expect(isOverCapacity(100, 100)).toBe(false);
  });

  it("should return false when planned is less than capacity", () => {
    expect(isOverCapacity(50, 100)).toBe(false);
  });
});

describe("getCapacityUsagePercent", () => {
  it("should calculate capacity usage percentage", () => {
    expect(getCapacityUsagePercent(50, 100)).toBe(50);
    expect(getCapacityUsagePercent(25, 100)).toBe(25);
    expect(getCapacityUsagePercent(100, 100)).toBe(100);
  });

  it("should handle over 100%", () => {
    expect(getCapacityUsagePercent(150, 100)).toBe(150);
  });

  it("should return 0 for zero capacity", () => {
    expect(getCapacityUsagePercent(50, 0)).toBe(0);
  });
});

describe("formatMinutesToHoursMinutes", () => {
  it("should format minutes correctly", () => {
    expect(formatMinutesToHoursMinutes(25)).toBe("25m");
    expect(formatMinutesToHoursMinutes(60)).toBe("1h");
    expect(formatMinutesToHoursMinutes(90)).toBe("1h 30m");
    expect(formatMinutesToHoursMinutes(200)).toBe("3h 20m");
  });

  it("should handle zero", () => {
    expect(formatMinutesToHoursMinutes(0)).toBe("0m");
  });
});
