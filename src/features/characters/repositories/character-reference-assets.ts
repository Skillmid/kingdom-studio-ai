import type { Asset } from "@/features/assets/types/asset";

export function filterCharacterReferenceAssets(
  assets: Asset[],
  productionId: string,
  characterId: string,
): Asset[] {
  return assets.filter(
    (asset) =>
      asset.productionId === productionId &&
      asset.characterId === characterId &&
      asset.kind === "character-reference",
  );
}

export type CharacterReferenceLibraryState =
  | { kind: "empty" }
  | {
      kind: "assets";
      assets: Asset[];
      approvedCount: number;
      pendingCount: number;
      primaryApproved?: Asset;
    };

export function getCharacterReferenceLibraryState(
  assets: Asset[],
): CharacterReferenceLibraryState {
  if (assets.length === 0) {
    return { kind: "empty" };
  }

  const approved = assets.filter((asset) => asset.userApproved);
  const pending = assets.filter((asset) => !asset.userApproved);
  const primaryApproved = approved.find(
    (asset) => Boolean(asset.fileUrl && asset.fileUrl.trim()),
  ) ?? approved[0];

  return {
    kind: "assets",
    assets,
    approvedCount: approved.length,
    pendingCount: pending.length,
    primaryApproved,
  };
}

export interface CharacterReferenceInput {
  productionId: string;
  characterId: string;
  characterName: string;
  title?: string;
  fileUrl?: string;
  description?: string;
  prompt?: string;
  sourceEvidence?: string;
  userApproved?: boolean;
}

export function buildCharacterReferenceProposal(
  input: CharacterReferenceInput,
): Partial<Asset> {
  const cleanTitle = (input.title ?? "").trim() || `${input.characterName} Reference`;
  const cleanUrl = (input.fileUrl ?? "").trim() || undefined;
  const cleanDescription = (input.description ?? "").trim() || undefined;
  const cleanPrompt = (input.prompt ?? "").trim() || undefined;
  const cleanEvidence = (input.sourceEvidence ?? "").trim() || undefined;

  return {
    productionId: input.productionId,
    characterId: input.characterId,
    kind: "character-reference",
    title: cleanTitle,
    fileUrl: cleanUrl,
    description: cleanDescription,
    prompt: cleanPrompt,
    sourceKind: "character",
    sourceId: input.characterId,
    sourceEvidence: cleanEvidence,
    provenance: cleanUrl ? "user" : "production-derived",
    userApproved: Boolean(input.userApproved),
    status: cleanUrl ? "ready" : "draft",
    progress: cleanUrl ? 100 : 0,
  };
}

