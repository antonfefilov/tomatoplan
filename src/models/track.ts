/**
 * Track model for the Tomato Plan
 * Represents a track (workflow/sequence) that contains tasks with dependencies
 */

/** Edge representing a dependency between two tasks */
export interface TrackEdge {
  /** Source task ID (the task that must be completed first) */
  readonly sourceTaskId: string;

  /** Target task ID (the task that depends on the source) */
  readonly targetTaskId: string;
}

export interface Track {
  /** Unique identifier for the track */
  readonly id: string;

  /** Track title/name */
  title: string;

  /** Optional track description */
  description?: string;

  /** Optional reference to a project (tracks can be project-specific) */
  projectId?: string;

  /** IDs of tasks that belong to this track */
  taskIds: readonly string[];

  /** Edges representing dependencies between tasks in this track */
  edges: readonly TrackEdge[];

  /** When the track was created */
  readonly createdAt: string; // ISO 8601 date string

  /** When the track was last updated */
  updatedAt: string; // ISO 8601 date string
}

/**
 * Creates a new track with default values
 */
export function createTrack(
  id: string,
  title: string,
  options?: {
    description?: string;
    projectId?: string;
    taskIds?: readonly string[];
    edges?: readonly TrackEdge[];
  },
): Track {
  const now = new Date().toISOString();
  return {
    id,
    title: title.trim(),
    description: options?.description?.trim(),
    projectId: options?.projectId,
    taskIds: options?.taskIds ?? [],
    edges: options?.edges ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates a track's properties and sets the updatedAt timestamp
 */
export function updateTrack(
  track: Track,
  updates: Partial<Pick<Track, "title" | "description" | "projectId">>,
): Track {
  return {
    ...track,
    ...updates,
    title: updates.title?.trim() ?? track.title,
    description:
      "description" in updates
        ? (updates.description ?? "").trim() || undefined
        : track.description,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a task to a track
 */
export function addTaskToTrack(track: Track, taskId: string): Track {
  if (track.taskIds.includes(taskId)) {
    return track; // Task already in track
  }
  return {
    ...track,
    taskIds: [...track.taskIds, taskId],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a task from a track and removes all edges involving that task
 */
export function removeTaskFromTrack(track: Track, taskId: string): Track {
  if (!track.taskIds.includes(taskId)) {
    return track; // Task not in track
  }

  // Remove task from taskIds
  const newTaskIds = track.taskIds.filter((id) => id !== taskId);

  // Remove all edges involving this task
  const newEdges = track.edges.filter(
    (edge) => edge.sourceTaskId !== taskId && edge.targetTaskId !== taskId,
  );

  return {
    ...track,
    taskIds: newTaskIds,
    edges: newEdges,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds an edge (dependency) to a track
 * Note: This function does NOT validate for cycles - that should be done separately
 */
export function addEdgeToTrack(
  track: Track,
  sourceTaskId: string,
  targetTaskId: string,
): Track {
  // Check if edge already exists
  const edgeExists = track.edges.some(
    (edge) =>
      edge.sourceTaskId === sourceTaskId && edge.targetTaskId === targetTaskId,
  );

  if (edgeExists) {
    return track;
  }

  // Verify both tasks are in the track
  if (
    !track.taskIds.includes(sourceTaskId) ||
    !track.taskIds.includes(targetTaskId)
  ) {
    return track;
  }

  return {
    ...track,
    edges: [...track.edges, { sourceTaskId, targetTaskId }],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes an edge (dependency) from a track
 */
export function removeEdgeFromTrack(
  track: Track,
  sourceTaskId: string,
  targetTaskId: string,
): Track {
  const newEdges = track.edges.filter(
    (edge) =>
      !(
        edge.sourceTaskId === sourceTaskId && edge.targetTaskId === targetTaskId
      ),
  );

  if (newEdges.length === track.edges.length) {
    return track; // Edge not found
  }

  return {
    ...track,
    edges: newEdges,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets all edges where the given task is the source (dependencies going out)
 */
export function getOutgoingEdges(
  track: Track,
  taskId: string,
): readonly TrackEdge[] {
  return track.edges.filter((edge) => edge.sourceTaskId === taskId);
}

/**
 * Gets all edges where the given task is the target (dependencies coming in)
 */
export function getIncomingEdges(
  track: Track,
  taskId: string,
): readonly TrackEdge[] {
  return track.edges.filter((edge) => edge.targetTaskId === taskId);
}

/**
 * Gets all tasks that depend on the given task (downstream tasks)
 */
export function getDownstreamTaskIds(
  track: Track,
  taskId: string,
): readonly string[] {
  const outgoing = getOutgoingEdges(track, taskId);
  return outgoing.map((edge) => edge.targetTaskId);
}

/**
 * Gets all tasks that the given task depends on (upstream tasks)
 */
export function getUpstreamTaskIds(
  track: Track,
  taskId: string,
): readonly string[] {
  const incoming = getIncomingEdges(track, taskId);
  return incoming.map((edge) => edge.sourceTaskId);
}
