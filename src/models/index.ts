/**
 * Models index - re-exports all model types and functions
 */

export type { Task } from "./task.js";
export { createTask, updateTaskTomatoCount, updateTask } from "./task.js";

export type { Track, TrackEdge } from "./track.js";
export {
  createTrack,
  updateTrack,
  addTaskToTrack,
  removeTaskFromTrack,
  addEdgeToTrack,
  removeEdgeFromTrack,
  getOutgoingEdges,
  getIncomingEdges,
  getDownstreamTaskIds,
  getUpstreamTaskIds,
} from "./track.js";

export type { TomatoPool } from "./tomato-pool.js";
export {
  createTomatoPool,
  getDateString,
  getTodayString,
  isToday,
  isStale,
} from "./tomato-pool.js";

export type { PlannerState } from "./planner-state.js";
export {
  STATE_VERSION,
  createInitialPlannerState,
  resetPlannerStateForNewDay,
  getTotalAssignedTomatoes,
  getRemainingTomatoes,
  isAtCapacity,
  isOverCapacity,
} from "./planner-state.js";

export type { PersistedPlannerState, LoadResult } from "./storage.js";
export {
  createPersistedState,
  isValidPersistedState,
  migratePersistedState,
} from "./storage.js";

export type { TimerState, TimerStatus } from "./timer-state.js";
export {
  createInitialTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  tickTimer,
  isTimerComplete,
  formatTimerDisplay,
  getElapsedSeconds,
} from "./timer-state.js";
