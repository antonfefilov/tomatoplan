/**
 * Track Graph Layout
 * Cytoscape layout configuration using dagre for DAG visualization
 */

/** Stylesheet entry for cytoscape styling */
export interface TrackStylesheetEntry {
  selector: string;
  style: Record<string, string | number>;
}

/** Dagre layout options for track graph */
export interface DagreLayoutOptions {
  name: "dagre";
  /** Direction of the layout (LR = left-to-right) */
  rankDir?: "TB" | "BT" | "LR" | "RL";
  /** Alignment of nodes within a rank */
  align?: "UL" | "UR" | "DL" | "DR";
  /** Node separation in the rank direction */
  nodeSep?: number;
  /** Node separation in the sibling direction */
  edgeSep?: number;
  /** Rank separation */
  rankSep?: number;
  /** Whether to fit the viewport after layout */
  fit?: boolean;
  /** Padding around the graph when fitting */
  padding?: number;
  /** Whether to animate the layout */
  animate?: boolean;
  /** Duration of animation in ms */
  animationDuration?: number;
  /** Easing function for animation */
  animationEasing?: (node: unknown) => number;
  /** Whether to randomize node positions before layout */
  randomize?: boolean;
  /** Whether to use a compound graph (for grouping) */
  useCompoundGraph?: boolean;
}

/**
 * Creates the default dagre layout options for track graphs
 * Optimized for left-to-right DAG visualization
 */
export function createDefaultLayoutOptions(): DagreLayoutOptions {
  return {
    name: "dagre",
    rankDir: "LR", // Left to right - natural for process flows
    nodeSep: 60, // Horizontal separation between nodes
    edgeSep: 20, // Separation between edges
    rankSep: 100, // Vertical separation between ranks/levels
    fit: true, // Fit to viewport after layout
    padding: 30, // Padding around the graph
    animate: true, // Smooth animation
    animationDuration: 300, // Fast animation
    randomize: false, // Deterministic layout
  };
}

/**
 * Creates layout options for initial render (with fit)
 */
export function createInitialLayoutOptions(): DagreLayoutOptions {
  return {
    ...createDefaultLayoutOptions(),
    fit: true,
    animate: false, // No animation on initial render
  };
}

/**
 * Creates layout options for structure changes (new nodes/edges)
 * Fits the graph to show new elements
 */
export function createStructureChangeLayoutOptions(): DagreLayoutOptions {
  return {
    ...createDefaultLayoutOptions(),
    fit: true,
    animate: true,
  };
}

/**
 * Creates layout options for relayout button
 * User-initiated relayout with animation and fit
 */
export function createRelayoutOptions(): DagreLayoutOptions {
  return {
    ...createDefaultLayoutOptions(),
    fit: true,
    animate: true,
    animationDuration: 500, // Slower for user visibility
  };
}

/**
 * Cytoscape stylesheet for track graph visualization
 * Uses CSS-like styling for nodes and edges
 */
export function createTrackGraphStylesheet(): TrackStylesheetEntry[] {
  return [
    // Default node styling
    {
      selector: "node",
      style: {
        width: 180,
        height: 60,
        shape: "roundrectangle",
        "background-color": "#ffffff",
        "border-width": 2,
        "border-color": "#e5e7eb",
        "border-opacity": 1,
        label: "data(title)",
        "font-size": 14,
        "font-weight": 600,
        color: "#111827",
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "text-max-width": 160,
        padding: "12px",
      },
    },
    // Node hover state (class-based, not :hover pseudo-selector)
    {
      selector: "node.hover",
      style: {
        "border-color": "#ef4444",
      },
    },
    // Selected node
    {
      selector: "node.selected",
      style: {
        "border-color": "#ef4444",
        "background-color": "#fef2f2",
      },
    },
    // Pending edge source node (during edge creation)
    {
      selector: "node.pending-edge-source",
      style: {
        "border-color": "#f59e0b",
        "background-color": "#fffbeb",
      },
    },
    // Completed/done task node
    {
      selector: "node.done",
      style: {
        "border-color": "#10b981",
        "background-color": "#ecfdf5",
        opacity: 0.85,
      },
    },
    // Readonly mode node (cursor removed - not valid in Cytoscape)
    {
      selector: "node.readonly",
      style: {
        // cursor property removed - not supported by Cytoscape
      },
    },
    // Default edge styling
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#9ca3af",
        "target-arrow-color": "#9ca3af",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 0.8,
        opacity: 0.9,
      },
    },
    // Edge hover state (class-based, not :hover pseudo-selector)
    {
      selector: "edge.hover",
      style: {
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
        width: 3,
      },
    },
    // Selected edge
    {
      selector: "edge.selected",
      style: {
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
        width: 3,
      },
    },
    // Readonly mode edge (cursor removed - not valid in Cytoscape)
    {
      selector: "edge.readonly",
      style: {
        // cursor property removed - not supported by Cytoscape
      },
    },
  ];
}

/**
 * Zoom and pan options for fitting the graph
 */
export interface FitOptions {
  /** Padding around the graph */
  padding?: number;
  /** Whether to animate the fit */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Minimum zoom level */
  minZoom?: number;
}

/**
 * Creates default fit options
 */
export function createDefaultFitOptions(): FitOptions {
  return {
    padding: 30,
    animate: true,
    animationDuration: 300,
    maxZoom: 1.5,
    minZoom: 0.3,
  };
}
