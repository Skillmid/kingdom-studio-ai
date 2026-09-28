"use client";

import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";
import AssetCard from "./AssetCard";

interface AssetListProps {
  assets: Asset[];
  jobs: GenerationJob[];
  loading?: boolean;
  queueing?: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onApprove: (asset: Asset) => void;
  onQueue: (asset: Asset) => void;
}

export default function AssetList({
  assets,
  jobs,
  loading = false,
  queueing = false,
  onEdit,
  onDelete,
  onApprove,
  onQueue,
}: AssetListProps) {
  const latestByAsset = new Map<string, GenerationJob>();
  for (const job of jobs) {
    if (!job.assetId || latestByAsset.has(job.assetId)) continue;
    latestByAsset.set(job.assetId, job);
  }

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center">
        <h3 className="text-xl font-bold text-white">No Assets Match This View</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Plan references from characters, locations, shots, panels and direction notes, or add an asset manually.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          job={latestByAsset.get(asset.id)}
          queueing={queueing}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onQueue={onQueue}
        />
      ))}
    </div>
  );
}
