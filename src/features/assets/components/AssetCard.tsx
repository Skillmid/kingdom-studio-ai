"use client";

import type { Asset, AssetStatus } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";
import { canGenerateAsset } from "../services/generation-job";

interface AssetCardProps {
  asset: Asset;
  job?: GenerationJob;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onApprove: (asset: Asset) => void;
  onQueue: (asset: Asset) => void;
  queueing?: boolean;
}

function statusClass(status: AssetStatus) {
  switch (status) {
    case "ready":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "generating":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
}

export default function AssetCard({
  asset,
  job,
  onEdit,
  onDelete,
  onApprove,
  onQueue,
  queueing = false,
}: AssetCardProps) {
  const progress = Math.max(0, Math.min(100, asset.progress));
  const canQueue = canGenerateAsset(asset) && asset.status !== "generating";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/75 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-500/35">
      <div className="border-b border-zinc-800/80 bg-black/20 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">
                {asset.kind.replace(/-/g, " ")}
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                {asset.sourceKind.replace(/-/g, " ")}
              </span>
              {asset.userApproved ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Approved</span>
              ) : null}
            </div>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white">
              {asset.title || asset.kind}
            </h3>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(asset.status)}`}>
            {asset.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
          {asset.description || asset.prompt || "No grounded description yet."}
        </p>
        {asset.uncertaintyNotes ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-200">
            {asset.uncertaintyNotes}
          </p>
        ) : null}
        {asset.fileUrl ? (
          <p className="break-all text-xs text-emerald-400">{asset.fileUrl}</p>
        ) : (
          <p className="text-xs text-zinc-600">No media URL. Generation never invents one.</p>
        )}
        {job ? (
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            Last job {job.status}
            {job.provider ? ` · ${job.provider}` : ""}
            {job.errorMessage ? ` · ${job.errorMessage}` : ""}
          </p>
        ) : null}
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-zinc-600">
            <span>Completion</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(asset)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-yellow-500/40 hover:text-white"
          >
            Edit
          </button>
          {!asset.userApproved ? (
            <button
              type="button"
              onClick={() => onApprove(asset)}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15"
            >
              Approve
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canQueue || queueing}
            onClick={() => onQueue(asset)}
            className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {asset.status === "generating" ? "Generating..." : asset.userApproved ? "Queue generation" : "Approve asset first"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(asset)}
            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
