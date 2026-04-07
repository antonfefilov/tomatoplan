import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "../src/components/project/project-editor-dialog.js";
import type { ProjectEditorDialog } from "../src/components/project/project-editor-dialog.js";
import type { Project } from "../src/models/project.js";
import { PROJECT_COLORS } from "../src/models/project.js";

describe("ProjectEditorDialog", () => {
  let element: ProjectEditorDialog;

  const mockProject: Project = {
    id: "proj-1",
    title: "Existing Project",
    description: "Existing description",
    tomatoEstimate: 12,
    weekId: "2024-W24",
    status: "active",
    createdAt: "2024-06-10T00:00:00.000Z",
    updatedAt: "2024-06-10T00:00:00.000Z",
    color: "#3b82f6",
  };

  beforeEach(async () => {
    element = document.createElement(
      "project-editor-dialog",
    ) as ProjectEditorDialog;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders closed by default", () => {
    const backdrop = element.shadowRoot!.querySelector(".backdrop");
    expect(backdrop?.classList.contains("open")).toBe(false);
  });

  it("prefills fields in edit mode when opened with a project", async () => {
    element.project = mockProject;
    element.isEdit = true;
    element.open = true;
    await element.updateComplete;
    await element.updateComplete;

    const titleInput = element.shadowRoot!.querySelector(
      "#title-input",
    ) as HTMLInputElement;
    const descriptionInput = element.shadowRoot!.querySelector(
      "#description-input",
    ) as HTMLTextAreaElement;
    const estimateInput = element.shadowRoot!.querySelector(
      "#estimate-input",
    ) as HTMLInputElement;
    const title = element.shadowRoot!.querySelector(".dialog-title");

    expect(title?.textContent?.trim()).toBe("Edit Project");
    expect(titleInput.value).toBe("Existing Project");
    expect(descriptionInput.value).toBe("Existing description");
    expect(estimateInput.value).toBe("12");
  });

  it("validates required title and prevents save", async () => {
    element.open = true;
    await element.updateComplete;

    const saveSpy = vi.fn();
    element.addEventListener("save", saveSpy);

    const titleInput = element.shadowRoot!.querySelector(
      "#title-input",
    ) as HTMLInputElement;
    titleInput.value = "   ";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));

    const form = element.shadowRoot!.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await element.updateComplete;

    const error = element.shadowRoot!.querySelector(".error-message");
    expect(error?.textContent).toBe("Project title is required");
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("emits trimmed save payload with selected color", async () => {
    element.maxEstimate = 20;
    element.open = true;
    await element.updateComplete;

    const saveSpy = vi.fn();
    element.addEventListener("save", saveSpy);

    const titleInput = element.shadowRoot!.querySelector(
      "#title-input",
    ) as HTMLInputElement;
    titleInput.value = "  New Project  ";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));

    const descriptionInput = element.shadowRoot!.querySelector(
      "#description-input",
    ) as HTMLTextAreaElement;
    descriptionInput.value = "  Some details  ";
    descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));

    const estimateInput = element.shadowRoot!.querySelector(
      "#estimate-input",
    ) as HTMLInputElement;
    estimateInput.value = "99";
    estimateInput.dispatchEvent(new Event("input", { bubbles: true }));

    const colorButtons = element.shadowRoot!.querySelectorAll(
      ".color-option",
    ) as NodeListOf<HTMLButtonElement>;
    colorButtons[2]!.click();

    const form = element.shadowRoot!.querySelector("form")!;
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const event = saveSpy.mock.calls[0]![0] as CustomEvent;
    expect(event.detail).toEqual({
      projectId: undefined,
      title: "New Project",
      description: "Some details",
      tomatoEstimate: 20,
      color: PROJECT_COLORS[2],
    });
  });

  it("emits cancel from cancel button, backdrop click, and Escape", async () => {
    element.open = true;
    await element.updateComplete;

    const cancelSpy = vi.fn();
    element.addEventListener("cancel", cancelSpy);

    const cancelButton = element.shadowRoot!.querySelector(
      ".btn-cancel",
    ) as HTMLButtonElement;
    cancelButton.click();

    const backdrop = element.shadowRoot!.querySelector(".backdrop")!;
    backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    backdrop.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(cancelSpy).toHaveBeenCalledTimes(3);
  });
});
