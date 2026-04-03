/**
 * Test setup file for Vitest
 * Runs before each test file
 */

import { beforeEach, afterEach, vi } from "vitest";
import { taskpoolStore } from "../src/state/taskpool-store.js";

// ResizeObserver polyfill for jsdom
// jsdom doesn't implement ResizeObserver, so we create a minimal implementation
class ResizeObserverPolyfill {
  // @ts-expect-error - _callback stored for API completeness but not invoked in tests
  private _callback: ResizeObserverCallback;
  private _targets: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this._callback = callback;
  }

  observe(target: Element): void {
    this._targets.add(target);
  }

  unobserve(target: Element): void {
    this._targets.delete(target);
  }

  disconnect(): void {
    this._targets.clear();
  }
}

// Assign to global
(globalThis as any).ResizeObserver = ResizeObserverPolyfill;

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

  // Clear taskpoolStore to ensure test isolation
  // taskpoolStore is a singleton that persists in memory
  taskpoolStore.clearAllData();

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
