/**
 * Project Coordinator - Coordinates project operations across stores
 * Ensures proper cleanup when projects are deleted
 */

import { taskpoolStore } from "./taskpool-store.js";
import { weeklyStore } from "./weekly-store.js";

/** Result type for coordinator actions */
interface CoordinatorResult {
  success: boolean;
  error?: string;
}

/**
 * Removes a project and unassigns all associated tasks
 * This is the canonical way to delete a project - it ensures:
 * 1. All tasks in the planner store are unassigned from the project
 * 2. The project is removed from the weekly store
 * 3. The task updates sync to the weekly store via the existing sync mechanism
 */
export function removeProject(projectId: string): CoordinatorResult {
  // Validate project exists
  const project = weeklyStore.getProjectById(projectId);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // First, unassign tasks from the project in taskpool store
  // This updates the source of truth for all tasks
  taskpoolStore.unassignTasksFromProject(projectId);

  // Then, remove the project from weekly store
  // The weekly store's removeProject now just removes the project
  // since tasks are already unassigned via the planner store sync
  const result = weeklyStore.removeProject(projectId);

  return result;
}
