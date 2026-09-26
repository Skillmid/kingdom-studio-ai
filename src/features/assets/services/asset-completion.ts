import type { Asset, AssetProposal, AssetStatus } from "../types/asset";

const COMPLETION_FIELDS: Array<keyof Pick<Asset, "title" | "description" | "prompt" | "fileUrl" | "sourceEvidence">> = [
  "title",
  "description",
  "prompt",
  "fileUrl",
  "sourceEvidence",
];

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
}

export function calculateAssetProgress(asset: Partial<Asset> | AssetProposal): number {
  const filled = COMPLETION_FIELDS.filter((field) => hasValue(asset[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export function deriveAssetStatus(progress: number, current?: AssetStatus, hasFile?: boolean): AssetStatus {
  if (current === "generating" || current === "failed") return current;
  if (hasFile || progress >= 80) return "ready";
  return current === "ready" ? "draft" : current ?? "draft";
}

export function withCalculatedProgress<T extends Partial<Asset> | AssetProposal>(
  asset: T,
): T & { progress: number; status: AssetStatus } {
  const progress = calculateAssetProgress(asset);
  const hasFile = typeof asset.fileUrl === "string" && asset.fileUrl.trim().length > 0;
  return {
    ...asset,
    progress,
    status: deriveAssetStatus(progress, asset.status, hasFile),
  };
}
