/**
 * Task model for the Tomato Plan
 * Represents a single task that can be assigned tomatoes (pomodoro sessions)
 */

export interface Task {
  /** Unique identifier for the task */
  readonly id: string;

  /** Task title/name */
  title: string;

  /** Optional task description */
  description?: string;

  /** Number of tomatoes assigned to this task */
  tomatoCount: number;

  /** Number of tomatoes that have been finished/completed */
  finishedTomatoCount: number;

  /** When the task was created */
  readonly createdAt: string; // ISO 8601 date string

  /** When the task was last updated */
  updatedAt: string; // ISO 8601 date string
}

/**
 * Creates a new task with default values
 */
export function createTask(
  id: string,
  title: string,
  description?: string,
): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description,
    tomatoCount: 0,
    finishedTomatoCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates a task's tomato count and sets the updatedAt timestamp.
 * If the new count is less than the finished count, finished count is reduced to match.
 */
export function updateTaskTomatoCount(task: Task, count: number): Task {
  const finishedTomatoCount =
    count < task.finishedTomatoCount ? count : task.finishedTomatoCount;
  return {
    ...task,
    tomatoCount: count,
    finishedTomatoCount,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks a tomato as finished by incrementing the finished count.
 * Note: This only increments the finishedTomatoCount; the planned tomatoCount
 * remains unchanged. Finished count can exceed planned count (actual vs planned).
 */
export function markTomatoAsFinished(task: Task): Task {
  return {
    ...task,
    finishedTomatoCount: task.finishedTomatoCount + 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks a tomato as unfinished by decrementing the finished count.
 * Will not decrement below 0.
 */
export function markTomatoAsUnfinished(task: Task): Task {
  if (task.finishedTomatoCount <= 0) {
    return task;
  }
  return {
    ...task,
    finishedTomatoCount: task.finishedTomatoCount - 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sets the finished tomato count to a specific value.
 * The count is validated to be non-negative. It can exceed the planned
 * tomato count (factual/actual tomatoes can be greater than planned).
 */
export function updateTaskFinishedCount(task: Task, count: number): Task {
  const validatedCount = Math.max(0, count);
  return {
    ...task,
    finishedTomatoCount: validatedCount,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates a task's properties and sets the updatedAt timestamp
 */
export function updateTask(
  task: Task,
  updates: Partial<Pick<Task, "title" | "description" | "tomatoCount">>,
): Task {
  return {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}
