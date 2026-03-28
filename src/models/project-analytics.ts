/**
 * Project Analytics - Pure functions for computing project metrics
 * Extracted from tomato-planner-app for reusability
 */

import type { Task } from "./task.js";
import type { Project } from "./project.js";
import type { WeeklyState } from "./weekly-state.js";
import {
  getTotalProjectEstimates,
  getTotalProjectFinishedTomatoes,
} from "./weekly-state.js";

/**
 * Gets task counts per project
 * Returns a map of projectId -> task count
 */
export function getProjectTaskCounts(
  tasks: readonly Task[],
  projects: readonly Project[],
): Record<string, number> {
  const taskCounts: Record<string, number> = {};

  for (const project of projects) {
    const count = tasks.filter((t) => t.projectId === project.id).length;
    taskCounts[project.id] = count;
  }

  return taskCounts;
}

/**
 * Gets progress data per project
 * Returns a map of projectId -> { finished, estimated }
 * Finished tomatoes come from tasks, estimated comes from project estimate
 */
export function getProjectProgressMap(
  tasks: readonly Task[],
  projects: readonly Project[],
): Record<string, { finished: number; estimated: number }> {
  const progressData: Record<string, { finished: number; estimated: number }> =
    {};

  for (const project of projects) {
    // Get tasks for this project
    const projectTasks = tasks.filter((t) => t.projectId === project.id);

    // Sum finished tomatoes from tasks
    const finishedTomatoes = projectTasks.reduce(
      (sum, t) => sum + t.finishedTomatoCount,
      0,
    );

    // Use project estimate as the estimated value
    const estimatedTomatoes = project.tomatoEstimate;

    progressData[project.id] = {
      finished: finishedTomatoes,
      estimated: estimatedTomatoes,
    };
  }

  return progressData;
}

/**
 * Overall project metrics for the week
 */
export interface OverallProjectMetrics {
  /** Total planned tomatoes (sum of active project estimates) */
  totalPlanned: number;
  /** Total finished tomatoes across all projects */
  totalFinished: number;
  /** Total number of projects */
  projectCount: number;
  /** Number of active projects */
  activeProjectCount: number;
  /** Number of completed projects */
  completedProjectCount: number;
  /** Number of archived projects */
  archivedProjectCount: number;
  /** Remaining weekly capacity */
  remainingCapacity: number;
  /** Weekly capacity */
  weeklyCapacity: number;
}

/**
 * Gets overall project metrics from weekly state
 */
export function getOverallProjectMetrics(
  state: WeeklyState,
): OverallProjectMetrics {
  const totalPlanned = getTotalProjectEstimates(state);
  const totalFinished = getTotalProjectFinishedTomatoes(state);
  const weeklyCapacity = state.pool.weeklyCapacity;

  const projectCount = state.projects.length;
  const activeProjectCount = state.projects.filter(
    (p) => p.status === "active",
  ).length;
  const completedProjectCount = state.projects.filter(
    (p) => p.status === "completed",
  ).length;
  const archivedProjectCount = state.projects.filter(
    (p) => p.status === "archived",
  ).length;

  const remainingCapacity = weeklyCapacity - totalPlanned;

  return {
    totalPlanned,
    totalFinished,
    projectCount,
    activeProjectCount,
    completedProjectCount,
    archivedProjectCount,
    remainingCapacity,
    weeklyCapacity,
  };
}

/**
 * Gets progress percentage for a project
 */
export function getProjectProgressPercent(
  finished: number,
  estimated: number,
): number {
  if (estimated === 0) return 0;
  return Math.min(100, (finished / estimated) * 100);
}

/**
 * Gets the color for a progress bar based on percentage
 */
export function getProgressColor(
  percent: number,
  projectColor?: string,
): string {
  if (percent >= 100) return "#22c55e";
  if (percent >= 75) return "#84cc16";
  if (percent >= 50) return "#f59e0b";
  return projectColor ?? "#ef4444";
}

/**
 * Gets the color for capacity bar based on percentage
 */
export function getCapacityColor(percent: number): string {
  if (percent > 100) return "#ef4444";
  if (percent >= 90) return "#f59e0b";
  if (percent >= 70) return "#84cc16";
  return "#22c55e";
}

/**
 * Checks if weekly capacity is exceeded
 */
export function isOverCapacity(
  totalPlanned: number,
  weeklyCapacity: number,
): boolean {
  return totalPlanned > weeklyCapacity;
}

/**
 * Calculates capacity usage percentage
 */
export function getCapacityUsagePercent(
  totalPlanned: number,
  weeklyCapacity: number,
): number {
  if (weeklyCapacity === 0) return 0;
  return (totalPlanned / weeklyCapacity) * 100;
}

/**
 * Formats minutes into a human-readable hours/minutes string
 * e.g., 200 minutes -> "3h 20m"
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
