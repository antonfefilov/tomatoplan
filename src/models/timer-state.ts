/**
 * Timer state model for the Pomodoro timer
 * Represents the runtime state of a single global timer
 */

/** Timer status enum */
export type TimerStatus = "idle" | "running" | "paused";

/** Persistable timer state */
export interface TimerState {
  /** ID of the task the timer is running for */
  activeTaskId: string | null;

  /** Current status of the timer */
  status: TimerStatus;

  /** Remaining time in seconds */
  remainingSeconds: number;

  /** Total duration in seconds (for reset) */
  totalSeconds: number;

  /** When the timer was started (ISO string) - used to calculate remaining time on load for running timers */
  startedAt: string | null;

  /** When the timer was paused (ISO string) - to preserve remaining time */
  pausedAt: string | null;

  /** When the timer completed (ISO string) - used to prevent double-counting completions on reload */
  completedAt: string | null;
}

/**
 * Creates an initial idle timer state
 */
export function createInitialTimerState(): TimerState {
  return {
    activeTaskId: null,
    status: "idle",
    remainingSeconds: 0,
    totalSeconds: 0,
    startedAt: null,
    pausedAt: null,
    completedAt: null,
  };
}

/**
 * Creates a timer state for starting a new timer
 */
export function startTimer(
  taskId: string,
  durationMinutes: number,
): TimerState {
  const now = new Date().toISOString();
  const totalSeconds = durationMinutes * 60;
  return {
    activeTaskId: taskId,
    status: "running",
    remainingSeconds: totalSeconds,
    totalSeconds,
    startedAt: now,
    pausedAt: null,
    completedAt: null,
  };
}

/**
 * Pauses a running timer
 */
export function pauseTimer(state: TimerState): TimerState {
  if (state.status !== "running") {
    return state;
  }
  return {
    ...state,
    status: "paused",
    pausedAt: new Date().toISOString(),
  };
}

/**
 * Resumes a paused timer
 */
export function resumeTimer(state: TimerState): TimerState {
  if (state.status !== "paused") {
    return state;
  }
  return {
    ...state,
    status: "running",
    startedAt: new Date().toISOString(),
    pausedAt: null,
  };
}

/**
 * Resets the timer to idle state
 */
export function resetTimer(_state: TimerState): TimerState {
  return createInitialTimerState();
}

/**
 * Updates the remaining seconds (called on tick)
 */
export function tickTimer(
  state: TimerState,
  remainingSeconds: number,
): TimerState {
  if (state.status !== "running") {
    return state;
  }
  return {
    ...state,
    remainingSeconds: Math.max(0, remainingSeconds),
  };
}

/**
 * Checks if the timer has completed
 */
export function isTimerComplete(state: TimerState): boolean {
  return state.status === "running" && state.remainingSeconds <= 0;
}

/**
 * Formats seconds into MM:SS display format
 */
export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculates elapsed time since a timestamp
 */
export function getElapsedSeconds(isoString: string): number {
  const start = new Date(isoString).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}
