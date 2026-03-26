/**
 * Tests for TimerStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TimerStore } from "../src/state/timer-store.js";
import { plannerStore } from "../src/state/planner-store.js";
import { STORAGE_KEYS } from "../src/constants/storage-keys.js";

describe("TimerStore", () => {
  let timerStore: TimerStore;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Clear the planner store
    plannerStore.clearAllData();
    timerStore = new TimerStore();
  });

  afterEach(() => {
    timerStore.resetTimer();
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should have idle status", () => {
      const state = timerStore.getState();
      expect(state.status).toBe("idle");
    });

    it("should have no active task", () => {
      expect(timerStore.activeTaskId).toBeNull();
    });
  });

  describe("startTimer", () => {
    it("should start a timer for a task", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      timerStore.startTimer(taskId!);

      expect(timerStore.activeTaskId).toBe(taskId);
      expect(timerStore.status).toBe("running");
      expect(timerStore.remainingSeconds).toBe(25 * 60); // 25 minutes in seconds
    });

    it("should use the global capacityInMinutes", () => {
      plannerStore.setCapacityInMinutes(30);
      const { taskId } = plannerStore.addTask("Test Task");

      timerStore.startTimer(taskId!);

      // Timer uses capacityInMinutes which is 30
      expect(timerStore.remainingSeconds).toBe(30 * 60); // 30 minutes in seconds
    });

    it("should start ticking", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      vi.advanceTimersByTime(1000);

      expect(timerStore.remainingSeconds).toBe(25 * 60 - 1);
    });
  });

  describe("pauseTimer", () => {
    it("should pause a running timer", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      timerStore.pauseTimer();

      expect(timerStore.status).toBe("paused");
    });

    it("should stop ticking when paused", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.pauseTimer();

      vi.advanceTimersByTime(5000);

      // Remaining should not change after pause
      expect(timerStore.remainingSeconds).toBe(25 * 60);
    });

    it("should not affect idle timer", () => {
      timerStore.pauseTimer();

      expect(timerStore.status).toBe("idle");
    });
  });

  describe("resumeTimer", () => {
    it("should resume a paused timer", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.pauseTimer();

      timerStore.resumeTimer();

      expect(timerStore.status).toBe("running");
    });

    it("should resume ticking", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.pauseTimer();
      timerStore.resumeTimer();

      vi.advanceTimersByTime(1000);

      expect(timerStore.remainingSeconds).toBe(25 * 60 - 1);
    });
  });

  describe("resetTimer", () => {
    it("should reset timer to idle", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      timerStore.resetTimer();

      expect(timerStore.status).toBe("idle");
      expect(timerStore.activeTaskId).toBeNull();
    });

    it("should stop ticking", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.resetTimer();

      vi.advanceTimersByTime(5000);

      expect(timerStore.remainingSeconds).toBe(0);
    });

    it("should clear localStorage", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.resetTimer();

      expect(localStorage.getItem(STORAGE_KEYS.TIMER_STATE)).toBeNull();
    });
  });

  describe("clearTimerForTask", () => {
    it("should clear timer if active task matches", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      timerStore.clearTimerForTask(taskId!);

      expect(timerStore.status).toBe("idle");
    });

    it("should not clear timer if active task differs", () => {
      const { taskId: task1 } = plannerStore.addTask("Task 1");
      const { taskId: task2 } = plannerStore.addTask("Task 2");
      timerStore.startTimer(task1!);

      timerStore.clearTimerForTask(task2!);

      expect(timerStore.status).toBe("running");
      expect(timerStore.activeTaskId).toBe(task1);
    });
  });

  describe("timer completion", () => {
    it("should increment finishedTomatoCount on completion", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Fast-forward to completion
      vi.advanceTimersByTime(25 * 60 * 1000);

      const task = plannerStore.getTaskById(taskId!);
      expect(task!.finishedTomatoCount).toBe(1);
    });

    it("should reset timer state on completion", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      vi.advanceTimersByTime(25 * 60 * 1000);

      expect(timerStore.status).toBe("idle");
      expect(timerStore.activeTaskId).toBeNull();
    });

    it("should increment by exactly 1 even if tick continues", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      vi.advanceTimersByTime(25 * 60 * 1000 + 5000);

      const task = plannerStore.getTaskById(taskId!);
      expect(task!.finishedTomatoCount).toBe(1);
    });
  });

  describe("subscription", () => {
    it("should notify subscribers on state change", () => {
      const callback = vi.fn();
      timerStore.subscribe(callback);
      callback.mockClear(); // Clear initial call

      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      expect(callback).toHaveBeenCalled();
    });

    it("should immediately call subscriber with current state", () => {
      const callback = vi.fn();
      timerStore.subscribe(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = timerStore.subscribe(callback);
      callback.mockClear();

      unsubscribe();
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("persistence", () => {
    it("should persist timer state to localStorage", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      const stored = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.activeTaskId).toBe(taskId);
      expect(parsed.status).toBe("running");
    });

    it("should load running timer from localStorage and recalculate remaining", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Create new store instance
      const newTimerStore = new TimerStore();

      // Should have recalculated remaining time
      expect(newTimerStore.remainingSeconds).toBe(20 * 60); // 25 - 5 = 20 minutes
      expect(newTimerStore.status).toBe("running");
    });

    it("should resume ticking when loading a running timer", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Create new store instance
      const newTimerStore = new TimerStore();

      // Verify ticking is active - advance time and see remaining decrease
      vi.advanceTimersByTime(1000);
      expect(newTimerStore.remainingSeconds).toBe(20 * 60 - 1); // 19:59
    });

    it("should load paused timer from localStorage", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.pauseTimer();

      const newTimerStore = new TimerStore();

      expect(newTimerStore.status).toBe("paused");
      expect(newTimerStore.activeTaskId).toBe(taskId);
    });

    it("should preserve remaining time after pause/resume and reload", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(timerStore.remainingSeconds).toBe(20 * 60);

      // Pause
      timerStore.pauseTimer();

      // Advance another 2 minutes (timer should not decrease)
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(timerStore.remainingSeconds).toBe(20 * 60);

      // Reload
      const newTimerStore = new TimerStore();
      expect(newTimerStore.remainingSeconds).toBe(20 * 60);
      expect(newTimerStore.status).toBe("paused");
    });

    it("should preserve remaining time after pause, resume, and reload", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(timerStore.remainingSeconds).toBe(20 * 60);

      // Pause
      timerStore.pauseTimer();
      vi.advanceTimersByTime(2 * 60 * 1000);

      // Resume
      timerStore.resumeTimer();
      expect(timerStore.status).toBe("running");
      expect(timerStore.remainingSeconds).toBe(20 * 60);

      // Advance 1 more minute
      vi.advanceTimersByTime(1 * 60 * 1000);
      expect(timerStore.remainingSeconds).toBe(19 * 60);

      // Reload - should recalculate correctly
      const newTimerStore = new TimerStore();
      expect(newTimerStore.remainingSeconds).toBe(19 * 60);
      expect(newTimerStore.status).toBe("running");
    });

    it("should clear completed timer on load", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      // Advance past completion
      vi.advanceTimersByTime(30 * 60 * 1000);

      const newTimerStore = new TimerStore();

      expect(newTimerStore.status).toBe("idle");
    });

    it("should increment finishedTomatoCount when timer completes while away", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      // Simulate a running timer that was started 30 minutes ago (app was closed)
      const pastTime = new Date("2024-06-15T09:30:00.000Z").toISOString();
      const staleState = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt: pastTime,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState),
      );

      // Create new store instance (simulates reload)
      const newTimerStore = new TimerStore();

      // Timer should be idle
      expect(newTimerStore.status).toBe("idle");

      // Task should have one finished tomato
      const task = plannerStore.getTaskById(taskId!);
      expect(task!.finishedTomatoCount).toBe(1);
    });

    it("should increment finishedTomatoCount exactly once even with multiple reloads", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      // Simulate a running timer that was started 30 minutes ago
      const pastTime = new Date("2024-06-15T09:30:00.000Z").toISOString();
      const staleState = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt: pastTime,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState),
      );

      // First reload
      new TimerStore();
      const task1 = plannerStore.getTaskById(taskId!);
      expect(task1!.finishedTomatoCount).toBe(1);

      // Second reload (simulates another page refresh)
      // TIMER_STATE is cleared, so no double-counting
      new TimerStore();
      const task2 = plannerStore.getTaskById(taskId!);
      expect(task2!.finishedTomatoCount).toBe(1); // Should still be 1
    });

    it("should clear TIMER_STATE after handling completion while away", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      // Simulate a running timer that was started 30 minutes ago (app was closed)
      const pastTime = new Date("2024-06-15T09:30:00.000Z").toISOString();
      const staleState = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt: pastTime,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState),
      );

      // Verify TIMER_STATE exists before reload
      expect(localStorage.getItem(STORAGE_KEYS.TIMER_STATE)).not.toBeNull();

      // Reload triggers completion handling
      new TimerStore();

      // TIMER_STATE should be cleared to prevent future re-handling
      expect(localStorage.getItem(STORAGE_KEYS.TIMER_STATE)).toBeNull();
    });

    it("should allow multiple completions for same task (different timer instances)", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      // First timer instance completes while away
      const pastTime1 = new Date("2024-06-15T09:30:00.000Z").toISOString();
      const staleState1 = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt: pastTime1,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState1),
      );
      new TimerStore();

      const task1 = plannerStore.getTaskById(taskId!);
      expect(task1!.finishedTomatoCount).toBe(1);
      expect(localStorage.getItem(STORAGE_KEYS.TIMER_STATE)).toBeNull();

      // Second timer instance for same task completes while away
      const pastTime2 = new Date("2024-06-15T08:00:00.000Z").toISOString(); // Different startedAt
      const staleState2 = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt: pastTime2,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState2),
      );
      new TimerStore();

      const task2 = plannerStore.getTaskById(taskId!);
      expect(task2!.finishedTomatoCount).toBe(2); // Second completion should work
    });

    it("should skip increment if completion marker already set (crash after handleTimerComplete)", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      const startedAt = new Date("2024-06-15T09:30:00.000Z").toISOString();

      // Simulate crash scenario: handleTimerComplete ran, set marker, but TIMER_STATE not cleared
      const completionKey = `timer-completed-${taskId}-${startedAt}`;
      localStorage.setItem(completionKey, new Date().toISOString());

      const staleState = {
        activeTaskId: taskId,
        status: "running" as const,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
        startedAt,
        pausedAt: null,
        completedAt: null,
      };
      localStorage.setItem(
        STORAGE_KEYS.TIMER_STATE,
        JSON.stringify(staleState),
      );

      // Manually increment to simulate what handleTimerComplete did before crash
      plannerStore.markTomatoAsFinished(taskId!);
      const taskBefore = plannerStore.getTaskById(taskId!);
      expect(taskBefore!.finishedTomatoCount).toBe(1);

      // Reload - should detect marker and skip increment
      new TimerStore();

      const taskAfter = plannerStore.getTaskById(taskId!);
      expect(taskAfter!.finishedTomatoCount).toBe(1); // Still 1, no double-count
      expect(localStorage.getItem(STORAGE_KEYS.TIMER_STATE)).toBeNull();
    });
  });

  describe("selectors", () => {
    it("should return display time", () => {
      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      expect(timerStore.displayTime).toBe("25:00");
    });

    it("should check if task is active", () => {
      const { taskId } = plannerStore.addTask("Test Task");

      expect(timerStore.isTaskActive(taskId!)).toBe(false);

      timerStore.startTimer(taskId!);

      expect(timerStore.isTaskActive(taskId!)).toBe(true);
    });

    it("should check isRunning", () => {
      expect(timerStore.isRunning).toBe(false);

      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      expect(timerStore.isRunning).toBe(true);
    });

    it("should check isPaused", () => {
      expect(timerStore.isPaused).toBe(false);

      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);
      timerStore.pauseTimer();

      expect(timerStore.isPaused).toBe(true);
    });

    it("should check hasActiveTimer", () => {
      expect(timerStore.hasActiveTimer).toBe(false);

      const { taskId } = plannerStore.addTask("Test Task");
      timerStore.startTimer(taskId!);

      expect(timerStore.hasActiveTimer).toBe(true);

      timerStore.pauseTimer();

      expect(timerStore.hasActiveTimer).toBe(true);
    });
  });
});
