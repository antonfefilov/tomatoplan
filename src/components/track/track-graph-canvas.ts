/**
 * TrackGraphCanvas - DAG visualization with SVG edges
 * Renders the track graph with nodes and dependency edges
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Track, TrackEdge } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import { getIncomingEdges, getOutgoingEdges } from "../../models/track.js";
import { getEdgePath, type NodePosition } from "../../utils/track-graph.js";
import { isTaskDone } from "../../models/task.js";
import "./track-node.js";
import "../shared/empty-state.js";

@customElement("track-graph-canvas")
export class TrackGraphCanvas extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .canvas-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .canvas-scroll {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .canvas-content {
      min-width: 100%;
      min-height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .graph-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .edge-path {
      fill: none;
      stroke: #9ca3af;
      stroke-width: 2;
      transition: stroke 0.15s ease;
      pointer-events: stroke;
    }

    .edge-path:hover {
      stroke: #ef4444;
      cursor: pointer;
    }

    .edge-path.selected {
      stroke: #ef4444;
      stroke-width: 3;
    }

    .edge-arrow {
      fill: #9ca3af;
      transition: fill 0.15s ease;
    }

    .edge-group:hover .edge-arrow {
      fill: #ef4444;
    }

    .nodes-container {
      position: relative;
      padding: 40px;
    }

    .instructions {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 16px;
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

    .empty-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40px;
    }
  `;

  @property({ type: Object })
  track?: Track;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Object })
  nodePositions: Map<string, NodePosition> = new Map();

  @property({ type: String })
  selectedNodeId: string | undefined = undefined;

  @property({ type: String })
  pendingEdgeSource: string | undefined = undefined;

  private readonly _nodeWidth = 180;
  private readonly _nodeHeight = 60;

  private _handleNodeSelect(taskId: string) {
    this.dispatchEvent(
      new CustomEvent("node-select", {
        bubbles: true,
        composed: true,
        detail: { taskId },
      }),
    );
  }

  private _handleStartEdgeCreation(taskId: string) {
    this.dispatchEvent(
      new CustomEvent("start-edge-creation", {
        bubbles: true,
        composed: true,
        detail: { taskId },
      }),
    );
  }

  private _handleCancelEdgeCreation() {
    this.dispatchEvent(
      new CustomEvent("cancel-edge-creation", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleRemoveEdge(sourceTaskId: string, targetTaskId: string) {
    this.dispatchEvent(
      new CustomEvent("remove-edge", {
        bubbles: true,
        composed: true,
        detail: { sourceTaskId, targetTaskId },
      }),
    );
  }

  private _handleRemoveTask(taskId: string) {
    this.dispatchEvent(
      new CustomEvent("remove-task-from-track", {
        bubbles: true,
        composed: true,
        detail: { taskId },
      }),
    );
  }

  private _getTask(taskId: string): Task | undefined {
    return this.tasks.find((t) => t.id === taskId);
  }

  private _renderEdge(edge: TrackEdge) {
    const sourcePos = this.nodePositions.get(edge.sourceTaskId);
    const targetPos = this.nodePositions.get(edge.targetTaskId);

    if (!sourcePos || !targetPos) return null;

    const path = getEdgePath(
      sourcePos,
      targetPos,
      this._nodeWidth,
      this._nodeHeight,
    );

    // Calculate arrow position at the end of the edge (for left-pointing arrow)
    const targetX = targetPos.x; // left side of target node
    const targetY = targetPos.y + this._nodeHeight / 2; // center vertically
    const arrowSize = 8;

    return html`
      <g
        class="edge-group"
        @click=${() =>
          this._handleRemoveEdge(edge.sourceTaskId, edge.targetTaskId)}
      >
        <path class="edge-path" d=${path} />
        <polygon
          class="edge-arrow"
          points="${targetX},${targetY -
          arrowSize} ${targetX},${targetY} ${targetX},${targetY + arrowSize}"
        />
      </g>
    `;
  }

  private _renderNode(taskId: string) {
    const position = this.nodePositions.get(taskId);
    if (!position) return null;

    const task = this._getTask(taskId);
    if (!task) return null;

    const isSelected = this.selectedNodeId === taskId;
    const isPendingSource = this.pendingEdgeSource === taskId;
    const isDone = isTaskDone(task);
    const incomingEdges = this.track
      ? getIncomingEdges(this.track, taskId)
      : [];
    const outgoingEdges = this.track
      ? getOutgoingEdges(this.track, taskId)
      : [];

    return html`
      <track-node
        style="position: absolute; left: ${position.x}px; top: ${position.y}px;"
        .task=${task}
        .selected=${isSelected}
        .isPendingEdgeSource=${isPendingSource}
        .isDone=${isDone}
        .incomingEdgeCount=${incomingEdges.length}
        .outgoingEdgeCount=${outgoingEdges.length}
        @node-select=${() => this._handleNodeSelect(taskId)}
        @start-edge=${() => this._handleStartEdgeCreation(taskId)}
        @remove-task=${() => this._handleRemoveTask(taskId)}
      ></track-node>
    `;
  }

  override render() {
    if (!this.track || this.tasks.length === 0) {
      return html`
        <div class="canvas-container">
          <div class="empty-container">
            <empty-state
              title="Empty Track"
              description="Add tasks from the palette to start building your workflow"
              icon="📊"
            ></empty-state>
          </div>
        </div>
      `;
    }

    // Calculate content dimensions
    let maxX = 0;
    let maxY = 0;
    for (const [_, pos] of this.nodePositions) {
      maxX = Math.max(maxX, pos.x + this._nodeWidth + 80);
      maxY = Math.max(maxY, pos.y + this._nodeHeight + 80);
    }

    return html`
      <div class="canvas-container">
        <div class="canvas-scroll">
          <div
            class="canvas-content"
            style="min-width: ${Math.max(maxX, 900)}px; min-height: ${Math.max(
              maxY,
              500,
            )}px;"
          >
            <svg
              class="graph-svg"
              viewBox="0 0 ${Math.max(maxX, 900)} ${Math.max(maxY, 500)}"
            >
              ${this.track.edges.map((edge) => this._renderEdge(edge))}
            </svg>

            <div class="nodes-container">
              ${this.track.taskIds.map((taskId) => this._renderNode(taskId))}
            </div>
          </div>
        </div>

        ${this.pendingEdgeSource
          ? html`
              <div class="pending-edge-indicator">
                <span
                  >Click another task to create dependency, or click the same
                  task to cancel</span
                >
                <button
                  class="cancel-btn"
                  @click=${this._handleCancelEdgeCreation}
                >
                  Cancel
                </button>
              </div>
            `
          : null}

        <div class="instructions">
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
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-graph-canvas": TrackGraphCanvas;
  }
}
