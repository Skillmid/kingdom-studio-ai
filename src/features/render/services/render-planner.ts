import type {
  RenderClip,
  RenderClipProposal,
  RenderSequenceProposal,
} from "../types/render";
import { withRenderProgress } from "./render-completion";

export interface RenderShotInput {
  id: string;
  sceneId?: string;
  shotNumber: number;
  shotCode?: string;
  subject?: string;
  action?: string;
  visualDescription?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  estimatedDurationSeconds?: number;
}

export interface RenderPanelInput {
  id: string;
  sceneId?: string;
  shotId?: string;
  panelNumber: number;
  title?: string;
  visualDescription?: string;
  composition?: string;
  imageUrl?: string;
  sourceEvidence?: string;
}

export interface RenderAssetInput {
  id: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  kind: string;
  title?: string;
  description?: string;
  fileUrl?: string;
  sourceKind?: string;
  sourceId?: string;
}

export interface RenderPlanContext {
  productionId: string;
  shots?: RenderShotInput[];
  panels?: RenderPanelInput[];
  assets?: RenderAssetInput[];
}

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function joinUnique(parts: Array<string | undefined>): string | undefined {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of parts) {
    const value = clean(part);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }
  return values.length > 0 ? values.join(" ") : undefined;
}

function isTimelineAsset(kind: string): boolean {
  return kind === "image" || kind === "video";
}

function mediaFromShot(
  shot: RenderShotInput,
  panels: RenderPanelInput[],
  assets: RenderAssetInput[],
): { mediaUrl?: string; panelId?: string; assetId?: string } {
  const videoAsset = assets.find((asset) => asset.shotId === shot.id && clean(asset.fileUrl) && asset.kind === "video");
  if (videoAsset?.fileUrl) {
    return { mediaUrl: clean(videoAsset.fileUrl), assetId: videoAsset.id };
  }

  const stillAsset = assets.find((asset) => asset.shotId === shot.id && clean(asset.fileUrl) && isTimelineAsset(asset.kind));
  if (stillAsset?.fileUrl) {
    return { mediaUrl: clean(stillAsset.fileUrl), assetId: stillAsset.id };
  }

  const panel = panels.find((item) => item.shotId === shot.id && clean(item.imageUrl));
  if (panel?.imageUrl) {
    return { mediaUrl: clean(panel.imageUrl), panelId: panel.id };
  }

  return {};
}

function clipFromShot(
  productionId: string,
  shot: RenderShotInput,
  sequenceNumber: number,
  panels: RenderPanelInput[],
  assets: RenderAssetInput[],
): RenderClipProposal {
  const media = mediaFromShot(shot, panels, assets);
  const evidence = joinUnique([
    shot.shotCode,
    shot.subject,
    shot.action,
    shot.visualDescription,
    shot.generationPrompt,
    shot.sourceEvidence,
  ]);
  const title = shot.shotCode || shot.subject || `Shot ${shot.shotNumber}`;

  return {
    productionId,
    sequenceNumber,
    sceneId: shot.sceneId,
    shotId: shot.id,
    panelId: media.panelId,
    assetId: media.assetId,
    title,
    description: joinUnique([shot.action, shot.visualDescription, shot.subject]),
    mediaUrl: media.mediaUrl,
    durationSeconds: shot.estimatedDurationSeconds,
    sourceKind: "shot",
    sourceId: shot.id,
    sourceEvidence: evidence,
    uncertaintyNotes: media.mediaUrl
      ? undefined
      : "No generated or uploaded media is attached to this shot. The clip is sequenced without inventing a file URL.",
    provenance: "production-derived",
    userApproved: false,
  };
}

function clipFromPanel(productionId: string, panel: RenderPanelInput, sequenceNumber: number): RenderClipProposal {
  const mediaUrl = clean(panel.imageUrl) || undefined;
  const evidence = joinUnique([panel.title, panel.visualDescription, panel.composition, panel.sourceEvidence]);

  return {
    productionId,
    sequenceNumber,
    sceneId: panel.sceneId,
    shotId: panel.shotId,
    panelId: panel.id,
    title: panel.title || `Panel ${panel.panelNumber}`,
    description: joinUnique([panel.visualDescription, panel.composition]),
    mediaUrl,
    sourceKind: "panel",
    sourceId: panel.id,
    sourceEvidence: evidence,
    uncertaintyNotes: mediaUrl
      ? undefined
      : "Storyboard panel has no image URL. The clip is listed without inventing media.",
    provenance: "production-derived",
    userApproved: false,
  };
}

