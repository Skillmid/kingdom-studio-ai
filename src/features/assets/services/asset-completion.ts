import type { Asset, AssetProposal, AssetStatus } from "../types/asset";

const COMPLETION_FIELDS: Array<
  keyof Pick<
    Asset,
    "title" | "assetType" | "description" | "generationPrompt" | "fileUrl" | "continuityNotes"
  >
> = ["title", "assetType", "description", "generationPrompt", "fileUrl", "continuityNotes"];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateAssetProgress(asset: Partial<Asset> | AssetProposal): number {
  const filled = COMPLETION_FIELDS.filter((field) => hasValue(asset[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export function deriveAssetStatus(progress: number, current?: AssetStatus): AssetStatus {
  if (progress >= 80) return "completed";
  if (progress >= 30) return "in-progress";
  return current === "completed" ? "in-progress" : current ?? "draft";
}

export function withCalculatedAssetProgress<T extends Partial<Asset> | AssetProposal>(
  asset: T,
): T & { progress: number; status: AssetStatus } {
  const progress = calculateAssetProgress(asset);
  return {
    ...asset,
    progress,
    status: deriveAssetStatus(progress, asset.status),
  };
}
