/**
 * TrackListPanel - Track list sidebar component
 * Shows list of tracks with add/edit/delete functionality
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Track } from "../../models/track.js";
import type { Task } from "../../models/task.js";
import type { Project } from "../../models/project.js";
import "../shared/empty-state.js";
import "./track-editor-dialog.js";

@customElement("track-list-panel")
export class TrackListPanel extends LitElement {
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

    .track-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .track-item {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .track-item:hover {
      border-color: #ef4444;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
    }

    .track-item.selected {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .track-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .track-info {
      flex: 1;
      min-width: 0;
    }

    .track-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .track-description {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0 0 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .track-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .track-count {
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .track-badge {
      background: #f3f4f6;
      color: #6b7280;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .track-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .action-btn.delete:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
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
  tracks: readonly Track[] = [];

  @property({ type: Array })
  tasks: readonly Task[] = [];

  @property({ type: Array })
  projects: readonly Project[] = [];

  @property({ type: String })
  selectedTrackId: string | undefined = undefined;

  @state()
  private _showTrackDialog = false;

  @state()
  private _editingTrack: Track | undefined = undefined;

  private _getTaskCount(trackId: string): number {
    const track = this.tracks.find((t) => t.id === trackId);
    return track?.taskIds.length ?? 0;
  }

  private _getProjectName(projectId: string): string | undefined {
    const project = this.projects.find((p) => p.id === projectId);
    return project?.title;
  }

  private _handleSelectTrack(trackId: string) {
    this.dispatchEvent(
      new CustomEvent("select-track", {
        bubbles: true,
        composed: true,
        detail: { trackId },
      }),
    );
  }

  private _handleOpenTrackDialog() {
    this._editingTrack = undefined;
    this._showTrackDialog = true;
  }

  private _handleEditTrack(trackId: string, e: Event) {
    e.stopPropagation();
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      this._editingTrack = track;
      this._showTrackDialog = true;
    }
  }

  private _handleDeleteTrack(trackId: string, e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("delete-track", {
        bubbles: true,
        composed: true,
        detail: { trackId },
      }),
    );
  }

  private _handleSaveTrack(
    e: CustomEvent<{
      trackId?: string;
      title: string;
      description?: string;
      projectId?: string;
    }>,
  ) {
    this.dispatchEvent(
      new CustomEvent("save-track", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
    this._closeTrackDialog();
  }

  private _closeTrackDialog() {
    this._showTrackDialog = false;
    this._editingTrack = undefined;
  }

  override render() {
    const isEdit = !!this._editingTrack;

    return html`
      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">Tracks</h2>
        </div>

        <div class="panel-content">
          ${this.tracks.length === 0
            ? html`
                <empty-state
                  title="No Tracks"
                  description="Create a track to organize your tasks with dependencies"
                  icon="📋"
                ></empty-state>
              `
            : html`
                <div class="track-list">
                  ${this.tracks.map(
                    (track) => html`
                      <div
                        class="track-item ${this.selectedTrackId === track.id
                          ? "selected"
                          : ""}"
                        @click=${() => this._handleSelectTrack(track.id)}
                      >
                        <div class="track-header">
                          <div class="track-info">
                            <h3 class="track-title">${track.title}</h3>
                            ${track.description
                              ? html`
                                  <p class="track-description">
                                    ${track.description}
                                  </p>
                                `
                              : null}
                            <div class="track-meta">
                              <span class="track-count">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                  />
                                  <path d="M9 9h6M9 13h6M9 17h6" />
                                </svg>
                                ${this._getTaskCount(track.id)} tasks
                              </span>
                              ${track.projectId
                                ? html`
                                    <span class="track-badge">
                                      ${this._getProjectName(track.projectId)}
                                    </span>
                                  `
                                : null}
                            </div>
                          </div>
                          <div class="track-actions">
                            <button
                              class="action-btn"
                              title="Edit track"
                              @click=${(e: Event) =>
                                this._handleEditTrack(track.id, e)}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                                />
                                <path
                                  d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                />
                              </svg>
                            </button>
                            <button
                              class="action-btn delete"
                              title="Delete track"
                              @click=${(e: Event) =>
                                this._handleDeleteTrack(track.id, e)}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `}
        </div>

        <div class="panel-footer">
          <button class="add-btn" @click=${this._handleOpenTrackDialog}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Track
          </button>
        </div>
      </div>

      <track-editor-dialog
        .open=${this._showTrackDialog}
        .track=${this._editingTrack}
        .projects=${this.projects}
        .isEdit=${isEdit}
        @save=${this._handleSaveTrack}
        @cancel=${this._closeTrackDialog}
      ></track-editor-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-list-panel": TrackListPanel;
  }
}
