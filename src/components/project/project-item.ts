/**
 * ProjectItem - Single project display component
 * Shows project title, progress bar, and task count
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Project } from "../../models/project.js";

@customElement("project-item")
export class ProjectItem extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .project-item {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .project-item:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .project-item.completed {
      opacity: 0.7;
    }

    .project-item.archived {
      opacity: 0.5;
    }

    .project-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .project-color {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .project-info {
      flex: 1;
      min-width: 0;
    }

    .project-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-description {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #9ca3af;
    }

    .task-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .progress-section {
      margin-top: 12px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .progress-label {
      color: #6b7280;
    }

    .progress-value {
      color: #111827;
      font-weight: 500;
    }

    .progress-bar {
      height: 6px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .project-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .action-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
    }

    .action-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .action-btn.danger {
      color: #ef4444;
      border-color: #fecaca;
    }

    .action-btn.danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.completed {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-badge.archived {
      background: #f3f4f6;
      color: #6b7280;
    }
  `;

  @property({ type: Object })
  project!: Project;

  @property({ type: Number })
  taskCount = 0;

  @property({ type: Number })
  finishedTomatoes = 0;

  @property({ type: Number })
  estimatedTomatoes = 0;

  private _getProgressPercent(): number {
    if (this.estimatedTomatoes === 0) return 0;
    return Math.min(
      100,
      (this.finishedTomatoes / this.estimatedTomatoes) * 100,
    );
  }

  private _getProgressColor(): string {
    const percent = this._getProgressPercent();
    if (percent >= 100) return "#22c55e";
    if (percent >= 75) return "#84cc16";
    if (percent >= 50) return "#f59e0b";
    return this.project.color ?? "#ef4444";
  }

  private _handleEdit(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("edit-project", {
        bubbles: true,
        composed: true,
        detail: { projectId: this.project.id },
      }),
    );
  }

  private _handleDelete(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("delete-project", {
        bubbles: true,
        composed: true,
        detail: { projectId: this.project.id },
      }),
    );
  }

  private _handleClick() {
    this.dispatchEvent(
      new CustomEvent("select-project", {
        bubbles: true,
        composed: true,
        detail: { projectId: this.project.id },
      }),
    );
  }

  override render() {
    const statusClass = this.project.status;
    const progressPercent = this._getProgressPercent();
    const progressColor = this._getProgressColor();

    return html`
      <div
        class="project-item ${statusClass}"
        @click=${this._handleClick}
        role="button"
        tabindex="0"
      >
        <div class="project-header">
          <div
            class="project-color"
            style="background-color: ${this.project.color ?? "#ef4444"}"
          ></div>
          <div class="project-info">
            <h3 class="project-title">${this.project.title}</h3>
            ${this.project.description
              ? html`<p class="project-description">
                  ${this.project.description}
                </p>`
              : null}
          </div>
          <span class="status-badge ${this.project.status}">
            ${this.project.status}
          </span>
        </div>

        <div class="project-meta">
          <span class="task-count">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 11l3 3L22 4"></path>
              <path
                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
              ></path>
            </svg>
            ${this.taskCount} task${this.taskCount !== 1 ? "s" : ""}
          </span>
          <span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            ${this.finishedTomatoes}/${this.estimatedTomatoes} tomatoes
          </span>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-value">${Math.round(progressPercent)}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width: ${progressPercent}%; background-color: ${progressColor}"
            ></div>
          </div>
        </div>

        ${this.project.status === "active"
          ? html`
              <div class="project-actions">
                <button class="action-btn" @click=${this._handleEdit}>
                  Edit
                </button>
                <button class="action-btn danger" @click=${this._handleDelete}>
                  Delete
                </button>
              </div>
            `
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "project-item": ProjectItem;
  }
}
