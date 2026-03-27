/**
 * ProjectListPanel - Weekly project view container
 * Shows weekly capacity progress and lists all projects
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Project } from "../../models/project.js";
import { formatWeekRange } from "../../models/weekly-pool.js";
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
      padding: 20px;
    }

    .week-info {
      margin-bottom: 16px;
    }

    .week-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .week-range {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .capacity-section {
      margin-top: 16px;
    }

    .capacity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .capacity-label {
      font-size: 13px;
      color: #6b7280;
    }

    .capacity-value {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    .capacity-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .capacity-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .capacity-stats {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 12px;
      color: #9ca3af;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
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

    .over-capacity-warning {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #dc2626;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  @property({ type: Array })
  projects: readonly Project[] = [];

  @property({ type: Number })
  weeklyCapacity = 125;

  @property({ type: String })
  weekStartDate = "";

  @property({ type: String })
  weekEndDate = "";

  @property({ type: Number })
  totalEstimated = 0;

  @property({ type: Number })
  totalFinished = 0;

  /** Map of projectId -> task count */
  @property({ type: Object })
  taskCounts: Record<string, number> = {};

  /** Map of projectId -> { finished, estimated } */
  @property({ type: Object })
  progressData: Record<string, { finished: number; estimated: number }> = {};

  @state()
  private _showProjectDialog = false;

  @state()
  private _editingProject: Project | undefined = undefined;

  private _getRemainingCapacity(): number {
    return this.weeklyCapacity - this.totalEstimated;
  }

  private _getCapacityPercent(): number {
    if (this.weeklyCapacity === 0) return 0;
    return Math.min(100, (this.totalEstimated / this.weeklyCapacity) * 100);
  }

  private _getCapacityColor(): string {
    const percent = this._getCapacityPercent();
    if (percent > 100) return "#ef4444";
    if (percent >= 90) return "#f59e0b";
    if (percent >= 70) return "#84cc16";
    return "#22c55e";
  }

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

  private _handleDeleteProject(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("delete-project", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleSelectProject(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("select-project", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  override render() {
    const isEdit = !!this._editingProject;
    const remaining = this._getRemainingCapacity();
    const isOverCapacity = remaining < 0;
    const capacityPercent = this._getCapacityPercent();
    const capacityColor = this._getCapacityColor();

    const weekPool = {
      weekStartDate: this.weekStartDate,
      weekEndDate: this.weekEndDate,
      weeklyCapacity: this.weeklyCapacity,
      capacityInMinutes: 25,
      weekId: "",
    };

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <div class="week-info">
            <div class="week-label">This Week</div>
            <div class="week-range">${formatWeekRange(weekPool)}</div>
          </div>

          <div class="capacity-section">
            <div class="capacity-header">
              <span class="capacity-label">Weekly Capacity</span>
              <span class="capacity-value">
                ${this.totalEstimated}/${this.weeklyCapacity} tomatoes
              </span>
            </div>
            <div class="capacity-bar">
              <div
                class="capacity-fill"
                style="width: ${Math.min(
                  100,
                  capacityPercent,
                )}%; background-color: ${capacityColor}"
              ></div>
            </div>
            <div class="capacity-stats">
              <span class="stat">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                ${this.totalFinished} finished
              </span>
              <span class="stat">
                ${isOverCapacity
                  ? html`<span style="color: #ef4444;"
                      >${Math.abs(remaining)} over</span
                    >`
                  : html`${remaining} remaining`}
              </span>
            </div>
          </div>

          ${isOverCapacity
            ? html`
                <div class="over-capacity-warning">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    ></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Project estimates exceed weekly capacity
                </div>
              `
            : null}
        </div>

        <div class="panel-content">
          <project-list
            .projects=${this.projects}
            .taskCounts=${this.taskCounts}
            .progressData=${this.progressData}
            @edit-project=${this._handleEditProject}
            @delete-project=${this._handleDeleteProject}
            @select-project=${this._handleSelectProject}
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
        .maxEstimate=${this.weeklyCapacity}
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
