/**
 * WeeklyState model for the Tomato Plan
 * Combines the weekly pool, projects, and tasks into a single state object
 */

import type { Task } from "./task.js";
import type { WeeklyPool } from "./weekly-pool.js";
import type { Project } from "./project.js";
import type { Track } from "./track.js";
import { createDefaultWeeklyPool } from "./weekly-pool.js";
import { getCurrentWeekId } from "./project.js";
import {
  DEFAULT_DAILY_CAPACITY,
  DEFAULT_CAPACITY_IN_MINUTES,
} from "../constants/defaults.js";

export interface WeeklyState {
  /** The tomato pool for the current week */
  pool: WeeklyPool;

  /** List of projects for the week */
  projects: readonly Project[];

  /** Tracks (workflows with task dependencies) */
  tracks: readonly Track[];

  /**
   * Tasks with projectId references (derived from taskpoolStore).
   * This field is computed on demand and not persisted.
   * @deprecated Use weeklyStore.tasks or taskpoolStore methods instead.
   */
  tasks?: readonly Task[];

  /** Version for potential migrations */
  readonly version: number;
}

/** Current state version for migrations */
export const WEEKLY_STATE_VERSION = 2;

/**
 * Creates the initial weekly state
 */
export function createInitialWeeklyState(
  dailyCapacity: number = DEFAULT_DAILY_CAPACITY,
  capacityInMinutes: number = DEFAULT_CAPACITY_IN_MINUTES,
): WeeklyState {
  return {
    pool: createDefaultWeeklyPool(dailyCapacity, capacityInMinutes),
    projects: [],
    tracks: [],
    tasks: [],
    version: WEEKLY_STATE_VERSION,
  };
}

/**
 * Resets the state for a new week
 * Creates a fresh pool with the same capacity but clears projects
 */
export function resetWeeklyStateForNewWeek(
  state: WeeklyState,
  newDailyCapacity?: number,
  newCapacityInMinutes?: number,
): WeeklyState {
  return {
    ...state,
    pool: createDefaultWeeklyPool(
      newDailyCapacity ?? Math.floor(state.pool.weeklyCapacity / 5),
      newCapacityInMinutes ?? state.pool.capacityInMinutes,
    ),
    projects: [],
    // tasks is not persisted - derived from taskpoolStore on load
    // Include empty array for backwards compatibility with code that reads state.tasks
    tasks: [],
    tracks: [],
  };
}

/**
 * Gets the current week ID
 */
export function getCurrentWeekIdFromState(state: WeeklyState): string {
  return state.pool.weekId;
}

/**
 * Checks if the state is for the current week
 */
export function isStateCurrentWeek(state: WeeklyState): boolean {
  return state.pool.weekId === getCurrentWeekId();
}

/**
 * Calculates total tomatoes assigned to projects (estimates)
 */
export function getTotalProjectEstimates(state: WeeklyState): number {
  return state.projects
    .filter((p) => p.status === "active")
    .reduce((sum, project) => sum + project.tomatoEstimate, 0);
}

/**
 * Calculates remaining weekly capacity
 */
export function getWeeklyRemaining(state: WeeklyState): number {
  return state.pool.weeklyCapacity - getTotalProjectEstimates(state);
}

/**
 * Checks if weekly capacity is exceeded by project estimates
 */
export function isWeeklyOverCapacity(state: WeeklyState): boolean {
  return getWeeklyRemaining(state) < 0;
}

/**
 * Gets a project by ID
 */
export function getProjectById(
  state: WeeklyState,
  projectId: string,
): Project | undefined {
  return state.projects.find((p) => p.id === projectId);
}

/**
 * Gets all active projects
 */
export function getActiveProjects(state: WeeklyState): readonly Project[] {
  return state.projects.filter((p) => p.status === "active");
}

/**
 * Gets all tasks for a specific project
 */
export function getProjectTasks(
  state: WeeklyState,
  projectId: string,
): readonly Task[] {
  return (state.tasks || []).filter((t) => t.projectId === projectId);
}

/**
 * Calculates project progress (finished tomatoes)
 */
export function getProjectProgress(
  state: WeeklyState,
  projectId: string,
): { finished: number; estimated: number } {
  const project = getProjectById(state, projectId);
  if (!project) {
    return { finished: 0, estimated: 0 };
  }

  const tasks = getProjectTasks(state, projectId);
  const finished = tasks.reduce((sum, t) => sum + t.finishedTomatoCount, 0);

  return {
    finished,
    estimated: project.tomatoEstimate,
  };
}

/**
 * Calculates total finished tomatoes across all projects
 */
export function getTotalProjectFinishedTomatoes(state: WeeklyState): number {
  return (state.tasks || [])
    .filter((t) => t.projectId)
    .reduce((sum, t) => sum + t.finishedTomatoCount, 0);
}

/**
 * Gets tasks without a project
 */
export function getUnassignedTasks(state: WeeklyState): readonly Task[] {
  return (state.tasks || []).filter((t) => !t.projectId);
}

/**
 * Gets the total tomatoes planned for a project (sum of task tomato counts)
 */
export function getProjectPlannedTomatoes(
  state: WeeklyState,
  projectId: string,
): number {
  const tasks = getProjectTasks(state, projectId);
  return tasks.reduce((sum, t) => sum + t.tomatoCount, 0);
}

/**
 * Formats minutes into a human-readable hours/minutes string
 * e.g., 200 minutes -> "3h 20m"
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Gets a track by ID
 */
export function getTrackById(
  state: WeeklyState,
  trackId: string,
): Track | undefined {
  return state.tracks.find((t) => t.id === trackId);
}

/**
 * Gets all tracks
 */
export function getAllTracks(state: WeeklyState): readonly Track[] {
  return state.tracks;
}

/**
 * Gets tracks for a specific project
 */
export function getProjectTracks(
  state: WeeklyState,
  projectId: string,
): readonly Track[] {
  return state.tracks.filter((t) => t.projectId === projectId);
}

/**
 * Gets tasks for a specific track
 */
export function getTrackTasks(
  state: WeeklyState,
  trackId: string,
): readonly Task[] {
  const track = getTrackById(state, trackId);
  if (!track) {
    return [];
  }
  return (state.tasks || []).filter((t) => track.taskIds.includes(t.id));
}

/**
 * Gets tasks without a track
 */
export function getUntrackedTasks(state: WeeklyState): readonly Task[] {
  return (state.tasks || []).filter((t) => !t.trackId);
}
