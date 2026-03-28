/**
 * TrackEditorDialog - Modal dialog for creating/editing tracks
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import type { Track } from "../../models/track.js";
import type { Project } from "../../models/project.js";

@customElement("track-editor-dialog")
export class TrackEditorDialog extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
      padding: 20px;
    }

    .backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      width: 100%;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    .backdrop.open .dialog {
      transform: scale(1);
    }

    .dialog-header {
      margin-bottom: 20px;
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .dialog-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }

    .dialog-content {
      position: relative;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    label.required::after {
      content: " *";
      color: #ef4444;
    }

    input,
    textarea,
    select {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.15s ease;
      background: white;
    }

    input:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    select {
      cursor: pointer;
    }

    .error-message {
      font-size: 12px;
      color: #ef4444;
      margin-top: -8px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-submit {
      background: #ef4444;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }
  `;

  @property({ type: Boolean })
  open = false;

  @property({ type: Object })
  track?: Track;

  @property({ type: Array })
  projects?: readonly Project[];

  @property({ type: Boolean })
  isEdit = false;

  @state()
  private _title = "";

  @state()
  private _description = "";

  @state()
  private _projectId = "";

  @state()
  private _titleError = "";

  @query("#title-input")
  private _titleInput!: HTMLInputElement;

  private readonly _maxTitleLength = 100;
  private readonly _maxDescriptionLength = 500;

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has("open") && this.open) {
      // Reset form when dialog opens
      if (this.track) {
        this._title = this.track.title;
        this._description = this.track.description ?? "";
        this._projectId = this.track.projectId ?? "";
      } else {
        this._title = "";
        this._description = "";
        this._projectId = "";
      }
      this._titleError = "";
      // Focus the title input after the dialog renders
      setTimeout(() => this._titleInput?.focus(), 0);
    }
  }

  private _validateTitle(): boolean {
    const trimmed = this._title.trim();
    if (trimmed.length === 0) {
      this._titleError = "Track title is required";
      return false;
    }
    if (trimmed.length > this._maxTitleLength) {
      this._titleError = `Title must be ${this._maxTitleLength} characters or less`;
      return false;
    }
    this._titleError = "";
    return true;
  }

  private _handleTitleInput(e: Event) {
    this._title = (e.target as HTMLInputElement).value;
    if (this._titleError) {
      this._validateTitle();
    }
  }

  private _handleDescriptionInput(e: Event) {
    this._description = (e.target as HTMLTextAreaElement).value;
  }

  private _handleProjectChange(e: Event) {
    this._projectId = (e.target as HTMLSelectElement).value;
  }

  private _handleSubmit(e: Event) {
    e.preventDefault();

    if (!this._validateTitle()) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("save", {
        bubbles: true,
        composed: true,
        detail: {
          trackId: this.track?.id,
          title: this._title.trim(),
          description: this._description.trim(),
          projectId: this._projectId || undefined,
        },
      }),
    );
  }

  private _handleCancel() {
    this.dispatchEvent(
      new CustomEvent("cancel", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      this._handleCancel();
    }
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      this._handleCancel();
    }
  }

  override render() {
    return html`
      <div
        class="backdrop ${this.open ? "open" : ""}"
        @click=${this._handleBackdropClick}
        @keydown=${this._handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title" id="dialog-title">
              ${this.isEdit ? "Edit Track" : "New Track"}
            </h2>
            <p class="dialog-subtitle">
              ${this.isEdit
                ? "Update your track details"
                : "Create a track to organize tasks with dependencies"}
            </p>
          </div>
          <div class="dialog-content">
            <form @submit=${this._handleSubmit}>
              <div class="form-group">
                <label class="required" for="title-input">Track Title</label>
                <input
                  id="title-input"
                  type="text"
                  .value=${this._title}
                  @input=${this._handleTitleInput}
                  @blur=${this._validateTitle}
                  placeholder="e.g., Feature Release Pipeline"
                  maxlength=${this._maxTitleLength + 10}
                />
                ${this._titleError
                  ? html`<div class="error-message">${this._titleError}</div>`
                  : null}
              </div>

              <div class="form-group">
                <label for="description-input">Description (optional)</label>
                <textarea
                  id="description-input"
                  .value=${this._description}
                  @input=${this._handleDescriptionInput}
                  placeholder="What's this track about?"
                  maxlength=${this._maxDescriptionLength}
                ></textarea>
              </div>

              <div class="form-group">
                <label for="project-select">Project (optional)</label>
                <select
                  id="project-select"
                  .value=${this._projectId}
                  @change=${this._handleProjectChange}
                >
                  <option value="">No project</option>
                  ${(this.projects ?? []).map(
                    (project) => html`
                      <option value=${project.id}>${project.title}</option>
                    `,
                  )}
                </select>
              </div>

              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-cancel"
                  @click=${this._handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-submit"
                  ?disabled=${this._title.trim().length === 0}
                >
                  ${this.isEdit ? "Save Changes" : "Create Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-editor-dialog": TrackEditorDialog;
  }
}
