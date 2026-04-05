/**
 * Tests for TrackTaskPalette component - specifically for finished task exclusion functionality
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Task } from "../src/models/task";
import type { Track } from "../src/models/track";
import { isTaskDone } from "../src/models/task";

// Import to register the component
import "../src/components/track/track-task-palette";

interface ExtendedTaskPalette extends HTMLElement {
  availableTasks: readonly Task[];
  trackTasks: readonly Task[];
  track?: Track;
  updateComplete: Promise<boolean>;
}

describe("TrackTaskPalette - Regression Tests for Child Bead tomatoplan-a8d", () => {
  let component: ExtendedTaskPalette;

  // Helper to create a test task
  const createTestTask = (
    id: string,
    title: string,
    tomatoCount: number,
    finishedTomatoCount: number,
    projectId?: string,
  ): Task => {
    return {
      id,
      title,
      description: `Description for ${title}`,
      tomatoCount,
      finishedTomatoCount,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Helper to create a test track
  const createTestTrack = (
    id: string,
    title: string,
    taskIds: string[] = [],
  ): Track => {
    return {
      id,
      title,
      taskIds: [...taskIds],
      description: `Track ${title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edges: [],
      projectId: undefined,
    };
  };

  beforeEach(async () => {
    component = document.createElement(
      "track-task-palette",
    ) as ExtendedTaskPalette;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    component.remove();
  });

  describe("finished-task exclusion", () => {
    it('shows unfinished task not in track in "Available" section', async () => {
      const unfinishedTask = createTestTask("task-1", "Unfinished Task", 3, 1); // Not done: 1 < 3

      // Confirm this task is indeed not done
      expect(isTaskDone(unfinishedTask)).toBe(false);

      component.availableTasks = [unfinishedTask];
      component.track = undefined;
      component.trackTasks = [];

      await component.updateComplete;

      // Check for the "Available" section title and verify its count
      const availableSectionTitles =
        component.shadowRoot?.querySelectorAll(".section-title");
      if (!availableSectionTitles) {
        throw new Error("Could not find section titles");
      }

      // Look for the "Available" section
      const availableSection = Array.from(availableSectionTitles).find(
        (section) => section.textContent?.includes("Available"),
      );

      expect(availableSection).toBeTruthy();

      if (availableSection && availableSection.textContent) {
        // Extract the count from "Available (num)"
        const match = availableSection.textContent.match(/Available \((\d+)\)/);
        const count = match && match[1] ? parseInt(match[1], 10) : 0;
        expect(count).toBe(1); // Should be exactly 1
      }

      // Also check if the task is rendered
      expect(component.shadowRoot?.innerHTML).toContain(unfinishedTask.title);
    });

    it("does not show finished task not in track in Available section", async () => {
      const finishedTask = createTestTask("task-done", "Finished Task", 2, 2); // Done: 2 >= 2
      const unfinishedTask = createTestTask(
        "task-unfinished",
        "Unfinished Task",
        3,
        1,
      ); // Not done

      // Confirm our expectations about task completion
      expect(isTaskDone(finishedTask)).toBe(true);
      expect(isTaskDone(unfinishedTask)).toBe(false);

      component.availableTasks = [finishedTask, unfinishedTask];
      component.track = undefined;
      component.trackTasks = [];

      await component.updateComplete;

      const sectionTitles =
        component.shadowRoot?.querySelectorAll(".section-title");
      const availableSection = Array.from(sectionTitles!).find((title) =>
        title.textContent?.includes("Available"),
      );

      // The finished task should NOT appear in the available section
      expect(component.shadowRoot?.innerHTML).not.toContain(finishedTask.title);
      // The unfinished task SHOULD appear
      expect(component.shadowRoot?.innerHTML).toContain(unfinishedTask.title);

      // Count available tasks correctly (only unfinished ones count)
      expect(availableSection?.textContent).not?.toMatch(/Available \(2\)/); // Should not be 2
      expect(availableSection?.textContent).toMatch(/Available \(1\)/); // Should be 1
    });

    it("shows task already in track despite completion status", async () => {
      const doneTask = createTestTask("done-task", "Done Task", 2, 2); // Done task with 2/2
      expect(isTaskDone(doneTask)).toBe(true); // Confirm it's marked done

      const track = createTestTrack("track-1", "Test Track", [doneTask.id]);

      component.availableTasks = []; // No available tasks initially
      component.track = track;
      // But add it to trackTasks so it will display in the "In Track" section
      component.trackTasks = [doneTask];

      await component.updateComplete;

      const inTrackSectionTitles =
        component.shadowRoot?.querySelectorAll(".section-title");
      if (!inTrackSectionTitles) {
        throw new Error("Could not find section titles");
      }

      // Look for the "In Track" section
      const inTrackSectionElement = Array.from(inTrackSectionTitles).find(
        (section) => section.textContent?.includes("In Track"),
      );

      expect(inTrackSectionElement).toBeTruthy();
      if (inTrackSectionElement) {
        const elementText = inTrackSectionElement.textContent;
        if (elementText) {
          // Extract the count from the section title
          const match = elementText.match(/In Track \((\d+)\)/);
          const count = match && match[1] ? parseInt(match[1], 10) : 0;
          expect(count).toBe(1); // Verify exactly 1 task in track
        }
      }

      // The done task that's in track should still be visible in the In Track section
      expect(component.shadowRoot?.innerHTML).toContain(doneTask.title);

      // Verify there is one task with in-track class
      const taskItems = component.shadowRoot?.querySelectorAll(
        ".task-item.in-track",
      );
      expect(taskItems?.length).toBe(1);
    });

    it("filters mixed list of tasks correctly", async () => {
      // Mix of tasks: unfinished not in track, finished not in track, already in track
      const unfinishedTask = createTestTask(
        "unfinished-not-track",
        "Unfinished Not in Track",
        3,
        1,
      ); // Not done: 1/3
      const finishedTaskNotTrack = createTestTask(
        "finished-not-track",
        "Finished Not in Track",
        2,
        2,
      ); // Done: 2/2
      const inTrackTask = createTestTask(
        "in-track-task",
        "In Track Task",
        1,
        0,
      ); // Not done: 0/1

      // Confirm our expectations
      expect(isTaskDone(unfinishedTask)).toBe(false);
      expect(isTaskDone(finishedTaskNotTrack)).toBe(true);
      expect(isTaskDone(inTrackTask)).toBe(false);

      const track = createTestTrack("track-1", "Test Track", [inTrackTask.id]);

      component.availableTasks = [
        unfinishedTask,
        finishedTaskNotTrack,
        inTrackTask,
      ]; // Only those that COULD be available
      component.track = track;
      component.trackTasks = [inTrackTask]; // In track - should appear in "In Track" section

      await component.updateComplete;

      const sectionTitles =
        component.shadowRoot?.querySelectorAll(".section-title");
      if (!sectionTitles) {
        throw new Error("Could not find section titles");
      }

      // Get the sections based on content
      const inTrackSection = Array.from(sectionTitles).find((title) =>
        title.textContent?.includes("In Track"),
      );
      const availableSection = Array.from(sectionTitles).find((title) =>
        title.textContent?.includes("Available"),
      );

      expect(inTrackSection).toBeTruthy();
      expect(availableSection).toBeTruthy();

      if (inTrackSection && inTrackSection.textContent) {
        // Verify the In Track section has exactly 1 task
        const inTrackMatch =
          inTrackSection.textContent.match(/In Track \((\d+)\)/);
        const inTrackCount =
          inTrackMatch && inTrackMatch[1] ? parseInt(inTrackMatch[1], 10) : 0;
        expect(inTrackCount).toBe(1); // Should be exactly 1
      }

      if (availableSection && availableSection.textContent) {
        // Verify the Available section has exactly 1 task (the unfinished one, not the finished one)
        const availableMatch =
          availableSection.textContent.match(/Available \((\d+)\)/);
        const availableCount =
          availableMatch && availableMatch[1]
            ? parseInt(availableMatch[1], 10)
            : 0;
        expect(availableCount).toBe(1); // Should count only unfinished tasks not in track
      }

      // Available section should only contain the unfinished task not in track
      expect(component.shadowRoot?.innerHTML).not.toContain(
        finishedTaskNotTrack.title,
      ); // Excluded because it's done
      expect(component.shadowRoot?.innerHTML).toContain(unfinishedTask.title); // Included because it's not done and not in track
      expect(component.shadowRoot?.innerHTML).toContain(inTrackTask.title); // Included in "In Track" section
    });

    it('shows "No tasks available to add" when available is empty but there are tasks in track', async () => {
      const inTrackTask = createTestTask(
        "in-track-task",
        "In Track Task",
        1,
        0,
      );
      expect(isTaskDone(inTrackTask)).toBe(false);

      const track = createTestTrack("track-1", "Test Track", [inTrackTask.id]);

      // Set up the scenario where:
      // - There are tasks in track (so trackTasks has items)
      // - But the available tasks are all completed (filtered out)
      component.trackTasks = [inTrackTask]; // Task is in track
      component.track = track;
      component.availableTasks = [
        createTestTask("finished-excluded", "Finished Task", 2, 2),
      ]; // All should be filtered out as done

      // Confirm the available task is indeed done
      const firstAvailableTask = component.availableTasks[0];
      expect(isTaskDone(firstAvailableTask!)).toBe(true);

      await component.updateComplete;

      // Since no eligible available tasks exist but there are in-track tasks,
      // we should see the specific message for "no tasks to add"
      expect(component.shadowRoot?.innerHTML).toContain(
        "No tasks available to add",
      );
      expect(component.shadowRoot?.innerHTML).not.toContain(
        "No tasks available. Create a task first.",
      );
    });

    it('shows general "No tasks available..." when both available and in-track sections are effectively empty', async () => {
      component.trackTasks = [];
      component.track = createTestTrack("track-1", "Test Track", []);
      // The available tasks are all done so they will be filtered out
      const availableTasks = [
        createTestTask("excluded-1", "Excluded Task 1", 2, 2), // Finished tasks that would be filtered out
        createTestTask("excluded-2", "Excluded Task 2", 3, 3),
      ];
      availableTasks.forEach((task) => expect(isTaskDone(task)).toBe(true));
      component.availableTasks = availableTasks;

      await component.updateComplete;

      // Show the generic no tasks message when everything is excluded or empty
      // The exact message depends on whether trackTasks has content or not

      // Check if there's an empty state message. According to the logic in the component:
      // if (tasksNotInTrack.length > 0): show Available section
      // else if (tasksInTrack.length === 0): show "No tasks available. Create a task first."
      // else: show "No tasks available to add"
      const emptyTextElement =
        component.shadowRoot?.querySelector(".empty-text");
      expect(emptyTextElement).toBeTruthy();
      if (emptyTextElement) {
        // Since there are no tasks in this scenario, it should be the general message
        expect(emptyTextElement.textContent).toContain(
          "No tasks available. Create a task first.",
        );
      }
    });
  });

  describe("task rendering details", () => {
    it("renders task item with correct CSS classes and DOM for unfinished task", async () => {
      const unfinishedTask = createTestTask("test-task", "Test Task", 2, 0); // Not done: 0/2
      expect(isTaskDone(unfinishedTask)).toBe(false);

      component.availableTasks = [unfinishedTask];
      component.track = undefined;
      component.trackTasks = [];

      await component.updateComplete;

      // Find task item in available section
      const taskItems = component.shadowRoot?.querySelectorAll(".task-item");
      expect(taskItems?.length).toBe(1);

      const taskItem = taskItems![0];
      if (taskItem) {
        expect(taskItem.classList.contains("done")).toBe(false); // Should not have done class
        expect(taskItem.classList.contains("in-track")).toBe(false); // Should not have in-track class since it's in available
        expect(component.shadowRoot?.innerHTML).toContain(unfinishedTask.title);
      }
    });

    it("handles finished task correctly in In Track section", async () => {
      const finishedTask = createTestTask("done-task", "Finished Task", 2, 2); // Is done: 2/2
      expect(isTaskDone(finishedTask)).toBe(true);

      // Put the finished task "in track" so it gets around the availability filtering
      component.track = createTestTrack("track-1", "Test Track", [
        finishedTask.id,
      ]);
      component.trackTasks = [finishedTask];
      component.availableTasks = []; // Don't put it in available so it won't conflict

      await component.updateComplete;

      const taskItems = component.shadowRoot?.querySelectorAll(".task-item");
      expect(taskItems).toBeDefined();
      if (taskItems) {
        expect(taskItems.length).toBe(1);
        const taskItem = taskItems[0];
        if (taskItem) {
          expect(taskItem.classList.contains("done")).toBe(true); // Should have done class
          expect(taskItem.classList.contains("in-track")).toBe(true); // Should have in-track class
          expect(component.shadowRoot?.innerHTML).toContain(finishedTask.title);
        }
      }
    });
  });
});
