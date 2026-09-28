import type { Screenplay, ScreenplayRevision } from "../types/screenplay";

export function findPersistedAnalysisRevision(
  screenplay: Pick<Screenplay, "id" | "version"> | null,
  revisions: Array<Pick<ScreenplayRevision, "id" | "screenplayId" | "version">>,
  hasUnsavedChanges: boolean,
): Pick<ScreenplayRevision, "id" | "screenplayId" | "version"> | null {
  if (!screenplay || hasUnsavedChanges) return null;
  return revisions.find((revision) =>
    revision.screenplayId === screenplay.id && revision.version === screenplay.version,
  ) ?? null;
}
