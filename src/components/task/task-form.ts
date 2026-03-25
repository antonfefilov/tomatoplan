/**
 * TaskForm - Form for creating/editing tasks
 * A form component for task title and description input
 */

import { LitElement, html, css, type PropertyValues } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import type { Task } from "../../models/task.js";

@customElement("task-form")
export class TaskForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
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
    textarea {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.15s ease;
      background: white;
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    input::placeholder,
    textarea::placeholder {
      color: #9ca3af;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    .char-count {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }

    .char-count.warning {
      color: #f59e0b;
    }

    .char-count.error {
      color: #ef4444;
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

  @property({ type: Object })
  task?: Task;

  @property({ type: String })
  submitLabel = "Create Task";

  @state()
  private _title = "";

  @state()
  private _description = "";

  @state()
  private _titleError = "";

  @query("#title-input")
  private _titleInput!: HTMLInputElement;

  private readonly _maxTitleLength = 200;
  private readonly _maxDescriptionLength = 1000;

  override updated(changedProperties: PropertyValues<this>) {
    super.updated(changedProperties);

    // Sync form fields when task property changes
    // This handles both initial load and subsequent updates when
    // the component receives different task values over time
    if (changedProperties.has("task")) {
      if (this.task) {
        this._title = this.task.title;
        this._description = this.task.description ?? "";
      } else {
        // Reset for new task mode
        this._title = "";
        this._description = "";
      }
      // Clear any previous validation errors when task changes
      this._titleError = "";
    }
  }

  override firstUpdated() {
    this._titleInput?.focus();
  }

  private _validateTitle(): boolean {
    const trimmed = this._title.trim();
    if (trimmed.length === 0) {
      this._titleError = "Task title is required";
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

  private _handleSubmit(e: Event) {
    e.preventDefault();

    if (!this._validateTitle()) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("submit", {
        bubbles: true,
        composed: true,
        detail: {
          title: this._title.trim(),
          description: this._description.trim() || undefined,
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

  private _getTitleCharCountClass(): string {
    const remaining = this._maxTitleLength - this._title.length;
    if (remaining < 0) return "error";
    if (remaining < 20) return "warning";
    return "";
  }

  private _getDescriptionCharCountClass(): string {
    const remaining = this._maxDescriptionLength - this._description.length;
    if (remaining < 0) return "error";
    if (remaining < 50) return "warning";
    return "";
  }

  override render() {
    const titleRemaining = this._maxTitleLength - this._title.length;
    const descRemaining = this._maxDescriptionLength - this._description.length;

    return html`
      <form @submit=${this._handleSubmit}>
        <div class="form-group">
          <label class="required" for="title-input">Task Title</label>
          <input
            id="title-input"
            type="text"
            .value=${this._title}
            @input=${this._handleTitleInput}
            @blur=${this._validateTitle}
            placeholder="What do you need to do?"
            maxlength=${this._maxTitleLength + 10}
          />
          <div class="char-count ${this._getTitleCharCountClass()}">
            ${titleRemaining} characters remaining
          </div>
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
            placeholder="Add more details about this task..."
            maxlength=${this._maxDescriptionLength + 10}
          ></textarea>
          <div class="char-count ${this._getDescriptionCharCountClass()}">
            ${descRemaining} characters remaining
          </div>
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
            ${this.submitLabel}
          </button>
        </div>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-form": TaskForm;
  }
}
