/**
 * Tests for Track Graph Adapter functions
 * Specifically tests edge ID encoding/decoding with UUID-like IDs
 */

import { describe, it, expect } from "vitest";
import {
  createEdgeId,
  parseEdgeId,
  createGraphElements,
  taskToNodeData,
} from "../src/graph/track/track-graph-adapter.js";
import type { Track } from "../src/models/track.js";
import type { Task } from "../src/models/task.js";

describe("track-graph-adapter", () => {
  describe("createEdgeId", () => {
    it("should create edge ID from simple task IDs", () => {
      const edgeId = createEdgeId("task-1", "task-2");
      expect(edgeId).toBe("task-1-->task-2");
    });

    it("should create edge ID from UUID-like task IDs containing dashes", () => {
      const uuidSource = "550e8400-e29b-41d4-a716-446655440000";
      const uuidTarget = "660e8400-e29b-41d4-a716-446655440001";
      const edgeId = createEdgeId(uuidSource, uuidTarget);

      // Should use the --> delimiter, not just dashes
      expect(edgeId).toContain("-->");
      expect(edgeId).toBe(
        `${encodeURIComponent(uuidSource)}-->${encodeURIComponent(uuidTarget)}`,
      );
    });

    it("should handle task IDs with special characters", () => {
      const source = "task-with-special chars!#$";
      const target = "another/task-id";
      const edgeId = createEdgeId(source, target);

      expect(edgeId).toContain("-->");
      // Verify the encoding works
      const parsed = parseEdgeId(edgeId);
      expect(parsed.sourceTaskId).toBe(source);
      expect(parsed.targetTaskId).toBe(target);
    });
  });

  describe("parseEdgeId", () => {
    it("should parse edge ID with simple task IDs", () => {
      const edgeId = createEdgeId("task-1", "task-2");
      const { sourceTaskId, targetTaskId } = parseEdgeId(edgeId);

      expect(sourceTaskId).toBe("task-1");
      expect(targetTaskId).toBe("task-2");
    });

    it("should parse edge ID with UUID-like task IDs containing dashes", () => {
      const uuidSource = "550e8400-e29b-41d4-a716-446655440000";
      const uuidTarget = "660e8400-e29b-41d4-a716-446655440001";
      const edgeId = createEdgeId(uuidSource, uuidTarget);
      const { sourceTaskId, targetTaskId } = parseEdgeId(edgeId);

      expect(sourceTaskId).toBe(uuidSource);
      expect(targetTaskId).toBe(uuidTarget);
    });

    it("should throw error for invalid edge ID format", () => {
      expect(() => parseEdgeId("invalid-no-delimiter")).toThrow(
        "Invalid edge ID format",
      );
    });

    it("should handle edge ID where source is all dashes", () => {
      const source = "---";
      const target = "task-2";
      const edgeId = createEdgeId(source, target);
      const { sourceTaskId, targetTaskId } = parseEdgeId(edgeId);

      expect(sourceTaskId).toBe("---");
      expect(targetTaskId).toBe("task-2");
    });
  });

  describe("createEdgeId and parseEdgeId roundtrip", () => {
    it("should correctly roundtrip with various ID formats", () => {
      const testCases = [
        { source: "task-1", target: "task-2" },
        {
          source: "550e8400-e29b-41d4-a716-446655440000",
          target: "660e8400-e29b-41d4-a716-446655440001",
        },
        { source: "a", target: "b" },
        {
          source: "task-with-many-dashes-123-456-789",
          target: "another-task-abc-def",
        },
        { source: "task%20with%20spaces", target: "task/with/slashes" },
      ];

      for (const { source, target } of testCases) {
        const edgeId = createEdgeId(source, target);
        const parsed = parseEdgeId(edgeId);

        expect(parsed.sourceTaskId).toBe(source);
        expect(parsed.targetTaskId).toBe(target);
      }
    });
  });

  describe("createGraphElements", () => {
    it("should create graph elements with UUID-like task IDs", () => {
      const uuid1 = "550e8400-e29b-41d4-a716-446655440000";
      const uuid2 = "660e8400-e29b-41d4-a716-446655440001";
      const uuid3 = "770e8400-e29b-41d4-a716-446655440002";

      const track: Track = {
        id: "track-1",
        title: "Test Track",
        taskIds: [uuid1, uuid2, uuid3],
        edges: [
          { sourceTaskId: uuid1, targetTaskId: uuid2 },
          { sourceTaskId: uuid2, targetTaskId: uuid3 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const tasks: Task[] = [
        {
          id: uuid1,
          title: "Task 1",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuid2,
          title: "Task 2",
          tomatoCount: 3,
          finishedTomatoCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: uuid3,
          title: "Task 3",
          tomatoCount: 1,
          finishedTomatoCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const elements = createGraphElements(track, tasks);

      // Should have 3 nodes and 2 edges
      expect(elements.length).toBe(5);

      // Check nodes
      const nodes = elements.filter((e) => e.group === "nodes");
      expect(nodes.length).toBe(3);

      // Check edges
      const edges = elements.filter((e) => e.group === "edges");
      expect(edges.length).toBe(2);

      // Verify edge data has correct source/target (UUIDs)
      for (const edge of edges) {
        if (edge.group === "edges") {
          const edgeData = edge.data;
          expect(edgeData.source).toBeDefined();
          expect(edgeData.target).toBeDefined();
          expect(edgeData.id).toBeDefined();

          // Verify edge ID can be parsed back correctly
          const parsed = parseEdgeId(edgeData.id);
          expect(parsed.sourceTaskId).toBe(edgeData.source);
          expect(parsed.targetTaskId).toBe(edgeData.target);
        }
      }
    });
  });

  describe("taskToNodeData", () => {
    it("should create node data for task with UUID-like ID", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const task: Task = {
        id: uuid,
        title: "Task with UUID",
        tomatoCount: 4,
        finishedTomatoCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const track: Track = {
        id: "track-1",
        title: "Test Track",
        taskIds: [uuid],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nodeData = taskToNodeData(task, track, { selectedNodeId: uuid });

      expect(nodeData.id).toBe(uuid);
      expect(nodeData.title).toBe("Task with UUID");
      expect(nodeData.tomatoCount).toBe(4);
      expect(nodeData.finishedTomatoCount).toBe(2);
      expect(nodeData.selected).toBe(true);
      expect(nodeData.isDone).toBe(false);
    });
  });
});
