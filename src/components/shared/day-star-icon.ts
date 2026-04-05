/**
 * DayStarIcon - Reusable SVG star icon for day assignment
 * Renders a star in two states: outline (not assigned) or filled (assigned)
 */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("day-star-icon")
export class DayStarIcon extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      line-height: 0;
    }

    .star-icon {
      display: block;
    }
  `;

  @property({ type: Boolean })
  filled = false;

  @property({ type: Number })
  size = 20;

  override render() {
    const { filled, size } = this;
    // Bright yellow/gold color: #facc15 (yellow-400) for a more vibrant star
    const starColor = "#facc15";
    const fillColor = filled ? starColor : "transparent";
    // Thinner stroke for outline, no stroke needed for filled (the shape defines it)
    const strokeWidth = filled ? 0 : 1.5;

    // Star SVG path (5-pointed star)
    // Using a standard star shape centered in a 24x24 viewBox
    const viewBoxSize = 24;
    const starPath =
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

    return html`
      <svg
        class="star-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${viewBoxSize} ${viewBoxSize}"
        width="${size}"
        height="${size}"
        fill="${fillColor}"
        stroke="${starColor}"
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
      >
        <path d="${starPath}" />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "day-star-icon": DayStarIcon;
  }
}
