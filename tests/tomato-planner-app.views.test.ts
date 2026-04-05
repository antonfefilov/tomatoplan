/**
 * Tests for TomatoPlannerApp view switching and render branching
 * Covers Day/Week/Projects tabs, render modes, and weekly integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PlannerState } from "../src/models/planner-state.js";
import type { WeeklyState } from "../src/models/weekly-state.js";
import type { TimerState } from "../src/models/timer-state.js";
import type { Task } from "../src/models/task.js";
import type { Project } from "../src/models/project.js";

// Use vi.hoisted to create shared backing state before mocks are hoisted
// Wrap in objects to allow mutation (hoisted returns constants)
const mockState = vi.hoisted(() => {
  return {
    plannerDate: "2024-06-15",
    plannerDayTasks: [] as Task[],
  };
});

// Mock taskpoolStore - the canonical source for tasks
vi.mock("../src/state/taskpool-store.js", () => ({
  taskpoolStore: {
    subscribe: vi.fn(),
    getTasksForDay: vi.fn().mockImplementation((date: string) => {
      // Return tasks only for the matching date
      if (date === mockState.plannerDate) {
        return mockState.plannerDayTasks;
      }
      return [];
    }),
    getAllTasks: vi.fn().mockImplementation(() => {
      // Return all tasks for weeklyStore compatibility
      return mockState.plannerDayTasks;
    }),
    addTask: vi.fn().mockReturnValue({ success: true, taskId: "test-task-id" }),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
    assignTomato: vi.fn(),
    unassignTomato: vi.fn(),
    markTomatoAsFinished: vi.fn(),
    markTomatoAsUnfinished: vi.fn(),
    reorderTask: vi.fn(),
    getTaskById: vi.fn(),
    setTaskProject: vi.fn(),
    markTaskDone: vi.fn(),
    importTasks: vi.fn(),
  },
}));

// Mock plannerStore - tasks is now a getter that derives from taskpoolStore
// Note: The getter uses the hoisted state directly, not a local mock reference
vi.mock("../src/state/planner-store.js", () => ({
  plannerStore: {
    subscribe: vi.fn(),
    setCapacity: vi.fn(),
    setCapacityInMinutes: vi.fn(),
    setDayStart: vi.fn(),
    setDayEnd: vi.fn(),
    addTask: vi.fn().mockReturnValue({ success: true, taskId: "test-task-id" }),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
    assignTomato: vi.fn(),
    unassignTomato: vi.fn(),
    markTomatoAsFinished: vi.fn(),
    markTomatoAsUnfinished: vi.fn(),
    reorderTask: vi.fn(),
    resetDay: vi.fn(),
    getTaskById: vi.fn(),
    setTaskProject: vi.fn(),
    markTaskDone: vi.fn(),
    assignTaskToToday: vi.fn(),
    assignedTomatoes: 3,
    remainingTomatoes: 7,
    capacityInMinutes: 25,
    // tasks is now a getter that derives from hoisted state
    // This matches production behavior where tasks are derived from taskpoolStore
    get tasks() {
      return mockState.plannerDayTasks;
    },
  },
}));

// Mock weeklyStore
vi.mock("../src/state/weekly-store.js", () => ({
  weeklyStore: {
    subscribe: vi.fn(),
    setWeeklyCapacity: vi.fn(),
    addProject: vi
      .fn()
      .mockReturnValue({ success: true, projectId: "test-project-id" }),
    updateProject: vi.fn(),
    removeProject: vi.fn(),
    incrementProjectEstimate: vi.fn(),
    decrementProjectEstimate: vi.fn(),
    syncTasks: vi.fn(),
    tasks: [],
  },
}));

// Mock timerStore
vi.mock("../src/state/timer-store.js", () => ({
  timerStore: {
    subscribe: vi.fn(),
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    resetTimer: vi.fn(),
    clearTimerForTask: vi.fn(),
  },
}));

// Mock project-coordinator
vi.mock("../src/state/project-coordinator.js", () => ({
  removeProject: vi.fn(),
}));

// Import component and dependent elements after mocking
import "../src/components/app/tomato-planner-app.js";
import type { TomatoPlannerApp } from "../src/components/app/tomato-planner-app.js";
import { plannerStore } from "../src/state/planner-store.js";
import { weeklyStore } from "../src/state/weekly-store.js";
import { timerStore } from "../src/state/timer-store.js";
import { taskpoolStore } from "../src/state/taskpool-store.js";

// Import all required custom elements
import "../src/components/layout/app-shell.js";
import "../src/components/layout/app-header.js";
import "../src/components/pool/tomato-pool-panel.js";
import "../src/components/pool/week-tomato-pool-panel.js";
import "../src/components/task/task-list-panel.js";
import "../src/components/task/task-list.js";
import "../src/components/task/task-item.js";
import "../src/components/task/task-editor-dialog.js";
import "../src/components/task/tasks-pool-panel.js";
import "../src/components/task/tasks-view-panel.js";
import "../src/components/project/project-list-panel.js";
import "../src/components/project/project-list.js";
import "../src/components/project/project-item.js";
import "../src/components/project/projects-analytics-panel.js";
import "../src/components/project/project-editor-dialog.js";
import "../src/components/shared/confirm-dialog.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/tomato/tomato-pool-visual.js";
import "../src/components/shared/dropdown-menu.js";
import "../src/components/shared/empty-state.js";

const mockPlannerStore = plannerStore as unknown as {
  subscribe: ReturnType<typeof vi.fn>;
  setCapacity: ReturnType<typeof vi.fn>;
  setCapacityInMinutes: ReturnType<typeof vi.fn>;
  setDayStart: ReturnType<typeof vi.fn>;
  setDayEnd: ReturnType<typeof vi.fn>;
  addTask: ReturnType<typeof vi.fn>;
  updateTask: ReturnType<typeof vi.fn>;
  removeTask: ReturnType<typeof vi.fn>;
  assignTomato: ReturnType<typeof vi.fn>;
  unassignTomato: ReturnType<typeof vi.fn>;
  markTomatoAsFinished: ReturnType<typeof vi.fn>;
  markTomatoAsUnfinished: ReturnType<typeof vi.fn>;
  reorderTask: ReturnType<typeof vi.fn>;
  resetDay: ReturnType<typeof vi.fn>;
  getTaskById: ReturnType<typeof vi.fn>;
  setTaskProject: ReturnType<typeof vi.fn>;
  markTaskDone: ReturnType<typeof vi.fn>;
  assignTaskToToday: ReturnType<typeof vi.fn>;
  assignedTomatoes: number;
  remainingTomatoes: number;
  capacityInMinutes: number;
  readonly tasks: readonly Task[];
};

const mockTaskpoolStore = taskpoolStore as unknown as {
  subscribe: ReturnType<typeof vi.fn>;
  getTasksForDay: ReturnType<typeof vi.fn>;
  getAllTasks: ReturnType<typeof vi.fn>;
  addTask: ReturnType<typeof vi.fn>;
  updateTask: ReturnType<typeof vi.fn>;
  removeTask: ReturnType<typeof vi.fn>;
  assignTomato: ReturnType<typeof vi.fn>;
  unassignTomato: ReturnType<typeof vi.fn>;
  markTomatoAsFinished: ReturnType<typeof vi.fn>;
  markTomatoAsUnfinished: ReturnType<typeof vi.fn>;
  reorderTask: ReturnType<typeof vi.fn>;
  getTaskById: ReturnType<typeof vi.fn>;
  setTaskProject: ReturnType<typeof vi.fn>;
  markTaskDone: ReturnType<typeof vi.fn>;
  importTasks: ReturnType<typeof vi.fn>;
};

const mockWeeklyStore = weeklyStore as unknown as {
  subscribe: ReturnType<typeof vi.fn>;
  setWeeklyCapacity: ReturnType<typeof vi.fn>;
  addProject: ReturnType<typeof vi.fn>;
  updateProject: ReturnType<typeof vi.fn>;
  removeProject: ReturnType<typeof vi.fn>;
  incrementProjectEstimate: ReturnType<typeof vi.fn>;
  decrementProjectEstimate: ReturnType<typeof vi.fn>;
  syncTasks: ReturnType<typeof vi.fn>;
  tasks: readonly Task[];
};

const mockTimerStore = timerStore as unknown as {
  subscribe: ReturnType<typeof vi.fn>;
  startTimer: ReturnType<typeof vi.fn>;
  pauseTimer: ReturnType<typeof vi.fn>;
  resumeTimer: ReturnType<typeof vi.fn>;
  resetTimer: ReturnType<typeof vi.fn>;
  clearTimerForTask: ReturnType<typeof vi.fn>;
};

// Helper to create mock planner state
function createMockPlannerState(): PlannerState {
  return {
    pool: {
      dailyCapacity: 10,
      date: "2024-06-15",
      capacityInMinutes: 25,
      dayStart: "08:00",
      dayEnd: "18:25",
    },
    version: 2,
  };
}

// Helper to create mock weekly state
function createMockWeeklyState(
  projects: Project[] = [],
  tasks: Task[] = [],
): WeeklyState {
  return {
    pool: {
      weekId: "2024-W24",
      weekStartDate: "2024-06-10",
      weekEndDate: "2024-06-16",
      weeklyCapacity: 125,
      capacityInMinutes: 25,
    },
    projects,
    tasks,
    tracks: [],
    version: 2,
  };
}

// Helper to create mock timer state
function createMockTimerState(): TimerState {
  return {
    activeTaskId: null,
    status: "idle",
    remainingSeconds: 0,
    totalSeconds: 0,
    startedAt: null,
    pausedAt: null,
    completedAt: null,
  };
}

// Helper to create mock project
function createMockProject(
  id: string,
  title: string,
  tomatoEstimate = 5,
): Project {
  return {
    id,
    title,
    tomatoEstimate,
    weekId: "2024-W24",
    status: "active",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
    color: "#ef4444",
  };
}

// Helper to create mock task (used in other tests)
function createMockTask(id: string, title: string, projectId?: string): Task {
  return {
    id,
    title,
    tomatoCount: 2,
    finishedTomatoCount: 0,
    projectId,
    createdAt: "2024-06-15T00:00:00.000Z",
    updatedAt: "2024-06-15T00:00:00.000Z",
  };
}

/**
 * Helper function to set planner tasks in the mock
 * Updates the shared backing state and configures taskpoolStore mock to return them
 */
