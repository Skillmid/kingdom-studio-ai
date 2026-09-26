import type { Shot, ShotProposal, ShotStatus } from "../types/shot";

const COMPLETION_FIELDS: Array<
  keyof Pick<
    Shot,
    | "shotType"
    | "framing"
    | "cameraAngle"
    | "cameraMovement"
    | "lens"
    | "subject"
    | "action"
    | "dialogueReference"
    | "visualDescription"
    | "continuityNotes"
    | "generationPrompt"
  >
> = [
  "shotType",
  "framing",
  "cameraAngle",
  "cameraMovement",
  "lens",
  "subject",
  "action",
  "dialogueReference",
  "visualDescription",
  "continuityNotes",
  "generationPrompt",
];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateShotProgress(shot: Partial<Shot> | ShotProposal): number {
  const filled = COMPLETION_FIELDS.filter((field) => hasValue(shot[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export function deriveShotStatus(progress: number, current?: ShotStatus): ShotStatus {
  if (progress >= 80) return "completed";
  if (progress >= 30) return "in-progress";
  return current === "completed" ? "in-progress" : current ?? "draft";
}

export function withCalculatedProgress<T extends Partial<Shot> | ShotProposal>(shot: T): T {
  const progress = calculateShotProgress(shot);
  return {
    ...shot,
    progress,
    status: deriveShotStatus(progress, shot.status),
  };
}
