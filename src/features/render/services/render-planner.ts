import type { Asset } from "@/features/assets/types/asset";
import type { Shot } from "@/features/shots/types/shot";
import type { StoryboardPanel } from "@/features/storyboard/types/storyboard-panel";
import type { RenderClip, RenderClipProposal, RenderSequenceProposal } from "../types/render";
import { withRenderProgress } from "./render-completion";

export interface RenderPlanContext {
  productionId: string;
  shots?: Shot[];
  panels?: StoryboardPanel[];
  assets?: Asset[];
}

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function planRenderClipsFromProduction(context: RenderPlanContext): RenderClipProposal[] {
  const clips: RenderClipProposal[] = [];
  const usedPanelIds = new Set<string>();
  const usedAssetIds = new Set<string>();
  let sequenceNumber = 1;
  for (const shot of [...(context.shots ?? [])].sort((a, b) => a.shotNumber - b.shotNumber)) {
    const linkedPanel = (context.panels ?? []).find((panel) => panel.shotId === shot.id);
    const linkedAsset = (context.assets ?? []).find((asset) => asset.shotId === shot.id && (asset.kind === "image" || asset.kind === "video") && asset.fileUrl);
    const mediaUrl = linkedAsset?.fileUrl?.trim() || linkedPanel?.imageUrl?.trim() || undefined;
    if (linkedPanel) usedPanelIds.add(linkedPanel.id);
    if (linkedAsset) usedAssetIds.add(linkedAsset.id);
    clips.push({
      productionId: context.productionId,
      sequenceNumber: sequenceNumber++,
      sceneId: shot.sceneId,
      shotId: shot.id,
      panelId: linkedPanel?.id,
      assetId: linkedAsset?.id,
      title: shot.shotCode || shot.subject || `Shot ${shot.shotNumber}`,
      description: clean(shot.visualDescription || shot.action),
      mediaUrl,
      durationSeconds: shot.estimatedDurationSeconds,
      sourceKind: "shot",
      sourceId: shot.id,
      sourceEvidence: clean(shot.sourceEvidence || shot.visualDescription || shot.action || shot.generationPrompt),
      uncertaintyNotes: mediaUrl ? undefined : "No media URL is attached. A file is copied only from an existing asset or panel URL.",
      provenance: "production-derived",
      userApproved: false,
    });
  }
  for (const panel of [...(context.panels ?? [])].sort((a, b) => a.panelNumber - b.panelNumber)) {
    if (usedPanelIds.has(panel.id)) continue;
    const linkedAsset = (context.assets ?? []).find((asset) => asset.panelId === panel.id && (asset.kind === "image" || asset.kind === "video") && asset.fileUrl);
    if (linkedAsset) usedAssetIds.add(linkedAsset.id);
    const mediaUrl = linkedAsset?.fileUrl?.trim() || panel.imageUrl?.trim() || undefined;
    clips.push({
      productionId: context.productionId,
      sequenceNumber: sequenceNumber++,
      sceneId: panel.sceneId,
      shotId: panel.shotId,
      panelId: panel.id,
      assetId: linkedAsset?.id,
      title: panel.title || `Panel ${panel.panelNumber}`,
      description: clean(panel.visualDescription || panel.composition),
      mediaUrl,
      sourceKind: "panel",
      sourceId: panel.id,
      sourceEvidence: clean(panel.sourceEvidence || panel.visualDescription || panel.generationPrompt),
      uncertaintyNotes: mediaUrl ? undefined : "Leftover storyboard panel has no copied media URL.",
      provenance: "production-derived",
      userApproved: false,
    });
  }
  for (const asset of context.assets ?? []) {
    if (usedAssetIds.has(asset.id) || (asset.kind !== "image" && asset.kind !== "video")) continue;
    clips.push({
      productionId: context.productionId,
      sequenceNumber: sequenceNumber++,
      sceneId: asset.sceneId,
      shotId: asset.shotId,
      panelId: asset.panelId,
      assetId: asset.id,
      title: asset.title || asset.kind,
      description: clean(asset.description),
      mediaUrl: asset.fileUrl?.trim() || undefined,
      sourceKind: "asset",
      sourceId: asset.id,
      sourceEvidence: clean(asset.sourceEvidence || asset.prompt),
      uncertaintyNotes: asset.fileUrl?.trim() ? undefined : "Image/video asset has no file URL to copy.",
      provenance: "production-derived",
      userApproved: false,
    });
  }
  return clips;
}

export function selectNewRenderClips(
  proposals: RenderClipProposal[],
  existing: Array<Pick<RenderClip, "sourceKind" | "sourceId" | "title" | "userApproved" | "provenance">>,
): RenderClipProposal[] {
  const existingKeys = new Set(existing.filter((clip) => clip.sourceId).map((clip) => `${clip.sourceKind}:${clip.sourceId}`));
  const protectedTitles = new Set(existing.filter((clip) => clip.userApproved || clip.provenance === "user").map((clip) => clean(clip.title).toLowerCase()).filter(Boolean));
  return proposals.filter((proposal) => {
    if (proposal.sourceId && existingKeys.has(`${proposal.sourceKind}:${proposal.sourceId}`)) return false;
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}

export function planRenderSequenceFromClips(
  productionId: string,
  clips: Array<Pick<RenderClipProposal, "mediaUrl" | "durationSeconds" | "sourceEvidence">>,
  title?: string,
): RenderSequenceProposal {
  const itemCount = clips.length;
  const readyItemCount = clips.filter((clip) => Boolean(clip.mediaUrl?.trim())).length;
  return withRenderProgress({
    productionId,
    title: title || "Assembly sequence",
    itemCount,
    readyItemCount,
    missingMediaCount: Math.max(0, itemCount - readyItemCount),
    totalDurationSeconds: clips.reduce((sum, clip) => sum + (clip.durationSeconds ?? 0), 0),
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}
