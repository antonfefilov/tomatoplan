/**
 * Utils index - re-exports all utility functions
 */

export { generateId, generateShortId, generatePrefixedId } from "./id.js";

export type { ValidationResult } from "./validation.js";
export {
  validateDailyCapacity,
  canAssignTomato,
  canUnassignTomato,
  validateTomatoCount,
  canSetTomatoCount,
  validateTaskTitle,
  combineValidations,
} from "./validation.js";
