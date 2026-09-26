import type { Asset, AssetProposal, AssetType } from "../types/asset";
import { withCalculatedAssetProgress } from "./asset-completion";

export interface AssetCharacterInput {
  id: string;
  productionId: string;
  name: string;
  appearance?: string;
  distinguishingFeatures?: string;
  hairColor?: string;
  eyeColor?: string;
}

export interface AssetLocationInput {
  id: string;
  productionId: string;
  name: string;
  description?: string;
  setting?: string;
}

export interface AssetShotInput {
  id: string;
  productionId: string;
  sceneId?: string;
  shotNumber: number;
  shotCode?: string;
  subject?: string;
  visualDescription?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface AssetPanelInput {
  id: string;
  productionId: string;
  sceneId?: string;
  shotId?: string;
  panelNumber: number;
  title?: string;
  visualDescription?: string;
  composition?: string;
  continuityNotes?: string;
  generationPrompt?: string;
  sourceEvidence?: string;
  imageUrl?: string;
  characterIds?: string[];
  locationId?: string;
}

export interface AssetPlanContext {
  characters?: AssetCharacterInput[];
  locations?: AssetLocationInput[];
  shots?: AssetShotInput[];
  panels?: AssetPanelInput[];
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
  ]);
}

export function inferJobTypeForAsset(assetType: AssetType) {
  if (assetType === "generated-video") return "video" as const;
  if (assetType === "audio") return "audio" as const;
  if (assetType === "music") return "music" as const;
  if (assetType === "document") return "document" as const;
  return "image" as const;
}

export function planAssetsFromProduction(context: AssetPlanContext): AssetProposal[] {
  const characters = context.characters ?? [];
  const locations = context.locations ?? [];
  const shots = context.shots ?? [];
  const panels = context.panels ?? [];

  const planned: AssetProposal[] = [
    ...characters.map((character) =>
      withCalculatedAssetProgress({
        productionId: character.productionId,
        characterId: character.id,
        assetNumber: 1,
        title: `${character.name} reference`,
        assetType: "character-reference" as const,
        description: characterContinuity(character),
        generationPrompt: joinUnique(["Character reference still.", characterContinuity(character)]),
        sourceEvidence: joinUnique([character.name, character.appearance]),
        continuityNotes: characterContinuity(character),
        characterIds: [character.id],
        provenance: "production-derived" as const,
        userApproved: false,
        status: "draft" as const,
        progress: 0,
      }),
    ),
    ...locations.map((location) =>
      withCalculatedAssetProgress({
        productionId: location.productionId,
        locationId: location.id,
        assetNumber: 1,
        title: `${location.name} reference`,
        assetType: "location-reference" as const,
        description: joinUnique([location.name, location.setting, location.description]),
        generationPrompt: joinUnique(["Location reference still.", location.name, location.setting, location.description]),
        sourceEvidence: joinUnique([location.name, location.description]),
        continuityNotes: joinUnique([location.name, location.setting, location.description]),
        characterIds: [],
        provenance: "production-derived" as const,
        userApproved: false,
        status: "draft" as const,
        progress: 0,
      }),
    ),
    ...shots
      .filter((shot) => clean(shot.generationPrompt) || clean(shot.visualDescription) || clean(shot.subject))
      .map((shot) =>
        withCalculatedAssetProgress({
          productionId: shot.productionId,
          sceneId: shot.sceneId,
          shotId: shot.id,
          locationId: shot.locationId,
          assetNumber: 1,
          title: shot.shotCode || shot.subject || `Shot ${shot.shotNumber} plate`,
          assetType: "shot-plate" as const,
          description: joinUnique([shot.visualDescription, shot.subject]),
          generationPrompt: shot.generationPrompt || joinUnique([shot.visualDescription, shot.subject]),
          sourceEvidence: joinUnique([shot.sourceEvidence, shot.visualDescription, shot.subject]),
          continuityNotes: joinUnique([shot.subject, shot.visualDescription]),
          characterIds: shot.characterIds ?? [],
          provenance: "production-derived" as const,
          userApproved: false,
          status: "draft" as const,
          progress: 0,
        }),
      ),
    ...panels.map((panel) =>
      withCalculatedAssetProgress({
        productionId: panel.productionId,
        sceneId: panel.sceneId,
        shotId: panel.shotId,
        panelId: panel.id,
        locationId: panel.locationId,
        assetNumber: 1,
        title: panel.title || `Panel ${panel.panelNumber} still`,
        assetType: "storyboard-still" as const,
        description: joinUnique([panel.visualDescription, panel.composition]),
        generationPrompt: panel.generationPrompt || joinUnique([panel.composition, panel.visualDescription]),
        fileUrl: panel.imageUrl,
        sourceEvidence: joinUnique([panel.sourceEvidence, panel.visualDescription]),
        continuityNotes: panel.continuityNotes,
        characterIds: panel.characterIds ?? [],
        provenance: "production-derived" as const,
        userApproved: false,
        status: "draft" as const,
        progress: 0,
      }),
    ),
  ];

  return planned.map((asset, index) => ({ ...asset, assetNumber: index + 1 }));
}

function sourceKey(
  asset: Pick<AssetProposal | Asset, "assetType" | "characterId" | "locationId" | "shotId" | "panelId">,
): string | undefined {
  if (asset.assetType === "character-reference" && asset.characterId) return `character:${asset.characterId}`;
  if (asset.assetType === "location-reference" && asset.locationId) return `location:${asset.locationId}`;
  if (asset.assetType === "shot-plate" && asset.shotId) return `shot:${asset.shotId}`;
  if (asset.assetType === "storyboard-still" && asset.panelId) return `panel:${asset.panelId}`;
  return undefined;
}

export function selectNewAssetProposals(
  proposals: AssetProposal[],
  existing: Array<
    Pick<Asset, "assetType" | "characterId" | "locationId" | "shotId" | "panelId" | "title" | "userApproved" | "provenance">
  >,
): AssetProposal[] {
  const existingKeys = new Set(
    existing.map((asset) => sourceKey(asset)).filter((key): key is string => Boolean(key)),
  );
  const protectedTitles = new Set(
    existing
      .filter((asset) => asset.userApproved || asset.provenance === "user")
      .map((asset) => clean(asset.title).toLowerCase())
      .filter(Boolean),
  );

  return proposals.filter((proposal) => {
    const key = sourceKey(proposal);
    if (key && existingKeys.has(key)) return false;
    const title = clean(proposal.title).toLowerCase();
    if (title && protectedTitles.has(title)) return false;
    return true;
  });
}
