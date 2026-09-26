import type {
  DirectorNote,
  DirectorNoteProposal,
  DirectorNoteStatus,
} from "../types/director-note";

const COMPLETION_FIELDS: Array<
  keyof Pick<
    DirectorNote,
    | "title"
    | "sceneIntent"
    | "blocking"
    | "camera"
    | "composition"
    | "lighting"
    | "pacing"
    | "sound"
    | "emotionalProgression"
    | "continuity"
    | "visualStorytelling"
  >
> = [
  "title",
  "sceneIntent",
  "blocking",
  "camera",
  "composition",
  "lighting",
  "pacing",
  "sound",
  "emotionalProgression",
  "continuity",
  "visualStorytelling",
];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateDirectorNoteProgress(
  note: Partial<DirectorNote> | DirectorNoteProposal,
): number {
  const filled = COMPLETION_FIELDS.filter((field) => hasValue(note[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export function deriveDirectorNoteStatus(
  progress: number,
  current?: DirectorNoteStatus,
): DirectorNoteStatus {
  if (progress >= 80) return "completed";
  if (progress >= 30) return "in-progress";
  return current === "completed" ? "in-progress" : current ?? "draft";
}

export function withCalculatedProgress<T extends Partial<DirectorNote> | DirectorNoteProposal>(
  note: T,
): T & { progress: number; status: DirectorNoteStatus } {
  const progress = calculateDirectorNoteProgress(note);
  return {
    ...note,
    progress,
    status: deriveDirectorNoteStatus(progress, note.status),
  };
}
