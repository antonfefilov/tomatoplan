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
