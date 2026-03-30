/**
 * TrackBuilderPanel - Main builder container for track visualization
 * Shows the track graph with nodes and edges using Cytoscape + dagre
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Track } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import type { Project } from "../../models/project.js";
import { getTaskLevels } from "../../utils/track-graph.js";
import "../shared/empty-state.js";
import "./track-task-palette.js";
import "./track-graph-editor.js";

@customElement("track-builder-panel")
export class TrackBuilderPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .builder-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f9fafb;
    }

    .builder-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .track-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .track-description {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }

    .track-project {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;
    }

    .project-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6b7280;
    }

    .stat-value {
      font-weight: 600;
      color: #111827;
    }

    .builder-content {
      flex: 1;
      display: flex;
      gap: 20px;
      padding: 20px;
      overflow: hidden;
    }

    .palette-section {
      width: 280px;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .graph-section {
      flex: 1;
      overflow: hidden;
    }

    .empty-state-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  @property({ type: Object })
  track?: Track;

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Array })
  availableTasks: readonly Task[] = [];

  @property({ type: Array })
  projects: readonly Project[] = [];

  @state()
  private _selectedNodeId: string | undefined = undefined;

  @state()
  private _pendingEdgeSource: string | undefined = undefined;

  private _getTrackTasks(): readonly Task[] {
    if (!this.track) return [];
    return this.tasks.filter((t) => this.track!.taskIds.includes(t.id));
  }

  private _getProjectInfo(projectId: string): Project | undefined {
    return this.projects.find((p) => p.id === projectId);
  }

  private _handleAddTaskToTrack(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("add-task-to-track", {
        bubbles: true,
        composed: true,
        detail: { trackId: this.track?.id, taskId: e.detail.taskId },
      }),
    );
  }

  private _handleRemoveTaskFromTrack(e: CustomEvent<{ taskId: string }>) {
    this.dispatchEvent(
      new CustomEvent("remove-task-from-track", {
        bubbles: true,
        composed: true,
        detail: { trackId: this.track?.id, taskId: e.detail.taskId },
      }),
    );
  }

  private _handleAddEdge(
    e: CustomEvent<{ sourceTaskId: string; targetTaskId: string }>,
  ) {
    this.dispatchEvent(
      new CustomEvent("add-track-edge", {
        bubbles: true,
        composed: true,
        detail: {
          trackId: this.track?.id,
          sourceTaskId: e.detail.sourceTaskId,
          targetTaskId: e.detail.targetTaskId,
        },
      }),
    );
    this._pendingEdgeSource = undefined;
  }

  private _handleRemoveEdge(
    e: CustomEvent<{ sourceTaskId: string; targetTaskId: string }>,
  ) {
    this.dispatchEvent(
      new CustomEvent("remove-track-edge", {
        bubbles: true,
        composed: true,
        detail: {
          trackId: this.track?.id,
          sourceTaskId: e.detail.sourceTaskId,
          targetTaskId: e.detail.targetTaskId,
        },
      }),
    );
  }

  // Handle events from the new track-graph-editor
  private _handleGraphNodeSelect(e: CustomEvent<{ nodeId: string }>) {
    const nodeId = e.detail.nodeId;

    if (this._pendingEdgeSource) {
      // We're in edge creation mode - complete the edge
      if (nodeId !== this._pendingEdgeSource) {
        this._handleAddEdge({
          detail: {
            sourceTaskId: this._pendingEdgeSource,
            targetTaskId: nodeId,
          },
        } as CustomEvent<{ sourceTaskId: string; targetTaskId: string }>);
      }
      this._pendingEdgeSource = undefined;
    } else {
      this._selectedNodeId = nodeId;
    }
  }

  private _handleGraphEdgeCreateRequest(
    e: CustomEvent<{ sourceTaskId: string; targetTaskId: string }>,
  ) {
    this._handleAddEdge(e);
    this._pendingEdgeSource = undefined;
  }

  private _handleGraphNodeRemoveRequest(e: CustomEvent<{ nodeId: string }>) {
    this.dispatchEvent(
      new CustomEvent("remove-task-from-track", {
        bubbles: true,
        composed: true,
        detail: { trackId: this.track?.id, taskId: e.detail.nodeId },
      }),
    );
  }

  private _handleGraphEdgeRemoveRequest(
    e: CustomEvent<{ sourceTaskId: string; targetTaskId: string }>,
  ) {
    this._handleRemoveEdge(e);
  }

  private _handleGraphEdgeCreationCancel() {
    this._pendingEdgeSource = undefined;
  }

  override render() {
    if (!this.track) {
      return html`
        <div class="builder-container">
          <div class="empty-state-container">
            <empty-state
              title="No Track Selected"
              description="Select a track from the sidebar or create a new one"
              icon="📋"
            ></empty-state>
          </div>
        </div>
      `;
    }

    const trackTasks = this._getTrackTasks();
    const project = this._getProjectInfo(this.track.projectId ?? "");
    const levels = getTaskLevels(this.track);
    const maxLevel = Math.max(...levels.values(), 0);

    return html`
      <div class="builder-container">
        <div class="builder-header">
          <div class="header-info">
            <h2 class="track-title">${this.track.title}</h2>
            ${this.track.description
              ? html`<p class="track-description">${this.track.description}</p>`
              : null}
            ${project
              ? html`
                  <div class="track-project">
                    <span
                      class="project-dot"
                      style="background-color: ${project.color ?? "#6b7280"}"
                    ></span>
                    ${project.title}
                  </div>
                `
              : null}
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="width: 16px; height: 16px"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span class="stat-value">${trackTasks.length}</span> tasks
            </div>
            <div class="stat-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="width: 16px; height: 16px"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span class="stat-value">${this.track.edges.length}</span> edges
            </div>
            <div class="stat-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="width: 16px; height: 16px"
              >
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
              </svg>
              <span class="stat-value">${maxLevel + 1}</span> levels
            </div>
          </div>
        </div>

        <div class="builder-content">
          <div class="palette-section">
            <track-task-palette
              .track=${this.track}
              .trackTasks=${trackTasks}
              .availableTasks=${this.availableTasks}
              @add-task-to-track=${this._handleAddTaskToTrack}
              @remove-task-from-track=${this._handleRemoveTaskFromTrack}
            ></track-task-palette>
          </div>

          <div class="graph-section">
            <track-graph-editor
              .track=${this.track}
              .tasks=${trackTasks}
              .selectedNodeId=${this._selectedNodeId}
              .pendingEdgeSource=${this._pendingEdgeSource}
              .readonly=${false}
              @track-node-select=${this._handleGraphNodeSelect}
              @track-edge-create-request=${this._handleGraphEdgeCreateRequest}
              @track-node-remove-request=${this._handleGraphNodeRemoveRequest}
              @track-edge-remove-request=${this._handleGraphEdgeRemoveRequest}
              @track-edge-creation-cancel=${this._handleGraphEdgeCreationCancel}
            ></track-graph-editor>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-builder-panel": TrackBuilderPanel;
  }
}
