import type { Scene, SceneCreateInput } from "@/features/scenes/types/scene";
import type { ParsedScreenplayScene } from "@/features/import-engine/types/parsed-screenplay-document";
import type { Screenplay, ScreenplayRevision } from "../types/screenplay";
import { findPersistedAnalysisRevision } from "./saved-analysis";
import type { ProposedScene } from "../types/scene-proposal";
import { resolveSceneLinks, type SceneLinkContext } from "@/features/scenes/services/scene-linking";

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
  sceneType?: Scene["sceneType"];
  timeOfDay?: string;
  action?: string;
  dialogue?: string;
  sourceText?: string;
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
  parsedScenes: ParsedScreenplayScene[] = [],
): Omit<ProposedScene, "clientId" | "selected">[] {
  const parsedByHeading = new Map(
    parsedScenes.map((scene) => [normaliseHeading(scene.heading), scene]),
  );

  return drafts.map((draft) => {
    const parsed = parsedByHeading.get(normaliseHeading(draft.heading));
    return {
      ...draft,
      sceneType: parsed?.sceneType ?? parseSceneType(draft.heading),
      timeOfDay: parsed?.timeOfDay,
      action: parsed?.action,
      dialogue: parsed?.dialogue,
      sourceText: parsed?.sourceText,
      ...toSceneSourceFields(source),
    };
  });
}

export function buildApprovedSceneInput(
  proposal: ProposedScene,
  productionId: string,
  currentSource: SceneExtractionSource | null,
  linkContext?: SceneLinkContext,
): SceneCreateInput {
  if (!currentSource || !matchesSceneSource(proposal, currentSource)) {
    throw new Error("The saved screenplay revision changed after scene extraction. Extract proposals again from the current saved revision.");
  }

  return {
    productionId,
    number: proposal.number,
    heading: proposal.heading,
    sceneType: proposal.sceneType,
    timeOfDay: proposal.timeOfDay,
    summary: proposal.summary.trim() || undefined,
    action: proposal.action?.trim() || undefined,
    dialogue: proposal.dialogue?.trim() || undefined,
    sourceText: proposal.sourceText?.trim() || undefined,
    // Same deterministic linking as "Sync from screenplay" (no links when no context is given).
    ...linksFor(proposal, linkContext),
    status: proposal.status,
    progress: proposal.progress,
    ...toSceneSourceFields(currentSource),
  };
}

function linksFor(proposal: ProposedScene, linkContext?: SceneLinkContext): Pick<SceneCreateInput, "characterIds" | "locationId"> {
  if (!linkContext) return { characterIds: [] };
  const links = resolveSceneLinks(
    {
      heading: proposal.heading,
      sourceText: proposal.sourceText,
      fallbackText: [proposal.summary, proposal.action, proposal.dialogue],
    },
    linkContext,
  );
  return links.locationId ? { characterIds: links.characterIds, locationId: links.locationId } : { characterIds: links.characterIds };
}

export function matchesSceneSource(
  proposal: Pick<ProposedScene, "sourceScreenplayId" | "sourceRevisionId" | "sourceScreenplayVersion">,
  source: SceneExtractionSource,
): boolean {
  return proposal.sourceScreenplayId === source.screenplayId &&
    proposal.sourceRevisionId === source.revisionId &&
    proposal.sourceScreenplayVersion === source.screenplayVersion;
}

function normaliseHeading(heading: string): string {
  return heading.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseSceneType(heading: string): Scene["sceneType"] | undefined {
  const prefix = heading.trim().match(/^(INT\.\/EXT\.|EXT\.\/INT\.|INT\.|EXT\.)/i)?.[1];
  if (!prefix) return undefined;
  return prefix.toUpperCase().includes("/") ? "BOTH" : prefix.startsWith("EXT") ? "EXT" : "INT";
}

function toSceneSourceFields(source: SceneExtractionSource) {
  return {
    sourceScreenplayId: source.screenplayId,
    sourceRevisionId: source.revisionId,
    sourceScreenplayVersion: source.screenplayVersion,
  };
}
