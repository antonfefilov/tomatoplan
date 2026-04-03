/**
 * Timer store - Manages Pomodoro timer state with persistence
 * Separate from planner store to keep timer runtime state isolated
 */

import type { TimerState, TimerStatus } from "../models/timer-state.js";
import {
  createInitialTimerState,
  startTimer as createTimerState,
  pauseTimer as pauseTimerState,
  resetTimer as resetTimerState,
  tickTimer,
  isTimerComplete,
  formatTimerDisplay,
  getElapsedSeconds,
} from "../models/timer-state.js";
import { STORAGE_KEYS } from "../constants/storage-keys.js";
import { taskpoolStore } from "./taskpool-store.js";
import { plannerStore } from "./planner-store.js";

/** Type for subscriber callback functions */
type TimerSubscriber = (state: TimerState) => void;

/** Unsubscribe function returned when subscribing */
type TimerUnsubscribe = () => void;

/**
 * TimerStore - Reactive state store for the Pomodoro timer
 */
class TimerStore {
  private state: TimerState;
  private subscribers: Set<TimerSubscriber> = new Set();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private visibilityChangeHandler: () => void;

  constructor() {
    this.state = this.loadState();
    // Sync timer before starting to ensure accurate time after page reload
    this.resyncTimer();
    // Resume ticking if timer was running
    if (this.state.status === "running") {
      this.startTick();
    }

    // Add visibility change listener to sync timer when tab becomes visible
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Gets the current timer state
   */
  getState(): TimerState {
    return { ...this.state };
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Loads timer state from localStorage
   */
  private loadState(): TimerState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      if (!serialized) {
        return createInitialTimerState();
      }

      const parsed = JSON.parse(serialized) as unknown;

      // Basic validation
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("status" in parsed) ||
        !("activeTaskId" in parsed)
      ) {
        return createInitialTimerState();
      }

      const loaded = parsed as TimerState;

      // If timer was running, recalculate remaining time
      if (loaded.status === "running" && loaded.startedAt) {
        const elapsed = getElapsedSeconds(loaded.startedAt);
        const actualRemaining = loaded.totalSeconds - elapsed;

        if (actualRemaining <= 0) {
          // Timer completed while away - handle completion once
          this.handleCompletionWhileAway(loaded.activeTaskId, loaded.startedAt);
          // Clear the stale timer state to prevent re-handling on future reloads
          localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
          return createInitialTimerState();
        }

        return {
          ...loaded,
          remainingSeconds: actualRemaining,
        };
      }

      // For paused state, remainingSeconds is already correct (saved when paused)
      return loaded;
    } catch (error) {
      console.error("Failed to load timer state:", error);
      return createInitialTimerState();
    }
  }

  /**
   * Handles timer completion that occurred while the app was closed
   * Uses startedAt as part of idempotency key to allow future completions for same task
   */
  private handleCompletionWhileAway(
    taskId: string | null,
    startedAt: string | null,
  ): void {
    if (!taskId || !startedAt) return;

    // Key by taskId + startedAt to allow multiple completions for same task
    const completionKey = `timer-completed-${taskId}-${startedAt}`;

    // Check if already handled (marker set by handleTimerComplete before crash)
    if (localStorage.getItem(completionKey)) {
      // Already incremented, just clean up the marker
      localStorage.removeItem(completionKey);
      return;
    }

    // Set marker BEFORE incrementing to prevent double-count on crash mid-increment
    localStorage.setItem(completionKey, new Date().toISOString());

    // Mark the tomato as finished
    const result = taskpoolStore.markTomatoAsFinished(taskId);
    if (!result.success) {
      console.error("Failed to mark tomato as finished:", result.error);
    }

    // Clear the marker (safe now that increment is done)
    localStorage.removeItem(completionKey);
  }

  /**
   * Saves timer state to localStorage
   */
  private saveState(): void {
    try {
      const serialized = JSON.stringify(this.state);
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, serialized);
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  }

  /**
   * Clears timer state from localStorage
   */
  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
    } catch (error) {
      console.error("Failed to clear timer state:", error);
    }
  }

  /**
   * Handler for visibility change events to sync timer when tab becomes visible
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === "visible") {
      this.resyncTimer();
    }
  }

  /**
   * Cleans up resources and event listeners
   */
  public destroy(): void {
    // Remove visibility change listener
    document.removeEventListener(
      "visibilitychange",
      this.visibilityChangeHandler,
    );

    // Stop ticking if running
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  // ============================================
  // SUBSCRIPTION
  // ============================================

  /**
   * Subscribe to timer state changes
   */
  subscribe(callback: TimerSubscriber): TimerUnsubscribe {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifies all subscribers of state changes
   */
  private notify(): void {
    const state = this.getState();
    for (const subscriber of this.subscribers) {
      subscriber(state);
    }
  }

  /**
   * Updates state and persists
   */
  private setState(newState: TimerState): void {
    this.state = newState;
    this.saveState();
    this.notify();
  }

  // ============================================
  // TIMER ACTIONS
  // ============================================

  /**
   * Starts a new timer for a task
   */
  startTimer(taskId: string): void {
    // Stop any existing timer
    this.stopTick();

    const durationMinutes = plannerStore.capacityInMinutes;
    const newState = createTimerState(taskId, durationMinutes);
    this.setState(newState);

    // Start ticking
    this.startTick();
  }

  /**
   * Pauses the current timer
   */
  pauseTimer(): void {
    if (this.state.status !== "running") return;

    this.stopTick();
    const newState = pauseTimerState(this.state);
    this.setState(newState);
  }

  /**
   * Resumes a paused timer
   */
  resumeTimer(): void {
    if (this.state.status !== "paused") return;

    // When resuming, keep remainingSeconds as-is and set startedAt to reflect
    // the remaining time (for accurate reload calculation)
    const now = new Date();
    const startedAtDate = new Date(
      now.getTime() -
        (this.state.totalSeconds - this.state.remainingSeconds) * 1000,
    );

    this.setState({
      ...this.state,
      status: "running",
      startedAt: startedAtDate.toISOString(),
      pausedAt: null,
    });

    this.startTick();
  }

  /**
   * Resets the timer to idle
   */
  resetTimer(): void {
    this.stopTick();
    const newState = resetTimerState(this.state);
    this.setState(newState);
    this.clearState();
  }

  /**
   * Clears timer if it's associated with a specific task
   * Called when a task is deleted
   */
  clearTimerForTask(taskId: string): void {
    if (this.state.activeTaskId === taskId) {
      this.resetTimer();
    }
  }

  // ============================================
  // TICKING
  // ============================================

  /**
   * Starts the tick interval
   */
  private startTick(): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * Stops the tick interval
   */
  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Called every second to update the timer
   */
  private tick(): void {
    if (this.state.status !== "running") return;

    const newRemaining = this.state.remainingSeconds - 1;
    const newState = tickTimer(this.state, newRemaining);

    if (isTimerComplete(newState)) {
      this.handleTimerComplete();
    } else {
      this.setState(newState);
    }
  }

  /**
   * Recalculates timer state from wall-clock time without page reload
   * Used to sync running timer with actual elapsed time
   */
  private resyncTimer(): void {
    // Exit early if timer is not running or has no startedAt timestamp
    if (this.state.status !== "running" || !this.state.startedAt) {
      return;
    }

    // Calculate elapsed seconds using the helper function
    const elapsed = getElapsedSeconds(this.state.startedAt);
    const actualRemaining = this.state.totalSeconds - elapsed;

    if (actualRemaining <= 0) {
      // Timer should be completed - handle completion
      this.handleTimerComplete();
    } else {
      // Update state only if needed (avoid unnecessary updates)
      if (this.state.remainingSeconds !== Math.floor(actualRemaining)) {
        const newState = {
          ...this.state,
          remainingSeconds: Math.max(0, Math.floor(actualRemaining)), // Ensure non-negative integer value
        };
        this.setState(newState);
      }
    }
  }

  /**
   * Handles timer completion
   */
  private handleTimerComplete(): void {
    const taskId = this.state.activeTaskId;
    const startedAt = this.state.startedAt;

    // Stop the timer
    this.stopTick();

    // Set completion marker keyed by taskId-startedAt (per-timer-instance)
    if (taskId && startedAt) {
      const completionKey = `timer-completed-${taskId}-${startedAt}`;
      localStorage.setItem(completionKey, new Date().toISOString());
    }

    // Increment finished tomato count for the task
    if (taskId) {
      const result = taskpoolStore.markTomatoAsFinished(taskId);
      if (!result.success) {
        console.error("Failed to mark tomato as finished:", result.error);
      }
    }

    // Reset timer state
    this.setState(createInitialTimerState());
    this.clearState();
  }

  // ============================================
  // SELECTORS
  // ============================================

  /**
   * Gets the active task ID
   */
  get activeTaskId(): string | null {
    return this.state.activeTaskId;
  }

  /**
   * Gets the timer status
   */
  get status(): TimerStatus {
    return this.state.status;
  }

  /**
   * Gets the remaining time in seconds
   */
  get remainingSeconds(): number {
    return this.state.remainingSeconds;
  }

  /**
   * Gets the formatted display string (MM:SS)
   */
  get displayTime(): string {
    return formatTimerDisplay(this.state.remainingSeconds);
  }

  /**
   * Checks if a specific task has an active timer
   */
  isTaskActive(taskId: string): boolean {
    return this.state.activeTaskId === taskId && this.state.status !== "idle";
  }

  /**
   * Checks if any timer is running
   */
  get isRunning(): boolean {
    return this.state.status === "running";
  }

  /**
   * Checks if any timer is paused
   */
  get isPaused(): boolean {
    return this.state.status === "paused";
  }

  /**
   * Checks if there's an active timer (running or paused)
   */
  get hasActiveTimer(): boolean {
    return this.state.status !== "idle" && this.state.activeTaskId !== null;
  }
}

// Export singleton instance
export const timerStore = new TimerStore();

// Export class for testing purposes
export { TimerStore };

// Export types for external use
export type { TimerSubscriber, TimerUnsubscribe };
