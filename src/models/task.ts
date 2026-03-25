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
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates a task's tomato count and sets the updatedAt timestamp
 */
export function updateTaskTomatoCount(task: Task, count: number): Task {
  return {
    ...task,
    tomatoCount: count,
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
