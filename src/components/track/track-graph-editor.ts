/**
 * TrackGraphEditor - Lit component wrapping Cytoscape for track visualization
 * Uses Light DOM for Cytoscape compatibility
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Track } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import cytoscape, {
  type Core,
  type NodeSingular,
  type EdgeSingular,
  type LayoutOptions,
} from "cytoscape";
import dagre from "cytoscape-dagre";
import {
  createGraphElements,
  hasStructureChanged,
  taskToNodeData,
} from "../../graph/track/track-graph-adapter.js";
import {
  createTrackGraphStylesheet,
  createInitialLayoutOptions,
  createStructureChangeLayoutOptions,
  createDefaultFitOptions,
  type DagreLayoutOptions,
} from "../../graph/track/track-graph-layout.js";

// Register dagre layout extension
cytoscape.use(dagre);

/** Custom event detail types for track graph editor */
export interface TrackNodeSelectEventDetail {
  nodeId: string;
}

export interface TrackEdgeSelectEventDetail {
  sourceTaskId: string;
  targetTaskId: string;
}

export interface TrackEdgeCreateRequestEventDetail {
  sourceTaskId: string;
  targetTaskId: string;
}

export interface TrackNodeRemoveRequestEventDetail {
  nodeId: string;
}

export interface TrackEdgeRemoveRequestEventDetail {
  sourceTaskId: string;
  targetTaskId: string;
}

@customElement("track-graph-editor")
export class TrackGraphEditor extends LitElement {
  /** Use Light DOM for Cytoscape compatibility */
  override createRenderRoot() {
    return this;
  }

  static override styles = css`
    .track-graph-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .graph-controls {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }

    .control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      color: #6b7280;
    }

    .control-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #111827;
    }

    .control-btn svg {
      width: 16px;
      height: 16px;
    }

    .cytoscape-container {
      width: 100%;
      height: 100%;
    }

    .instructions-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: rgba(249, 250, 251, 0.95);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 5;
    }

    .instruction-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .instruction-key {
      background: #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      color: #374151;
    }

    .pending-edge-indicator {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #991b1b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .cancel-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 12px;
      color: #991b1b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cancel-btn:hover {
      background: #fef2f2;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
      color: #6b7280;
      font-size: 14px;
    }
  `;

