"use client";

import { useEffect, useState } from "react";
import { assetRepository } from "../repositories/asset.repository";
import { generationJobRepository } from "../repositories/generation-job.repository";
import { draftJobFromAsset } from "../services/generation-job";
import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";

export function AssetsView({ productionId }: { productionId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    assetRepository.getByProductionId(productionId).then((rows) => {
      if (!cancelled) setAssets(rows);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load assets.");
    });
    return () => {
      cancelled = true;
    };
  }, [productionId]);

  async function generate(asset: Asset) {
    setWorking(true);
    setError(null);
    try {
      const queued = await generationJobRepository.create({ ...draftJobFromAsset(asset), productionId });
      const response = await fetch("/api/generation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: queued }),
      });
      const payload = (await response.json()) as { job?: GenerationJob; error?: string };
      if (!response.ok || !payload.job) throw new Error(payload.error || "Generation failed.");
      if (payload.job.outputUrl) {
        const updated = await assetRepository.update(asset.id, { fileUrl: payload.job.outputUrl, status: "ready" });
        setAssets((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      setNotice(payload.job.errorMessage || payload.job.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-black text-white">Assets</h1>
      <p className="text-sm text-zinc-400">Generation copies a file URL only when a configured provider returns one.</p>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {notice ? <p className="text-sm text-zinc-300">{notice}</p> : null}
      {assets.length === 0 ? <p className="text-sm text-zinc-500">No assets yet.</p> : assets.map((asset) => (
        <article key={asset.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-lg font-bold text-white">{asset.title || asset.kind}</h2>
          <p className="mt-2 text-sm text-zinc-400">{asset.prompt || asset.description || "No grounded prompt."}</p>
          {asset.fileUrl ? <p className="mt-2 break-all text-xs text-emerald-400">{asset.fileUrl}</p> : null}
          <button type="button" disabled={working || !asset.prompt} onClick={() => generate(asset)} className="mt-4 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50">Generate</button>
        </article>
      ))}
    </div>
  );
}
