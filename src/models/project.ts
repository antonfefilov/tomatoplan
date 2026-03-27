/**
 * Project model for weekly project planning
 * Represents a project that spans a week and can contain multiple tasks
 */

/** Project status */
export type ProjectStatus = "active" | "completed" | "archived";

/** Predefined colors for projects */
export const PROJECT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export interface Project {
  /** Unique identifier for the project */
  readonly id: string;

  /** Project title/name */
  title: string;

  /** Optional project description */
  description?: string;

  /** Estimated tomatoes for this project */
  tomatoEstimate: number;

  /** Color for visual distinction */
  color?: ProjectColor;

  /** Week ID in YYYY-Www format (ISO 8601 week) */
  weekId: string;

  /** Project status */
  status: ProjectStatus;

  /** When the project was created */
  readonly createdAt: string; // ISO 8601 date string

  /** When the project was last updated */
  updatedAt: string; // ISO 8601 date string
}

/**
 * Gets the ISO week year and week number for a given date
 * ISO 8601: Week starts Monday, Week 1 contains first Thursday of year
 */
function getISOWeekParts(date: Date): { isoWeekYear: number; isoWeek: number } {
  // Use UTC consistently to avoid timezone issues
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay() || 7; // Convert Sunday (0) to 7, so Monday=1...Sunday=7

  // Move to Thursday of this week (this is the reference day for ISO week year)
  d.setUTCDate(d.getUTCDate() + 4 - day);

  const isoWeekYear = d.getUTCFullYear();

  // Find January 4th of the ISO week year (which is always in week 1)
  const jan4 = new Date(Date.UTC(isoWeekYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Monday=1...Sunday=7

  // Week 1 starts on the Monday of the week containing Jan 4
  const week1Start = new Date(
    Date.UTC(isoWeekYear, 0, 4 - jan4Day + 1, 0, 0, 0, 0),
  );

  // Calculate week number: days since week 1 start, divided by 7, rounded up
  const weekNumber = Math.ceil(((+d - +week1Start) / 86400000 + 1) / 7);

  return { isoWeekYear, isoWeek: weekNumber };
}

/**
 * Gets the ISO 8601 week ID for a given date
 * Format: YYYY-Www (e.g., "2020-W53")
 * ISO 8601: Week starts Monday, Week 1 contains first Thursday of year
 */
export function getWeekId(date: Date): string {
  const { isoWeekYear, isoWeek } = getISOWeekParts(date);
  return `${isoWeekYear}-W${isoWeek.toString().padStart(2, "0")}`;
}

/**
 * Gets the current week ID
 */
export function getCurrentWeekId(): string {
  return getWeekId(new Date());
}

/**
 * Gets the Monday of the week containing the given date
 * ISO week starts on Monday
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Convert Sunday (0) to 7 for ISO calculation
  const diff = d.getUTCDate() - ((day === 0 ? 7 : day) - 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the Sunday of the week containing the given date
 * ISO week ends on Sunday
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Gets the date string (YYYY-MM-DD) from a Date
 */
export function getDateString(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Creates a new project with default values
 */
export function createProject(
  id: string,
  title: string,
  weekId: string,
  options?: {
    description?: string;
    tomatoEstimate?: number;
    color?: ProjectColor;
  },
): Project {
  const now = new Date().toISOString();
  return {
    id,
    title: title.trim(),
    description: options?.description?.trim(),
    tomatoEstimate: options?.tomatoEstimate ?? 0,
    color: options?.color,
    weekId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates a project's properties and sets the updatedAt timestamp
 */
export function updateProject(
  project: Project,
  updates: Partial<
    Pick<
      Project,
      "title" | "description" | "tomatoEstimate" | "color" | "status"
    >
  >,
): Project {
  return {
    ...project,
    ...updates,
    title: updates.title?.trim() ?? project.title,
    description:
      "description" in updates
        ? (updates.description ?? "").trim() || undefined
        : project.description,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks a project as completed
 */
export function completeProject(project: Project): Project {
  return {
    ...project,
    status: "completed",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marks a project as archived
 */
export function archiveProject(project: Project): Project {
  return {
    ...project,
    status: "archived",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Checks if a project is active
 */
export function isProjectActive(project: Project): boolean {
  return project.status === "active";
}

/**
 * Checks if a project is completed
 */
export function isProjectCompleted(project: Project): boolean {
  return project.status === "completed";
}

/**
 * Gets a random color for a new project
 */
export function getRandomProjectColor(): ProjectColor {
  const index = Math.floor(Math.random() * PROJECT_COLORS.length);
  return PROJECT_COLORS[index]!;
}

/**
 * Gets the next color in sequence for a new project
 * Uses the project count to determine which color to use
 */
export function getNextProjectColor(existingCount: number): ProjectColor {
  return PROJECT_COLORS[existingCount % PROJECT_COLORS.length]!;
}
