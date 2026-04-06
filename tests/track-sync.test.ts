/**
 * Regression tests for track membership synchronization
 * Tests that track membership is properly maintained across various operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WeeklyStore } from "../src/state/weekly-store.js";
import type { Task } from "../src/models/task.js";

describe("Track membership synchronization", () => {
  let store: WeeklyStore;

  beforeEach(() => {
    localStorage.clear();
    // Use fake timers for consistent date handling
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:00:00.000Z"));

    // Create fresh store instance for each test
    store = new WeeklyStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("syncTasks preserves track membership", () => {
    it("should preserve trackId when syncing task that was added to track", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");
      expect(trackId).toBeDefined();

      // Create a task via syncTasks
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Add task to track
      const addResult = store.addTaskToTrack(trackId!, "task-1");
      expect(addResult.success).toBe(true);

      // Verify task has trackId
      const taskAfterAdd = store.getTaskById("task-1");
      expect(taskAfterAdd?.trackId).toBe(trackId);

      // Sync the same task again (simulate re-sync from planner)
      const updatedTask: Task = {
        ...task,
        title: "Updated Title",
        tomatoCount: 3,
      };

      store.syncTasks([updatedTask]);

      // Verify track membership is preserved
      const taskAfterSync = store.getTaskById("task-1");
      expect(taskAfterSync?.trackId).toBe(trackId);
      expect(taskAfterSync?.title).toBe("Updated Title");
      expect(taskAfterSync?.tomatoCount).toBe(3);

      // Verify track still contains the task
      const track = store.getTrackById(trackId!);
      expect(track?.taskIds).toContain("task-1");
    });

    it("should preserve existing trackId when syncing task with trackId set", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create a task with trackId already set (synced from another source)
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        trackId: trackId!,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Verify task has trackId preserved
      const syncedTask = store.getTaskById("task-1");
      expect(syncedTask?.trackId).toBe(trackId);

      // Note: The track.taskIds may not be updated via syncTasks alone
      // The caller needs to ensure track.taskIds is also updated
      // This test verifies the task.trackId is preserved, not track.taskIds
    });
  });

  describe("task deletion cleans up track membership", () => {
    it("should remove task from track.taskIds when task is deleted", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.addTaskToTrack(trackId!, "task-1");

      // Verify task is in track
      const trackBefore = store.getTrackById(trackId!);
      expect(trackBefore?.taskIds).toContain("task-1");

      // Delete the task
      store.removeTask("task-1");

      // Verify task is removed from track.taskIds
      const trackAfter = store.getTrackById(trackId!);
      expect(trackAfter?.taskIds).not.toContain("task-1");
      expect(trackAfter?.taskIds).toHaveLength(0);

      // Verify task no longer exists
      const deletedTask = store.getTaskById("task-1");
      expect(deletedTask).toBeUndefined();
    });

    it("should cleanup edges involving deleted task", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync two tasks
      const task1: Task = {
        id: "task-1",
        title: "Task 1",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      const task2: Task = {
        id: "task-2",
        title: "Task 2",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task1, task2]);

      // Add both tasks to track
      store.addTaskToTrack(trackId!, "task-1");
      store.addTaskToTrack(trackId!, "task-2");

      // Add an edge between tasks (task-1 -> task-2)
      const edgeResult = store.addTrackEdge(trackId!, "task-1", "task-2");
      expect(edgeResult.success).toBe(true);

      // Verify edge exists
      const trackBefore = store.getTrackById(trackId!);
      expect(trackBefore?.edges).toHaveLength(1);
      expect(trackBefore?.edges[0]?.sourceTaskId).toBe("task-1");
      expect(trackBefore?.edges[0]?.targetTaskId).toBe("task-2");

      // Delete task-1
      store.removeTask("task-1");

      // Verify edge is cleaned up
      const trackAfter = store.getTrackById(trackId!);
      expect(trackAfter?.edges).toHaveLength(0);

      // Verify task-2 is still in track (but without the edge)
      expect(trackAfter?.taskIds).toContain("task-2");
      expect(trackAfter?.taskIds).toHaveLength(1);
    });

    it("should clear trackId from task when removed from track", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.addTaskToTrack(trackId!, "task-1");

      // Verify task has trackId
      const taskBefore = store.getTaskById("task-1");
      expect(taskBefore?.trackId).toBe(trackId);

      // Remove task from track (but not delete)
      const removeResult = store.removeTaskFromTrack(trackId!, "task-1");
      expect(removeResult.success).toBe(true);

      // Verify task's trackId is cleared
      const taskAfter = store.getTaskById("task-1");
      expect(taskAfter?.trackId).toBeUndefined();

      // Verify track no longer contains the task
      const track = store.getTrackById(trackId!);
      expect(track?.taskIds).not.toContain("task-1");
    });

    it("regression: removing task via removeTask cleans up all track references (bd-gs8)", () => {
      // Regression test for bug: task deleted from Tasks view still displayed in Tracks view
      // Root cause: plannerStore.removeTask() didn't call cleanupTaskFromTracks()
      // Fix: always use weeklyStore.removeTask() which properly cleans up track references

      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync a task assigned to today (simulating Tasks view scenario)
      const task: Task = {
        id: "task-today-1",
        title: "Task assigned to today",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        dayDate: "2024-06-15", // Assigned to today
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Add task to track (simulating being in Tracks view)
      const addResult = store.addTaskToTrack(trackId!, "task-today-1");
      expect(addResult.success).toBe(true);

      // Verify task is in track before deletion
      const trackBefore = store.getTrackById(trackId!);
      expect(trackBefore?.taskIds).toContain("task-today-1");
      expect(trackBefore?.taskIds).toHaveLength(1);

      // Verify task has trackId set
      const taskBefore = store.getTaskById("task-today-1");
      expect(taskBefore?.trackId).toBe(trackId);

      // Delete the task using weeklyStore.removeTask (the fixed approach)
      // This should clean up track references AND remove from taskpool
      store.removeTask("task-today-1");

      // CRITICAL: Verify task is removed from track.taskIds
      const trackAfter = store.getTrackById(trackId!);
      expect(trackAfter?.taskIds).not.toContain("task-today-1");
      expect(trackAfter?.taskIds).toHaveLength(0);

      // Verify task no longer exists in taskpool
      const deletedTask = store.getTaskById("task-today-1");
      expect(deletedTask).toBeUndefined();

      // This regression test ensures that the bug where:
      // - Deleting from Tasks view (which used plannerStore.removeTask)
      // - Left stale taskIds in tracks.taskIds
      // - Causing Tasks to still appear in Tracks view
      // Is now fixed because we always use weeklyStore.removeTask()
    });
  });

  describe("task movement between tracks", () => {
    it("should remove task from old track when moved to new track", () => {
      // Create two tracks
      const { trackId: track1Id } = store.addTrack("Track 1");
      const { trackId: track2Id } = store.addTrack("Track 2");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Add task to track 1
      store.addTaskToTrack(track1Id!, "task-1");

      // Verify task is in track 1
      const track1Before = store.getTrackById(track1Id!);
      expect(track1Before?.taskIds).toContain("task-1");

      // Remove task from track 1 first (required before moving to another track)
      store.removeTaskFromTrack(track1Id!, "task-1");

      // Now add to track 2
      store.addTaskToTrack(track2Id!, "task-1");

      // Verify task is in track 2
      const track2 = store.getTrackById(track2Id!);
      expect(track2?.taskIds).toContain("task-1");

      // Verify task is not in track 1
      const track1After = store.getTrackById(track1Id!);
      expect(track1After?.taskIds).not.toContain("task-1");

      // Verify task's trackId is updated
      const taskAfter = store.getTaskById("task-1");
      expect(taskAfter?.trackId).toBe(track2Id);
    });

    it("should prevent adding task to new track without removing from old track first", () => {
      // Create two tracks
      const { trackId: track1Id } = store.addTrack("Track 1");
      const { trackId: track2Id } = store.addTrack("Track 2");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Add task to track 1
      store.addTaskToTrack(track1Id!, "task-1");

      // Try to add task to track 2 without removing from track 1 first
      const result = store.addTaskToTrack(track2Id!, "task-1");

      // Should fail because task is already in another track
      expect(result.success).toBe(false);
      expect(result.error).toContain("already assigned to another track");

      // Verify task is still in track 1
      const track1 = store.getTrackById(track1Id!);
      expect(track1?.taskIds).toContain("task-1");

      // Verify task is not in track 2
      const track2 = store.getTrackById(track2Id!);
      expect(track2?.taskIds).toHaveLength(0);

      // Verify task's trackId is still track 1
      const taskAfter = store.getTaskById("task-1");
      expect(taskAfter?.trackId).toBe(track1Id);
    });
  });

  describe("invalid trackId handling", () => {
    it("should handle task with invalid trackId gracefully", () => {
      // Create a task with an invalid (non-existent) trackId
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        trackId: "invalid-track-id",
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Task should be synced but trackId may or may not be cleared
      // The behavior here is to preserve the trackId even if invalid
      // (it's up to the UI/consumer to handle invalid trackIds)
      const syncedTask = store.getTaskById("task-1");
      expect(syncedTask).toBeDefined();
      expect(syncedTask?.id).toBe("task-1");

      // Note: The implementation preserves trackId even if it's invalid
      // This is because the track might exist in a different week or context
      expect(syncedTask?.trackId).toBe("invalid-track-id");
    });

    it("should clear trackId from tasks when track is deleted", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);
      store.addTaskToTrack(trackId!, "task-1");

      // Verify task has trackId
      const taskBefore = store.getTaskById("task-1");
      expect(taskBefore?.trackId).toBe(trackId);

      // Delete the track
      const removeResult = store.removeTrack(trackId!);
      expect(removeResult.success).toBe(true);

      // Verify track is deleted
      const deletedTrack = store.getTrackById(trackId!);
      expect(deletedTrack).toBeUndefined();

      // Verify task's trackId is cleared
      const taskAfter = store.getTaskById("task-1");
      expect(taskAfter?.trackId).toBeUndefined();

      // Task should still exist
      expect(taskAfter?.id).toBe("task-1");
    });

    it("should clear trackId from all tasks when track with multiple tasks is deleted", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync multiple tasks
      const tasks: Task[] = [
        {
          id: "task-1",
          title: "Task 1",
          tomatoCount: 2,
          finishedTomatoCount: 0,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Task 2",
          tomatoCount: 3,
          finishedTomatoCount: 0,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
        },
        {
          id: "task-3",
          title: "Task 3",
          tomatoCount: 1,
          finishedTomatoCount: 0,
          createdAt: "2024-06-15T10:00:00.000Z",
          updatedAt: "2024-06-15T10:00:00.000Z",
        },
      ];

      store.syncTasks(tasks);

      // Add all tasks to track
      store.addTaskToTrack(trackId!, "task-1");
      store.addTaskToTrack(trackId!, "task-2");
      store.addTaskToTrack(trackId!, "task-3");

      // Verify all tasks have trackId
      expect(store.getTaskById("task-1")?.trackId).toBe(trackId);
      expect(store.getTaskById("task-2")?.trackId).toBe(trackId);
      expect(store.getTaskById("task-3")?.trackId).toBe(trackId);

      // Delete the track
      store.removeTrack(trackId!);

      // Verify all tasks' trackIds are cleared
      expect(store.getTaskById("task-1")?.trackId).toBeUndefined();
      expect(store.getTaskById("task-2")?.trackId).toBeUndefined();
      expect(store.getTaskById("task-3")?.trackId).toBeUndefined();

      // All tasks should still exist
      expect(store.getTaskById("task-1")).toBeDefined();
      expect(store.getTaskById("task-2")).toBeDefined();
      expect(store.getTaskById("task-3")).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty syncTasks without error", () => {
      // Sync empty array
      store.syncTasks([]);

      // Should not throw and state should remain valid
      expect(store.tasks).toHaveLength(0);
      expect(store.tracks).toHaveLength(0);
    });

    it("should handle adding same task to track multiple times", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Create and sync a task
      const task: Task = {
        id: "task-1",
        title: "Test Task",
        tomatoCount: 2,
        finishedTomatoCount: 0,
        createdAt: "2024-06-15T10:00:00.000Z",
        updatedAt: "2024-06-15T10:00:00.000Z",
      };

      store.syncTasks([task]);

      // Add task to track
      const result1 = store.addTaskToTrack(trackId!, "task-1");
      expect(result1.success).toBe(true);

      // Try to add again (should succeed but not duplicate)
      const result2 = store.addTaskToTrack(trackId!, "task-1");
      expect(result2.success).toBe(true);

      // Track should only have one instance of the task
      const track = store.getTrackById(trackId!);
      expect(track?.taskIds).toHaveLength(1);
      expect(track?.taskIds).toContain("task-1");
    });

    it("should handle removing non-existent task from track gracefully", () => {
      // Create a track
      const { trackId } = store.addTrack("Test Track");

      // Try to remove a task that doesn't exist from the track
      const result = store.removeTaskFromTrack(trackId!, "non-existent-task");

      // Should succeed (no error for task not in track)
      expect(result.success).toBe(true);

      // Track should remain unchanged
      const track = store.getTrackById(trackId!);
      expect(track?.taskIds).toHaveLength(0);
    });
  });
});
