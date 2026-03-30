/**
 * TrackNode - Task node component for the graph canvas
 * Renders a single task node with actions
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../models/task.js";

@customElement("track-node")
export class TrackNode extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 180px;
    }

    .node-container {
      width: 180px;
      height: 60px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      overflow: hidden;
    }

    .node-container:hover {
      border-color: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }

    .node-container.selected {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .node-container.pending-source {
      border-color: #f59e0b;
      background: #fffbeb;
      animation: pulse 1s infinite;
    }

    .node-container.done {
      opacity: 0.7;
      background: #ecfdf5;
      border-color: #10b981;
    }

    @keyframes pulse {
      0%,
      100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
      }
    }

    .node-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .node-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }

    .tomato-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tomato-icon {
      width: 14px;
      height: 14px;
      fill: #ef4444;
    }

    .tomato-icon.done {
      fill: #10b981;
    }

    .edge-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .edge-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #6b7280;
    }

    .edge-indicator.incoming {
      background: #dbeafe;
      color: #3b82f6;
    }

    .edge-indicator.outgoing {
      background: #fce7f3;
      color: #ec4899;
    }

    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: #9ca3af;
      opacity: 0;
      transition: all 0.15s ease;
    }

    .node-container:hover .remove-btn {
      opacity: 1;
    }

    .remove-btn:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .remove-btn svg {
      width: 12px;
      height: 12px;
    }

    .create-edge-btn {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: #6b7280;
      opacity: 0;
      transition: all 0.15s ease;
    }

    .node-container:hover .create-edge-btn {
      opacity: 1;
    }

    .create-edge-btn:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .create-edge-btn svg {
      width: 12px;
      height: 12px;
    }
  `;

  @property({ type: Object })
  task?: Task;

  @property({ type: Boolean })
  selected = false;

  @property({ type: Boolean })
  isPendingEdgeSource = false;

  @property({ type: Boolean })
  isDone = false;

  @property({ type: Number })
  incomingEdgeCount = 0;

  @property({ type: Number })
  outgoingEdgeCount = 0;

  private _handleNodeClick(e: MouseEvent) {
    // If shift key is held, start edge creation
    if (e.shiftKey) {
      this.dispatchEvent(
        new CustomEvent("start-edge", {
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent("node-select", {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _handleRemoveTask(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("remove-task", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleStartEdge(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("start-edge", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    if (!this.task) return null;

    return html`
      <div
        class="node-container ${this.selected ? "selected" : ""} ${this
          .isPendingEdgeSource
          ? "pending-source"
          : ""} ${this.isDone ? "done" : ""}"
        @click=${this._handleNodeClick}
      >
        <button
          class="remove-btn"
          title="Remove from track"
          @click=${this._handleRemoveTask}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div class="node-content">
          <div class="node-title">${this.task.title}</div>
          <div class="node-meta">
            <div class="tomato-count">
              <svg
                class="tomato-icon ${this.isDone ? "done" : ""}"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="14" r="8" />
                <path
                  d="M12 2C12 2 14 4 14 6C14 6 12 5 12 5C12 5 10 6 10 6C10 4 12 2 12 2Z"
                  fill="#22c55e"
                />
              </svg>
              <span>${this.task.tomatoCount}</span>
            </div>
            ${this.incomingEdgeCount > 0 || this.outgoingEdgeCount > 0
              ? html`
                  <div class="edge-count">
                    ${this.incomingEdgeCount > 0
                      ? html`
                          <span class="edge-indicator incoming">
                            ↑${this.incomingEdgeCount}
                          </span>
                        `
                      : null}
                    ${this.outgoingEdgeCount > 0
                      ? html`
                          <span class="edge-indicator outgoing">
                            ↓${this.outgoingEdgeCount}
                          </span>
                        `
                      : null}
                  </div>
                `
              : null}
          </div>
        </div>

        <button
          class="create-edge-btn"
          title="Create dependency (Shift+Click)"
          @click=${this._handleStartEdge}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "track-node": TrackNode;
  }
}
