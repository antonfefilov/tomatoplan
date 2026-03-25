/**
 * Storage key constants for localStorage
 */

/** Keys used for persisting application state */
export const STORAGE_KEYS = {
  /** Main planner state key */
  PLANNER_STATE: "tomato-planner-state",

  /** User preferences key */
  USER_PREFERENCES: "tomato-planner-preferences",

  /** Timer state key (for running timer persistence) */
  TIMER_STATE: "tomato-planner-timer",
} as const;

/** Type for storage key values */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Creates a namespaced storage key for feature-specific data
 */
export function createNamespacedKey(namespace: string, key: string): string {
  return `tomato-planner-${namespace}-${key}`;
}
