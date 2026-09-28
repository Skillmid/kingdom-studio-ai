"use client";

import { useState } from "react";
import type { ExportFormat, ExportPackageProposal } from "../types/render";
import { useRender } from "../hooks/use-render";
import { planRenderSequenceFromClips } from "../services/render-planner";

const formats: Array<{ value: ExportFormat; label: string }> = [
  { value: "delivery-manifest", label: "Delivery manifest (JSON)" },
  { value: "edit-decision-list", label: "Edit decision list (EDL)" },
  { value: "preview-package", label: "Preview package (JSON)" },
];

function downloadPackage(item: { title?: string; format: ExportFormat; serializedPackage: string }) {
  const extension = item.format === "edit-decision-list" ? "edl" : "json";
  const type = item.format === "edit-decision-list" ? "text/plain" : "application/json";
  const blobUrl = URL.createObjectURL(new Blob([item.serializedPackage], { type }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${(item.title || "kingdom-studio-export").replace(/[^a-z0-9-_]+/gi, "-")}.${extension}`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export function RenderView({ productionId, mode = "render" }: { productionId: string; mode?: "render" | "export" }) {
  const {
    sequences, clips, exports, selectedRenderId, setSelectedRenderId, clipPreview,
    loading, clipsLoading, canExportSelected, planning, saving, error, planSequence, saveSequence, approveSequence, removePreviewClip,
    planExport, saveExport,
  } = useRender(productionId);
  const [sequenceTitle, setSequenceTitle] = useState("Assembly sequence");
  const [format, setFormat] = useState<ExportFormat>("delivery-manifest");
  const [exportPreview, setExportPreview] = useState<ExportPackageProposal | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const activeSequence = sequences.find((sequence) => sequence.id === selectedRenderId);
  const previewSummary = planRenderSequenceFromClips(productionId, clipPreview, sequenceTitle);

  async function handlePlanSequence() {
    setActionError(null);
    setNotice(null);
    try {
      const proposal = await planSequence();
      setSequenceTitle(proposal.title || "Assembly sequence");
      setNotice(`Review ${proposal.itemCount} approved source clip(s). ${proposal.missingMediaCount} currently have no media URL.`);
    } catch (planError) {
      setActionError(planError instanceof Error ? planError.message : "Unable to plan the sequence.");
    }
  }

  async function handleSaveSequence() {
    setActionError(null);
    try {
      const saved = await saveSequence(sequenceTitle);
      setNotice(`Saved creator-approved sequence '${saved.title || "Assembly sequence"}'.`);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Unable to save the sequence.");
    }
  }

  function handlePlanExport() {
    setActionError(null);
    try {
      setExportPreview(planExport(format));
      setNotice("Review the export content before saving and downloading it.");
    } catch (planError) {
      setActionError(planError instanceof Error ? planError.message : "Unable to prepare this export.");
    }
  }

  async function handleSaveExport() {
    if (!exportPreview) return;
    setActionError(null);
    try {
      const saved = await saveExport(exportPreview);
      downloadPackage(saved);
      setNotice(`Saved and downloaded ${saved.format.replace(/-/g, " ")}. The package contains a manifest, not an encoded video file.`);
      setExportPreview(null);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Unable to save this export.");
    }
  }

  async function handleApproveSequence() {
    if (!activeSequence) return;
    setActionError(null);
    try {
      await approveSequence(activeSequence);
      setNotice("Sequence approved for export.");
    } catch (approveError) {
      setActionError(approveError instanceof Error ? approveError.message : "Unable to approve the sequence.");
    }
  }

  return (
    <main className="space-y-7 p-6 lg:p-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-500">Production pipeline</p>
        <h1 className="mt-2 text-3xl font-black text-white">{mode === "export" ? "Export packages" : "Render assembly"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          {mode === "export"
            ? "Prepare and download creator-approved EDL or JSON delivery manifests. This workspace does not encode or host a video file."
            : "Review ordered clips from approved shots, storyboard panels, and media assets. Save an assembly only after reviewing its sources and missing media."}
        </p>
      </header>

      {error || actionError ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-200">{actionError || error}</p> : null}
      {notice ? <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-200">{notice}</p> : null}

      {mode === "render" ? (
        <>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="min-w-64 flex-1 text-sm font-semibold text-zinc-300">Sequence title
                <input value={sequenceTitle} onChange={(event) => setSequenceTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white" maxLength={255} />
              </label>
              <button type="button" disabled={planning || loading} onClick={handlePlanSequence} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 disabled:opacity-50">{planning ? "Planning..." : "Plan from approved sources"}</button>
            </div>
            {clipPreview.length > 0 ? (
              <div className="mt-6 space-y-4 border-t border-zinc-800 pt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Summary label="Clips" value={previewSummary.itemCount} />
                  <Summary label="Media ready" value={previewSummary.readyItemCount} />
                  <Summary label="Missing media" value={previewSummary.missingMediaCount} />
                </div>
                <div className="space-y-2">
                  {clipPreview.map((clip, index) => (
                    <article key={`${clip.sourceKind}:${clip.sourceId || index}`} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">{String(clip.sequenceNumber).padStart(3, "0")} | {clip.sourceKind}</p>
                        <h3 className="mt-1 font-bold text-white">{clip.title || "Untitled clip"}</h3>
                        <p className="mt-1 text-sm text-zinc-400">{clip.description || clip.sourceEvidence || "No additional description."}</p>
                        {clip.sourceEvidence ? <p className="mt-2 text-xs text-zinc-500">Evidence: {clip.sourceEvidence}</p> : null}
                        <p className={`mt-2 text-xs ${clip.mediaUrl ? "text-emerald-400" : "text-amber-300"}`}>{clip.mediaUrl ? "Media URL available" : clip.uncertaintyNotes || "Media URL missing"}</p>
                      </div>
                      <button type="button" onClick={() => removePreviewClip(index)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300">Remove from sequence</button>
                    </article>
                  ))}
                </div>
                <button type="button" disabled={saving || clipPreview.length === 0} onClick={handleSaveSequence} className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50">{saving ? "Saving..." : "Save reviewed sequence"}</button>
              </div>
            ) : null}
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="min-w-64 flex-1 text-sm font-semibold text-zinc-300">Saved sequence
                <select value={selectedRenderId} onChange={(event) => setSelectedRenderId(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white">
                  {sequences.length === 0 ? <option value="">No saved sequences</option> : null}
                  {sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.title || "Untitled sequence"} | {sequence.userApproved ? "approved" : "review required"}</option>)}
                </select>
              </label>
              {activeSequence && !activeSequence.userApproved && activeSequence.status !== "failed" ? <button type="button" onClick={handleApproveSequence} className="rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-300">Approve sequence</button> : null}
            </div>
            {activeSequence ? <div className="mt-4 grid gap-3 sm:grid-cols-4"><Summary label="Status" value={activeSequence.status} /><Summary label="Clips" value={activeSequence.itemCount} /><Summary label="Media ready" value={activeSequence.readyItemCount} /><Summary label="Missing media" value={activeSequence.missingMediaCount} /></div> : null}
            <div className="mt-4 space-y-2">{clips.map((clip) => <article key={clip.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{String(clip.sequenceNumber).padStart(3, "0")} | {clip.sourceKind}</p><p className="mt-1 font-semibold text-white">{clip.title || "Untitled clip"}</p><p className="mt-1 text-sm text-zinc-400">{clip.description || clip.uncertaintyNotes || "No description."}</p></article>)}</div>
            {loading ? <p className="mt-4 text-sm text-zinc-500">Loading saved render sequences...</p> : null}
          </section>
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="text-sm font-semibold text-zinc-300">Saved sequence
                <select value={selectedRenderId} onChange={(event) => { setSelectedRenderId(event.target.value); setExportPreview(null); }} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white">
                  {sequences.length === 0 ? <option value="">No saved sequence</option> : null}
                  {sequences.map((sequence) => <option key={sequence.id} value={sequence.id}>{sequence.title || "Untitled sequence"} | {sequence.userApproved ? "approved" : "review required"}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-zinc-300">Package format
                <select value={format} onChange={(event) => { setFormat(event.target.value as ExportFormat); setExportPreview(null); }} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white">
                  {formats.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <button type="button" disabled={loading || clipsLoading || !canExportSelected} onClick={handlePlanExport} className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 disabled:opacity-50">{clipsLoading ? "Loading clips..." : "Prepare export"}</button>
            </div>
            {activeSequence && activeSequence.missingMediaCount > 0 ? <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">This sequence has {activeSequence.missingMediaCount} clip(s) without media. The export will preserve those as missing entries.</p> : null}
            {activeSequence && !activeSequence.userApproved && activeSequence.status !== "failed" ? <button type="button" onClick={handleApproveSequence} className="mt-4 rounded-xl border border-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-300">Approve selected sequence</button> : null}{exportPreview ? <ExportPreview proposal={exportPreview} saving={saving} onSave={handleSaveExport} /> : null}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Saved packages</h2>
            {exports.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"><div><p className="font-bold text-white">{item.title || item.format}</p><p className="mt-1 text-xs text-zinc-500">{item.format.replace(/-/g, " ")} | {item.manifest.clipCount} clips | saved {new Date(item.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => downloadPackage(item)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200">Download again</button></article>)}
            {!loading && exports.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-500">No export packages have been saved.</p> : null}
          </section>
        </>
      )}
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p><p className="mt-1 font-bold text-white">{value}</p></div>;
}

function ExportPreview({ proposal, saving, onSave }: { proposal: ExportPackageProposal; saving: boolean; onSave: () => void }) {
  return <div className="mt-6 space-y-4 border-t border-zinc-800 pt-5"><div className="grid gap-3 sm:grid-cols-3"><Summary label="Clips" value={proposal.manifest.clipCount} /><Summary label="Media ready" value={proposal.manifest.readyClipCount} /><Summary label="Missing media" value={proposal.manifest.missingMediaCount} /></div><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-300">{proposal.serializedPackage}</pre><button type="button" disabled={saving} onClick={onSave} className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50">{saving ? "Saving..." : "Save package and download"}</button></div>;
}
