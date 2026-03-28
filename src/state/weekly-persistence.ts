/**
 * Persistence layer for Weekly State
 * Handles saving and loading weekly state from localStorage
 */

import type { WeeklyState } from "../models/weekly-state.js";
import type { Task } from "../models/task.js";
import type { Project } from "../models/project.js";
import type { Track } from "../models/track.js";
import { PROJECT_COLORS } from "../models/project.js";
import { WEEKLY_STATE_VERSION } from "../models/weekly-state.js";
import { STORAGE_KEYS } from "../constants/storage-keys.js";
import { DEFAULT_CAPACITY_IN_MINUTES } from "../constants/defaults.js";

/** Type for project color - union of valid colors */
type ProjectColorType = (typeof PROJECT_COLORS)[number];

/**
 * Checks if a string is a valid project color
 */
function isValidProjectColor(color: string): color is ProjectColorType {
  return (PROJECT_COLORS as readonly string[]).includes(color);
}

/**
 * Persisted version of WeeklyState for storage
 */
interface PersistedWeeklyState {
  weeklyCapacity: number;
  capacityInMinutes: number;
  weekId: string;
  weekStartDate: string;
  weekEndDate: string;
  projects: readonly {
    id: string;
    title: string;
    description?: string;
    tomatoEstimate: number;
    color?: string;
    weekId: string;
    status: "active" | "completed" | "archived";
    createdAt: string;
    updatedAt: string;
  }[];
  tasks: readonly Task[];
  tracks?: readonly Track[]; // Optional for backward compatibility (v1)
  version: number;
}

/**
 * Validates that a persisted weekly state has the required fields
 */
function isValidPersistedWeeklyState(
  data: unknown,
): data is PersistedWeeklyState {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj["weeklyCapacity"] === "number" &&
    obj["weeklyCapacity"] > 0 &&
    typeof obj["weekId"] === "string" &&
    Array.isArray(obj["projects"]) &&
    Array.isArray(obj["tasks"]) &&
    typeof obj["version"] === "number"
  );
}

/**
 * Converts WeeklyState to PersistedWeeklyState
 */
function toPersistedState(state: WeeklyState): PersistedWeeklyState {
  return {
    weeklyCapacity: state.pool.weeklyCapacity,
    capacityInMinutes: state.pool.capacityInMinutes,
    weekId: state.pool.weekId,
    weekStartDate: state.pool.weekStartDate,
    weekEndDate: state.pool.weekEndDate,
    projects: state.projects,
    tasks: state.tasks,
    tracks: state.tracks,
    version: state.version,
  };
}

/**
 * Converts PersistedWeeklyState to WeeklyState
 * Handles migration from older versions
 */
function fromPersistedState(persisted: PersistedWeeklyState): WeeklyState {
  // Map projects and validate colors
  const projects: readonly Project[] = persisted.projects.map((p) => ({
    ...p,
    color: p.color && isValidProjectColor(p.color) ? p.color : undefined,
  })) as readonly Project[];

  // Handle tracks (migrate from v1 if needed)
  const tracks: readonly Track[] = migrateTracks(persisted);

  return {
    pool: {
      weeklyCapacity: persisted.weeklyCapacity,
      capacityInMinutes:
        persisted.capacityInMinutes ?? DEFAULT_CAPACITY_IN_MINUTES,
      weekId: persisted.weekId,
      weekStartDate: persisted.weekStartDate,
      weekEndDate: persisted.weekEndDate,
    },
    projects,
    tasks: persisted.tasks,
    tracks,
    version: WEEKLY_STATE_VERSION,
  };
}

/**
 * Migrates tracks from persisted state
 * For v1 states (without tracks), returns empty array
 */
function migrateTracks(persisted: PersistedWeeklyState): readonly Track[] {
  if (persisted.tracks && Array.isArray(persisted.tracks)) {
    return persisted.tracks;
  }
  // v1 didn't have tracks - return empty array
  return [];
}

/**
 * Saves the weekly state to localStorage
 */
export function saveWeeklyState(state: WeeklyState): void {
  const persistedState = toPersistedState(state);

  try {
    const serialized = JSON.stringify(persistedState);
    localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE, serialized);
  } catch (error) {
    console.error("Failed to save weekly state:", error);
  }
}

/**
 * Loads the weekly state from localStorage
 */
export function loadWeeklyState(): WeeklyState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE);

    if (!serialized) {
      return null;
    }

    const parsed: unknown = JSON.parse(serialized);

    if (!isValidPersistedWeeklyState(parsed)) {
      console.warn("Invalid persisted weekly state format, discarding");
      return null;
    }

    return fromPersistedState(parsed);
  } catch (error) {
    console.error("Failed to load weekly state:", error);
    return null;
  }
}

/**
 * Clears all persisted weekly state from localStorage
 */
export function clearWeeklyState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE);
  } catch (error) {
    console.error("Failed to clear weekly state:", error);
  }
}

/**
 * Checks if there's any persisted weekly state available
 */
export function hasPersistedWeeklyState(): boolean {
  return localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANNER_STATE) !== null;
}
