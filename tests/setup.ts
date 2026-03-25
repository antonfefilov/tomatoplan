/**
 * Test setup file for Vitest
 * Runs before each test file
 */

import { beforeEach, afterEach, vi } from "vitest";

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
