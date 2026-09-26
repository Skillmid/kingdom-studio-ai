import type { Shot } from "@/features/shots/types/shot";

import type { StoryboardPanel, StoryboardPanelProposal } from "../types/storyboard-panel";
import { withCalculatedProgress } from "./storyboard-completion";

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function compositionFromShot(shot: Shot): string {
  const parts = [
    shot.framing,
    shot.shotType.replace(/-/g, " "),
    shot.cameraAngle,
    shot.cameraMovement && shot.cameraMovement !== "static" ? shot.cameraMovement : undefined,
    shot.lens,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function planPanelsFromShots(shots: Shot[]): StoryboardPanelProposal[] {
  return [...shots]
    .sort((a, b) => a.shotNumber - b.shotNumber)
    .map((shot, index) =>
      withCalculatedProgress({
        productionId: shot.productionId,
        sceneId: shot.sceneId,
        shotId: shot.id,
        panelNumber: index + 1,
        title: shot.shotCode || shot.subject || `Shot ${shot.shotNumber}`,
        visualDescription: shot.visualDescription || shot.action || shot.subject,
        composition: compositionFromShot(shot),
        continuityNotes: shot.continuityNotes,
        generationPrompt: shot.generationPrompt,
        sourceEvidence: shot.sourceEvidence || shot.visualDescription || shot.action,
        characterIds: shot.characterIds ?? [],
        locationId: shot.locationId,
        provenance: "shot-derived",
        userApproved: false,
        status: "draft",
        progress: 0,
      }),
    );
}

export function selectNewPanelProposals(
  proposals: StoryboardPanelProposal[],
  existing: Array<Pick<StoryboardPanel, "shotId" | "panelNumber" | "title" | "userApproved" | "provenance">>,
): StoryboardPanelProposal[] {
  const existingShotIds = new Set(existing.map((panel) => panel.shotId).filter(Boolean) as string[]);
  const existingNumbers = new Set(existing.map((panel) => panel.panelNumber));
  const protectedTitles = new Set(
    existing
      .filter((panel) => panel.userApproved || panel.provenance === "user")
      .map((panel) => `${panel.panelNumber}|${clean(panel.title).toLowerCase()}`),
  );

  return proposals.filter((proposal) => {
    if (proposal.shotId && existingShotIds.has(proposal.shotId)) return false;
    if (existingNumbers.has(proposal.panelNumber)) return false;
    if (protectedTitles.has(`${proposal.panelNumber}|${clean(proposal.title).toLowerCase()}`)) return false;
    return true;
  });
}
