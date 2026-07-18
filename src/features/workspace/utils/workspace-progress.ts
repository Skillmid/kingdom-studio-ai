import type {
  WorkspaceSection,
} from "../types/workspace";

export function calculateWorkspaceProgress(
  sections: WorkspaceSection[]
) {
  if (sections.length === 0) {
    return 0;
  }

  const completed =
    sections.filter(
      (section) => section.completed
    ).length;

  return Math.round(
    (completed / sections.length) * 100
  );
}