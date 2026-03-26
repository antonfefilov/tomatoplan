/**
 * Time formatting utilities
 */

/**
 * Formats minutes into human-readable time estimation
 * Returns strings like "25m", "1h 30m", "2h", etc.
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Parses an HH:MM time string to minutes from midnight
 * Returns null if the format is invalid
 */
export function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);

  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight to HH:MM string
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 0 || minutes >= 24 * 60) {
    // Handle out of range by clamping
    const clamped = Math.max(0, Math.min(24 * 60 - 1, minutes));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculates the number of minutes between two times
 * Returns a positive number if end > start, negative otherwise
 */
export function getMinutesBetween(start: string, end: string): number | null {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null) return null;

  return endMinutes - startMinutes;
}

/**
 * Calculates the daily capacity based on time range and tomato duration
 * Returns floor((dayEnd - dayStart) / capacityInMinutes)
 */
export function calculateDailyCapacityFromSchedule(
  dayStart: string,
  dayEnd: string,
  capacityInMinutes: number,
): number {
  const minutesBetween = getMinutesBetween(dayStart, dayEnd);

  if (minutesBetween === null || minutesBetween <= 0) {
    return 0;
  }

  if (capacityInMinutes <= 0) {
    return 0;
  }

  return Math.floor(minutesBetween / capacityInMinutes);
}

/**
 * Validates an HH:MM time string
 */
export function isValidTimeString(time: string): boolean {
  return parseTimeToMinutes(time) !== null;
}
