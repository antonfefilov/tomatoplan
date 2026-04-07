import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/project/project-list-panel.js";
import type { ProjectListPanel } from "../src/components/project/project-list-panel.js";
import type { Project } from "../src/models/project.js";
import type { Task } from "../src/models/task.js";
import type { Track } from "../src/models/track.js";

import "../src/components/project/project-list.js";
import "../src/components/project/project-item.js";
import "../src/components/project/project-details.js";
import "../src/components/project/project-editor-dialog.js";

describe("ProjectListPanel", () => {
  let element: ProjectListPanel;

  const mockProject: Project = {
    id: "proj-1",
    title: "Test Project",
    description: "Project description",
    tomatoEstimate: 5,
    weekId: "2024-W24",
    status: "active",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
    color: "#ef4444",
  };

  const mockTask: Task = {
    id: "task-1",
    title: "Project Task",
    tomatoCount: 2,
    finishedTomatoCount: 1,
    projectId: "proj-1",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
  };

  const mockTrack: Track = {
    id: "track-1",
    title: "Project Track",
    projectId: "proj-1",
    taskIds: ["task-1"],
    edges: [],
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
  };

  beforeEach(async () => {
    element = document.createElement("project-list-panel") as ProjectListPanel;
    element.projects = [mockProject];
    element.tasks = [mockTask];
    element.tracks = [mockTrack];
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders mode-specific panel title", async () => {
    const title = element.shadowRoot!.querySelector(".panel-title");
    expect(title?.textContent?.trim()).toBe("All Projects");

    element.mode = "planning";
    await element.updateComplete;

    expect(title?.textContent?.trim()).toBe("Projects");
  });

  it("computes and passes project relations to project-list", () => {
    const projectList = element.shadowRoot!.querySelector(
      "project-list",
    ) as any;
    expect(projectList.projectRelations["proj-1"].tasks).toEqual([mockTask]);
    expect(projectList.projectRelations["proj-1"].tracks).toEqual([mockTrack]);
  });

  it("opens create dialog when add button is clicked", async () => {
    const addButton = element.shadowRoot!.querySelector(
      ".add-btn",
    ) as HTMLButtonElement;
    addButton.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector(
      "project-editor-dialog",
    ) as any;
    expect(dialog.open).toBe(true);
    expect(dialog.isEdit).toBe(false);
    expect(dialog.project).toBeUndefined();
  });

  it("opens edit dialog for selected project", async () => {
    const list = element.shadowRoot!.querySelector("project-list")!;
    list.dispatchEvent(
      new CustomEvent("edit-project", {
        bubbles: true,
        composed: true,
        detail: { projectId: "proj-1" },
      }),
    );
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector(
      "project-editor-dialog",
    ) as any;
    expect(dialog.open).toBe(true);
    expect(dialog.isEdit).toBe(true);
    expect(dialog.project.id).toBe("proj-1");
  });

  it("dispatches save-project and closes dialog after save", async () => {
    const saveSpy = vi.fn();
    element.addEventListener("save-project", saveSpy);

    const addButton = element.shadowRoot!.querySelector(
      ".add-btn",
    ) as HTMLButtonElement;
    addButton.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector(
      "project-editor-dialog",
    ) as HTMLElement;
    dialog.dispatchEvent(
      new CustomEvent("save", {
        bubbles: true,
        composed: true,
        detail: {
          title: "New Project",
          description: "New description",
          tomatoEstimate: 8,
          color: "#3b82f6",
        },
      }),
    );
    await element.updateComplete;

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const event = saveSpy.mock.calls[0]![0] as CustomEvent;
    expect(event.detail).toEqual({
      projectId: undefined,
      title: "New Project",
      description: "New description",
      tomatoEstimate: 8,
      color: "#3b82f6",
    });

    const updatedDialog = element.shadowRoot!.querySelector(
      "project-editor-dialog",
    ) as any;
    expect(updatedDialog.open).toBe(false);
  });

  it("forwards project plan adjustment events", async () => {
    const increaseSpy = vi.fn();
    const decreaseSpy = vi.fn();
    element.addEventListener("increase-project-plan", increaseSpy);
    element.addEventListener("decrease-project-plan", decreaseSpy);

    const list = element.shadowRoot!.querySelector("project-list")!;
    list.dispatchEvent(
      new CustomEvent("increase-project-plan", {
        bubbles: true,
        composed: true,
        detail: { projectId: "proj-1" },
      }),
    );
    list.dispatchEvent(
      new CustomEvent("decrease-project-plan", {
        bubbles: true,
        composed: true,
        detail: { projectId: "proj-1" },
      }),
    );
    await element.updateComplete;

    expect(increaseSpy).toHaveBeenCalledTimes(1);
    expect(decreaseSpy).toHaveBeenCalledTimes(1);
  });

  it("tracks a single expanded project id and toggles collapse", async () => {
    const list = element.shadowRoot!.querySelector("project-list") as any;

    list.dispatchEvent(
      new CustomEvent("toggle-project-details", {
        bubbles: true,
        composed: true,
        detail: { projectId: "proj-1" },
      }),
    );
    await element.updateComplete;
    expect(list.expandedProjectId).toBe("proj-1");

    list.dispatchEvent(
      new CustomEvent("toggle-project-details", {
        bubbles: true,
        composed: true,
        detail: { projectId: "proj-1" },
      }),
    );
    await element.updateComplete;
    expect(list.expandedProjectId).toBeUndefined();
  });
});
