"use client";

import { useMemo, useState } from "react";
import type { Asset } from "../types/asset";
import { useAssets } from "../hooks/use-assets";
import AssetFormDialog from "./AssetFormDialog";
import AssetList from "./AssetList";
import DeleteAssetDialog from "./DeleteAssetDialog";

export function AssetsView({ productionId }: { productionId: string }) {
  const {
    assets, jobs, loading, saving, planning, queueing, error,
    createAsset, updateAsset, deleteAsset, approveAsset, planFromProduction,
    queueAsset, queueMissing,
  } = useAssets(productionId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const approvedQueueableCount = useMemo(
    () => assets.filter((asset) => asset.userApproved && asset.prompt?.trim() && asset.status !== "generating").length,
    [assets],
  );

  function openNewAsset() {
    setEditingAsset(null);
    setFormOpen(true);
    setActionError(null);
  }

  function openEditAsset(asset: Asset) {
    setEditingAsset(asset);
    setFormOpen(true);
    setActionError(null);
  }

  async function saveAsset(values: Partial<Asset>) {
    if (editingAsset) await updateAsset(editingAsset.id, values);
    else await createAsset(values);
    setNotice(editingAsset ? "Asset saved and approved." : "Asset added and approved.");
  }

  async function handlePlan() {
    setActionError(null);
    setNotice(null);
    try {
      const result = await planFromProduction();
      setNotice(result.createdCount > 0
        ? `Added ${result.createdCount} asset proposals from ${result.sourceCount} production records. ${result.preservedCount} existing assets were preserved for creator review.`
        : `No new asset proposals. ${result.preservedCount} existing assets were preserved.`);
    } catch (planError) {
      setActionError(planError instanceof Error ? planError.message : "Unable to plan assets.");
    }
  }

  async function handleQueue(asset: Asset) {
    setActionError(null);
    try {
      await queueAsset(asset);
      setNotice(`Generation job updated for ${asset.title || asset.kind}.`);
    } catch (queueError) {
      setActionError(queueError instanceof Error ? queueError.message : "Unable to queue generation.");
    }
  }

  async function handleQueueMissing() {
    setActionError(null);
    try {
      const result = await queueMissing();
      setNotice(`Dispatched ${result.queuedCount} approved asset job(s); ${result.skippedCount} asset(s) were skipped.`);
    } catch (queueError) {
      setActionError(queueError instanceof Error ? queueError.message : "Unable to queue approved assets.");
    }
  }

  async function handleApprove(asset: Asset) {
    setActionError(null);
    try {
      await approveAsset(asset.id);
      setNotice(`${asset.title || asset.kind} approved for production use.`);
    } catch (approveError) {
      setActionError(approveError instanceof Error ? approveError.message : "Unable to approve this asset.");
    }
  }

  async function handleDelete() {
    if (!deletingAsset) return;
    await deleteAsset(deletingAsset.id);
    setNotice(`${deletingAsset.title || deletingAsset.kind} deleted.`);
    setDeletingAsset(null);
  }

  return (
    <main className="space-y-7 p-6 lg:p-8">
      <header className="flex flex-col gap-5 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">Production workspace</p>
          <h1 className="mt-2 text-3xl font-black text-white">Assets</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Review production-derived references, edit prompts, approve assets, and create generation jobs. A media URL appears only when a provider returns one.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={planning || loading} onClick={handlePlan} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 disabled:opacity-50">{planning ? "Planning..." : "Plan from production"}</button>
          <button type="button" disabled={queueing || approvedQueueableCount === 0} onClick={handleQueueMissing} className="rounded-xl border border-yellow-500/40 px-4 py-3 text-sm font-bold text-yellow-300 disabled:opacity-50">{queueing ? "Queueing..." : "Queue approved assets"}</button>
          <button type="button" onClick={openNewAsset} className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-black text-black">Add asset</button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Total assets</p><p className="mt-2 text-2xl font-black text-white">{assets.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Awaiting creator approval</p><p className="mt-2 text-2xl font-black text-white">{assets.filter((asset) => !asset.userApproved).length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Generation jobs</p><p className="mt-2 text-2xl font-black text-white">{jobs.length}</p></div>
      </section>

      {error || actionError ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-200">{actionError || error}</p> : null}
      {notice ? <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-200">{notice}</p> : null}
      <AssetList assets={assets} jobs={jobs} loading={loading} queueing={queueing} onEdit={openEditAsset} onDelete={setDeletingAsset} onApprove={handleApprove} onQueue={handleQueue} />

      {formOpen ? <AssetFormDialog asset={editingAsset} productionId={productionId} saving={saving} onClose={() => setFormOpen(false)} onSave={saveAsset} /> : null}
      <DeleteAssetDialog asset={deletingAsset} open={Boolean(deletingAsset)} loading={saving} onClose={() => setDeletingAsset(null)} onDelete={handleDelete} />
    </main>
  );
}
