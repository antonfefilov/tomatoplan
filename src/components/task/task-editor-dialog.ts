/**
 * TaskEditorDialog - Modal dialog wrapper for task form
 * A dialog component that wraps the task form for creating/editing tasks
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Task } from "../../models/task.js";
import type { Project } from "../../models/project.js";
import "./task-form.js";

@customElement("task-editor-dialog")
export class TaskEditorDialog extends LitElement {
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

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .dialog-content {
      position: relative;
    }
  `;

  @property({ type: Boolean })
  open = false;

  @property({ type: Object })
  task?: Task;

  @property({ type: Array })
  projects?: readonly Project[];

  @property({ type: Boolean })
  isEdit = false;

  @property({ type: String })
  defaultProjectId?: string;

  @state()
  private _focusedElement: HTMLElement | null = null;

  private _getDialogTitle(): string {
    return this.isEdit ? "Edit Task" : "New Task";
  }

  private _getDialogSubtitle(): string {
    return this.isEdit
      ? "Update the details of your task"
      : "Create a new task to plan your day";
  }

  private _getSubmitLabel(): string {
    return this.isEdit ? "Save Changes" : "Create Task";
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this._focusedElement = document.activeElement as HTMLElement;
      } else if (this._focusedElement) {
        this._focusedElement.focus();
      }
    }
  }

  private _handleSubmit(
    e: CustomEvent<{
      title: string;
      description?: string;
      projectId?: string;
    }>,
  ) {
    this.dispatchEvent(
      new CustomEvent("save", {
        bubbles: true,
        composed: true,
        detail: {
          taskId: this.task?.id,
          ...e.detail,
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
              ${this._getDialogTitle()}
            </h2>
            ${this._getDialogSubtitle()
              ? html`<p class="dialog-subtitle">
                  ${this._getDialogSubtitle()}
                </p>`
              : null}
          </div>
          <div class="dialog-content">
            <task-form
              .task=${this.task}
              .projects=${this.projects}
              .submitLabel=${this._getSubmitLabel()}
              .defaultProjectId=${this.defaultProjectId}
              @submit=${this._handleSubmit}
              @cancel=${this._handleCancel}
            ></task-form>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "task-editor-dialog": TaskEditorDialog;
  }
}