  @property({ type: Object })
  track?: Track;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: String })
  selectedNodeId?: string;

  @property({ type: String })
  pendingEdgeSource?: string;

  @property({ type: Boolean })
  readonly = false;

  @state()
  private _cy?: Core;

  @state()
  private _previousTrack?: Track;

  @state()
  private _isInitialized = false;

  private _containerId = `cy-container-${Math.random().toString(36).slice(2, 9)}`;

  override firstUpdated() {
    // Only initialize if we have a track with tasks (container exists)
    if (this.track && this.tasks.length > 0) {
      this._initializeCytoscape();
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    const trackChanged = changedProperties.has("track");
    const tasksChanged = changedProperties.has("tasks");
    const optionsChanged =
      changedProperties.has("selectedNodeId") ||
      changedProperties.has("pendingEdgeSource") ||
      changedProperties.has("readonly");

    // Check for empty -> non-empty transition (need to initialize Cytoscape)
    const nowHasGraph = this.track && this.tasks.length > 0;

    if (!this._isInitialized && nowHasGraph) {
      // Transition from empty to graph state - initialize Cytoscape
      this._initializeCytoscape();
      return;
    }

    // Check for graph -> empty transition (need to destroy Cytoscape)
    const nowEmpty = !this.track || this.tasks.length === 0;
    if ((trackChanged || tasksChanged) && nowEmpty && this._isInitialized) {
      this._destroyCytoscape();
      return;
    }

    if (!this._cy || !this._isInitialized) return;

    // Determine what changed and sync accordingly
    if (trackChanged || tasksChanged) {
      this._syncGraph();
    } else if (optionsChanged) {
      this._syncNodeClasses();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyCytoscape();
  }

  private _initializeCytoscape() {
    const container = this.querySelector(`#${this._containerId}`);
    if (!container) {
      console.error("Cytoscape container not found");
      return;
    }

    // Create initial elements if track exists
    const elements =
      this.track && this.tasks.length > 0
        ? createGraphElements(this.track, this.tasks, {
            selectedNodeId: this.selectedNodeId,
            pendingEdgeSource: this.pendingEdgeSource,
            readonly: this.readonly,
          })
        : [];

    this._cy = cytoscape({
      container: container as HTMLElement,
      elements: elements,
      style: createTrackGraphStylesheet(),
      layout: createInitialLayoutOptions(),
      minZoom: 0.3,
      maxZoom: 2,
      wheelSensitivity: 0.3,
    });

    // Wire up events
    this._setupEventHandlers();

    this._isInitialized = true;
    this._previousTrack = this.track;

    // Fit graph after initial layout
    if (elements.length > 0) {
      this._fitGraph();
    }
  }

  private _setupEventHandlers() {
    if (!this._cy) return;

    // Node tap/click
    this._cy.on("tap", "node", (event) => {
      const node = event.target as NodeSingular;
      const nodeId = node.id();

      // If shift key held, start edge creation (blocked in readonly mode)
      if (event.originalEvent?.shiftKey) {
        // Block edge creation in readonly mode
        if (this.readonly) {
          // Still allow node selection in readonly mode
          this._emitNodeSelect(nodeId);
          return;
        }

        if (this.pendingEdgeSource) {
          // Complete edge creation
          if (nodeId !== this.pendingEdgeSource) {
            this._emitEdgeCreateRequest(this.pendingEdgeSource, nodeId);
          }
          this._cancelEdgeCreation();
        } else {
          // Start edge creation from this node
          this.pendingEdgeSource = nodeId;
        }
      } else {
        // Regular node selection
        if (this.pendingEdgeSource) {
          // Block edge creation in readonly mode, just cancel and select
          if (this.readonly) {
            this._cancelEdgeCreation();
            this._emitNodeSelect(nodeId);
            return;
          }

          // In edge creation mode - complete or cancel
          if (nodeId !== this.pendingEdgeSource) {
            this._emitEdgeCreateRequest(this.pendingEdgeSource, nodeId);
          }
          this._cancelEdgeCreation();
        } else {
          this._emitNodeSelect(nodeId);
        }
      }
    });

    // Edge tap/click
    this._cy.on("tap", "edge", (event) => {
      if (this.readonly) return;

      const edge = event.target as EdgeSingular;
      // Use edge.data() directly instead of parsing ID to handle UUID-like task IDs
      const sourceTaskId = edge.data("source") as string;
      const targetTaskId = edge.data("target") as string;
      this._emitEdgeRemoveRequest(sourceTaskId, targetTaskId);
    });

    // Double-click on node to remove
    this._cy.on("dblclick", "node", (event) => {
      if (this.readonly) return;

      const node = event.target as NodeSingular;
      this._emitNodeRemoveRequest(node.id());
    });
  }

  private _syncGraph() {
    if (!this._cy) return;

    const hasStructChange = hasStructureChanged(
      this._previousTrack,
      this.track,
    );

    if (hasStructChange || !this.track) {
      // Full rebuild
      this._rebuildGraph();
    } else {
      // Just sync data/classes
      this._syncNodeData();
      this._syncNodeClasses();
    }

    this._previousTrack = this.track;
  }

  private _rebuildGraph() {
    if (!this._cy) return;

    // Remove all elements
    this._cy.elements().remove();

    if (!this.track) {
      return;
    }

    // Add new elements
    const elements = createGraphElements(this.track, this.tasks, {
      selectedNodeId: this.selectedNodeId,
      pendingEdgeSource: this.pendingEdgeSource,
      readonly: this.readonly,
    });

    if (elements.length > 0) {
      this._cy.add(elements);

      // Run layout for new structure
      this._runLayout(createStructureChangeLayoutOptions());

      // Fit to show all elements
      this._fitGraph();
    }
  }

  private _syncNodeData() {
    if (!this._cy || !this.track) return;

    // Update data for existing nodes
    for (const taskId of this.track.taskIds) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) continue;

      const node = this._cy.getElementById(taskId);
      if (node.length > 0) {
        const newData = taskToNodeData(task, this.track, {
          selectedNodeId: this.selectedNodeId,
          pendingEdgeSource: this.pendingEdgeSource,
          readonly: this.readonly,
        });
        node.data(newData);
      }
    }
  }

  private _syncNodeClasses() {
    if (!this._cy) return;

    // Update classes for all nodes - compute directly from current component props
    this._cy.nodes().forEach((node) => {
      const nodeId = node.id();
      const data = node.data() as {
        id: string;
        isDone?: boolean;
      };

      // Clear dynamic classes
      node.removeClass("selected pending-edge-source done readonly");

      // Add appropriate classes computed from current component state
      // Note: selected, isPendingEdgeSource, readonly are computed from component props
      // not from stale node.data() to ensure correct reactive updates
      if (this.selectedNodeId === nodeId) {
        node.addClass("selected");
      }
      if (this.pendingEdgeSource === nodeId) {
        node.addClass("pending-edge-source");
      }
      // isDone is task-specific metadata, still read from node.data()
      if (data.isDone) {
        node.addClass("done");
      }
      if (this.readonly) {
        node.addClass("readonly");
      }
    });

    // Update edge classes
    this._cy.edges().removeClass("readonly");
    if (this.readonly) {
      this._cy.edges().addClass("readonly");
    }
  }

  private _runLayout(options: DagreLayoutOptions) {
    if (!this._cy) return;

    const layout = this._cy.layout(options as unknown as LayoutOptions);
    layout.run();
  }

  private _fitGraph() {
    if (!this._cy) return;

    const fitOptions = createDefaultFitOptions();
    this._cy.fit(undefined, fitOptions.padding);
  }

  private _cancelEdgeCreation() {
    this.pendingEdgeSource = undefined;
    this.dispatchEvent(
      new CustomEvent("track-edge-creation-cancel", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Event emission helpers
  private _emitNodeSelect(nodeId: string) {
    this.dispatchEvent(
      new CustomEvent<TrackNodeSelectEventDetail>("track-node-select", {
        bubbles: true,
        composed: true,
        detail: { nodeId },
      }),
    );
  }

  private _emitEdgeCreateRequest(sourceTaskId: string, targetTaskId: string) {
    this.dispatchEvent(
      new CustomEvent<TrackEdgeCreateRequestEventDetail>(
        "track-edge-create-request",
        {
          bubbles: true,
          composed: true,
          detail: { sourceTaskId, targetTaskId },
        },
      ),
    );
  }

  private _emitNodeRemoveRequest(nodeId: string) {
    this.dispatchEvent(
      new CustomEvent<TrackNodeRemoveRequestEventDetail>(
        "track-node-remove-request",
        {
          bubbles: true,
          composed: true,
          detail: { nodeId },
        },
      ),
    );
  }

  private _emitEdgeRemoveRequest(sourceTaskId: string, targetTaskId: string) {
    this.dispatchEvent(
      new CustomEvent<TrackEdgeRemoveRequestEventDetail>(
        "track-edge-remove-request",
        {
          bubbles: true,
          composed: true,
          detail: { sourceTaskId, targetTaskId },
        },
      ),
    );
  }

  private _handleRelayout() {
    this._runLayout(createStructureChangeLayoutOptions());
    this._fitGraph();
  }

  private _handleFit() {
    this._fitGraph();
  }

  private _handleCancelEdgeCreation() {
    this._cancelEdgeCreation();
  }

  private _destroyCytoscape() {
    if (this._cy) {
      this._cy.destroy();
      this._cy = undefined;
      this._isInitialized = false;
    }
  }

  override render() {
    if (!this.track || this.tasks.length === 0) {
      return html`
        <div class="track-graph-container">
          <div class="empty-state">
            <div>
              <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
              <div>Empty Track</div>
              <div style="font-size: 12px; margin-top: 4px;">
                Add tasks from the palette to start building your workflow
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="track-graph-container">
        <div class="graph-controls">
          <button
            class="control-btn"
            title="Relayout graph"
            @click=${this._handleRelayout}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <button
            class="control-btn"
            title="Fit to view"
            @click=${this._handleFit}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>

        <div id="${this._containerId}" class="cytoscape-container"></div>

        ${this.pendingEdgeSource
          ? html`
              <div class="pending-edge-indicator">
                <span>Click another task to create dependency, or cancel</span>
                <button
                  class="cancel-btn"
                  @click=${this._handleCancelEdgeCreation}
                >
                  Cancel
                </button>
              </div>
            `
          : null}

        <div class="instructions-overlay">
          <div class="instruction-item">
            <span class="instruction-key">Click</span>
            <span>node to select</span>
          </div>
          <div class="instruction-item">
            <span class="instruction-key">Shift+Click</span>
            <span>to create edge</span>
          </div>
          <div class="instruction-item">
            <span class="instruction-key">Click edge</span>
            <span>to remove</span>
          </div>
          <div class="instruction-item">
            <span class="instruction-key">DblClick</span>
            <span>node to remove</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-graph-editor": TrackGraphEditor;
  }

  interface HTMLElementEventMap {
    "track-node-select": CustomEvent<TrackNodeSelectEventDetail>;
    "track-edge-select": CustomEvent<TrackEdgeSelectEventDetail>;
    "track-edge-create-request": CustomEvent<TrackEdgeCreateRequestEventDetail>;
    "track-node-remove-request": CustomEvent<TrackNodeRemoveRequestEventDetail>;
    "track-edge-remove-request": CustomEvent<TrackEdgeRemoveRequestEventDetail>;
    "track-edge-creation-cancel": CustomEvent;
  }
}
