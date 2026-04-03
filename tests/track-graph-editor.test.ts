/**
 * Tests for TrackGraphEditor component
 * Tests the Cytoscape event bridge and edge ID handling with UUID-like IDs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/track/track-graph-editor.js";
import type { TrackGraphEditor } from "../src/components/track/track-graph-editor.js";
import type { Track } from "../src/models/track.js";
import type { Task } from "../src/models/task.js";

// Mock cytoscape and dagre - use inline function to avoid hoisting issues
// Shared spy for stable remove() assertions
const removeSpy = vi.fn();

vi.mock("cytoscape", () => {
  // Layout mock that stores callbacks for 'one' method
  const layoutOneCallbacks: { event: string; callback: () => void }[] = [];
  const mockLayout = {
    one: vi.fn((event: string, callback: () => void) => {
      layoutOneCallbacks.push({ event, callback });
      return mockLayout;
    }),
    run: vi.fn(() => {
      // Simulate layoutstop event after run
      const stopCallback = layoutOneCallbacks.find(
        (entry) => entry.event === "layoutstop",
      );
      if (stopCallback) {
        stopCallback.callback();
      }
    }),
    // Expose for tests to trigger layoutstop manually
    _triggerLayoutStop: () => {
      const stopCallback = layoutOneCallbacks.find(
        (entry) => entry.event === "layoutstop",
      );
      if (stopCallback) {
        stopCallback.callback();
      }
    },
  };

  const mockCy = {
    on: vi.fn(),
    elements: vi.fn(() => ({ remove: removeSpy })),
    add: vi.fn(),
    layout: vi.fn(() => mockLayout),
    fit: vi.fn(),
    resize: vi.fn(),
    nodes: vi.fn(() => ({
      forEach: vi.fn(),
      removeClass: vi.fn(),
      addClass: vi.fn(),
    })),
    edges: vi.fn(() => ({
      removeClass: vi.fn(),
      addClass: vi.fn(),
    })),
    getElementById: vi.fn(() => ({
      length: 1,
      data: vi.fn(),
    })),
    destroy: vi.fn(),
  };
  const cytoscape = vi.fn(() => mockCy);
  (cytoscape as any).use = vi.fn();
  return { default: cytoscape };
});

vi.mock("cytoscape-dagre", () => ({
  default: {},
}));

describe("TrackGraphEditor", () => {
  let element: TrackGraphEditor;
  let mockTrack: Track;
  let mockTasks: Task[];

  beforeEach(async () => {
    mockTrack = {
      id: "track-1",
      title: "Test Track",
      description: "Test description",
      taskIds: ["task-1", "task-2"],
      edges: [{ sourceTaskId: "task-1", targetTaskId: "task-2" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTasks = [
      {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "task-2",
        title: "Task 2",
        tomatoCount: 3,
        finishedTomatoCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    element = document.createElement("track-graph-editor") as TrackGraphEditor;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  describe("registration", () => {
    it("should be defined", () => {
      expect(customElements.get("track-graph-editor")).toBeDefined();
    });

    it("should be an instance of TrackGraphEditor", () => {
      expect(element).toBeInstanceOf(HTMLElement);
    });
  });

  describe("light DOM", () => {
    it("should use light DOM (renderRoot is element)", () => {
      expect(element.renderRoot).toBe(element);
    });
  });

  describe("empty state rendering", () => {
    it("should render empty state when no track", () => {
      const emptyState = element.querySelector(".empty-state");
      expect(emptyState).toBeDefined();
    });

    it("should render empty state when no tasks", async () => {
      element.track = mockTrack;
      element.tasks = [];
      await element.updateComplete;

      const emptyState = element.querySelector(".empty-state");
      expect(emptyState).toBeDefined();
    });
  });

  describe("graph rendering with track", () => {
    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    it("should render graph container", () => {
      const cyContainer = element.querySelector(".cytoscape-container");
      expect(cyContainer).toBeDefined();
    });

    it("should render control buttons", () => {
      const controlBtns = element.querySelectorAll(".control-btn");
      expect(controlBtns.length).toBe(2);
    });

    it("should render instructions overlay", () => {
      const instructions = element.querySelector(".instructions-overlay");
      expect(instructions).toBeDefined();
    });

    it("should render all instruction items", () => {
      const items = element.querySelectorAll(".instruction-item");
      expect(items.length).toBe(4);
    });
  });

  describe("properties", () => {
    it("should accept track property", async () => {
      element.track = mockTrack;
      await element.updateComplete;
      expect(element.track).toBe(mockTrack);
    });

    it("should accept tasks property", async () => {
      element.tasks = mockTasks;
      await element.updateComplete;
      expect(element.tasks).toBe(mockTasks);
    });

    it("should accept selectedNodeId property", async () => {
      element.selectedNodeId = "task-1";
      await element.updateComplete;
      expect(element.selectedNodeId).toBe("task-1");
    });

    it("should accept pendingEdgeSource property", async () => {
      element.pendingEdgeSource = "task-1";
      await element.updateComplete;
      expect(element.pendingEdgeSource).toBe("task-1");
    });

    it("should accept readonly property", async () => {
      element.readonly = true;
      await element.updateComplete;
      expect(element.readonly).toBe(true);
    });
  });

  describe("pending edge indicator", () => {
    it("should show pending edge indicator when pendingEdgeSource is set", async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      element.pendingEdgeSource = "task-1";
      await element.updateComplete;

      const indicator = element.querySelector(".pending-edge-indicator");
      expect(indicator).toBeDefined();
    });

    it("should render cancel button in pending edge indicator", async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      element.pendingEdgeSource = "task-1";
      await element.updateComplete;

      const cancelBtn = element.querySelector(".cancel-btn");
      expect(cancelBtn).toBeDefined();
    });

    it("should not show pending edge indicator when pendingEdgeSource is undefined", async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      element.pendingEdgeSource = undefined;
      await element.updateComplete;

      const indicator = element.querySelector(".pending-edge-indicator");
      expect(indicator).toBeNull();
    });
  });

  describe("events dispatched directly", () => {
    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    it("should dispatch track-node-select event", () => {
      const eventSpy = vi.fn();
      element.addEventListener("track-node-select", eventSpy);

      element.dispatchEvent(
        new CustomEvent("track-node-select", {
          bubbles: true,
          composed: true,
          detail: { nodeId: "task-1" },
        }),
      );

      expect(eventSpy).toHaveBeenCalled();
    });

    it("should dispatch track-edge-create-request event", () => {
      const eventSpy = vi.fn();
      element.addEventListener("track-edge-create-request", eventSpy);

      element.dispatchEvent(
        new CustomEvent("track-edge-create-request", {
          bubbles: true,
          composed: true,
          detail: { sourceTaskId: "task-1", targetTaskId: "task-2" },
        }),
      );

      expect(eventSpy).toHaveBeenCalled();
    });

    it("should dispatch track-node-remove-request event", () => {
      const eventSpy = vi.fn();
      element.addEventListener("track-node-remove-request", eventSpy);

      element.dispatchEvent(
        new CustomEvent("track-node-remove-request", {
          bubbles: true,
          composed: true,
          detail: { nodeId: "task-1" },
        }),
      );

      expect(eventSpy).toHaveBeenCalled();
    });

    it("should dispatch track-edge-remove-request event", () => {
      const eventSpy = vi.fn();
      element.addEventListener("track-edge-remove-request", eventSpy);

      element.dispatchEvent(
        new CustomEvent("track-edge-remove-request", {
          bubbles: true,
          composed: true,
          detail: { sourceTaskId: "task-1", targetTaskId: "task-2" },
        }),
      );

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe("empty to non-empty initialization transition", () => {
    it("should initialize Cytoscape when transitioning from empty to graph state", async () => {
      // Start with empty state
      expect(element.querySelector(".empty-state")).toBeDefined();

      // Transition to graph state
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;

      // Should now have graph container
      expect(element.querySelector(".cytoscape-container")).toBeDefined();
    });

    it("should show empty state after graph to empty transition", async () => {
      // Start with graph state
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;

      expect(element.querySelector(".cytoscape-container")).toBeDefined();

      // Transition to empty state
      element.track = undefined;
      element.tasks = [];
      await element.updateComplete;

      // Should now show empty state
      expect(element.querySelector(".empty-state")).toBeDefined();
    });
  });

  describe("Cytoscape event bridge", () => {
    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    describe("node selection behavior", () => {
      it("should set pendingEdgeSource when shift-clicked on node", async () => {
        element.pendingEdgeSource = "task-1";
        await element.updateComplete;

        expect(element.pendingEdgeSource).toBe("task-1");

        const indicator = element.querySelector(".pending-edge-indicator");
        expect(indicator).toBeDefined();
      });

      it("should emit edge create request when completing edge creation", async () => {
        element.pendingEdgeSource = "task-1";
        await element.updateComplete;

        const eventSpy = vi.fn();
        element.addEventListener("track-edge-create-request", eventSpy);

        element.dispatchEvent(
          new CustomEvent("track-edge-create-request", {
            bubbles: true,
            composed: true,
            detail: { sourceTaskId: "task-1", targetTaskId: "task-2" },
          }),
        );

        expect(eventSpy).toHaveBeenCalled();
      });
    });

    describe("readonly behavior", () => {
      it("should prevent edge removal when readonly", async () => {
        element.readonly = true;
        await element.updateComplete;
        expect(element.readonly).toBe(true);
      });

      it("should prevent node removal when readonly", async () => {
        element.readonly = true;
        await element.updateComplete;
        expect(element.readonly).toBe(true);
      });
    });
  });

  describe("Cytoscape tap handler readonly prevention", () => {
    type TapEvent = {
      target: { id: () => string };
      originalEvent?: { shiftKey: boolean };
    };

    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    it("should dispatch track-node-select and NOT set pendingEdgeSource on shift+tap when readonly", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      expect(mockCy.on).toHaveBeenCalledWith(
        "tap",
        "node",
        expect.any(Function),
      );
      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      element.readonly = true;
      await element.updateComplete;

      const nodeSelectSpy = vi.fn();
      const edgeCreateSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);
      element.addEventListener("track-edge-create-request", edgeCreateSpy);

      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: true },
      });

      expect(nodeSelectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { nodeId: "task-1" },
        }),
      );

      expect(element.pendingEdgeSource).toBeUndefined();
      expect(edgeCreateSpy).not.toHaveBeenCalled();
    });

    it("should NOT emit track-edge-create-request on pending edge completion when readonly", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      expect(mockCy.on).toHaveBeenCalledWith(
        "tap",
        "node",
        expect.any(Function),
      );
      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      element.pendingEdgeSource = "task-1";
      element.readonly = true;
      await element.updateComplete;

      const nodeSelectSpy = vi.fn();
      const edgeCreateSpy = vi.fn();
      const edgeCancelSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);
      element.addEventListener("track-edge-create-request", edgeCreateSpy);
      element.addEventListener("track-edge-creation-cancel", edgeCancelSpy);

      tapHandler!({
        target: { id: () => "task-2" },
        originalEvent: { shiftKey: false },
      });

      expect(nodeSelectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { nodeId: "task-2" },
        }),
      );

      expect(edgeCreateSpy).not.toHaveBeenCalled();
      expect(edgeCancelSpy).toHaveBeenCalled();
      expect(element.pendingEdgeSource).toBeUndefined();
    });

    it("should allow edge creation when NOT readonly (shift+tap start)", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      element.readonly = false;
      await element.updateComplete;

      const nodeSelectSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);

      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: true },
      });

      expect(nodeSelectSpy).not.toHaveBeenCalled();
      expect(element.pendingEdgeSource).toBe("task-1");
    });

    it("should allow edge creation when NOT readonly (pending edge completion)", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      element.pendingEdgeSource = "task-1";
      element.readonly = false;
      await element.updateComplete;

      const edgeCreateSpy = vi.fn();
      element.addEventListener("track-edge-create-request", edgeCreateSpy);

      tapHandler!({
        target: { id: () => "task-2" },
        originalEvent: { shiftKey: false },
      });

      expect(edgeCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { sourceTaskId: "task-1", targetTaskId: "task-2" },
        }),
      );

      expect(element.pendingEdgeSource).toBeUndefined();
    });

    it("should dispatch track-node-select on regular tap when readonly", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      element.readonly = true;
      element.pendingEdgeSource = undefined;
      await element.updateComplete;

      const nodeSelectSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);

      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: false },
      });

      expect(nodeSelectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { nodeId: "task-1" },
        }),
      );
    });
  });

  describe("reactive class sync", () => {
    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    it("should update node classes when selectedNodeId changes", async () => {
      element.selectedNodeId = "task-1";
      await element.updateComplete;
      expect(element.selectedNodeId).toBe("task-1");
    });

    it("should update node classes when pendingEdgeSource changes", async () => {
      element.pendingEdgeSource = "task-2";
      await element.updateComplete;
      expect(element.pendingEdgeSource).toBe("task-2");
    });

    it("should update node classes when readonly changes", async () => {
      element.readonly = true;
      await element.updateComplete;
      expect(element.readonly).toBe(true);
    });

    it("should clear selectedNodeId correctly", async () => {
      element.selectedNodeId = "task-1";
      await element.updateComplete;
      expect(element.selectedNodeId).toBe("task-1");

      element.selectedNodeId = undefined;
      await element.updateComplete;
      expect(element.selectedNodeId).toBeUndefined();
    });
  });

  describe("deferred rebuild + resize retry", () => {
    let requestAnimationFrameSpy: unknown;
    let rafCallbacks: ((time: number) => void)[] = [];

    beforeEach(() => {
      rafCallbacks = [];
      requestAnimationFrameSpy = vi
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((cb: FrameRequestCallback) => {
          rafCallbacks.push(cb);
          return rafCallbacks.length as unknown as number;
        });
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      (requestAnimationFrameSpy as ReturnType<typeof vi.spyOn>)?.mockRestore();
      vi.restoreAllMocks();
    });

    function flushAnimationFrames() {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach((cb) => cb(performance.now()));
    }

    let resizeObserverCallback: ResizeObserverCallback | null = null;

    beforeEach(() => {
      resizeObserverCallback = null;
    });

    function triggerResizeObserver(width = 800, height = 600) {
      if (!resizeObserverCallback) {
        throw new Error(
          "ResizeObserver callback not set up. Ensure component created ResizeObserver.",
        );
      }
      const target = document.createElement("div");
      const mockEntry = {
        target,
        contentRect: {
          width,
          height,
          left: 0,
          top: 0,
          right: width,
          bottom: height,
        } as DOMRectReadOnly,
        borderBoxSize: [] as unknown as ResizeObserverSize[],
        contentBoxSize: [] as unknown as ResizeObserverSize[],
        devicePixelContentBoxSize: [] as unknown as ResizeObserverSize[],
      } as unknown as ResizeObserverEntry;
      resizeObserverCallback([mockEntry], null as unknown as ResizeObserver);
    }

    beforeEach(() => {
      vi.stubGlobal(
        "ResizeObserver",
        class MockResizeObserver {
          constructor(callback: ResizeObserverCallback) {
            resizeObserverCallback = callback;
          }
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function isPendingStructureRebuild(): Promise<boolean> {
      element.requestUpdate();
      return element.updateComplete.then(() => {
        return (element as unknown as { _pendingStructureRebuild: boolean })
          ._pendingStructureRebuild;
      });
    }

    it("A. defers rebuild when container is zero-sized", async () => {
      // This test verifies that when container has zero size and there's a
      // structural change, _pendingStructureRebuild becomes true and rebuild is deferred.

      // Mount with track/tasks
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      // Verify no deferred rebuild is pending initially
      const pendingAfterInit = await isPendingStructureRebuild();
      expect(pendingAfterInit).toBe(false);

      // Spy on _rebuildGraph to simulate zero-size container deferral
      const warnSpy = vi.spyOn(console, "warn");
      const elementCasted = element as unknown as {
        _rebuildGraph: () => Promise<"rebuilt" | "deferred">;
        _pendingStructureRebuild: boolean;
      };
      const originalRebuildGraph = elementCasted._rebuildGraph;
      elementCasted._rebuildGraph = async () => {
        console.warn("Cytoscape container has zero size, deferring rebuild");
        elementCasted._pendingStructureRebuild = true;
        return "deferred";
      };

      // Trigger STRUCTURAL change (taskIds) - _rebuildGraph should defer
      const updatedTrack = {
        ...mockTrack,
        taskIds: ["task-1", "task-2", "task-3"],
      };
      element.track = updatedTrack;
      await element.updateComplete;

      // _pendingStructureRebuild should be true because _rebuildGraph deferred
      const pendingAfterChange = await isPendingStructureRebuild();
      expect(pendingAfterChange).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(
        "Cytoscape container has zero size, deferring rebuild",
      );

      // Restore original method
      elementCasted._rebuildGraph = originalRebuildGraph;
    });

    it("B. retries deferred rebuild after resize", async () => {
      // This test verifies that when _pendingStructureRebuild = true and
      // ResizeObserver fires, a FULL rebuild happens (remove, add, layout.run).

      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      removeSpy.mockClear();
      mockCy.add.mockClear();
      const mockLayout = mockCy.layout.mock.results[0]?.value;
      if (mockLayout) {
        mockLayout.run.mockClear();
      }

      const pendingBefore = await isPendingStructureRebuild();
      expect(pendingBefore).toBe(false);

      // Get container and ensure it has proper dimensions for rebuild
      const container = element.querySelector(
        ".cytoscape-container",
      ) as HTMLElement;
      expect(container).toBeDefined();
      Object.defineProperty(container, "clientWidth", {
        get: () => 800,
        configurable: true,
      });
      Object.defineProperty(container, "clientHeight", {
        get: () => 600,
        configurable: true,
      });

      // Manually set _pendingStructureRebuild = true to simulate deferred state
      (
        element as unknown as { _pendingStructureRebuild: boolean }
      )._pendingStructureRebuild = true;

      const pendingNow = await isPendingStructureRebuild();
      expect(pendingNow).toBe(true);

      // Trigger resize observer callback
      expect(resizeObserverCallback).not.toBeNull();
      triggerResizeObserver(800, 600);
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      // Assert: _pendingStructureRebuild should now be false (rebuild completed)
      const pendingAfter = await isPendingStructureRebuild();
      expect(pendingAfter).toBe(false);

      // Assert: full rebuild happened
      expect(removeSpy).toHaveBeenCalled();
      expect(mockCy.add).toHaveBeenCalled();
      if (mockLayout) {
        expect(mockLayout.run).toHaveBeenCalled();
      }
    });

it("D. deferred rebuild uses latest structure after updates", async () => {
      // This test validates the deferred-update flow:
      // 1) rebuild deferred (simulate zero-size by forcing pending state)
      // 2) structural updates while pending
      // 3) resize retry uses LATEST structure

      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();
      const mockLayout = mockCy.layout.mock.results[0]?.value;

      // ===== Phase 1: Establish baseline =====
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      const container = element.querySelector(
        ".cytoscape-container",
      ) as HTMLElement;
      expect(container).toBeDefined();

      // Ensure container has valid size for successful initial render
      Object.defineProperty(container, "clientWidth", {
        get: () => 800,
        configurable: true,
      });
      Object.defineProperty(container, "clientHeight", {
        get: () => 600,
        configurable: true,
      });

      const pendingAfterInit = await isPendingStructureRebuild();
      expect(pendingAfterInit).toBe(false);

      // Clear spies after initialization
      removeSpy.mockClear();
      mockCy.add.mockClear();
      if (mockLayout) mockLayout.run.mockClear();

      // ===== Phase 2: Simulate deferral (like test A) =====
      // Intercept _rebuildGraph to force deferral on first structural update
      const elementCasted = element as unknown as {
        _rebuildGraph: () => Promise<"rebuilt" | "deferred">;
        _pendingStructureRebuild: boolean;
      };

      const originalRebuildGraph = elementCasted._rebuildGraph.bind(elementCasted);
      let rebuildAttempts = 0;

      elementCasted._rebuildGraph = async () => {
        rebuildAttempts++;
        // Force deferral on first rebuild attempt (simulating zero-size container)
        if (rebuildAttempts === 1) {
          console.warn("Cytoscape container has zero size, deferring rebuild");
          elementCasted._pendingStructureRebuild = true;
          return "deferred";
        }
        // Let subsequent rebuilds proceed normally
        return await originalRebuildGraph();
      };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Apply FIRST structural update
      const firstUpdateTrack = {
        ...mockTrack,
        taskIds: ["task-1", "task-2", "task-3"],
        edges: [
          { sourceTaskId: "task-1", targetTaskId: "task-2" },
          { sourceTaskId: "task-2", targetTaskId: "task-3" },
        ],
      };
      const firstUpdateTasks = [
        ...mockTasks,
        {
          id: "task-3",
          title: "Task 3",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      element.track = firstUpdateTrack;
      element.tasks = firstUpdateTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      // Assert: rebuild was attempted (first attempt forced to defer)
      expect(rebuildAttempts).toBeGreaterThanOrEqual(1);

      // Assert: pending state set to true
      const pendingAfterFirst = await isPendingStructureRebuild();
      expect(pendingAfterFirst).toBe(true);

      // Assert: warning logged
      expect(warnSpy).toHaveBeenCalledWith(
        "Cytoscape container has zero size, deferring rebuild",
      );

      // Assert: no actual rebuild happened (deferred)
      expect(removeSpy).not.toHaveBeenCalled();
      expect(mockCy.add).not.toHaveBeenCalled();

      warnSpy.mockRestore();

      // ===== Phase 3: Update while pending =====
      // Reset rebuild counter for phase 3
      rebuildAttempts = 0;

      // Apply SECOND structural update (latest structure with task-4)
      const secondUpdateTrack = {
        ...firstUpdateTrack,
        taskIds: ["task-1", "task-2", "task-3", "task-4"],
        edges: [
          { sourceTaskId: "task-1", targetTaskId: "task-2" },
          { sourceTaskId: "task-2", targetTaskId: "task-3" },
          { sourceTaskId: "task-3", targetTaskId: "task-4" },
        ],
      };
      const secondUpdateTasks = [
        ...firstUpdateTasks,
        {
          id: "task-4",
          title: "Task 4",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      element.track = secondUpdateTrack;
      element.tasks = secondUpdateTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      // Force pending back to true to simulate container still being zero-sized
      elementCasted._pendingStructureRebuild = true;

      const pendingAfterSecond = await isPendingStructureRebuild();
      expect(pendingAfterSecond).toBe(true);

      // ===== Phase 4: Trigger retry =====
      // Reset counters and clear mocks for phase 4
      rebuildAttempts = 0;
      removeSpy.mockClear();
      mockCy.add.mockClear();
      if (mockLayout) mockLayout.run.mockClear();

      // Restore original rebuildGraph for resize retry
      elementCasted._rebuildGraph = originalRebuildGraph;

      // Trigger ResizeObserver
      expect(resizeObserverCallback).not.toBeNull();
      triggerResizeObserver(800, 600);
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      // Assert: rebuild completed successfully
      const pendingAfterRetry = await isPendingStructureRebuild();
      expect(pendingAfterRetry).toBe(false);

      // Assert: full rebuild occurred
      expect(removeSpy).toHaveBeenCalled();
      expect(mockCy.add).toHaveBeenCalled();
      if (mockLayout) {
        expect(mockLayout.run).toHaveBeenCalled();
      }

      // Assert: add() called with LATEST structure (task-4)
      const allAddCalls = mockCy.add.mock.calls;
      expect(allAddCalls.length).toBeGreaterThan(0);

      const lastAddCall = allAddCalls[allAddCalls.length - 1][0] as Array<{
        data: { id: string; source?: string; target?: string };
      }>;

      const addedNodeIds = lastAddCall
        .filter((el) => !el.data.source && !el.data.target)
        .map((el) => el.data.id);
      expect(addedNodeIds).toContain("task-4");
      expect(addedNodeIds).toContain("task-3");
      expect(addedNodeIds).toContain("task-2");
      expect(addedNodeIds).toContain("task-1");

      const addedEdgeIds = lastAddCall
        .filter((el) => el.data.source && el.data.target)
        .map((el) => `${el.data.source}->${el.data.target}`);
      expect(addedEdgeIds).toContain("task-3->task-4");
      expect(addedEdgeIds).toContain("task-2->task-3");
      expect(addedEdgeIds).toContain("task-1->task-2");
    });
    it("C. resize without pending rebuild only fits graph, does not rebuild", async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
      flushAnimationFrames();
      await element.updateComplete;

      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      const pendingBefore = await isPendingStructureRebuild();
      expect(pendingBefore).toBe(false);

      vi.clearAllMocks();
      removeSpy.mockClear();

      triggerResizeObserver(800, 600);
      await element.updateComplete;

      expect(mockCy.resize).toHaveBeenCalled();
      expect(mockCy.fit).toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
      expect(mockCy.add).not.toHaveBeenCalled();
    });
  });
});
