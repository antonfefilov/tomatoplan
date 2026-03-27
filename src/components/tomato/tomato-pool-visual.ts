/**
 * TomatoPoolVisual - Renders the pool of tomatoes (assigned vs remaining)
 * Visual representation of tomato distribution
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { DEFAULT_DAILY_CAPACITY } from "../../constants/defaults.js";
import "./tomato-icon.js";

@customElement("tomato-pool-visual")
export class TomatoPoolVisual extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .pool-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 12px;
      border: 1px solid #fecaca;
    }

    .tomato-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .tomato-wrapper:hover {
      transform: scale(1.1);
    }

    .assigned {
      opacity: 1;
    }

    .remaining {
      opacity: 0.35;
    }

    .count-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .empty-pool {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #9ca3af;
      font-size: 14px;
    }

    .legend {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-dot.assigned {
      background: #ef4444;
    }

    .legend-dot.remaining {
      background: #fecaca;
    }
  `;

  @property({ type: Number })
  capacity = DEFAULT_DAILY_CAPACITY;

  @property({ type: Number })
  assigned = 0;

  @property({ type: Boolean })
  showLegend = true;

  private _renderTomato(_index: number, isAssigned: boolean) {
    return html`
      <div class="tomato-wrapper ${isAssigned ? "assigned" : "remaining"}">
        <tomato-icon size="28"></tomato-icon>
      </div>
    `;
  }

  override render() {
    const { capacity, assigned } = this;
    const remaining = Math.max(0, capacity - assigned);

    if (capacity === 0) {
      return html` <div class="empty-pool">No tomatoes in your pool</div> `;
    }

    // Create arrays for assigned and remaining tomatoes
    const assignedTomatoes = Array.from({ length: assigned }, (_, i) =>
      this._renderTomato(i, true),
    );
    const remainingTomatoes = Array.from({ length: remaining }, (_, i) =>
      this._renderTomato(i + assigned, false),
    );

    return html`
      <div class="pool-container">${assignedTomatoes} ${remainingTomatoes}</div>
      ${this.showLegend
        ? html`
            <div class="legend">
              <div class="legend-item">
                <div class="legend-dot assigned"></div>
                <span>Assigned</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot remaining"></div>
                <span>Available</span>
              </div>
            </div>
          `
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tomato-pool-visual": TomatoPoolVisual;
  }
}
