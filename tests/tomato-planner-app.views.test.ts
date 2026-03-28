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

// Mock plannerStore before importing component
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
    assignedTomatoes: 3,
    remainingTomatoes: 7,
    capacityInMinutes: 25,
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

// Import all required custom elements
import "../src/components/layout/app-shell.js";
import "../src/components/layout/app-header.js";
import "../src/components/pool/tomato-pool-panel.js";
import "../src/components/pool/week-tomato-pool-panel.js";
import "../src/components/task/task-list-panel.js";
import "../src/components/task/task-list.js";
import "../src/components/task/task-item.js";
import "../src/components/task/task-editor-dialog.js";
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
  assignedTomatoes: number;
  remainingTomatoes: number;
  capacityInMinutes: number;
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
function createMockPlannerState(tasks: Task[] = []): PlannerState {
  return {
    pool: {
      dailyCapacity: 10,
      date: "2024-06-15",
      capacityInMinutes: 25,
      dayStart: "08:00",
      dayEnd: "18:25",
    },
    tasks,
    version: 2,
  };
}

// Helper to create mock weekly state
function createMockWeeklyState(projects: Project[] = []): WeeklyState {
  return {
    pool: {
      weekId: "2024-W24",
      weekStartDate: "2024-06-10",
      weekEndDate: "2024-06-16",
      weeklyCapacity: 125,
      capacityInMinutes: 25,
    },
    projects,
    tasks: [],
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

// Export for use in other test files
export {
  createMockPlannerState,
  createMockWeeklyState,
  createMockTimerState,
  createMockProject,
  createMockTask,
};

describe("TomatoPlannerApp Views", () => {
  let element: TomatoPlannerApp;
  let plannerUnsubscribe: ReturnType<typeof vi.fn>;
  let weeklyUnsubscribe: ReturnType<typeof vi.fn>;
  let timerUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

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

    // Set up weekly store mock
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
      expect(tabs.length).toBe(4);

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
});
