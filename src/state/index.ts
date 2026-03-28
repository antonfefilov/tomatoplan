/**
 * State management index - re-exports store and persistence
 */

export { plannerStore, PlannerStore } from "./planner-store.js";
export type { Subscriber, Unsubscribe } from "./planner-store.js";

export {
  saveState,
  loadState,
  clearState,
  exportState,
  importState,
  hasPersistedState,
} from "./persistence.js";

export { timerStore, TimerStore } from "./timer-store.js";
export type { TimerSubscriber, TimerUnsubscribe } from "./timer-store.js";

// Export coordinated project actions
export { removeProject } from "./project-coordinator.js";
