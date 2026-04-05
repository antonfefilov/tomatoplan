/**
 * Tests for TomatoPlannerApp component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { PlannerState } from "../src/models/planner-state.js";
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
    updateTask: vi.fn().mockReturnValue({ success: true }),
    removeTask: vi.fn(),
    assignTomato: vi.fn(),
    unassignTomato: vi.fn(),
    markTomatoAsFinished: vi.fn(),
    markTomatoAsUnfinished: vi.fn(),
    reorderTask: vi.fn(),
    getTaskById: vi.fn(),
    setTaskProject: vi.fn().mockReturnValue({ success: true }),
    unassignTaskFromProject: vi.fn().mockReturnValue({ success: true }),
    importTasks: vi.fn(),
  },
}));

// Mock the plannerStore singleton - tasks is now a getter that derives from taskpoolStore
// Note: The getter uses the hoisted state directly, not a local mock reference
vi.mock("../src/state/planner-store.js", () => ({
  plannerStore: {
    subscribe: vi.fn(),
    setCapacity: vi.fn(),
    setCapacityInMinutes: vi.fn(),
    setDayStart: vi.fn(),
    setDayEnd: vi.fn(),
    addTask: vi.fn().mockReturnValue({ success: true, taskId: "test-task-id" }),
    updateTask: vi.fn().mockReturnValue({ success: true }),
    removeTask: vi.fn(),
    assignTomato: vi.fn(),
    unassignTomato: vi.fn(),
    markTomatoAsFinished: vi.fn(),
    markTomatoAsUnfinished: vi.fn(),
    reorderTask: vi.fn(),
    resetDay: vi.fn(),
    getTaskById: vi.fn(),
    setTaskProject: vi.fn().mockReturnValue({ success: true }),
    assignedTomatoes: 3,
    remainingTomatoes: 7,
    // tasks is now a getter that derives from hoisted state
    // This matches production behavior where tasks are derived from taskpoolStore
    get tasks() {
      return mockState.plannerDayTasks;
    },
  },
}));

// Mock weeklyStore for project assignment validation
vi.mock("../src/state/weekly-store.js", () => ({
  weeklyStore: {
    subscribe: vi.fn(),
    getTaskById: vi.fn(),
    assignTaskToProject: vi.fn().mockReturnValue({ success: true }),
    unassignTaskFromProject: vi.fn().mockReturnValue({ success: true }),
    updateTask: vi.fn().mockReturnValue({ success: true }),
    getProjectById: vi.fn(),
    projects: [],
    tasks: [],
  },
}));

// Import component and dependent elements after mocking
import "../src/components/app/tomato-planner-app.js";
import type { TomatoPlannerApp } from "../src/components/app/tomato-planner-app.js";
import { plannerStore } from "../src/state/planner-store.js";
import { taskpoolStore } from "../src/state/taskpool-store.js";
import { weeklyStore } from "../src/state/weekly-store.js";
import "../src/components/layout/app-shell.js";
import "../src/components/layout/app-header.js";
import "../src/components/pool/tomato-pool-panel.js";
import "../src/components/task/task-list-panel.js";
import "../src/components/task/task-list.js";
import "../src/components/task/task-item.js";
import "../src/components/task/task-editor-dialog.js";
import "../src/components/shared/confirm-dialog.js";
import "../src/components/tomato/tomato-icon.js";
import "../src/components/tomato/tomato-pool-visual.js";
import "../src/components/shared/dropdown-menu.js";
import "../src/components/shared/empty-state.js";

const mockStore = plannerStore as unknown as {
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
  assignedTomatoes: number;
  remainingTomatoes: number;
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
  unassignTaskFromProject: ReturnType<typeof vi.fn>;
  importTasks: ReturnType<typeof vi.fn>;
};

const mockWeeklyStore = weeklyStore as unknown as {
  subscribe: ReturnType<typeof vi.fn>;
  getTaskById: ReturnType<typeof vi.fn>;
  assignTaskToProject: ReturnType<typeof vi.fn>;
  unassignTaskFromProject: ReturnType<typeof vi.fn>;
  updateTask: ReturnType<typeof vi.fn>;
  getProjectById: ReturnType<typeof vi.fn>;
  projects: readonly Project[];
  tasks: readonly Task[];
};

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Test Task",
    description: "Test description",
    tomatoCount: 2,
    finishedTomatoCount: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

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

describe("TomatoPlannerApp", () => {
  let element: TomatoPlannerApp;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the hoisted shared backing state
    mockState.plannerDayTasks.splice(0, mockState.plannerDayTasks.length);
    mockState.plannerDate = "2024-06-15";

    // Set up default mock state (tasks are now on the store, not in state)
    const mockStateObj: PlannerState = {
      pool: {
        dailyCapacity: 10,
        date: "2024-06-15",
        capacityInMinutes: 25,
        dayStart: "08:00",
        dayEnd: "18:25",
      },
      version: 2,
    };

    // Set up default mock behavior
    unsubscribeSpy = vi.fn();
    mockStore.subscribe.mockImplementation(
      (callback: (state: PlannerState) => void) => {
        callback(mockStateObj);
        return unsubscribeSpy;
      },
    );
    mockStore.addTask.mockReturnValue({
      success: true,
      taskId: "test-task-id",
    });
    mockStore.updateTask.mockReturnValue({ success: true });
    mockStore.setTaskProject.mockReturnValue({ success: true });
    mockStore.assignedTomatoes = 3;
    mockStore.remainingTomatoes = 7;

    // Set up taskpoolStore mocks
    mockTaskpoolStore.addTask.mockReturnValue({
      success: true,
      taskId: "test-task-id",
    });
    mockTaskpoolStore.updateTask.mockReturnValue({ success: true });
    mockTaskpoolStore.setTaskProject.mockReturnValue({ success: true });
    mockTaskpoolStore.unassignTaskFromProject.mockReturnValue({
      success: true,
    });

    // Set up weeklyStore mocks
    mockWeeklyStore.assignTaskToProject.mockReturnValue({ success: true });
    mockWeeklyStore.updateTask.mockReturnValue({ success: true });

    // Use helper to set tasks - tasks is a getter now
    setPlannerTasks([]);

    element = document.createElement("tomato-planner-app") as TomatoPlannerApp;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("subscription lifecycle", () => {
    it("should subscribe to store on connect", () => {
      expect(mockStore.subscribe).toHaveBeenCalled();
    });

    it("should unsubscribe from store on disconnect", async () => {
      element.remove();
      await element.updateComplete;

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it("should receive state updates through subscription callback", async () => {
      // The subscribe callback should have been called during connect
      const subscribeCall = mockStore.subscribe.mock.calls[0];
      const callback = subscribeCall![0] as (state: PlannerState) => void;

      // Simulate state update (tasks are now on the store, not in state)
      // Use helper to set tasks - tasks is a getter now
      setPlannerTasks(mockTasks);
      const newState: PlannerState = {
        pool: {
          dailyCapacity: 15,
          date: "2024-06-15",
          capacityInMinutes: 30,
          dayStart: "08:00",
          dayEnd: "18:25",
        },
        version: 2,
      };

      callback(newState);
      await element.updateComplete;

      // Verify the component updated based on new state
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel");
      expect(taskListPanel).toBeDefined();
    });
  });

  describe("passing store values to child components", () => {
    it("should pass headerModel with day view data to app-header", async () => {
      const appHeader = element.shadowRoot!.querySelector(
        "app-header",
      ) as HTMLElement & {
        headerModel: { view: string; date: string };
      };
      expect(appHeader).toBeDefined();
      expect(appHeader.headerModel?.view).toBe("day");
      expect(appHeader.headerModel?.date).toBe("2024-06-15");
    });

    it("should pass capacity to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        capacity: number;
      };
      expect(poolPanel).toBeDefined();
      expect(poolPanel.capacity).toBe(10);
    });

    it("should pass assigned to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        assigned: number;
      };
      expect(poolPanel.assigned).toBe(3);
    });

    it("should pass remaining to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        remaining: number;
      };
      expect(poolPanel.remaining).toBe(7);
    });

    it("should pass capacityInMinutes to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        capacityInMinutes: number;
      };
      expect(poolPanel.capacityInMinutes).toBe(25);
    });

    it("should pass dayStart to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        dayStart: string;
      };
      expect(poolPanel.dayStart).toBe("08:00");
    });

    it("should pass dayEnd to tomato-pool-panel", async () => {
      const poolPanel = element.shadowRoot!.querySelector(
        "tomato-pool-panel",
      ) as HTMLElement & {
        dayEnd: string;
      };
      expect(poolPanel.dayEnd).toBe("18:25");
    });

    it("should pass tasks to task-list-panel", async () => {
      const taskListPanel = element.shadowRoot!.querySelector(
        "task-list-panel",
      ) as HTMLElement & {
        tasks: readonly Task[];
      };
      expect(taskListPanel).toBeDefined();
      expect(taskListPanel.tasks).toEqual([]);
    });

    it("should pass remaining to task-list-panel", async () => {
      const taskListPanel = element.shadowRoot!.querySelector(
        "task-list-panel",
      ) as HTMLElement & {
        remaining: number;
      };
      expect(taskListPanel.remaining).toBe(7);
    });

    it("should pass assigned to task-list-panel", async () => {
      const taskListPanel = element.shadowRoot!.querySelector(
        "task-list-panel",
      ) as HTMLElement & {
        assigned: number;
      };
      expect(taskListPanel.assigned).toBe(3);
    });

    it("should pass capacityInMinutes to task-list-panel", async () => {
      const taskListPanel = element.shadowRoot!.querySelector(
        "task-list-panel",
      ) as HTMLElement & {
        capacityInMinutes: number;
      };
      expect(taskListPanel.capacityInMinutes).toBe(25);
    });
  });

  describe("event handlers wiring to store", () => {
    it("should call resetDay on store when reset-day event is dispatched", async () => {
      const appHeader = element.shadowRoot!.querySelector("app-header")!;

      // Dispatch reset-day event
      appHeader.dispatchEvent(
        new CustomEvent("reset-day", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      expect(mockStore.resetDay).toHaveBeenCalled();
    });

    it("should call setCapacity on store when capacity-change event is dispatched", async () => {
      const poolPanel = element.shadowRoot!.querySelector("tomato-pool-panel")!;

      poolPanel.dispatchEvent(
        new CustomEvent("capacity-change", {
          bubbles: true,
          composed: true,
          detail: { capacity: 15 },
        }),
      );
      await element.updateComplete;

      expect(mockStore.setCapacity).toHaveBeenCalledWith(15);
    });

    it("should call setCapacityInMinutes on store when duration-change event is dispatched", async () => {
      const poolPanel = element.shadowRoot!.querySelector("tomato-pool-panel")!;

      poolPanel.dispatchEvent(
        new CustomEvent("duration-change", {
          bubbles: true,
          composed: true,
          detail: { minutes: 30 },
        }),
      );
      await element.updateComplete;

      expect(mockStore.setCapacityInMinutes).toHaveBeenCalledWith(30);
    });

    it("should call setDayStart on store when day-start-change event is dispatched", async () => {
      const poolPanel = element.shadowRoot!.querySelector("tomato-pool-panel")!;

      poolPanel.dispatchEvent(
        new CustomEvent("day-start-change", {
          bubbles: true,
          composed: true,
          detail: { time: "09:00" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.setDayStart).toHaveBeenCalledWith("09:00");
    });

    it("should call setDayEnd on store when day-end-change event is dispatched", async () => {
      const poolPanel = element.shadowRoot!.querySelector("tomato-pool-panel")!;

      poolPanel.dispatchEvent(
        new CustomEvent("day-end-change", {
          bubbles: true,
          composed: true,
          detail: { time: "17:00" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.setDayEnd).toHaveBeenCalledWith("17:00");
    });

    it("should handle open-task-dialog event from task-list-panel", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("open-task-dialog", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      // Should show the task dialog (we can verify by checking the dialog element)
      const taskDialog = element.shadowRoot!.querySelector(
        "task-editor-dialog",
      ) as HTMLElement & {
        open: boolean;
      };
      expect(taskDialog.open).toBe(true);
    });

    it("should handle delete-task event and show confirm dialog", async () => {
      // Set up state with a task
      const callback = mockStore.subscribe.mock.calls[0]![0] as (
        state: PlannerState,
      ) => void;
      mockStore.getTaskById.mockReturnValue(mockTasks[0]);
      // Use helper to set tasks - tasks is a getter now
      setPlannerTasks(mockTasks);

      callback({
        pool: {
          dailyCapacity: 10,
          date: "2024-06-15",
          capacityInMinutes: 25,
          dayStart: "08:00",
          dayEnd: "18:25",
        },
        version: 2,
      });
      await element.updateComplete;

      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("delete-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      // Should show the confirm dialog
      const confirmDialog = element.shadowRoot!.querySelector(
        "confirm-dialog",
      ) as HTMLElement & {
        open: boolean;
      };
      expect(confirmDialog.open).toBe(true);
    });

    it("should call removeTask when delete is confirmed", async () => {
      // Set up state with a task
      const callback = mockStore.subscribe.mock.calls[0]![0] as (
        state: PlannerState,
      ) => void;
      mockStore.getTaskById.mockReturnValue(mockTasks[0]);
      // Use helper to set tasks - tasks is a getter now
      setPlannerTasks(mockTasks);

      callback({
        pool: {
          dailyCapacity: 10,
          date: "2024-06-15",
          capacityInMinutes: 25,
          dayStart: "08:00",
          dayEnd: "18:25",
        },
        version: 2,
      });
      await element.updateComplete;

      // First trigger delete-task to show dialog
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;
      taskListPanel.dispatchEvent(
        new CustomEvent("delete-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      // Then confirm the delete
      const confirmDialog =
        element.shadowRoot!.querySelector("confirm-dialog")!;
      confirmDialog.dispatchEvent(
        new CustomEvent("confirm", {
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      expect(mockStore.removeTask).toHaveBeenCalledWith("task-1");
    });

    it("should call assignTomato on store when add-tomato event is dispatched", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("add-tomato", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.assignTomato).toHaveBeenCalledWith("task-1");
    });

    it("should call unassignTomato on store when remove-tomato event is dispatched", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("remove-tomato", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.unassignTomato).toHaveBeenCalledWith("task-1");
    });

    it("should call markTomatoAsFinished when mark-tomato-finished event is dispatched", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("mark-tomato-finished", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.markTomatoAsFinished).toHaveBeenCalledWith("task-1");
    });

    it("should call markTomatoAsUnfinished when mark-tomato-unfinished event is dispatched", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("mark-tomato-unfinished", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.markTomatoAsUnfinished).toHaveBeenCalledWith("task-1");
    });

    it("should call reorderTask when reorder-task event is dispatched", async () => {
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("reorder-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1", toIndex: 2 },
        }),
      );
      await element.updateComplete;

      expect(mockStore.reorderTask).toHaveBeenCalledWith("task-1", 2);
    });
  });

  describe("edit task flow", () => {
    it("should open dialog with editing task when edit-task event is dispatched", async () => {
      const callback = mockStore.subscribe.mock.calls[0]![0] as (
        state: PlannerState,
      ) => void;
      mockStore.getTaskById.mockReturnValue(mockTasks[0]);
      // Use helper to set tasks - tasks is a getter now
      setPlannerTasks(mockTasks);

      callback({
        pool: {
          dailyCapacity: 10,
          date: "2024-06-15",
          capacityInMinutes: 25,
          dayStart: "08:00",
          dayEnd: "18:25",
        },
        version: 2,
      });
      await element.updateComplete;

      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;

      taskListPanel.dispatchEvent(
        new CustomEvent("edit-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.getTaskById).toHaveBeenCalledWith("task-1");

      const taskDialog = element.shadowRoot!.querySelector(
        "task-editor-dialog",
      ) as HTMLElement & {
        open: boolean;
        task: Task;
        isEdit: boolean;
      };
      expect(taskDialog.open).toBe(true);
      expect(taskDialog.task).toEqual(mockTasks[0]);
      expect(taskDialog.isEdit).toBe(true);
    });

    it("should call updateTask when saving edited task", async () => {
      const callback = mockStore.subscribe.mock.calls[0]![0] as (
        state: PlannerState,
      ) => void;
      mockStore.getTaskById.mockReturnValue(mockTasks[0]);
      mockWeeklyStore.getTaskById.mockReturnValue(mockTasks[0]);
      mockTaskpoolStore.getTaskById.mockReturnValue(mockTasks[0]);
      // Use helper to set tasks - tasks is a getter now
      setPlannerTasks(mockTasks);

      callback({
        pool: {
          dailyCapacity: 10,
          date: "2024-06-15",
          capacityInMinutes: 25,
          dayStart: "08:00",
          dayEnd: "18:25",
        },
        version: 2,
      });
      await element.updateComplete;

      // Open edit dialog
      const taskListPanel =
        element.shadowRoot!.querySelector("task-list-panel")!;
      taskListPanel.dispatchEvent(
        new CustomEvent("edit-task", {
          bubbles: true,
          composed: true,
          detail: { taskId: "task-1" },
        }),
      );
      await element.updateComplete;

      // Save the task
      const taskDialog =
        element.shadowRoot!.querySelector("task-editor-dialog")!;
      taskDialog.dispatchEvent(
        new CustomEvent("save", {
          bubbles: true,
          composed: true,
          detail: {
            taskId: "task-1",
            title: "Updated Task",
            description: "Updated desc",
          },
        }),
      );
      await element.updateComplete;

      expect(mockTaskpoolStore.updateTask).toHaveBeenCalledWith("task-1", {
        title: "Updated Task",
        description: "Updated desc",
      });
    });

    it("should call addTask when saving new task", async () => {
      const taskDialog =
        element.shadowRoot!.querySelector("task-editor-dialog")!;

      taskDialog.dispatchEvent(
        new CustomEvent("save", {
          bubbles: true,
          composed: true,
          detail: { title: "New Task", description: "New desc" },
        }),
      );
      await element.updateComplete;

      expect(mockStore.addTask).toHaveBeenCalledWith("New Task", "New desc");
    });
  });
});
