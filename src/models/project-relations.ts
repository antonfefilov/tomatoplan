/**
 * Project Relations - Helper functions for mapping projects to their related tasks and tracks
 * Used by project-list-panel to determine which tasks/tracks belong to each project
 */

import type { Task } from "./task.js";
import type { Track } from "./track.js";
import type { Project } from "./project.js";

/**
 * Relations for a single project
 */
export interface ProjectRelations {
  /** Tasks assigned to this project */
  tasks: readonly Task[];
  /** Tracks assigned to this project */
  tracks: readonly Track[];
}

/**
 * Map of projectId -> ProjectRelations
 */
export type ProjectRelationsMap = Record<string, ProjectRelations>;

/**
 * Gets a map of all projects to their related tasks and tracks
 * @param tasks - All tasks in the system
 * @param tracks - All tracks in the system
 * @param projects - All projects to compute relations for
 * @returns Map where each projectId has its related tasks and tracks
 */
export function getProjectRelationsMap(
  tasks: readonly Task[],
  tracks: readonly Track[],
  projects: readonly Project[],
): ProjectRelationsMap {
  const relationsMap: ProjectRelationsMap = {};

  for (const project of projects) {
    // Get tasks assigned to this project
    const projectTasks = tasks.filter((task) => task.projectId === project.id);

    // Get tracks assigned to this project
    const projectTracks = tracks.filter(
      (track) => track.projectId === project.id,
    );

    relationsMap[project.id] = {
      tasks: projectTasks,
      tracks: projectTracks,
    };
  }

  return relationsMap;
}

/**
 * Gets relations for a specific project
 * @param projectId - The project ID to get relations for
 * @param tasks - All tasks in the system
 * @param tracks - All tracks in the system
 * @returns Relations for the specified project
 */
export function getProjectRelations(
  projectId: string,
  tasks: readonly Task[],
  tracks: readonly Track[],
): ProjectRelations {
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
  const projectTracks = tracks.filter((track) => track.projectId === projectId);

  return {
    tasks: projectTasks,
    tracks: projectTracks,
  };
}

/**
 * Checks if a project has any related tasks or tracks
 */
export function hasProjectRelations(relations: ProjectRelations): boolean {
  return relations.tasks.length > 0 || relations.tracks.length > 0;
}
