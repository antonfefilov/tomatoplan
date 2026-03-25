/**
 * Persistence layer for Tomato Plan state
 * Handles saving and loading state from localStorage
 */

import type { PlannerState } from "../models/planner-state.js";
import type { PersistedPlannerState, LoadResult } from "../models/storage.js";
import {
  createPersistedState,
  isValidPersistedState,
  migratePersistedState,
} from "../models/storage.js";
import { STORAGE_KEYS } from "../constants/storage-keys.js";
import { getTodayString } from "../models/tomato-pool.js";

/**
 * Saves the planner state to localStorage
 */
export function saveState(state: PlannerState): void {
  const persistedState = createPersistedState(
    state.pool.dailyCapacity,
    state.tasks,
    getTodayString(),
  );

  try {
    const serialized = JSON.stringify(persistedState);
    localStorage.setItem(STORAGE_KEYS.PLANNER_STATE, serialized);
  } catch (error) {
    console.error("Failed to save planner state:", error);
  }
}

/**
 * Loads the planner state from localStorage
 */
export function loadState(): PlannerState | null {
  const loadResult = loadPersistedState();

  if (!loadResult.state) {
    return null;
  }

  // If the state needs migration, save the migrated version
  if (loadResult.needsMigration) {
    savePersistedState(loadResult.state);
  }

  // Reconstruct PlannerState from PersistedPlannerState
  return {
    pool: {
      dailyCapacity: loadResult.state.dailyCapacity,
      date: loadResult.state.savedDate,
    },
    tasks: loadResult.state.tasks,
    version: loadResult.state.version,
  };
}

/**
 * Loads persisted state from localStorage with validation
 */
function loadPersistedState(): LoadResult {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.PLANNER_STATE);

    if (!serialized) {
      return { state: null, needsMigration: false };
    }

    const parsed: unknown = JSON.parse(serialized);

    if (!isValidPersistedState(parsed)) {
      console.warn("Invalid persisted state format, discarding");
      return { state: null, needsMigration: false };
    }

    // Check if migration is needed
    const currentVersion = 1; // STATE_VERSION from planner-state
    const needsMigration = parsed.version !== currentVersion;

    const state = needsMigration ? migratePersistedState(parsed) : parsed;

    return { state, needsMigration };
  } catch (error) {
    console.error("Failed to load planner state:", error);
    return { state: null, error: String(error), needsMigration: false };
  }
}

/**
 * Saves a PersistedPlannerState directly to localStorage
 */
function savePersistedState(state: PersistedPlannerState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEYS.PLANNER_STATE, serialized);
  } catch (error) {
    console.error("Failed to save persisted state:", error);
  }
}

/**
 * Clears all persisted state from localStorage
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLANNER_STATE);
  } catch (error) {
    console.error("Failed to clear planner state:", error);
  }
}

/**
 * Exports the current state as a JSON string (for backup/download)
 */
export function exportState(state: PlannerState): string {
  const exportData = {
    ...createPersistedState(
      state.pool.dailyCapacity,
      state.tasks,
      getTodayString(),
    ),
    exportedAt: new Date().toISOString(),
    appName: "Tomato Plan",
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports state from a JSON string (for restore)
 */
export function importState(jsonString: string): {
  success: boolean;
  error?: string;
  state?: PersistedPlannerState;
} {
  try {
    const parsed: unknown = JSON.parse(jsonString);

    if (!isValidPersistedState(parsed)) {
      return { success: false, error: "Invalid state format" };
    }

    // Migrate if needed and save
    const state = migratePersistedState(parsed);
    savePersistedState(state);

    return { success: true, state };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse state",
    };
  }
}

/**
 * Checks if there's any persisted state available
 */
export function hasPersistedState(): boolean {
  return localStorage.getItem(STORAGE_KEYS.PLANNER_STATE) !== null;
}
