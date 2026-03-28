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

  /** Optional reference to a weekly project */
  projectId?: string;

  /** Optional reference to a track (workflow) */
  trackId?: string;

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
  projectId?: string,
): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description,
    tomatoCount: 0,
    finishedTomatoCount: 0,
    projectId,
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
  updates: Partial<
    Pick<Task, "title" | "description" | "tomatoCount" | "projectId">
  >,
): Task {
  return {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Assigns a task to a project
 */
export function assignTaskToProject(task: Task, projectId: string): Task {
  return {
    ...task,
    projectId,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a task from its project
 */
export function unassignTaskFromProject(task: Task): Task {
  const { projectId: _, ...rest } = task;
  return {
    ...rest,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks a task as done by setting finishedTomatoCount to at least tomatoCount.
 * This is a one-way convenience action that ensures the task appears complete.
 * If finishedTomatoCount already exceeds tomatoCount, it remains unchanged.
 */
export function markTaskDone(task: Task): Task {
  // If already done (finished >= planned), no change needed
  if (task.finishedTomatoCount >= task.tomatoCount) {
    return task;
  }
  return {
    ...task,
    finishedTomatoCount: task.tomatoCount,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Determines if a task is considered "done".
 * A task is done when it has at least one planned tomato (tomatoCount > 0)
 * AND the finished count meets or exceeds the planned count.
 * Note: Tasks with 0/0 tomatoes are NOT considered done.
 */
export function isTaskDone(task: Task): boolean {
  return task.tomatoCount > 0 && task.finishedTomatoCount >= task.tomatoCount;
}
