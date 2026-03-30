/**
 * Track Graph Adapter
 * Converts Track/Task data to Cytoscape elements and vice versa
 */

import type { Track } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import { isTaskDone } from "../../models/task.js";
import { getIncomingEdges, getOutgoingEdges } from "../../models/track.js";
import type {
  TrackNodeData,
  TrackEdgeData,
  TrackNodeDefinition,
  TrackEdgeDefinition,
  TrackGraphElement,
  TrackGraphEditorOptions,
} from "./track-graph-types.js";

/**
 * Creates a unique edge ID from source and target task IDs.
 * Uses URL-safe base64 encoding to avoid collision issues with task IDs that contain dashes (e.g., UUIDs).
 */
export function createEdgeId(
  sourceTaskId: string,
  targetTaskId: string,
): string {
  // Use a delimiter that's unlikely to be in task IDs
  // Encode both IDs to make the delimiter safe
  const encodedSource = encodeURIComponent(sourceTaskId);
  const encodedTarget = encodeURIComponent(targetTaskId);
  return `${encodedSource}-->${encodedTarget}`;
}

/**
 * Parses an edge ID back to source and target task IDs.
 * Handles task IDs that contain special characters like dashes (UUIDs).
 */
export function parseEdgeId(edgeId: string): {
  sourceTaskId: string;
  targetTaskId: string;
} {
  const delimiter = "-->";
  const delimiterIndex = edgeId.indexOf(delimiter);
  if (delimiterIndex === -1) {
    throw new Error(`Invalid edge ID format: ${edgeId}`);
  }
  const encodedSource = edgeId.slice(0, delimiterIndex);
  const encodedTarget = edgeId.slice(delimiterIndex + delimiter.length);
  return {
    sourceTaskId: decodeURIComponent(encodedSource),
    targetTaskId: decodeURIComponent(encodedTarget),
  };
}

/**
 * Converts a Task to TrackNodeData for Cytoscape
 */
export function taskToNodeData(
  task: Task,
  track: Track,
  options: TrackGraphEditorOptions = {},
): TrackNodeData {
  const incomingEdges = getIncomingEdges(track, task.id);
  const outgoingEdges = getOutgoingEdges(track, task.id);

  return {
    id: task.id,
    title: task.title,
    tomatoCount: task.tomatoCount,
    finishedTomatoCount: task.finishedTomatoCount,
    isDone: isTaskDone(task),
    selected: options.selectedNodeId === task.id,
    incomingEdgeCount: incomingEdges.length,
    outgoingEdgeCount: outgoingEdges.length,
    isPendingEdgeSource: options.pendingEdgeSource === task.id,
    readonly: options.readonly ?? false,
  };
}

/**
 * Converts a TrackEdge to TrackEdgeData for Cytoscape
 */
export function edgeToEdgeData(
  sourceTaskId: string,
  targetTaskId: string,
): TrackEdgeData {
  return {
    source: sourceTaskId,
    target: targetTaskId,
    id: createEdgeId(sourceTaskId, targetTaskId),
  };
}

/**
 * Creates all node definitions from a track's tasks
 */
export function createNodeElements(
  track: Track,
  tasks: readonly Task[],
  options: TrackGraphEditorOptions = {},
): TrackNodeDefinition[] {
  return track.taskIds
    .map((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return null;
      return {
        group: "nodes",
        data: taskToNodeData(task, track, options),
      };
    })
    .filter((n): n is TrackNodeDefinition => n !== null);
}

/**
 * Creates all edge definitions from a track's edges
 */
export function createEdgeElements(track: Track): TrackEdgeDefinition[] {
  return track.edges.map((edge) => ({
    group: "edges",
    data: edgeToEdgeData(edge.sourceTaskId, edge.targetTaskId),
  }));
}

/**
 * Creates all Cytoscape elements from a track and its tasks
 */
export function createGraphElements(
  track: Track,
  tasks: readonly Task[],
  options: TrackGraphEditorOptions = {},
): TrackGraphElement[] {
  const nodes = createNodeElements(track, tasks, options);
  const edges = createEdgeElements(track);
  return [...nodes, ...edges];
}

/**
 * Updates node data for a specific task (for reactive sync)
 */
export function updateNodeData(
  existingData: TrackNodeData,
  task: Task,
  track: Track,
  options: TrackGraphEditorOptions = {},
): TrackNodeData {
  return taskToNodeData(task, track, { ...options, ...existingData });
}

/**
 * Checks if the graph structure has changed (nodes or edges added/removed)
 */
export function hasStructureChanged(
  oldTrack: Track | undefined,
  newTrack: Track | undefined,
): boolean {
  if (!oldTrack && !newTrack) return false;
  if (!oldTrack || !newTrack) return true;
  if (oldTrack.id !== newTrack.id) return true;

  // Check task IDs
  const oldTaskIds = new Set(oldTrack.taskIds);
  const newTaskIds = new Set(newTrack.taskIds);
  if (oldTaskIds.size !== newTaskIds.size) return true;
  for (const id of newTaskIds) {
    if (!oldTaskIds.has(id)) return true;
  }

  // Check edges
  const oldEdges = new Set(
    oldTrack.edges.map((e) => createEdgeId(e.sourceTaskId, e.targetTaskId)),
  );
  const newEdges = new Set(
    newTrack.edges.map((e) => createEdgeId(e.sourceTaskId, e.targetTaskId)),
  );
  if (oldEdges.size !== newEdges.size) return true;
  for (const id of newEdges) {
    if (!oldEdges.has(id)) return true;
  }

  return false;
}

/**
 * Checks if only metadata changed (task properties, selection state)
 * Structure is the same but data needs sync
 */
export function hasMetadataChanged(
  oldTasks: readonly Task[],
  newTasks: readonly Task[],
  oldOptions: TrackGraphEditorOptions,
  newOptions: TrackGraphEditorOptions,
): boolean {
  // Check options changes
  if (oldOptions.selectedNodeId !== newOptions.selectedNodeId) return true;
  if (oldOptions.pendingEdgeSource !== newOptions.pendingEdgeSource)
    return true;
  if (oldOptions.readonly !== newOptions.readonly) return true;

  // Check task metadata changes
  const oldTaskMap = new Map(oldTasks.map((t) => [t.id, t]));
  for (const newTask of newTasks) {
    const oldTask = oldTaskMap.get(newTask.id);
    if (!oldTask) continue;
    if (oldTask.title !== newTask.title) return true;
    if (oldTask.tomatoCount !== newTask.tomatoCount) return true;
    if (oldTask.finishedTomatoCount !== newTask.finishedTomatoCount)
      return true;
  }

  return false;
}
