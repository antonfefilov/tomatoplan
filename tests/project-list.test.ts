import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../src/components/project/project-list.js";
import type { ProjectList } from "../src/components/project/project-list.js";
import type { Project } from "../src/models/project.js";
import type { Task } from "../src/models/task.js";
import type { Track } from "../src/models/track.js";

import "../src/components/project/project-item.js";
import "../src/components/project/project-details.js";

describe("ProjectList", () => {
  let element: ProjectList;

  const mockProjects: Project[] = [
    {
      id: "proj-1",
      title: "Alpha",
      description: "First project",
      tomatoEstimate: 5,
      weekId: "2024-W24",
      status: "active",
      createdAt: "2024-06-10T00:00:00.000Z",
      updatedAt: "2024-06-10T00:00:00.000Z",
      color: "#ef4444",
    },
    {
      id: "proj-2",
      title: "Beta",
      tomatoEstimate: 3,
      weekId: "2024-W24",
      status: "active",
      createdAt: "2024-06-10T00:00:00.000Z",
      updatedAt: "2024-06-10T00:00:00.000Z",
      color: "#3b82f6",
    },
  ];

  const relatedTask: Task = {
    id: "task-1",
    title: "Task A",
    tomatoCount: 2,
    finishedTomatoCount: 1,
    projectId: "proj-1",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
  };

  const relatedTrack: Track = {
    id: "track-1",
    title: "Track A",
    projectId: "proj-1",
    taskIds: ["task-1"],
    edges: [],
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
  };

  beforeEach(async () => {
    element = document.createElement("project-list") as ProjectList;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders empty state when there are no projects", () => {
    const emptyTitle = element.shadowRoot!.querySelector(".empty-title");
    const emptyDescription =
      element.shadowRoot!.querySelector(".empty-description");

    expect(emptyTitle?.textContent).toBe("No projects yet");
    expect(emptyDescription?.textContent).toContain(
      "Create your first project",
    );
  });

  it("renders one project-item per project", async () => {
    element.projects = mockProjects;
    await element.updateComplete;

    const items = element.shadowRoot!.querySelectorAll("project-item");
    expect(items).toHaveLength(2);
  });

  it("passes computed project props to project-item", async () => {
    element.projects = mockProjects;
    element.taskCounts = { "proj-1": 4 };
    element.progressData = { "proj-1": { finished: 2, estimated: 5 } };
    element.mode = "planning";
    element.expandedProjectId = "proj-1";
    element.projectRelations = {
      "proj-1": { tasks: [relatedTask], tracks: [relatedTrack] },
      "proj-2": { tasks: [], tracks: [] },
    };

    await element.updateComplete;

    const firstItem = element.shadowRoot!.querySelector("project-item") as any;
    expect(firstItem.project.id).toBe("proj-1");
    expect(firstItem.taskCount).toBe(4);
    expect(firstItem.finishedTomatoes).toBe(2);
    expect(firstItem.estimatedTomatoes).toBe(5);
    expect(firstItem.mode).toBe("planning");
    expect(firstItem.expanded).toBe(true);
    expect(firstItem.relatedTasks).toEqual([relatedTask]);
    expect(firstItem.relatedTracks).toEqual([relatedTrack]);
  });

  it("uses fallback values when task/progress/relation maps are missing entries", async () => {
    element.projects = [mockProjects[1]!];
    await element.updateComplete;

    const item = element.shadowRoot!.querySelector("project-item") as any;
    expect(item.taskCount).toBe(0);
    expect(item.finishedTomatoes).toBe(0);
    expect(item.estimatedTomatoes).toBe(0);
    expect(item.relatedTasks).toEqual([]);
    expect(item.relatedTracks).toEqual([]);
  });
});
