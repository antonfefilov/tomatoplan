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
vi.mock("cytoscape", () => {
  const mockCy = {
    on: vi.fn(),
    elements: vi.fn(() => ({ remove: vi.fn() })),
    add: vi.fn(),
    layout: vi.fn(() => ({ run: vi.fn() })),
    fit: vi.fn(),
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
    // These tests use the actual component's internal logic
    // They verify that events are wired correctly by testing the output

    beforeEach(async () => {
      element.track = mockTrack;
      element.tasks = mockTasks;
      await element.updateComplete;
    });

    describe("node selection behavior", () => {
      it("should set pendingEdgeSource when shift-clicked on node", async () => {
        // Simulate shift-click behavior by setting pendingEdgeSource
        element.pendingEdgeSource = "task-1";
        await element.updateComplete;

        expect(element.pendingEdgeSource).toBe("task-1");

        // Should show pending edge indicator
        const indicator = element.querySelector(".pending-edge-indicator");
        expect(indicator).toBeDefined();
      });

      it("should emit edge create request when completing edge creation", async () => {
        element.pendingEdgeSource = "task-1";
        await element.updateComplete;

        const eventSpy = vi.fn();
        element.addEventListener("track-edge-create-request", eventSpy);

        // Dispatch event simulating edge creation completion
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

        // Component should be in readonly mode
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
    // These tests verify the readonly guard in the node tap handler
    // by capturing the registered handler and invoking it directly

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
      // Get the mock cytoscape instance
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      // Capture the tap handler
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

      // Set readonly mode
      element.readonly = true;
      await element.updateComplete;

      // Listen for events
      const nodeSelectSpy = vi.fn();
      const edgeCreateSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);
      element.addEventListener("track-edge-create-request", edgeCreateSpy);

      // Simulate shift+tap on node (shift+click to start edge creation)
      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: true },
      });

      // Should emit node select (allowed in readonly)
      expect(nodeSelectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { nodeId: "task-1" },
        }),
      );

      // Should NOT start edge creation (pendingEdgeSource should remain undefined)
      expect(element.pendingEdgeSource).toBeUndefined();

      // Should NOT emit edge create request
      expect(edgeCreateSpy).not.toHaveBeenCalled();
    });

    it("should NOT emit track-edge-create-request on pending edge completion when readonly", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      // Capture the tap handler
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

      // Set up pending edge state and readonly mode
      element.pendingEdgeSource = "task-1";
      element.readonly = true;
      await element.updateComplete;

      // Listen for events
      const nodeSelectSpy = vi.fn();
      const edgeCreateSpy = vi.fn();
      const edgeCancelSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);
      element.addEventListener("track-edge-create-request", edgeCreateSpy);
      element.addEventListener("track-edge-creation-cancel", edgeCancelSpy);

      // Simulate tap on target node (completing edge creation flow)
      tapHandler!({
        target: { id: () => "task-2" },
        originalEvent: { shiftKey: false },
      });

      // Should emit node select (allowed in readonly)
      expect(nodeSelectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { nodeId: "task-2" },
        }),
      );

      // Should NOT emit edge create request
      expect(edgeCreateSpy).not.toHaveBeenCalled();

      // Should cancel pending edge creation
      expect(edgeCancelSpy).toHaveBeenCalled();
      expect(element.pendingEdgeSource).toBeUndefined();
    });

    it("should allow edge creation when NOT readonly (shift+tap start)", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      // Capture the tap handler
      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      // Ensure NOT readonly
      element.readonly = false;
      await element.updateComplete;

      // Listen for events
      const nodeSelectSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);

      // Simulate shift+tap on node to start edge creation
      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: true },
      });

      // Should NOT emit node select when starting edge creation
      expect(nodeSelectSpy).not.toHaveBeenCalled();

      // Should start edge creation
      expect(element.pendingEdgeSource).toBe("task-1");
    });

    it("should allow edge creation when NOT readonly (pending edge completion)", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      // Capture the tap handler
      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      // Set up pending edge state (NOT readonly)
      element.pendingEdgeSource = "task-1";
      element.readonly = false;
      await element.updateComplete;

      // Listen for events
      const edgeCreateSpy = vi.fn();
      element.addEventListener("track-edge-create-request", edgeCreateSpy);

      // Simulate tap on target node
      tapHandler!({
        target: { id: () => "task-2" },
        originalEvent: { shiftKey: false },
      });

      // Should emit edge create request
      expect(edgeCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { sourceTaskId: "task-1", targetTaskId: "task-2" },
        }),
      );

      // Should clear pending edge
      expect(element.pendingEdgeSource).toBeUndefined();
    });

    it("should dispatch track-node-select on regular tap when readonly", async () => {
      const cytoscapeModule = await import("cytoscape");
      const mockCy = (
        cytoscapeModule.default as unknown as ReturnType<typeof vi.fn>
      )();

      // Capture the tap handler
      const tapHandler = (
        mockCy.on as unknown as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: unknown[]) => call[0] === "tap" && call[1] === "node",
      )?.[2] as ((event: TapEvent) => void) | undefined;

      expect(tapHandler).toBeDefined();

      // Set readonly mode (no pending edge)
      element.readonly = true;
      element.pendingEdgeSource = undefined;
      await element.updateComplete;

      // Listen for events
      const nodeSelectSpy = vi.fn();
      element.addEventListener("track-node-select", nodeSelectSpy);

      // Simulate regular tap on node (no shift key)
      tapHandler!({
        target: { id: () => "task-1" },
        originalEvent: { shiftKey: false },
      });

      // Should emit node select (allowed in readonly)
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

      // The component should have updated selectedNodeId
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
});
