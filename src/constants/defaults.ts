/**
 * Default configuration values for the Tomato Plan
 */

import { STORAGE_KEYS } from "./storage-keys.js";

/** Default number of tomatoes available per day */
export const DEFAULT_DAILY_CAPACITY = 25;

/** Default duration of each tomato in minutes */
export const DEFAULT_CAPACITY_IN_MINUTES = 25;

/** Minimum allowed daily capacity */
export const MIN_DAILY_CAPACITY = 1;

/** Maximum allowed daily capacity */
export const MAX_DAILY_CAPACITY = 30;

/** Minimum allowed tomato duration in minutes */
export const MIN_CAPACITY_IN_MINUTES = 5;

/** Maximum allowed tomato duration in minutes */
export const MAX_CAPACITY_IN_MINUTES = 60;

/** Default task values */
export const DEFAULT_TASK = {
  /** Default tomato count for new tasks */
  tomatoCount: 0,
} as const;

/** All storage keys used by the application */
export { STORAGE_KEYS };
