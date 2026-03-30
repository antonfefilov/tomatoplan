/**
 * ProjectList - List container for projects
 * Renders a list of ProjectItem components
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Project } from "../../models/project.js";
import "./project-item.js";

@customElement("project-list")
export class ProjectList extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .project-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: #d1d5db;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 500;
      color: #374151;
      margin: 0 0 8px 0;
    }

    .empty-description {
      font-size: 14px;
      margin: 0;
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

  /** Display mode: planning shows +/- controls, analytics shows read-only progress */
  @property({ type: String })
  mode: "planning" | "analytics" = "analytics";

  private _handleEditProject(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("edit-project", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
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

  private _handleIncreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("increase-project-plan", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleDecreaseProjectPlan(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("decrease-project-plan", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  private _handleAddProjectTask(e: CustomEvent<{ projectId: string }>) {
    this.dispatchEvent(
      new CustomEvent("add-project-task", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  }

  override render() {
    if (this.projects.length === 0) {
      return html`
        <div class="empty-state">
          <svg
            class="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            ></path>
          </svg>
          <h3 class="empty-title">No projects yet</h3>
          <p class="empty-description">
            Create your first project to start planning your week
          </p>
        </div>
      `;
    }

    return html`
      <div class="project-list">
        ${this.projects.map(
          (project) => html`
            <project-item
              .project=${project}
              .taskCount=${this.taskCounts[project.id] ?? 0}
              .finishedTomatoes=${this.progressData[project.id]?.finished ?? 0}
              .estimatedTomatoes=${this.progressData[project.id]?.estimated ??
              0}
              .mode=${this.mode}
              @edit-project=${this._handleEditProject}
              @delete-project=${this._handleDeleteProject}
              @select-project=${this._handleSelectProject}
              @increase-project-plan=${this._handleIncreaseProjectPlan}
              @decrease-project-plan=${this._handleDecreaseProjectPlan}
              @add-project-task=${this._handleAddProjectTask}
            ></project-item>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "project-list": ProjectList;
  }
}
