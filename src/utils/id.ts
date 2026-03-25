/**
 * Unique ID generation utilities
 */

/**
 * Generates a unique identifier string
 * Uses crypto.randomUUID if available, otherwise falls back to a timestamp-based ID
 */
export function generateId(): string {
  // Use native crypto API if available (modern browsers)
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  return `${Date.now()}-${generateRandomString(8)}`;
}

/**
 * Generates a short ID suitable for display
 * Format: 4 alphanumeric characters
 */
export function generateShortId(): string {
  return generateRandomString(4);
}

/**
 * Generates a random alphanumeric string of specified length
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Use crypto.getRandomValues if available for better randomness
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i]! % chars.length];
    }
  } else {
    // Fallback to Math.random (less secure but functional)
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
}

/**
 * Generates a prefixed ID for specific entity types
 * Useful for debugging and identifying ID sources
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateId()}`;
}
