/**
 * HeaderModel - Discriminated union type for view-specific header content
 */

/**
 * Header model for Day view
 */
export interface DayHeaderModel {
  view: "day";
  date: string;
  dayStart: string;
  dayEnd: string;
  capacityInMinutes: number;
  showReset: boolean;
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
 * Discriminated union of all header models
 */
export type HeaderModel =
  | DayHeaderModel
  | WeekHeaderModel
  | ProjectsHeaderModel
  | TracksHeaderModel;