function clipFromAsset(productionId: string, asset: RenderAssetInput, sequenceNumber: number): RenderClipProposal {
  const mediaUrl = clean(asset.fileUrl) || undefined;
  const evidence = joinUnique([asset.title, asset.description]);

  return {
    productionId,
    sequenceNumber,
    sceneId: asset.sceneId,
    shotId: asset.shotId,
    panelId: asset.panelId,
    assetId: asset.id,
    title: asset.title || "Production asset",
    description: asset.description,
    mediaUrl,
    sourceKind: "asset",
    sourceId: asset.id,
    sourceEvidence: evidence,
    uncertaintyNotes: mediaUrl
      ? undefined
      : "Asset is sequenced from production records but has no file URL yet.",
    provenance: "production-derived",
    userApproved: false,
  };
}

export function planRenderClipsFromProduction(context: RenderPlanContext): RenderClipProposal[] {
  const productionId = context.productionId;
  const shots = [...(context.shots ?? [])].sort((a, b) => a.shotNumber - b.shotNumber);
  const panels = [...(context.panels ?? [])].sort((a, b) => a.panelNumber - b.panelNumber);
  const assets = context.assets ?? [];
  const clips: RenderClipProposal[] = [];
  const usedPanelIds = new Set<string>();
  const usedAssetIds = new Set<string>();
  const coveredShotIds = new Set<string>();

  for (const shot of shots) {
    const clip = clipFromShot(productionId, shot, clips.length + 1, panels, assets);
    clips.push(clip);
    coveredShotIds.add(shot.id);
    if (clip.panelId) usedPanelIds.add(clip.panelId);
    if (clip.assetId) usedAssetIds.add(clip.assetId);
  }

  for (const panel of panels) {
    if (usedPanelIds.has(panel.id)) continue;
    if (panel.shotId && coveredShotIds.has(panel.shotId)) continue;
    clips.push(clipFromPanel(productionId, panel, clips.length + 1));
    usedPanelIds.add(panel.id);
  }

  for (const asset of assets) {
    if (!isTimelineAsset(asset.kind)) continue;
    if (usedAssetIds.has(asset.id)) continue;
    if (asset.shotId && coveredShotIds.has(asset.shotId)) continue;
    if (asset.panelId && usedPanelIds.has(asset.panelId)) continue;
    clips.push(clipFromAsset(productionId, asset, clips.length + 1));
    usedAssetIds.add(asset.id);
  }

  return clips;
}

export function selectNewRenderClips(
  proposals: RenderClipProposal[],
  existing: Array<Pick<RenderClip, "sourceKind" | "sourceId" | "title" | "userApproved" | "provenance">>,
): RenderClipProposal[] {
  const existingKeys = new Set(
    existing
      .filter((clip) => clip.sourceId)
      .map((clip) => `${clip.sourceKind}:${clip.sourceId}`),
  );
  const protectedTitles = new Set(
    existing
      .filter((clip) => clip.userApproved || clip.provenance === "user")
      .map((clip) => clean(clip.title).toLowerCase())
      .filter(Boolean),
  );

  return proposals.filter((proposal) => {
    if (proposal.sourceId) {
      const key = `${proposal.sourceKind}:${proposal.sourceId}`;
      if (existingKeys.has(key)) return false;
    }
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}

export function planRenderSequenceFromClips(
  productionId: string,
  clips: Array<Pick<RenderClipProposal, "mediaUrl" | "durationSeconds" | "sourceEvidence" | "uncertaintyNotes" | "title">>,
  title = "Production sequence",
): RenderSequenceProposal {
  const itemCount = clips.length;
  const readyItemCount = clips.filter((clip) => Boolean(clean(clip.mediaUrl))).length;
  const missingMediaCount = Math.max(0, itemCount - readyItemCount);
  const totalDurationSeconds = clips.reduce((sum, clip) => sum + (clip.durationSeconds ?? 0), 0);
  const sourceEvidence = joinUnique(clips.map((clip) => clip.sourceEvidence || clip.title));

  return withRenderProgress({
    productionId,
    title,
    status: "draft",
    progress: 0,
    itemCount,
    readyItemCount,
    missingMediaCount,
    totalDurationSeconds,
    uncertaintyNotes:
      itemCount === 0
        ? "No shots, panels or timeline assets are available to assemble."
        : missingMediaCount > 0
          ? `${missingMediaCount} clip${missingMediaCount === 1 ? "" : "s"} have no media URL. Sequence order is preserved without inventing files.`
          : undefined,
    sourceEvidence,
    provenance: "production-derived",
    userApproved: false,
  });
}
