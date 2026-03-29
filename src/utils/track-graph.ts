/**
 * Track Graph Utilities
 * DAG (Directed Acyclic Graph) utilities for track dependencies
 */

import type { Track } from "../models/track.js";

/**
 * Checks if adding an edge would create a cycle in the graph
 * Uses DFS to detect if there's a path from target to source
 * (which would create a cycle when adding source->target edge)
 */
export function wouldCreateCycle(
  track: Track,
  sourceTaskId: string,
  targetTaskId: string,
): boolean {
  // Self-loop would always be a cycle
  if (sourceTaskId === targetTaskId) {
    return true;
  }

  // Check if there's a path from target back to source
  // If so, adding source->target would create a cycle
  return hasPath(track, targetTaskId, sourceTaskId);
}

/**
 * Checks if there's a path from startTaskId to endTaskId using DFS
 */
function hasPath(
  track: Track,
  startTaskId: string,
  endTaskId: string,
): boolean {
  const visited = new Set<string>();
  const stack = [startTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === endTaskId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get all outgoing edges from current node
    const neighbors = track.edges
      .filter((edge) => edge.sourceTaskId === current)
      .map((edge) => edge.targetTaskId);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}

/**
 * Performs topological sort on the track's tasks
 * Returns tasks in order where dependencies come before dependents
 * Returns null if the graph has cycles (should not happen with validation)
 */
export function topologicalSort(track: Track): string[] | null {
  const taskIds = [...track.taskIds];
  const inDegree = new Map<string, number>();

  // Initialize in-degree for all tasks
  for (const taskId of taskIds) {
    inDegree.set(taskId, 0);
  }

  // Calculate in-degrees
  for (const edge of track.edges) {
    const current = inDegree.get(edge.targetTaskId) ?? 0;
    inDegree.set(edge.targetTaskId, current + 1);
  }

  // Start with tasks that have no dependencies (in-degree 0)
  const queue: string[] = [];
  for (const taskId of taskIds) {
    if (inDegree.get(taskId) === 0) {
      queue.push(taskId);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    // Reduce in-degree for all dependents
    for (const edge of track.edges) {
      if (edge.sourceTaskId === current) {
        const newDegree = (inDegree.get(edge.targetTaskId) ?? 1) - 1;
        inDegree.set(edge.targetTaskId, newDegree);
        if (newDegree === 0) {
          queue.push(edge.targetTaskId);
        }
      }
    }
  }

  // If not all tasks are in sorted order, there's a cycle
  if (sorted.length !== taskIds.length) {
    return null;
  }

  return sorted;
}

/**
 * Gets the depth/level of each task in the DAG
 * Tasks with no dependencies have level 0
 * Tasks that depend on level 0 tasks have level 1, etc.
 */
export function getTaskLevels(track: Track): Map<string, number> {
  const levels = new Map<string, number>();
  const taskIds = track.taskIds;

  // Initialize all tasks to level 0
  for (const taskId of taskIds) {
    levels.set(taskId, 0);
  }

  // Use topological sort to determine levels
  const sorted = topologicalSort(track);
  if (!sorted) {
    // Graph has cycles - return all at level 0
    return levels;
  }

  // Calculate levels based on dependencies
  for (const taskId of sorted) {
    const incomingEdges = track.edges.filter(
      (edge) => edge.targetTaskId === taskId,
    );
    if (incomingEdges.length > 0) {
      // Level is max of all predecessor levels + 1
      const maxPredLevel = Math.max(
        ...incomingEdges.map((edge) => levels.get(edge.sourceTaskId) ?? 0),
      );
      levels.set(taskId, maxPredLevel + 1);
    }
  }

  return levels;
}

/**
 * Gets the maximum level/depth of the track graph
 */
export function getTrackDepth(track: Track): number {
  const levels = getTaskLevels(track);
  if (levels.size === 0) {
    return 0;
  }
  return Math.max(...levels.values());
}

/**
 * Gets all tasks at a specific level
 */
export function getTasksAtLevel(track: Track, level: number): string[] {
  const levels = getTaskLevels(track);
  return track.taskIds.filter((taskId) => levels.get(taskId) === level);
}

/**
 * Validates that all edges reference tasks that exist in the track
 */
export function validateEdges(track: Track): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const taskSet = new Set(track.taskIds);

  for (const edge of track.edges) {
    if (!taskSet.has(edge.sourceTaskId)) {
      errors.push(`Edge references unknown source task: ${edge.sourceTaskId}`);
    }
    if (!taskSet.has(edge.targetTaskId)) {
      errors.push(`Edge references unknown target task: ${edge.targetTaskId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if the track graph has any cycles
 */
export function hasCycle(track: Track): boolean {
  return topologicalSort(track) === null;
}

/**
 * Gets all tasks that can be started (no unfinished dependencies)
 * This considers both the graph structure AND task completion status
 */
export function getReadyTasks(
  track: Track,
  finishedTaskIds: Set<string>,
): string[] {
  return track.taskIds.filter((taskId) => {
    // If already finished, not "ready" in the sense of needing work
    if (finishedTaskIds.has(taskId)) {
      return false;
    }

    // Check if all dependencies are finished
    const dependencies = track.edges
      .filter((edge) => edge.targetTaskId === taskId)
      .map((edge) => edge.sourceTaskId);

    return dependencies.every((depId) => finishedTaskIds.has(depId));
  });
}

/**
 * Calculates auto-layout positions for nodes in the track graph
 * Returns positions in a grid layout based on levels spread on the x-axis
 */
export function calculateNodePositions(
  track: Track,
  nodeWidth: number = 180,
  nodeHeight: number = 60,
  horizontalGap: number = 40,
  verticalGap: number = 80,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const levels = getTaskLevels(track);

  // Group tasks by level
  const tasksByLevel = new Map<number, string[]>();
  for (const taskId of track.taskIds) {
    const level = levels.get(taskId) ?? 0;
    const existing = tasksByLevel.get(level) ?? [];
    tasksByLevel.set(level, [...existing, taskId]);
  }

  // Calculate positions
  for (const [level, tasks] of tasksByLevel) {
    const x = level * (nodeWidth + horizontalGap);
    const totalHeight =
      tasks.length * nodeHeight + (tasks.length - 1) * verticalGap;
    const startY = -totalHeight / 2; // Center vertically

    tasks.forEach((taskId, index) => {
      const y = startY + index * (nodeHeight + verticalGap);
      positions.set(taskId, { x, y });
    });
  }

  return positions;
}

/**
 * Gets edge path data for SVG rendering
 * Returns bezier curve path from source to target node centers
 */
export function getEdgePath(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  nodeWidth: number = 180,
  nodeHeight: number = 60,
): string {
  // Calculate connection points (right of source, left of target for horizontal flow)
  const sourceX = sourcePos.x + nodeWidth; // right side of source
  const sourceY = sourcePos.y + nodeHeight / 2; // center vertically
  const targetX = targetPos.x; // left side of target
  const targetY = targetPos.y + nodeHeight / 2; // center vertically

  // Create bezier curve with control points for smooth horizontal connection
  const midX = (sourceX + targetX) / 2;

  return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
}

/**
 * Type for node position
 */
export interface NodePosition {
  x: number;
  y: number;
}