function setPlannerTasks(tasks: Task[]) {
  // Update the hoisted state object
  mockState.plannerDayTasks.splice(
    0,
    mockState.plannerDayTasks.length,
    ...tasks,
  );
  // Update taskpoolStore mocks to return the tasks
  mockTaskpoolStore.getTasksForDay.mockImplementation((date: string) => {
    if (date === mockState.plannerDate) {
      return mockState.plannerDayTasks;
    }
    return [];
  });
  mockTaskpoolStore.getAllTasks.mockReturnValue(mockState.plannerDayTasks);
}

// Export for use in other test files
export {
  createMockPlannerState,
  createMockWeeklyState,
  createMockTimerState,
  createMockProject,
  createMockTask,
  setPlannerTasks,
};

describe("TomatoPlannerApp Views", () => {
  let element: TomatoPlannerApp;
  let plannerUnsubscribe: ReturnType<typeof vi.fn>;
  let weeklyUnsubscribe: ReturnType<typeof vi.fn>;
  let timerUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the hoisted shared backing state for plannerStore.tasks
    mockState.plannerDayTasks.splice(0, mockState.plannerDayTasks.length);
    mockState.plannerDate = "2024-06-15";

    plannerUnsubscribe = vi.fn();
    weeklyUnsubscribe = vi.fn();
    timerUnsubscribe = vi.fn();

    // Set up planner store mock
    mockPlannerStore.subscribe.mockImplementation(
      (callback: (state: PlannerState) => void) => {
        callback(createMockPlannerState());
        return plannerUnsubscribe;
      },
    );
    mockPlannerStore.assignedTomatoes = 3;
    mockPlannerStore.remainingTomatoes = 7;
    mockPlannerStore.capacityInMinutes = 25;
    // Reset planner tasks using helper - tasks is a getter now
    setPlannerTasks([]);

    // Set up weekly store mock
    mockWeeklyStore.tasks = []; // Reset tasks to empty array
    mockWeeklyStore.subscribe.mockImplementation(
      (callback: (state: WeeklyState) => void) => {
        callback(createMockWeeklyState());
        return weeklyUnsubscribe;
      },
    );

    // Set up timer store mock
    mockTimerStore.subscribe.mockImplementation(
      (callback: (state: TimerState) => void) => {
        callback(createMockTimerState());
        return timerUnsubscribe;
      },
    );

    element = document.createElement("tomato-planner-app") as TomatoPlannerApp;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  // ============================================
  // Tab Switching Tests
  // ============================================

  describe("tab switching", () => {
    it("should start with Day view as active", async () => {
      const dayTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='day-view']",
      );
      expect(dayTab!.classList.contains("active")).toBe(true);
      expect(dayTab!.getAttribute("aria-selected")).toBe("true");
    });

    it("should switch to Week view when Week tab is clicked", async () => {
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      expect(weekTab.classList.contains("active")).toBe(true);
      expect(weekTab.getAttribute("aria-selected")).toBe("true");

      // Day tab should no longer be active
      const dayTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='day-view']",
      );
      expect(dayTab!.classList.contains("active")).toBe(false);
    });

    it("should switch to Projects view when Projects tab is clicked", async () => {
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      expect(projectsTab.classList.contains("active")).toBe(true);
      expect(projectsTab.getAttribute("aria-selected")).toBe("true");
    });

    it("should have correct aria attributes on tabs", async () => {
      const tabs = element.shadowRoot!.querySelectorAll(".tab-btn");
      expect(tabs.length).toBe(5); // Day, Week, Projects, Tasks, Tracks

      tabs.forEach((tab) => {
        expect(tab.hasAttribute("role")).toBe(true);
        expect(tab.getAttribute("role")).toBe("tab");
        expect(tab.hasAttribute("aria-selected")).toBe(true);
        expect(tab.hasAttribute("aria-controls")).toBe(true);
      });
    });
  });

  // ============================================
  // Render Branch Tests
  // ============================================

  describe("render branching", () => {
    it("should render Day view content when Day tab is active", async () => {
      // Day view is active by default
      const dayView = element.shadowRoot!.querySelector("#day-view");
      expect(dayView).not.toBeNull();

      const tomatoPoolPanel =
        element.shadowRoot!.querySelector("tomato-pool-panel");
      expect(tomatoPoolPanel).not.toBeNull();

      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel");
      expect(taskListPanel).not.toBeNull();
    });

    it("should render Week view content when Week tab is active", async () => {
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const weekView = element.shadowRoot!.querySelector("#week-view");
      expect(weekView).not.toBeNull();

      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      );
      expect(weekPoolPanel).not.toBeNull();

      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");
      expect(projectListPanel).not.toBeNull();
    });

    it("should render Projects view content when Projects tab is active", async () => {
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      const projectsView = element.shadowRoot!.querySelector("#projects-view");
      expect(projectsView).not.toBeNull();

      const analyticsPanel = element.shadowRoot!.querySelector(
        "projects-analytics-panel",
      );
      expect(analyticsPanel).not.toBeNull();

      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");
      expect(projectListPanel).not.toBeNull();
    });

    it("should not render Day view panels when Week view is active", async () => {
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const tomatoPoolPanel =
        element.shadowRoot!.querySelector("tomato-pool-panel");
      expect(tomatoPoolPanel).toBeNull();

      // Day view content is removed when Week view is active
      const dayView = element.shadowRoot!.querySelector("#day-view");
      expect(dayView).toBeNull();
    });
  });

  // ============================================
  // Week View Mode Tests (planning mode)
  // ============================================

  describe("Week view mode", () => {
    beforeEach(async () => {
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;
    });

    it("should pass planning mode to project-list-panel in Week view", async () => {
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement & { mode: string };
      expect(projectListPanel.mode).toBe("planning");
    });

    it("should pass weeklyCapacity to week-tomato-pool-panel", async () => {
      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      ) as HTMLElement & { weeklyCapacity: number };
      expect(weekPoolPanel.weeklyCapacity).toBe(125);
    });

    it("should dispatch weekly-capacity-change event to weeklyStore", async () => {
      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      )!;

      weekPoolPanel.dispatchEvent(
        new CustomEvent("weekly-capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: 130 },
        }),
      );
      await element.updateComplete;

      expect(mockWeeklyStore.setWeeklyCapacity).toHaveBeenCalledWith(130);
    });
  });

  // ============================================
  // Projects View Mode Tests (analytics mode)
  // ============================================

  describe("Projects view mode", () => {
    beforeEach(async () => {
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;
    });

    it("should pass analytics mode to project-list-panel in Projects view", async () => {
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement & { mode: string };
      expect(projectListPanel.mode).toBe("analytics");
    });

    it("should pass metrics to projects-analytics-panel", async () => {
      const analyticsPanel = element.shadowRoot!.querySelector(
        "projects-analytics-panel",
      ) as HTMLElement & {
        weeklyCapacity: number;
        totalPlanned: number;
        totalFinished: number;
        projectCount: number;
      };

      expect(analyticsPanel.weeklyCapacity).toBe(125);
      expect(analyticsPanel.totalPlanned).toBe(0);
      expect(analyticsPanel.totalFinished).toBe(0);
      expect(analyticsPanel.projectCount).toBe(0);
    });
  });

  // ============================================
  // Weekly Capacity +/- Integration Tests
  // ============================================

  describe("weekly capacity integration", () => {
    beforeEach(async () => {
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;
    });

    it("should call weeklyStore.setWeeklyCapacity when capacity increases", async () => {
      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      )!;

      // Simulate capacity increase
      weekPoolPanel.dispatchEvent(
        new CustomEvent("weekly-capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: 130 },
        }),
      );
      await element.updateComplete;

      expect(mockWeeklyStore.setWeeklyCapacity).toHaveBeenCalledWith(130);
    });

    it("should call weeklyStore.setWeeklyCapacity when capacity decreases", async () => {
      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      )!;

      // Simulate capacity decrease
      weekPoolPanel.dispatchEvent(
        new CustomEvent("weekly-capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: 120 },
        }),
      );
      await element.updateComplete;

      expect(mockWeeklyStore.setWeeklyCapacity).toHaveBeenCalledWith(120);
    });
  });

  // ============================================
  // Project Estimate +/- Integration Tests
  // ============================================

  describe("project estimate integration", () => {
    it("should call weeklyStore.incrementProjectEstimate when estimate increases", async () => {
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");

      // Dispatch event directly from project-list-panel
      projectListPanel!.dispatchEvent(
        new CustomEvent("increase-project-plan", {
          bubbles: true,
          composed: true,
          detail: { projectId: "proj-1" },
        }),
      );
      await element.updateComplete;

      expect(mockWeeklyStore.incrementProjectEstimate).toHaveBeenCalledWith(
        "proj-1",
      );
    });

    it("should call weeklyStore.decrementProjectEstimate when estimate decreases", async () => {
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");

      projectListPanel!.dispatchEvent(
        new CustomEvent("decrease-project-plan", {
          bubbles: true,
          composed: true,
          detail: { projectId: "proj-1" },
        }),
      );
      await element.updateComplete;

      expect(mockWeeklyStore.decrementProjectEstimate).toHaveBeenCalledWith(
        "proj-1",
      );
    });

    // Regression test setup: add projects so project-items render
    beforeEach(async () => {
      // Set up weekly store with a project
      const mockProject = createMockProject("proj-1", "Test Project", 5);
      mockWeeklyStore.subscribe.mockImplementation(
        (callback: (state: WeeklyState) => void) => {
          callback(createMockWeeklyState([mockProject]));
          return weeklyUnsubscribe;
        },
      );
      // Re-render with projects
      vi.clearAllMocks();
      element = document.createElement(
        "tomato-planner-app",
      ) as TomatoPlannerApp;
      document.body.appendChild(element);
      await element.updateComplete;
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;
    });

    it("should call weeklyStore.incrementProjectEstimate exactly once when + button is clicked in Week view (regression test for 4x bubbling bug)", async () => {
      // Clear any previous calls
      mockWeeklyStore.incrementProjectEstimate.mockClear();

      // Get project-list-panel and find project-item
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement;
      const projectList = projectListPanel.shadowRoot!.querySelector(
        "project-list",
      ) as HTMLElement;
      const projectItem = projectList.shadowRoot!.querySelector(
        "project-item",
      ) as HTMLElement & { mode: string; updateComplete: Promise<boolean> };

      // Ensure planning mode so estimate buttons are visible
      projectItem.mode = "planning";
      await projectItem.updateComplete;

      // Click the + button (second estimate-btn)
      const increaseBtn = projectItem.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[1] as HTMLButtonElement;
      increaseBtn.click();
      await element.updateComplete;

      // Should be called exactly once, not 4 times (the original bug)
      expect(mockWeeklyStore.incrementProjectEstimate).toHaveBeenCalledTimes(1);
      expect(mockWeeklyStore.incrementProjectEstimate).toHaveBeenCalledWith(
        "proj-1",
      );
    });

    it("should call weeklyStore.decrementProjectEstimate exactly once when - button is clicked in Week view (regression test for 4x bubbling bug)", async () => {
      // Clear any previous calls
      mockWeeklyStore.decrementProjectEstimate.mockClear();

      // Get project-list-panel and find project-item
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement;
      const projectList = projectListPanel.shadowRoot!.querySelector(
        "project-list",
      ) as HTMLElement;
      const projectItem = projectList.shadowRoot!.querySelector(
        "project-item",
      ) as HTMLElement & {
        mode: string;
        project: Project;
        updateComplete: Promise<boolean>;
      };

      // Ensure planning mode so estimate buttons are visible
      projectItem.mode = "planning";
      // Ensure project has estimate > 0 so - button is enabled
      projectItem.project = { ...projectItem.project, tomatoEstimate: 5 };
      await projectItem.updateComplete;

      // Click the - button (first estimate-btn)
      const decreaseBtn = projectItem.shadowRoot!.querySelectorAll(
        ".estimate-btn",
      )[0] as HTMLButtonElement;
      decreaseBtn.click();
      await element.updateComplete;

      // Should be called exactly once, not 4 times (the original bug)
      expect(mockWeeklyStore.decrementProjectEstimate).toHaveBeenCalledTimes(1);
      expect(mockWeeklyStore.decrementProjectEstimate).toHaveBeenCalledWith(
        "proj-1",
      );
    });
  });

  // ============================================
  // Project Selection Returns to Day View Tests
  // ============================================

  describe("project selection returns to Day view", () => {
    it("should switch to Day view when project is selected in Week view", async () => {
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      // Verify Week view is active
      expect(weekTab.classList.contains("active")).toBe(true);

      // Select a project by dispatching event from project-list-panel
      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");
      projectListPanel!.dispatchEvent(
        new CustomEvent("select-project", {
          bubbles: true,
          composed: true,
          detail: { projectId: "proj-1" },
        }),
      );
      await element.updateComplete;

      // Should now be on Day view
      const dayTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='day-view']",
      );
      expect(dayTab!.classList.contains("active")).toBe(true);

      // Week tab should no longer be active
      expect(weekTab.classList.contains("active")).toBe(false);
    });

    it("should switch to Day view when project is selected in Projects view", async () => {
      // Switch to Projects view first
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      // Verify Projects view is active
      expect(projectsTab.classList.contains("active")).toBe(true);

      // Select a project by dispatching event from project-list-panel
      const projectListPanel =
        element.shadowRoot!.querySelector("project-list-panel");
      projectListPanel!.dispatchEvent(
        new CustomEvent("select-project", {
          bubbles: true,
          composed: true,
          detail: { projectId: "proj-1" },
        }),
      );
      await element.updateComplete;

      // Should now be on Day view
      const dayTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='day-view']",
      );
      expect(dayTab!.classList.contains("active")).toBe(true);
    });
  });

  // ============================================
  // Panel Collapse Transition Tests
  // ============================================

  describe("panel collapse transitions", () => {
    it("should toggle panel collapse in Day view", async () => {
      const tomatoPoolPanel =
        element.shadowRoot!.querySelector("tomato-pool-panel")!;

      tomatoPoolPanel.dispatchEvent(
        new CustomEvent("toggle-collapse", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      const appShell = element.shadowRoot!.querySelector(
        "app-shell",
      ) as HTMLElement & {
        leftPanelCollapsed: boolean;
      };
      expect(appShell.leftPanelCollapsed).toBe(true);
    });

    it("should toggle panel collapse in Week view", async () => {
      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const weekPoolPanel = element.shadowRoot!.querySelector(
        "week-tomato-pool-panel",
      )!;

      weekPoolPanel.dispatchEvent(
        new CustomEvent("toggle-collapse", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      const appShell = element.shadowRoot!.querySelector(
        "app-shell",
      ) as HTMLElement & {
        leftPanelCollapsed: boolean;
      };
      expect(appShell.leftPanelCollapsed).toBe(true);
    });

    it("should auto-expand panel when switching to Week view", async () => {
      // First collapse panel in Day view
      const tomatoPoolPanel =
        element.shadowRoot!.querySelector("tomato-pool-panel")!;
      tomatoPoolPanel.dispatchEvent(
        new CustomEvent("toggle-collapse", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      // Verify panel is collapsed
      let appShell = element.shadowRoot!.querySelector(
        "app-shell",
      ) as HTMLElement & {
        leftPanelCollapsed: boolean;
      };
      expect(appShell.leftPanelCollapsed).toBe(true);

      // Switch to Week view - should auto-expand
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      appShell = element.shadowRoot!.querySelector(
        "app-shell",
      ) as HTMLElement & {
        leftPanelCollapsed: boolean;
      };
      expect(appShell.leftPanelCollapsed).toBe(false);
    });

    it("should auto-expand panel when switching to Projects view", async () => {
      // First collapse panel in Day view
      const tomatoPoolPanel =
        element.shadowRoot!.querySelector("tomato-pool-panel")!;
      tomatoPoolPanel.dispatchEvent(
        new CustomEvent("toggle-collapse", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      // Switch to Projects view - should auto-expand
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      const appShell = element.shadowRoot!.querySelector(
        "app-shell",
      ) as HTMLElement & {
        leftPanelCollapsed: boolean;
      };
      expect(appShell.leftPanelCollapsed).toBe(false);
    });
  });

  // ============================================
  // Multiple Store Subscription Tests
  // ============================================

  describe("multiple store subscriptions", () => {
    it("should subscribe to planner, weekly, and timer stores on connect", () => {
      expect(mockPlannerStore.subscribe).toHaveBeenCalled();
      expect(mockWeeklyStore.subscribe).toHaveBeenCalled();
      expect(mockTimerStore.subscribe).toHaveBeenCalled();
    });

    it("should unsubscribe from all stores on disconnect", async () => {
      element.remove();
      await element.updateComplete;

      expect(plannerUnsubscribe).toHaveBeenCalled();
      expect(weeklyUnsubscribe).toHaveBeenCalled();
      expect(timerUnsubscribe).toHaveBeenCalled();
    });

    it("should receive timer state updates", async () => {
      const timerCallback = mockTimerStore.subscribe.mock.calls[0]?.[0] as (
        state: TimerState,
      ) => void;

      if (timerCallback) {
        timerCallback({
          activeTaskId: "task-1",
          status: "running",
          remainingSeconds: 1500,
          totalSeconds: 1500,
          startedAt: new Date().toISOString(),
          pausedAt: null,
          completedAt: null,
        });
        await element.updateComplete;
      }

      // Verify timer state was received (component should pass it to task-list-panel)
      const taskListPanel = element.shadowRoot!.querySelector(
        "task-list-panel",
      ) as HTMLElement & {
        timerActiveTaskId: string | null;
        timerStatus: string;
        timerRemainingSeconds: number;
      };

      expect(taskListPanel?.timerActiveTaskId).toBe("task-1");
    });
  });

  // ============================================
  // Regression Test: Tasks Data Source for project-list-panel
  // ============================================

  describe("project-list-panel data source (regression)", () => {
    it("should pass tasks from weeklyStore (not plannerStore) to project-list-panel in Week view", async () => {
      // Create different tasks for plannerStore and weeklyStore
      // This proves the data source is weeklyStore, not plannerStore
      const plannerTasks: Task[] = [
        createMockTask("planner-task-1", "Planner Task 1"),
        createMockTask("planner-task-2", "Planner Task 2"),
      ];

      const weeklyTasksWithProjects: Task[] = [
        createMockTask("weekly-task-1", "Weekly Task 1", "project-alpha"),
        createMockTask("weekly-task-2", "Weekly Task 2", "project-beta"),
      ];

      const projects = [
        createMockProject("project-alpha", "Alpha Project"),
        createMockProject("project-beta", "Beta Project"),
      ];

      // Set up plannerStore with its own tasks - use helper since tasks is a getter now
      setPlannerTasks(plannerTasks);
      mockPlannerStore.subscribe.mockImplementation(
        (callback: (state: PlannerState) => void) => {
          callback(createMockPlannerState());
          return plannerUnsubscribe;
        },
      );

      // Set up weeklyStore with different tasks (that have projectIds)
      // CRITICAL: Set the tasks property directly, as the component uses weeklyStore.tasks getter
      mockWeeklyStore.tasks = weeklyTasksWithProjects;
      mockWeeklyStore.subscribe.mockImplementation(
        (callback: (state: WeeklyState) => void) => {
          callback(createMockWeeklyState(projects, weeklyTasksWithProjects));
          return weeklyUnsubscribe;
        },
      );

      // Recreate element to pick up new mock data
      element.remove();
      element = document.createElement(
        "tomato-planner-app",
      ) as TomatoPlannerApp;
      document.body.appendChild(element);
      await element.updateComplete;

      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      // Get project-list-panel and verify it received weeklyStore tasks
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement & {
        tasks: readonly Task[];
        projects: readonly Project[];
      };

      expect(projectListPanel).not.toBeNull();
      expect(projectListPanel!.tasks).toHaveLength(2);

      // Verify the tasks are from weeklyStore (not plannerStore)
      expect(projectListPanel!.tasks[0]!.id).toBe("weekly-task-1");
      expect(projectListPanel!.tasks[0]!.projectId).toBe("project-alpha");
      expect(projectListPanel!.tasks[1]!.id).toBe("weekly-task-2");
      expect(projectListPanel!.tasks[1]!.projectId).toBe("project-beta");

      // Verify it's NOT the plannerStore tasks
      const taskIds = projectListPanel!.tasks.map((t) => t.id);
      expect(taskIds).not.toContain("planner-task-1");
      expect(taskIds).not.toContain("planner-task-2");
    });

    it("should pass tasks from weeklyStore to project-list-panel in Projects view", async () => {
      const plannerTasks: Task[] = [
        createMockTask("planner-only-task", "Planner Only Task"),
      ];

      const weeklyTasksWithProjects: Task[] = [
        createMockTask(
          "weekly-task-projects",
          "Weekly Task in Projects",
          "project-gamma",
        ),
      ];

      const projects = [createMockProject("project-gamma", "Gamma Project")];

      // Set up stores with different tasks - use helper since tasks is a getter now
      setPlannerTasks(plannerTasks);
      mockPlannerStore.subscribe.mockImplementation(
        (callback: (state: PlannerState) => void) => {
          callback(createMockPlannerState());
          return plannerUnsubscribe;
        },
      );

      // Set up weeklyStore with different tasks
      // CRITICAL: Set the tasks property directly, as the component uses weeklyStore.tasks getter
      mockWeeklyStore.tasks = weeklyTasksWithProjects;
      mockWeeklyStore.subscribe.mockImplementation(
        (callback: (state: WeeklyState) => void) => {
          callback(createMockWeeklyState(projects, weeklyTasksWithProjects));
          return weeklyUnsubscribe;
        },
      );

      // Recreate element to pick up new mock data
      element.remove();
      element = document.createElement(
        "tomato-planner-app",
      ) as TomatoPlannerApp;
      document.body.appendChild(element);
      await element.updateComplete;

      // Switch to Projects view
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      // Get project-list-panel and verify it received weeklyStore tasks
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement & {
        tasks: readonly Task[];
      };

      expect(projectListPanel).not.toBeNull();
      expect(projectListPanel.tasks).toHaveLength(1);

      // Verify the task is from weeklyStore (not plannerStore)
      const task = projectListPanel.tasks[0];
      expect(task).toBeDefined();
      expect(task!.id).toBe("weekly-task-projects");
      expect(task!.projectId).toBe("project-gamma");

      // Verify it's NOT the plannerStore task
      expect(task!.id).not.toBe("planner-only-task");
    });

    it("should pass tracks from weeklyStore to project-list-panel", async () => {
      const mockTrack = {
        id: "track-1",
        title: "Test Track",
        taskIds: ["task-1"],
        edges: [],
        weekId: "2024-W24",
        createdAt: "2024-06-10T00:00:00.000Z",
        updatedAt: "2024-06-10T00:00:00.000Z",
      };

      const weeklyStateWithTracks: WeeklyState = {
        pool: {
          weekId: "2024-W24",
          weekStartDate: "2024-06-10",
          weekEndDate: "2024-06-16",
          weeklyCapacity: 125,
          capacityInMinutes: 25,
        },
        projects: [],
        tasks: [],
        tracks: [mockTrack],
        version: 2,
      };

      mockWeeklyStore.subscribe.mockImplementation(
        (callback: (state: WeeklyState) => void) => {
          callback(weeklyStateWithTracks);
          return weeklyUnsubscribe;
        },
      );

      // Recreate element to pick up new mock data
      element.remove();
      element = document.createElement(
        "tomato-planner-app",
      ) as TomatoPlannerApp;
      document.body.appendChild(element);
      await element.updateComplete;

      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      // Get project-list-panel and verify it received tracks
      const projectListPanel = element.shadowRoot!.querySelector(
        "project-list-panel",
      ) as HTMLElement & {
        tracks: readonly { id: string }[];
      };

      expect(projectListPanel).not.toBeNull();
      expect(projectListPanel.tracks).toHaveLength(1);
      const track = projectListPanel.tracks[0];
      expect(track).toBeDefined();
      expect(track!.id).toBe("track-1");
    });
  });

  // ============================================
  // Header Model View-Specific Content Tests
  // ============================================

  describe("header model view-specific content", () => {
    it("should show day-specific header content in Day view", async () => {
      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: { view: string; date: string; showReset: boolean };
      };

      expect(appHeader.headerModel?.view).toBe("day");
      expect(appHeader.headerModel?.date).toBe("2024-06-15");
      expect(appHeader.headerModel?.showReset).toBe(true);

      // Verify reset button is visible in day view
      const resetBtn = appHeader.shadowRoot!.querySelector(".reset-btn");
      expect(resetBtn).not.toBeNull();
    });

    it("should show week-specific header content in Week view", async () => {
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: {
          view: string;
          weekStartDate: string;
          weekEndDate: string;
          planned: number;
          capacity: number;
        };
      };

      expect(appHeader.headerModel?.view).toBe("week");
      expect(appHeader.headerModel?.weekStartDate).toBe("2024-06-10");
      expect(appHeader.headerModel?.weekEndDate).toBe("2024-06-16");
      expect(appHeader.headerModel?.planned).toBe(0);
      expect(appHeader.headerModel?.capacity).toBe(125);

      // Verify reset button is NOT visible in week view
      const resetBtn = appHeader.shadowRoot!.querySelector(".reset-btn");
      expect(resetBtn).toBeNull();
    });

    it("should show projects-specific header content in Projects view", async () => {
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: {
          view: string;
          projectCount: number;
          activeProjectCount: number;
          totalFinished: number;
          totalPlanned: number;
        };
      };

      expect(appHeader.headerModel?.view).toBe("projects");
      expect(appHeader.headerModel?.projectCount).toBe(0);
      expect(appHeader.headerModel?.activeProjectCount).toBe(0);
      expect(appHeader.headerModel?.totalFinished).toBe(0);
      expect(appHeader.headerModel?.totalPlanned).toBe(0);

      // Verify reset button is NOT visible in projects view
      const resetBtn = appHeader.shadowRoot!.querySelector(".reset-btn");
      expect(resetBtn).toBeNull();
    });

    it("should show tracks-specific header content in Tracks view", async () => {
      const tracksTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='tracks-view']",
      ) as HTMLButtonElement;
      tracksTab.click();
      await element.updateComplete;

      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: {
          view: string;
          trackCount: number;
          selectedTrackTitle?: string;
        };
      };

      expect(appHeader.headerModel?.view).toBe("tracks");
      expect(appHeader.headerModel?.trackCount).toBe(0);
      expect(appHeader.headerModel?.selectedTrackTitle).toBeUndefined();

      // Verify reset button is NOT visible in tracks view
      const resetBtn = appHeader.shadowRoot!.querySelector(".reset-btn");
      expect(resetBtn).toBeNull();
    });

    it("should show selected track title in Tracks view when track is selected", async () => {
      // Create a mock track
      const mockTrack = {
        id: "track-1",
        title: "Test Track",
        taskIds: [],
        edges: [],
        weekId: "2024-W24",
        createdAt: "2024-06-10T00:00:00.000Z",
        updatedAt: "2024-06-10T00:00:00.000Z",
      };

      const weeklyStateWithTrack: WeeklyState = {
        pool: {
          weekId: "2024-W24",
          weekStartDate: "2024-06-10",
          weekEndDate: "2024-06-16",
          weeklyCapacity: 125,
          capacityInMinutes: 25,
        },
        projects: [],
        tasks: [],
        tracks: [mockTrack],
        version: 2,
      };

      mockWeeklyStore.subscribe.mockImplementation(
        (callback: (state: WeeklyState) => void) => {
          callback(weeklyStateWithTrack);
          return weeklyUnsubscribe;
        },
      );

      // Recreate element to pick up new mock data
      element.remove();
      element = document.createElement(
        "tomato-planner-app",
      ) as TomatoPlannerApp;
      document.body.appendChild(element);
      await element.updateComplete;

      // Switch to Tracks view
      const tracksTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='tracks-view']",
      ) as HTMLButtonElement;
      tracksTab.click();
      await element.updateComplete;

      // Select a track
      const trackListPanel =
        element.shadowRoot!.querySelector("track-list-panel");
      trackListPanel!.dispatchEvent(
        new CustomEvent("select-track", {
          bubbles: true,
          composed: true,
          detail: { trackId: "track-1" },
        }),
      );
      await element.updateComplete;

      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: {
          view: string;
          trackCount: number;
          selectedTrackTitle?: string;
        };
      };

      expect(appHeader.headerModel?.view).toBe("tracks");
      expect(appHeader.headerModel?.trackCount).toBe(1);
      expect(appHeader.headerModel?.selectedTrackTitle).toBe("Test Track");
    });

    it("should switch header content when switching views", async () => {
      // Start in Day view
      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: { view: string };
      };
      expect(appHeader.headerModel?.view).toBe("day");

      // Switch to Week view
      const weekTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='week-view']",
      ) as HTMLButtonElement;
      weekTab.click();
      await element.updateComplete;

      expect(appHeader.headerModel?.view).toBe("week");

      // Switch to Projects view
      const projectsTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='projects-view']",
      ) as HTMLButtonElement;
      projectsTab.click();
      await element.updateComplete;

      expect(appHeader.headerModel?.view).toBe("projects");

      // Back to Day view
      const dayTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='day-view']",
      ) as HTMLButtonElement;
      dayTab.click();
      await element.updateComplete;

      expect(appHeader.headerModel?.view).toBe("day");
    });
  });

  // ============================================
  // Tasks View Integration Tests
  // ============================================

  describe("Tasks view integration", () => {
    beforeEach(async () => {
      // Switch to Tasks view
      const tasksTab = element.shadowRoot!.querySelector(
        ".tab-btn[aria-controls='tasks-view']",
      ) as HTMLButtonElement;
      tasksTab.click();
      await element.updateComplete;
    });

    it("should render tasks-view-panel in Tasks view", async () => {
      const tasksViewPanel =
        element.shadowRoot!.querySelector("tasks-view-panel");
      expect(tasksViewPanel).not.toBeNull();
    });

    it("should pass showAssignToToday=true to tasks-view-panel in Tasks view", async () => {
      const tasksViewPanel = element.shadowRoot!.querySelector(
        "tasks-view-panel",
      ) as HTMLElement & { showAssignToToday: boolean };
      expect(tasksViewPanel.showAssignToToday).toBe(true);
    });

    it("should pass todayDate to tasks-view-panel in Tasks view", async () => {
      const tasksViewPanel = element.shadowRoot!.querySelector(
        "tasks-view-panel",
      ) as HTMLElement & { todayDate: string | undefined };
      expect(tasksViewPanel.todayDate).toBe("2024-06-15");
    });

    it("should call plannerStore.assignTaskToToday exactly once when Add to Today button is clicked in task-item (true end-to-end test)", async () => {
      // Clear any previous calls
      mockPlannerStore.assignTaskToToday.mockClear();

      // Create a task that is not assigned to today so the button is visible
      const unassignedTask = createMockTask(
        "task-to-assign",
        "Unassigned Task",
      );
      unassignedTask.dayDate = "2024-06-14"; // Not today (2024-06-15)

      // Get the tasks-view-panel and set tasks directly
      const tasksViewPanel = element.shadowRoot!.querySelector(
        "tasks-view-panel",
      ) as unknown as HTMLElement & {
        tasks: readonly Task[];
        showAssignToToday: boolean;
        todayDate: string | undefined;
        updateComplete: Promise<boolean>;
      };

      // Set up the panel with a task that has the assign button visible
      // Note: tasks is readonly but we can still assign in tests via property binding
      tasksViewPanel.tasks = [unassignedTask] as readonly Task[];
      tasksViewPanel.showAssignToToday = true;
      tasksViewPanel.todayDate = "2024-06-15"; // Today's date
      await tasksViewPanel.updateComplete;

      // Navigate to task-list -> task-item
      const taskList = tasksViewPanel.shadowRoot!.querySelector(
        "task-list",
      ) as HTMLElement & { updateComplete: Promise<boolean> };
      await taskList.updateComplete;

      const taskItem = taskList.shadowRoot!.querySelector(
        "task-item",
      ) as HTMLElement & { updateComplete: Promise<boolean> };

      // Verify task-item exists
      expect(taskItem).not.toBeNull();

      // Wait for task-item to render
      await taskItem.updateComplete;

      // Locate the actual .btn-assign-today button in task-item's shadow DOM
      const assignBtn = taskItem.shadowRoot!.querySelector(
        ".btn-assign-today",
      ) as HTMLButtonElement;
      expect(assignBtn).not.toBeNull();
      expect(assignBtn.disabled).toBe(false);

      // Click the actual button (true end-to-end interaction)
      assignBtn.click();
      await element.updateComplete;

      // Assert the store method was called exactly once with correct taskId
      expect(mockPlannerStore.assignTaskToToday).toHaveBeenCalledTimes(1);
      expect(mockPlannerStore.assignTaskToToday).toHaveBeenCalledWith(
        "task-to-assign",
      );
    });

    it("should call plannerStore.assignTaskToToday exactly once when assign-to-today event is dispatched from tasks-view-panel", async () => {
      // Clear any previous calls
      mockPlannerStore.assignTaskToToday.mockClear();

      // Dispatch event from tasks-view-panel level (valid for testing store call directly)
      const tasksViewPanel = element.shadowRoot!.querySelector(
        "tasks-view-panel",
      ) as HTMLElement;

      tasksViewPanel.dispatchEvent(
        new CustomEvent("assign-to-today", {
          bubbles: true,
          composed: true,
          detail: { taskId: "test-task-id" },
        }),
      );
      await element.updateComplete;

      // Assert exactly once to catch duplicate dispatch regressions
      expect(mockPlannerStore.assignTaskToToday).toHaveBeenCalledTimes(1);
      expect(mockPlannerStore.assignTaskToToday).toHaveBeenCalledWith(
        "test-task-id",
      );
    });
  });
});
