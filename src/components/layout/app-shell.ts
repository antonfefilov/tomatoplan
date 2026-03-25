/**
 * AppShell - Two-column layout (pool left, tasks right)
 * Main application layout container
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("app-shell")
export class AppShell extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .shell-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f9fafb;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .left-panel {
      width: 320px;
      min-width: 280px;
      max-width: 400px;
      background: white;
      border-right: 1px solid #e5e7eb;
    }

    .right-panel {
      flex: 1;
      background: #f9fafb;
    }

    /* Responsive layout */
    @media (max-width: 768px) {
      .main-content {
        flex-direction: column;
      }

      .left-panel {
        width: 100%;
        max-width: none;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        max-height: 45vh;
      }

      .right-panel {
        flex: 1;
      }
    }
  `;

  override render() {
    return html`
      <div class="shell-container">
        <slot name="header"></slot>
        <div class="main-content">
          <div class="panel left-panel">
            <slot name="pool-panel"></slot>
          </div>
          <div class="panel right-panel">
            <slot name="task-panel"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-shell": AppShell;
  }
}
