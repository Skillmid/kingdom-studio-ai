import type { Scene, SceneCreateInput } from "@/features/scenes/types/scene";
import type { Screenplay, ScreenplayRevision } from "../types/screenplay";
import { findPersistedAnalysisRevision } from "./saved-analysis";
import type { ProposedScene } from "../types/scene-proposal";

export interface SceneExtractionSource {
  screenplayId: string;
  revisionId: string;
  screenplayVersion: number;
}

export interface ExtractedSceneInput {
  number: number;
  heading: string;
  summary: string;
  status: Scene["status"];
  progress: number;
}

export function getSceneExtractionSource(
  screenplay: Pick<Screenplay, "id" | "version"> | null,
  revisions: Array<Pick<ScreenplayRevision, "id" | "screenplayId" | "version">>,
  hasUnsavedChanges: boolean,
): SceneExtractionSource | null {
  const revision = findPersistedAnalysisRevision(screenplay, revisions, hasUnsavedChanges);
  if (!revision) return null;
  return {
    screenplayId: revision.screenplayId,
    revisionId: revision.id,
    screenplayVersion: revision.version,
  };
}

export function createRevisionBoundSceneProposals(
  drafts: ExtractedSceneInput[],
  source: SceneExtractionSource,
): Omit<ProposedScene, "clientId" | "selected">[] {
  return drafts.map((draft) => ({ ...draft, ...toSceneSourceFields(source) }));
}

export function buildApprovedSceneInput(
  proposal: ProposedScene,
  productionId: string,
  currentSource: SceneExtractionSource | null,
): SceneCreateInput {
  if (!currentSource || !matchesSceneSource(proposal, currentSource)) {
    throw new Error("The saved screenplay revision changed after scene extraction. Extract proposals again from the current saved revision.");
  }

  return {
    productionId,
    number: proposal.number,
    heading: proposal.heading,
    summary: proposal.summary.trim() || undefined,
    characterIds: [],
    status: proposal.status,
    progress: proposal.progress,
    ...toSceneSourceFields(currentSource),
  };
}

export function matchesSceneSource(
  proposal: Pick<ProposedScene, "sourceScreenplayId" | "sourceRevisionId" | "sourceScreenplayVersion">,
  source: SceneExtractionSource,
): boolean {
  return proposal.sourceScreenplayId === source.screenplayId &&
    proposal.sourceRevisionId === source.revisionId &&
    proposal.sourceScreenplayVersion === source.screenplayVersion;
}

function toSceneSourceFields(source: SceneExtractionSource) {
  return {
    sourceScreenplayId: source.screenplayId,
    sourceRevisionId: source.revisionId,
    sourceScreenplayVersion: source.screenplayVersion,
  };
}
