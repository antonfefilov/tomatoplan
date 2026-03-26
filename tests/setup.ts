/**
 * Test setup file for Vitest
 * Runs before each test file
 */

import { beforeEach, afterEach, vi } from "vitest";

// DragEvent polyfill for jsdom
// jsdom doesn't implement DragEvent, so we create a minimal implementation
// Extends MouseEvent-like coordinates for drag position calculations
class DragEventPolyfill extends Event {
  dataTransfer: DataTransfer | null;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;

  constructor(
    type: string,
    eventInitDict?: EventInit & {
      dataTransfer?: DataTransfer;
      clientX?: number;
      clientY?: number;
      pageX?: number;
      pageY?: number;
      screenX?: number;
      screenY?: number;
    },
  ) {
    super(type, eventInitDict);
    this.dataTransfer = eventInitDict?.dataTransfer ?? null;
    this.clientX = eventInitDict?.clientX ?? 0;
    this.clientY = eventInitDict?.clientY ?? 0;
    this.pageX = eventInitDict?.pageX ?? 0;
    this.pageY = eventInitDict?.pageY ?? 0;
    this.screenX = eventInitDict?.screenX ?? 0;
    this.screenY = eventInitDict?.screenY ?? 0;
  }
}

// DataTransfer polyfill
class DataTransferPolyfill {
  private _data: Record<string, string> = {};
  dropEffect: "none" | "copy" | "link" | "move" = "none";
  effectAllowed:
    | "none"
    | "copy"
    | "copyLink"
    | "copyMove"
    | "link"
    | "linkMove"
    | "move"
    | "all"
    | "uninitialized" = "all";

  setData(format: string, data: string): void {
    this._data[format] = data;
  }

  getData(format: string): string {
    return this._data[format] ?? "";
  }

  clearData(format?: string): void {
    if (format) {
      delete this._data[format];
    } else {
      this._data = {};
    }
  }
}

// Assign to global
(globalThis as any).DragEvent = DragEventPolyfill;
(globalThis as any).DataTransfer = DataTransferPolyfill;

beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();

  // Reset document body
  document.body.innerHTML = "";
});

afterEach(() => {
  // Restore all mocks
  vi.restoreAllMocks();

  // Clear localStorage after each test
  localStorage.clear();

  // Clean up document
  document.body.innerHTML = "";
});
