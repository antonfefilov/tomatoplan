/**
 * Track Graph Types
 * Type definitions for Cytoscape-based track graph visualization
 */

import type { Core, NodeSingular, EdgeSingular } from "cytoscape";

/** Node data for a task in the track graph */
export interface TrackNodeData {
  /** Task ID */
  id: string;
  /** Task title */
  title: string;
  /** Number of planned tomatoes */
  tomatoCount: number;
  /** Number of finished tomatoes */
  finishedTomatoCount: number;
  /** Whether the task is done */
  isDone: boolean;
  /** Whether this node is selected */
  selected: boolean;
  /** Number of incoming edges (dependencies) */
  incomingEdgeCount: number;
  /** Number of outgoing edges (dependents) */
  outgoingEdgeCount: number;
  /** Whether this node is the pending edge source */
  isPendingEdgeSource: boolean;
  /** Whether the editor is in readonly mode */
  readonly: boolean;
}

/** Edge data for a dependency in the track graph */
export interface TrackEdgeData {
  /** Source task ID */
  source: string;
  /** Target task ID */
  target: string;
  /** Unique edge ID (source-target) */
  id: string;
}

/** Cytoscape element definition for nodes */
export interface TrackNodeDefinition {
  group: "nodes";
  data: TrackNodeData;
}

/** Cytoscape element definition for edges */
export interface TrackEdgeDefinition {
  group: "edges";
  data: TrackEdgeData;
}

/** Combined elements collection */
export type TrackGraphElement = TrackNodeDefinition | TrackEdgeDefinition;

/** Options for the track graph editor */
export interface TrackGraphEditorOptions {
  /** Whether the editor is readonly */
  readonly?: boolean;
  /** ID of the currently selected node */
  selectedNodeId?: string;
  /** ID of the node that is the pending edge source */
  pendingEdgeSource?: string;
  /** Whether to run layout on initial render */
  runLayout?: boolean;
  /** Whether to fit the graph after layout */
  fitAfterLayout?: boolean;
}

/** Custom events emitted by the track graph editor */
export interface TrackGraphEvents {
  /** Fired when a node is clicked/selected */
  "track-node-select": { nodeId: string };
  /** Fired when an edge is clicked/selected */
  "track-edge-select": { sourceTaskId: string; targetTaskId: string };
  /** Fired when user requests to create an edge (shift+click) */
  "track-edge-create-request": { sourceTaskId: string; targetTaskId: string };
  /** Fired when user requests to remove a node */
  "track-node-remove-request": { nodeId: string };
  /** Fired when user requests to remove an edge */
  "track-edge-remove-request": { sourceTaskId: string; targetTaskId: string };
}

/** Cytoscape instance type with our extensions */
export type TrackCytoscape = Core;

/** Node collection type */
export type TrackNodeCollection = NodeSingular;

/** Edge collection type */
export type TrackEdgeCollection = EdgeSingular;
