/**
 * Tests for WeeklyState model
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInitialWeeklyState,
  resetWeeklyStateForNewWeek,
  getProjectProgress,
  getProjectTasks,
  getWeeklyRemaining,
  getCurrentWeekIdFromState,
  isStateCurrentWeek,
  getTotalProjectEstimates,
  isWeeklyOverCapacity,
  getProjectById,
  getActiveProjects,
  getTotalProjectFinishedTomatoes,
  getUnassignedTasks,
  getProjectPlannedTomatoes,
  formatMinutesToHoursMinutes,
  WEEKLY_STATE_VERSION,
} from "../src/models/weekly-state.js";
import type { Task } from "../src/models/task.js";
import type { Project } from "../src/models/project.js";
import { createProject } from "../src/models/project.js";

describe("createInitialWeeklyState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should create initial state with default values", () => {
    const state = createInitialWeeklyState();

    expect(state.pool.weeklyCapacity).toBe(125); // 25 * 5
    expect(state.pool.capacityInMinutes).toBe(25);
    expect(state.projects).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.version).toBe(WEEKLY_STATE_VERSION);
  });

  it("should create initial state with custom daily capacity", () => {
    const state = createInitialWeeklyState(20);

    expect(state.pool.weeklyCapacity).toBe(100); // 20 * 5
  });

  it("should create initial state with custom capacity in minutes", () => {
    const state = createInitialWeeklyState(25, 30);

    expect(state.pool.capacityInMinutes).toBe(30);
  });

  it("should have correct week dates", () => {
    const state = createInitialWeeklyState();

    expect(state.pool.weekId).toMatch(/^\d{4}-W\d{2}$/);
    expect(state.pool.weekStartDate).toBeDefined();
    expect(state.pool.weekEndDate).toBeDefined();
  });
});

describe("resetWeeklyStateForNewWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should create fresh state for new week", () => {
    const oldState = createInitialWeeklyState();
    // Add a project to old state
    const project = createProject("proj-1", "Project", "2024-W24");

    const stateWithProject = {
      ...oldState,
      projects: [project] as readonly Project[],
    };

    vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z")); // Next week
    const newState = resetWeeklyStateForNewWeek(stateWithProject);

    expect(newState.projects).toEqual([]);
    expect(newState.tasks).toEqual([]);
    expect(newState.pool.weekId).not.toBe(stateWithProject.pool.weekId);
  });

  it("should preserve capacity settings", () => {
    const oldState = createInitialWeeklyState(20, 30);
    const newState = resetWeeklyStateForNewWeek(oldState);

    expect(newState.pool.capacityInMinutes).toBe(30);
  });

  it("should accept new capacity values", () => {
    const oldState = createInitialWeeklyState(25, 25);
    const newState = resetWeeklyStateForNewWeek(oldState, 15, 20);

    expect(newState.pool.weeklyCapacity).toBe(75); // 15 * 5
    expect(newState.pool.capacityInMinutes).toBe(20);
  });
});

describe("getCurrentWeekIdFromState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return week ID from state", () => {
    const state = createInitialWeeklyState();
    const weekId = getCurrentWeekIdFromState(state);

    expect(weekId).toBe(state.pool.weekId);
  });
});

describe("isStateCurrentWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return true for current week state", () => {
    const state = createInitialWeeklyState();
    expect(isStateCurrentWeek(state)).toBe(true);
  });

  it("should return false for past week state", () => {
    vi.setSystemTime(new Date("2024-06-22T10:00:00.000Z"));
    // Create a state manually with a past week pool
    const pastState = {
      ...createInitialWeeklyState(),
      pool: {
        ...createInitialWeeklyState().pool,
        weekId: "2024-W23", // Previous week
      },
    };

    expect(isStateCurrentWeek(pastState)).toBe(false);
  });
});

describe("getTotalProjectEstimates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return 0 for empty projects", () => {
    const state = createInitialWeeklyState();
    expect(getTotalProjectEstimates(state)).toBe(0);
  });

  it("should sum estimates from active projects", () => {
    const state = createInitialWeeklyState();
    const project1 = createProject("proj-1", "Project 1", "2024-W24", {
      tomatoEstimate: 10,
    });
    const project2 = createProject("proj-2", "Project 2", "2024-W24", {
      tomatoEstimate: 15,
    });

    const stateWithProjects = {
      ...state,
      projects: [project1, project2] as readonly Project[],
    };

    expect(getTotalProjectEstimates(stateWithProjects)).toBe(25);
  });

  it("should only count active projects", () => {
    const state = createInitialWeeklyState();
    const activeProject = createProject("proj-1", "Active", "2024-W24", {
      tomatoEstimate: 10,
    });
    const completedProject = createProject("proj-2", "Completed", "2024-W24", {
      tomatoEstimate: 15,
    });
    const completedProjectUpdated = {
      ...completedProject,
      status: "completed" as const,
    };

    const stateWithProjects = {
      ...state,
      projects: [activeProject, completedProjectUpdated] as readonly Project[],
    };

    expect(getTotalProjectEstimates(stateWithProjects)).toBe(10);
  });
});

describe("getWeeklyRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return full capacity when no projects", () => {
    const state = createInitialWeeklyState(25); // 125 weekly capacity
    expect(getWeeklyRemaining(state)).toBe(125);
  });

  it("should subtract project estimates from capacity", () => {
    const state = createInitialWeeklyState(25);
    const project = createProject("proj-1", "Project", "2024-W24", {
      tomatoEstimate: 50,
    });

    const stateWithProject = {
      ...state,
      projects: [project] as readonly Project[],
    };

    expect(getWeeklyRemaining(stateWithProject)).toBe(75);
  });
});

describe("isWeeklyOverCapacity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return false when under capacity", () => {
    const state = createInitialWeeklyState(25);
    expect(isWeeklyOverCapacity(state)).toBe(false);
  });

  it("should return true when over capacity", () => {
    const state = createInitialWeeklyState(25); // 125 capacity
    const project = createProject("proj-1", "Project", "2024-W24", {
      tomatoEstimate: 150,
    });

    const stateWithProject = {
      ...state,
      projects: [project] as readonly Project[],
    };

    expect(isWeeklyOverCapacity(stateWithProject)).toBe(true);
  });

  it("should return false at exact capacity", () => {
    const state = createInitialWeeklyState(25); // 125 capacity
    const project = createProject("proj-1", "Project", "2024-W24", {
      tomatoEstimate: 125,
    });

    const stateWithProject = {
      ...state,
      projects: [project] as readonly Project[],
    };

    expect(isWeeklyOverCapacity(stateWithProject)).toBe(false);
  });
});

describe("getProjectById", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return project by ID", () => {
    const state = createInitialWeeklyState();
    const project = createProject("proj-1", "Project", "2024-W24");

    const stateWithProject = {
      ...state,
      projects: [project] as readonly Project[],
    };

    const found = getProjectById(stateWithProject, "proj-1");
    expect(found).toBe(project);
  });

  it("should return undefined for non-existent project", () => {
    const state = createInitialWeeklyState();
    const found = getProjectById(state, "non-existent");
    expect(found).toBeUndefined();
  });
});

describe("getActiveProjects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return only active projects", () => {
    const state = createInitialWeeklyState();
    const activeProject = createProject("proj-1", "Active", "2024-W24");
    const completedProject = {
      ...createProject("proj-2", "Completed", "2024-W24"),
      status: "completed" as const,
    };
    const archivedProject = {
      ...createProject("proj-3", "Archived", "2024-W24"),
      status: "archived" as const,
    };

    const stateWithProjects = {
      ...state,
      projects: [
        activeProject,
        completedProject,
        archivedProject,
      ] as readonly Project[],
    };

    const active = getActiveProjects(stateWithProjects);
    expect(active.length).toBe(1);
    expect(active[0]!.id).toBe("proj-1");
  });

  it("should return empty array when no active projects", () => {
    const state = createInitialWeeklyState();
    expect(getActiveProjects(state)).toEqual([]);
  });
});

describe("getProjectTasks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return tasks for a specific project", () => {
    const state = createInitialWeeklyState();
    const task1: Task = {
      id: "task-1",
      title: "Task 1",
      tomatoCount: 3,
      finishedTomatoCount: 1,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };
    const task2: Task = {
      id: "task-2",
      title: "Task 2",
      tomatoCount: 2,
      finishedTomatoCount: 0,
      projectId: "proj-2",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };

    const stateWithTasks = {
      ...state,
      tasks: [task1, task2] as readonly Task[],
    };

    const projectTasks = getProjectTasks(stateWithTasks, "proj-1");
    expect(projectTasks.length).toBe(1);
    expect(projectTasks[0]!.id).toBe("task-1");
  });

  it("should return empty array for project with no tasks", () => {
    const state = createInitialWeeklyState();
    expect(getProjectTasks(state, "proj-1")).toEqual([]);
  });
});

describe("getProjectProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return progress for project with tasks", () => {
    const state = createInitialWeeklyState();
    const project = createProject("proj-1", "Project", "2024-W24", {
      tomatoEstimate: 10,
    });
    const task1: Task = {
      id: "task-1",
      title: "Task 1",
      tomatoCount: 3,
      finishedTomatoCount: 2,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };
    const task2: Task = {
      id: "task-2",
      title: "Task 2",
      tomatoCount: 2,
      finishedTomatoCount: 1,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };

    const stateWithData = {
      ...state,
      projects: [project] as readonly Project[],
      tasks: [task1, task2] as readonly Task[],
    };

    const progress = getProjectProgress(stateWithData, "proj-1");
    expect(progress.finished).toBe(3); // 2 + 1
    expect(progress.estimated).toBe(10);
  });

  it("should return zeros for non-existent project", () => {
    const state = createInitialWeeklyState();
    const progress = getProjectProgress(state, "non-existent");

    expect(progress.finished).toBe(0);
    expect(progress.estimated).toBe(0);
  });
});

describe("getTotalProjectFinishedTomatoes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should sum finished tomatoes for project tasks", () => {
    const state = createInitialWeeklyState();
    const task1: Task = {
      id: "task-1",
      title: "Task 1",
      tomatoCount: 3,
      finishedTomatoCount: 2,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };
    const task2: Task = {
      id: "task-2",
      title: "Task 2",
      tomatoCount: 2,
      finishedTomatoCount: 0,
      projectId: undefined,
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };

    const stateWithTasks = {
      ...state,
      tasks: [task1, task2] as readonly Task[],
    };

    expect(getTotalProjectFinishedTomatoes(stateWithTasks)).toBe(2);
  });

  it("should return 0 when no project tasks", () => {
    const state = createInitialWeeklyState();
    expect(getTotalProjectFinishedTomatoes(state)).toBe(0);
  });
});

describe("getUnassignedTasks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should return tasks without project", () => {
    const state = createInitialWeeklyState();
    const task1: Task = {
      id: "task-1",
      title: "Task 1",
      tomatoCount: 3,
      finishedTomatoCount: 0,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };
    const task2: Task = {
      id: "task-2",
      title: "Task 2",
      tomatoCount: 2,
      finishedTomatoCount: 0,
      projectId: undefined,
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };

    const stateWithTasks = {
      ...state,
      tasks: [task1, task2] as readonly Task[],
    };

    const unassigned = getUnassignedTasks(stateWithTasks);
    expect(unassigned.length).toBe(1);
    expect(unassigned[0]!.id).toBe("task-2");
  });
});

describe("getProjectPlannedTomatoes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));
  });

  it("should sum tomatoCount for project tasks", () => {
    const state = createInitialWeeklyState();
    const task1: Task = {
      id: "task-1",
      title: "Task 1",
      tomatoCount: 3,
      finishedTomatoCount: 0,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };
    const task2: Task = {
      id: "task-2",
      title: "Task 2",
      tomatoCount: 2,
      finishedTomatoCount: 0,
      projectId: "proj-1",
      createdAt: "2024-06-15T10:00:00.000Z",
      updatedAt: "2024-06-15T10:00:00.000Z",
    };

    const stateWithTasks = {
      ...state,
      tasks: [task1, task2] as readonly Task[],
    };

    expect(getProjectPlannedTomatoes(stateWithTasks, "proj-1")).toBe(5);
  });

  it("should return 0 for project with no tasks", () => {
    const state = createInitialWeeklyState();
    expect(getProjectPlannedTomatoes(state, "proj-1")).toBe(0);
  });
});

describe("formatMinutesToHoursMinutes", () => {
  it("should format minutes under 60", () => {
    expect(formatMinutesToHoursMinutes(45)).toBe("45m");
  });

  it("should format exact hours", () => {
    expect(formatMinutesToHoursMinutes(120)).toBe("2h");
  });

  it("should format hours and minutes", () => {
    expect(formatMinutesToHoursMinutes(150)).toBe("2h 30m");
  });

  it("should handle zero minutes", () => {
    expect(formatMinutesToHoursMinutes(0)).toBe("0m");
  });

  it("should handle large values", () => {
    expect(formatMinutesToHoursMinutes(625)).toBe("10h 25m");
  });
});

describe("WEEKLY_STATE_VERSION", () => {
  it("should be defined", () => {
    expect(WEEKLY_STATE_VERSION).toBe(1);
  });
});
