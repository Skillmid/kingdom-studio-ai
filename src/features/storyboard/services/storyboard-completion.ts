import type { StoryboardPanel, StoryboardPanelProposal, StoryboardStatus } from "../types/storyboard-panel";

const COMPLETION_FIELDS: Array<
  keyof Pick<
    StoryboardPanel,
    "title" | "visualDescription" | "composition" | "continuityNotes" | "generationPrompt" | "imageUrl"
  >
> = ["title", "visualDescription", "composition", "continuityNotes", "generationPrompt", "imageUrl"];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateStoryboardProgress(
  panel: Partial<StoryboardPanel> | StoryboardPanelProposal,
): number {
  const filled = COMPLETION_FIELDS.filter((field) => hasValue(panel[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export function deriveStoryboardStatus(progress: number, current?: StoryboardStatus): StoryboardStatus {
  if (progress >= 80) return "completed";
  if (progress >= 30) return "in-progress";
  return current === "completed" ? "in-progress" : current ?? "draft";
}

export function withCalculatedProgress<T extends Partial<StoryboardPanel> | StoryboardPanelProposal>(
  panel: T,
): T & { progress: number; status: StoryboardStatus } {
  const progress = calculateStoryboardProgress(panel);
  return {
    ...panel,
    progress,
    status: deriveStoryboardStatus(progress, panel.status),
  };
}
