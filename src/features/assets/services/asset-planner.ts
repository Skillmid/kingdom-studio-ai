import {
  formatCreativePromptDirective,
  normalizeAspectRatio,
} from "@/features/productions/services/production-creative-dna";

import type { Asset, AssetProposal } from "../types/asset";
import { withCalculatedProgress } from "./asset-completion";

export interface AssetCharacterInput {
  id: string;
  productionId?: string;
  name: string;
  appearance?: string;
  distinguishingFeatures?: string;
  hairColor?: string;
  eyeColor?: string;
  occupation?: string;
}

export interface AssetLocationInput {
  id: string;
  productionId?: string;
  name: string;
  description?: string;
  setting?: string;
  notes?: string;
}

export interface AssetShotInput {
  id: string;
  productionId?: string;
  sceneId?: string;
  shotNumber: number;
  shotCode?: string;
  shotType?: string;
  framing?: string;
  subject?: string;
  action?: string;
  visualDescription?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface AssetPanelInput {
  id: string;
  productionId?: string;
  sceneId?: string;
  shotId?: string;
  panelNumber?: number;
  title?: string;
  visualDescription?: string;
  composition?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface AssetDirectorNoteInput {
  id: string;
  productionId?: string;
  sceneId?: string;
  shotId?: string;
  panelId?: string;
  noteNumber?: number;
  title?: string;
  composition?: string;
  sceneIntent?: string;
  continuity?: string;
  sourceEvidence?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface AssetPlanContext {
  productionId: string;
  artStyle?: string | null;
  aspectRatio?: string | null;
  characters?: AssetCharacterInput[];
  locations?: AssetLocationInput[];
  shots?: AssetShotInput[];
  panels?: AssetPanelInput[];
  directorNotes?: AssetDirectorNoteInput[];
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

function characterContinuity(character: AssetCharacterInput): string | undefined {
  return joinUnique([
    character.name,
    character.appearance,
    character.distinguishingFeatures,
    character.hairColor ? `hair ${character.hairColor}` : undefined,
    character.eyeColor ? `eyes ${character.eyeColor}` : undefined,
    character.occupation,
  ]);
}

function planCharacterAsset(
  productionId: string,
  character: AssetCharacterInput,
  creativeDirective?: string,
): AssetProposal {
  const continuity = characterContinuity(character);
  const appearanceKnown = Boolean(clean(character.appearance) || clean(character.distinguishingFeatures));
  const basePrompt = continuity
    ? `Character reference still of ${continuity}. Keep wardrobe and features consistent with production records.`
    : undefined;
  const prompt = basePrompt && creativeDirective ? `${basePrompt} ${creativeDirective}` : basePrompt;

  return withCalculatedProgress({
    productionId,
    characterId: character.id,
    kind: "character-reference",
    title: `${character.name} reference`,
    description: continuity,
    prompt,
    sourceKind: "character",
    sourceId: character.id,
    sourceEvidence: continuity,
    uncertaintyNotes: appearanceKnown
      ? undefined
      : `Appearance is not established for ${character.name} beyond the recorded name.`,
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}

function planLocationAsset(
  productionId: string,
  location: AssetLocationInput,
  creativeDirective?: string,
): AssetProposal {
  const description = joinUnique([location.name, location.setting, location.description, location.notes]);
  const basePrompt = description
    ? `Location reference still of ${description}. Do not invent architecture or weather not supported by production records.`
    : undefined;
  const prompt = basePrompt && creativeDirective ? `${basePrompt} ${creativeDirective}` : basePrompt;

  return withCalculatedProgress({
    productionId,
    locationId: location.id,
    kind: "location-reference",
    title: `${location.name} reference`,
    description,
    prompt,
    sourceKind: "location",
    sourceId: location.id,
    sourceEvidence: description,
    uncertaintyNotes: clean(location.description)
      ? undefined
      : `Visual detail is sparse for ${location.name}. Keep the frame generic until the filmmaker adds description.`,
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}

function planShotAsset(
  productionId: string,
  shot: AssetShotInput,
  creativeDirective?: string,
): AssetProposal | null {
  const evidence = joinUnique([
    shot.generationPrompt,
    shot.visualDescription,
    shot.action,
    shot.subject,
    shot.sourceEvidence,
  ]);
  if (!evidence) return null;

  const title = shot.shotCode || shot.subject || `Shot ${shot.shotNumber} still`;
  const prompt = shot.generationPrompt
    ? shot.generationPrompt
    : creativeDirective
      ? `${evidence} ${creativeDirective}`
      : evidence;

  return withCalculatedProgress({
    productionId,
    sceneId: shot.sceneId,
    shotId: shot.id,
    locationId: shot.locationId,
    kind: "image",
    title,
    description: joinUnique([shot.visualDescription, shot.action, shot.subject]),
    prompt,
    sourceKind: "shot",
    sourceId: shot.id,
    sourceEvidence: evidence,
    uncertaintyNotes: shot.generationPrompt
      ? undefined
      : "Camera still is grounded only in recorded shot text. No generated file is attached.",
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}

function planPanelAsset(
  productionId: string,
  panel: AssetPanelInput,
  creativeDirective?: string,
): AssetProposal | null {
  const evidence = joinUnique([
    panel.generationPrompt,
    panel.visualDescription,
    panel.composition,
    panel.sourceEvidence,
  ]);
  if (!evidence) return null;

  const prompt = panel.generationPrompt
    ? panel.generationPrompt
    : creativeDirective
      ? `${evidence} ${creativeDirective}`
      : evidence;

  return withCalculatedProgress({
    productionId,
    sceneId: panel.sceneId,
    shotId: panel.shotId,
    panelId: panel.id,
    locationId: panel.locationId,
    kind: "image",
    title: panel.title || (panel.panelNumber ? `Panel ${panel.panelNumber} still` : "Storyboard still"),
    description: joinUnique([panel.visualDescription, panel.composition]),
    prompt,
    sourceKind: "panel",
    sourceId: panel.id,
    sourceEvidence: evidence,
    uncertaintyNotes: "No still is fabricated. A generation job must supply the file URL.",
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}

function planDirectorAsset(
  productionId: string,
  note: AssetDirectorNoteInput,
  creativeDirective?: string,
): AssetProposal | null {
  const evidence = joinUnique([note.composition, note.sceneIntent, note.continuity, note.sourceEvidence]);
  if (!evidence) return null;

  const prompt = creativeDirective ? `${evidence} ${creativeDirective}` : evidence;

  return withCalculatedProgress({
    productionId,
    sceneId: note.sceneId,
    shotId: note.shotId,
    panelId: note.panelId,
    directorNoteId: note.id,
    locationId: note.locationId,
    kind: "image",
    title: note.title || (note.noteNumber ? `Direction ${note.noteNumber} reference` : "Direction reference"),
    description: evidence,
    prompt,
    sourceKind: "director-note",
    sourceId: note.id,
    sourceEvidence: evidence,
    uncertaintyNotes: "Direction references wait for a generation job. No media URL is invented.",
    provenance: "production-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
  });
}

export function planAssetsFromProduction(context: AssetPlanContext): AssetProposal[] {
  const productionId = context.productionId;
  const creativeDirective =
    context.artStyle || context.aspectRatio
      ? formatCreativePromptDirective({
          artStyle: context.artStyle ?? null,
          aspectRatio: normalizeAspectRatio(context.aspectRatio),
        })
      : undefined;
  const proposals: AssetProposal[] = [];

  for (const character of context.characters ?? []) {
    if (!clean(character.name)) continue;
    proposals.push(planCharacterAsset(productionId, character, creativeDirective));
  }
  for (const location of context.locations ?? []) {
    if (!clean(location.name)) continue;
    proposals.push(planLocationAsset(productionId, location, creativeDirective));
  }
  for (const shot of context.shots ?? []) {
    const proposal = planShotAsset(productionId, shot, creativeDirective);
    if (proposal) proposals.push(proposal);
  }
  for (const panel of context.panels ?? []) {
    const proposal = planPanelAsset(productionId, panel, creativeDirective);
    if (proposal) proposals.push(proposal);
  }
  for (const note of context.directorNotes ?? []) {
    const proposal = planDirectorAsset(productionId, note, creativeDirective);
    if (proposal) proposals.push(proposal);
  }

  return proposals;
}

export function selectNewAssetProposals(
  proposals: AssetProposal[],
  existing: Array<Pick<Asset, "sourceKind" | "sourceId" | "title" | "kind" | "userApproved" | "provenance">>,
): AssetProposal[] {
  const existingKeys = new Set(
    existing
      .filter((asset) => asset.sourceId)
      .map((asset) => `${asset.sourceKind}:${asset.sourceId}:${asset.kind}`),
  );
  const protectedTitles = new Set(
    existing
      .filter((asset) => asset.userApproved || asset.provenance === "user")
      .map((asset) => clean(asset.title).toLowerCase())
      .filter(Boolean),
  );

  return proposals.filter((proposal) => {
    if (proposal.sourceId) {
      const key = `${proposal.sourceKind}:${proposal.sourceId}:${proposal.kind}`;
      if (existingKeys.has(key)) return false;
    }
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}
