/**
 * HeaderModel - Discriminated union type for view-specific header content
 */

import type { TomatoTimeSlot } from "../../models/tomato-pool.js";

/**
 * Header model for Day view
 */
export interface DayHeaderModel {
  view: "day";
  date: string;
  /** @deprecated Use timeSlots instead. Kept for compatibility. */
  dayStart: string;
  /** @deprecated Use timeSlots instead. Kept for compatibility. */
  dayEnd: string;
  capacityInMinutes: number;
  showReset: boolean;
  /** Time slots for the work day (used for remaining calculation) */
  timeSlots: TomatoTimeSlot[];
}

/**
 * Header model for Week view
 */
export interface WeekHeaderModel {
  view: "week";
  weekStartDate: string;
  weekEndDate: string;
  planned: number;
  capacity: number;
}

/**
 * Header model for Projects view
 */
export interface ProjectsHeaderModel {
  view: "projects";
  projectCount: number;
  activeProjectCount: number;
  totalFinished: number;
  totalPlanned: number;
}

/**
 * Header model for Tracks view
 */
export interface TracksHeaderModel {
  view: "tracks";
  trackCount: number;
  selectedTrackTitle?: string;
}

/**
 * Header model for Tasks view
 */
export interface TasksHeaderModel {
  view: "tasks";
  taskCount: number;
  activeTaskCount: number;
  doneTaskCount: number;
}

/**
 * Discriminated union of all header models
 */
export type HeaderModel =
  | DayHeaderModel
  | WeekHeaderModel
  | ProjectsHeaderModel
  | TracksHeaderModel
  | TasksHeaderModel;
