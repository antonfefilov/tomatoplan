/**
 * ProjectListPanel - Project view container
 * Shows project list with add project functionality
 * Can be used in planning mode (Week view) or analytics mode (Projects tab)
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Project } from "../../models/project.js";
import type { Task } from "../../models/task.js";
import type { Track } from "../../models/track.js";
import {
  getProjectRelationsMap,
  type ProjectRelationsMap,
} from "../../models/project-relations.js";
import "./project-list.js";
import "./project-editor-dialog.js";

@customElement("project-list-panel")
export class ProjectListPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f9fafb;
    }

    .panel-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 20px;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .panel-footer {
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 16px 20px;
    }

    .add-btn {
      width: 100%;
      padding: 12px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .add-btn:hover {
      background: #dc2626;
    }

    .add-btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    .add-btn svg {
      width: 16px;
      height: 16px;
    }
  `;

  @property({ type: Array })
  projects: readonly Project[] = [];

  /** Map of projectId -> task count */
  @property({ type: Object })
  taskCounts: Record<string, number> = {};

  /** Map of projectId -> { finished, estimated } */
  @property({ type: Object })
  progressData: Record<string, { finished: number; estimated: number }> = {};

  /** Maximum estimate allowed for new projects */
  @property({ type: Number })
  maxEstimate = 125;

  /** Display mode: planning shows +/- controls, analytics shows read-only progress */
  @property({ type: String })
  mode: "planning" | "analytics" = "analytics";

  /** All tasks in the system (for computing project relations) */
  @property({ type: Array })
  tasks: readonly Task[] = [];

  /** All tracks in the system (for computing project relations) */
  @property({ type: Array })
  tracks: readonly Track[] = [];

  @state()
  private _showProjectDialog = false;

  @state()
  private _editingProject: Project | undefined = undefined;

  /** ID of the currently expanded project (single expansion at a time) */
  @state()
  private _expandedProjectId: string | undefined = undefined;

  private _handleOpenProjectDialog() {
    this._editingProject = undefined;
    this._showProjectDialog = true;
  }

  private _handleEditProject(e: CustomEvent<{ projectId: string }>) {
    const project = this.projects.find((p) => p.id === e.detail.projectId);
    if (project) {
      this._editingProject = project;
      this._showProjectDialog = true;
    }
  }

  private _handleSaveProject(
    e: CustomEvent<{
      projectId?: string;
      title: string;
      description?: string;
      tomatoEstimate: number;
      color: string;
    }>,
  ) {
    const { projectId, title, description, tomatoEstimate, color } = e.detail;

    this.dispatchEvent(
      new CustomEvent("save-project", {
        bubbles: true,
        composed: true,
        detail: {
          projectId,
          title,
          description,
          tomatoEstimate,
          color,
        },
      }),
    );

    this._closeProjectDialog();
  }

  private _closeProjectDialog() {
    this._showProjectDialog = false;
    this._editingProject = undefined;
  }

  private _handleIncreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("increase-project-plan", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleDecreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("decrease-project-plan", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  /**
   * Handles toggle of project details expansion
   * Only one project can be expanded at a time
   */
  private _handleToggleProjectDetails(e: CustomEvent<{ projectId: string }>) {
    const { projectId } = e.detail;

    // If clicking on already expanded project, collapse it
    // Otherwise, expand the clicked project (closing any other)
    if (this._expandedProjectId === projectId) {
      this._expandedProjectId = undefined;
    } else {
      this._expandedProjectId = projectId;
    }
  }

  /**
   * Computes the project relations map from tasks and tracks
   */
  private _computeProjectRelations(): ProjectRelationsMap {
    return getProjectRelationsMap(this.tasks, this.tracks, this.projects);
  }

  override render() {
    const isEdit = !!this._editingProject;
    const projectRelations = this._computeProjectRelations();

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">
            ${this.mode === "planning" ? "Projects" : "All Projects"}
          </h2>
        </div>

        <div class="panel-content">
          <project-list
            .projects=${this.projects}
            .taskCounts=${this.taskCounts}
            .progressData=${this.progressData}
            .mode=${this.mode}
            .expandedProjectId=${this._expandedProjectId}
            .projectRelations=${projectRelations}
            @edit-project=${this._handleEditProject}
            @toggle-project-details=${this._handleToggleProjectDetails}
            @increase-project-plan=${this._handleIncreaseProjectPlan}
            @decrease-project-plan=${this._handleDecreaseProjectPlan}
          ></project-list>
        </div>

        <div class="panel-footer">
          <button class="add-btn" @click=${this._handleOpenProjectDialog}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Project
          </button>
        </div>
      </div>

      <project-editor-dialog
        .open=${this._showProjectDialog}
        .project=${this._editingProject}
        .isEdit=${isEdit}
        .maxEstimate=${this.maxEstimate}
        @save=${this._handleSaveProject}
        @cancel=${this._closeProjectDialog}
      ></project-editor-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "project-list-panel": ProjectListPanel;
  }
}
