/**
 * ProjectDetails - Displays tasks and tracks for an expanded project
 * Shows the details region when a project is expanded in the list
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import type { Track } from "../../models/track.js";
import { isTaskDone } from "../../models/task.js";

@customElement("project-details")
export class ProjectDetails extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .details-container {
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      border: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-title svg {
      width: 14px;
      height: 14px;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .items-list:last-child {
      margin-bottom: 0;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
    }

    .item-row.done {
      opacity: 0.7;
    }

    .item-icon {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    .item-icon.done {
      color: #22c55e;
    }

    .item-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #374151;
    }

    .item-title.done {
      color: #6b7280;
    }

    .item-meta {
      font-size: 11px;
      color: #9ca3af;
    }

    .empty-state {
      text-align: center;
      padding: 16px;
      color: #9ca3af;
      font-size: 13px;
    }

    .empty-icon {
      width: 24px;
      height: 24px;
      margin: 0 auto 8px;
      color: #d1d5db;
    }

    .no-items-message {
      padding: 12px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }

    /* Track-specific styles */
    .track-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
    }

    .track-icon {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    .track-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #374151;
    }

    .track-task-count {
      font-size: 11px;
      color: #9ca3af;
    }
  `;

  /** Tasks assigned to this project */
  @property({ type: Array })
  tasks: readonly Task[] = [];

  /** Tracks assigned to this project */
  @property({ type: Array })
  tracks: readonly Track[] = [];

  /** Display mode: planning shows minimal info, analytics shows progress */
  @property({ type: String })
  mode: "planning" | "analytics" = "analytics";

  private _renderTaskItem(task: Task) {
    const isDone = isTaskDone(task);
    const progress = `${task.finishedTomatoCount}/${task.tomatoCount}`;

    return html`
      <div class="item-row ${isDone ? "done" : ""}">
        <svg
          class="item-icon ${isDone ? "done" : ""}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          ${isDone
            ? html`<path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>`
            : html`<circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4l3 3"></path>`}
        </svg>
        <span class="item-title ${isDone ? "done" : ""}">${task.title}</span>
        <span class="item-meta">${progress} 🍅</span>
      </div>
    `;
  }

  private _renderTrackItem(track: Track) {
    const taskCount = track.taskIds.length;

    return html`
      <div class="track-row">
        <svg
          class="track-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <span class="track-title">${track.title}</span>
        <span class="track-task-count"
          >${taskCount} task${taskCount !== 1 ? "s" : ""}</span
        >
      </div>
    `;
  }

  private _renderTasksSection() {
    if (this.tasks.length === 0) {
      return null;
    }

    return html`
      <div class="items-list">
        <h4 class="section-title">
          <svg
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
          Tasks (${this.tasks.length})
        </h4>
        ${this.tasks.map((task) => this._renderTaskItem(task))}
      </div>
    `;
  }

  private _renderTracksSection() {
    if (this.tracks.length === 0) {
      return null;
    }

    return html`
      <div class="items-list">
        <h4 class="section-title">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          Tracks (${this.tracks.length})
        </h4>
        ${this.tracks.map((track) => this._renderTrackItem(track))}
      </div>
    `;
  }

  private _renderEmptyState() {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          ></path>
        </svg>
        <p>No tasks or tracks assigned to this project</p>
      </div>
    `;
  }

  override render() {
    const hasContent = this.tasks.length > 0 || this.tracks.length > 0;

    return html`
      <div class="details-container">
        ${hasContent
          ? html`${this._renderTasksSection()} ${this._renderTracksSection()}`
          : this._renderEmptyState()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "project-details": ProjectDetails;
  }
}
