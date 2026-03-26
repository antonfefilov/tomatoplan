/**
 * Tests for Task model
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTask,
  updateTaskTomatoCount,
  markTomatoAsFinished,
  markTomatoAsUnfinished,
  updateTaskFinishedCount,
  updateTask,
  markTaskDone,
} from "../src/models/task.js";

describe("createTask", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T10:30:00.000Z"));
  });

  it("should create a task with required fields", () => {
    const task = createTask("task-123", "My Task");

    expect(task.id).toBe("task-123");
    expect(task.title).toBe("My Task");
    expect(task.tomatoCount).toBe(0);
    expect(task.finishedTomatoCount).toBe(0);
    expect(task.createdAt).toBe("2024-06-15T10:30:00.000Z");
    expect(task.updatedAt).toBe("2024-06-15T10:30:00.000Z");
  });

  it("should create a task with optional description", () => {
    const task = createTask("task-123", "My Task", "Task description");
    expect(task.description).toBe("Task description");
  });

  it("should create a task without description when not provided", () => {
    const task = createTask("task-123", "My Task");
    expect(task.description).toBeUndefined();
  });
});

describe("updateTaskTomatoCount", () => {
  it("should update tomato count", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));

    const task = createTask("task-1", "Task");
    const updated = updateTaskTomatoCount(task, 5);

    expect(updated.tomatoCount).toBe(5);
    expect(updated.updatedAt).toBe("2024-06-15T12:00:00.000Z");

    vi.useRealTimers();
  });

  it("should reduce finished count if new tomato count is lower", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 4,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = updateTaskTomatoCount(task, 3);

    expect(updated.tomatoCount).toBe(3);
    expect(updated.finishedTomatoCount).toBe(3);
  });

  it("should not reduce finished count if new count is higher", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = updateTaskTomatoCount(task, 8);

    expect(updated.tomatoCount).toBe(8);
    expect(updated.finishedTomatoCount).toBe(2);
  });
});

describe("markTomatoAsFinished", () => {
  it("should increment finished count", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTomatoAsFinished(task);

    expect(updated.finishedTomatoCount).toBe(3);
  });

  it("should increment finished count beyond planned without changing tomatoCount", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTomatoAsFinished(task);

    // When all planned tomatoes are finished, finishing another should only
    // increment finishedTomatoCount, NOT tomatoCount (planned stays unchanged)
    expect(updated.finishedTomatoCount).toBe(4);
    expect(updated.tomatoCount).toBe(3); // planned count unchanged
  });

  it("should allow finished count to exceed planned count", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 2,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    // Mark multiple tomatoes finished beyond planned
    let updated = markTomatoAsFinished(task);
    updated = markTomatoAsFinished(updated);
    updated = markTomatoAsFinished(updated);

    expect(updated.finishedTomatoCount).toBe(5);
    expect(updated.tomatoCount).toBe(2); // planned count unchanged
  });
});

describe("markTomatoAsUnfinished", () => {
  it("should decrement finished count", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTomatoAsUnfinished(task);

    expect(updated.finishedTomatoCount).toBe(2);
  });

  it("should not go below zero", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTomatoAsUnfinished(task);

    expect(updated.finishedTomatoCount).toBe(0);
  });
});

describe("updateTaskFinishedCount", () => {
  it("should set finished count to specified value", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = updateTaskFinishedCount(task, 4);

    expect(updated.finishedTomatoCount).toBe(4);
  });

  it("should allow finished count to exceed planned tomato count", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    // Setting finished count beyond planned should be allowed
    const updated = updateTaskFinishedCount(task, 10);

    expect(updated.finishedTomatoCount).toBe(10);
    expect(updated.tomatoCount).toBe(3); // planned count unchanged
  });

  it("should not go below zero", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = updateTaskFinishedCount(task, -5);

    expect(updated.finishedTomatoCount).toBe(0);
  });
});

describe("updateTask", () => {
  it("should update title", () => {
    const task = createTask("task-1", "Original Title");
    const updated = updateTask(task, { title: "New Title" });

    expect(updated.title).toBe("New Title");
    expect(updated.id).toBe(task.id);
  });

  it("should update description", () => {
    const task = createTask("task-1", "Task", "Old description");
    const updated = updateTask(task, { description: "New description" });

    expect(updated.description).toBe("New description");
  });

  it("should update tomatoCount", () => {
    const task = createTask("task-1", "Task");
    const updated = updateTask(task, { tomatoCount: 5 });

    expect(updated.tomatoCount).toBe(5);
  });

  it("should update updatedAt timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T14:00:00.000Z"));

    const task = createTask("task-1", "Task");
    const updated = updateTask(task, { title: "Updated" });

    expect(updated.updatedAt).toBe("2024-06-15T14:00:00.000Z");

    vi.useRealTimers();
  });

  it("should preserve other fields when partially updating", () => {
    const task = {
      id: "task-1",
      title: "Task",
      description: "Description",
      tomatoCount: 5,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = updateTask(task, { title: "New Task" });

    expect(updated.description).toBe("Description");
    expect(updated.tomatoCount).toBe(5);
    expect(updated.finishedTomatoCount).toBe(2);
  });
});

describe("markTaskDone", () => {
  it("should set finishedTomatoCount to tomatoCount when not done", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 5,
      finishedTomatoCount: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTaskDone(task);

    expect(updated.finishedTomatoCount).toBe(5);
    expect(updated.tomatoCount).toBe(5);
  });

  it("should not change task when already done (finished >= planned)", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTaskDone(task);

    // Should return same task (no change)
    expect(updated).toBe(task);
  });

  it("should not change task when finished exceeds planned", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 5,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTaskDone(task);

    // Should return same task (no change)
    expect(updated).toBe(task);
    expect(updated.finishedTomatoCount).toBe(5);
  });

  it("should handle task with zero tomatoes", () => {
    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 0,
      finishedTomatoCount: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTaskDone(task);

    // Already "done" since finished (0) >= planned (0)
    expect(updated).toBe(task);
  });

  it("should update updatedAt timestamp when marking done", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T14:00:00.000Z"));

    const task = {
      id: "task-1",
      title: "Task",
      tomatoCount: 3,
      finishedTomatoCount: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    const updated = markTaskDone(task);

    expect(updated.updatedAt).toBe("2024-06-15T14:00:00.000Z");

    vi.useRealTimers();
  });
});
