"use client";

import { useState } from "react";
import type { ExportFormat, ExportPackageProposal } from "../types/render";
import { useRender } from "../hooks/use-render";
import { planRenderSequenceFromClips } from "../services/render-planner";
import { downloadExportPackage } from "../services/export-download";

const formats: Array<{ value: ExportFormat; label: string }> = [
  { value: "delivery-manifest", label: "Delivery manifest (JSON)" },
  { value: "edit-decision-list", label: "Edit decision list (EDL)" },
  { value: "preview-package", label: "Preview package (JSON)" },
];

export function RenderView({ productionId, mode = "render" }: { productionId: string; mode?: "render" | "export" }) {
  const {
    sequences, clips, exports, selectedRenderId, setSelectedRenderId, clipPreview,
    loading, clipsLoading, canExportSelected, planning, saving, error, planSequence, saveSequence, approveSequence, removePreviewClip,
    planExport, saveExport, renderJobs, jobError, submitVideoRender, retryVideoRender,
    cancelVideoRender, getVideoPlayback,
  } = useRender(productionId);
  const [sequenceTitle, setSequenceTitle] = useState("Assembly sequence");
  const [format, setFormat] = useState<ExportFormat>("delivery-manifest");
  const [exportPreview, setExportPreview] = useState<ExportPackageProposal | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [jobActionId, setJobActionId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
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
      downloadExportPackage(saved);
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

  async function handleSubmitRender() {
    setActionError(null);
    setNotice(null);
    try {
      const job = await submitVideoRender();
      setNotice(`Render job queued for ${job.clips.length} clip(s).`);
    } catch (renderError) {
      setActionError(renderError instanceof Error ? renderError.message : "Unable to submit the MP4 render.");
    }
  }

  async function handleRetryRender(jobId: string) {
    setActionError(null);
    setJobActionId(jobId);
    try {
      await retryVideoRender(jobId);
      setNotice("Render retry queued.");
    } catch (renderError) {
      setActionError(renderError instanceof Error ? renderError.message : "Unable to retry the render.");
    } finally {
      setJobActionId(null);
    }
  }

  async function handleCancelRender(jobId: string) {
    setActionError(null);
    setJobActionId(jobId);
    try {
      await cancelVideoRender(jobId);
      setNotice("Render cancellation requested.");
    } catch (renderError) {
      setActionError(renderError instanceof Error ? renderError.message : "Unable to cancel the render.");
    } finally {
      setJobActionId(null);
    }
  }

  async function handlePlayRender(jobId: string) {
    setActionError(null);
    setJobActionId(jobId);
    try {
      const nextUrl = await getVideoPlayback(jobId);
      setPlaybackUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
    } catch (playbackError) {
      setActionError(playbackError instanceof Error ? playbackError.message : "Unable to play the completed render.");
    } finally {
      setJobActionId(null);
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

      {error || actionError || jobError ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-200">{actionError || jobError || error}</p> : null}
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
          <section aria-labelledby="video-render-jobs-heading" className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="video-render-jobs-heading" className="text-lg font-bold text-white">MP4 render jobs</h2>
                <p className="mt-1 text-sm text-zinc-400">Encode the selected approved sequence into a validated MP4.</p>
              </div>
              <button
                type="button"
                disabled={loading || clipsLoading || !canExportSelected || !activeSequence?.userApproved || saving}
                onClick={handleSubmitRender}
                className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
              >
                Submit MP4 render
              </button>
            </div>
            {!activeSequence?.userApproved ? <p className="text-sm text-amber-200">Approve the selected sequence before rendering.</p> : null}
            {renderJobs.map((job) => (
              <article key={job.id} aria-label={`Render job ${job.id}`} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-white">{job.status}</p>
                    <p className="mt-1 text-xs text-zinc-500">{job.clips.length} clip(s) · attempt {job.attempts} of {job.maxAttempts}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(job.status === "queued" || job.status === "running") ? (
                      <button type="button" disabled={jobActionId === job.id} onClick={() => handleCancelRender(job.id)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 disabled:opacity-50">Cancel</button>
                    ) : null}
                    {job.status === "failed" && job.retryable && job.attempts < job.maxAttempts ? (
                      <button type="button" disabled={jobActionId === job.id} onClick={() => handleRetryRender(job.id)} className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-200 disabled:opacity-50">Retry</button>
                    ) : null}
                    {job.status === "completed" ? (
                      <button type="button" disabled={jobActionId === job.id} onClick={() => handlePlayRender(job.id)} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50">{jobActionId === job.id ? "Loading video..." : "Play render"}</button>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-zinc-400"><span>{job.status === "running" ? "Encoding" : job.status}</span><span>{job.progress}%</span></div>
                  <div role="progressbar" aria-label="Render progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress} className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-yellow-500 transition-[width] duration-300" style={{ width: `${job.progress}%` }} />
                  </div>
                </div>
                {job.error ? <p role={job.status === "failed" ? "alert" : "status"} className="text-sm text-red-300">{job.failureCode ? `${job.failureCode}: ` : ""}{job.error}</p> : null}
                {job.warnings.length > 0 ? <ul className="list-inside list-disc text-xs text-amber-200">{job.warnings.map((warning, index) => <li key={`${job.id}-warning-${index}`}>{warning}</li>)}</ul> : null}
                {job.status === "completed" ? <p className="text-xs text-zinc-400">{job.fileSizeBytes ? `${(job.fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : "MP4 ready"}{job.durationSeconds ? ` · ${job.durationSeconds}s` : ""}</p> : null}
              </article>
            ))}
            {renderJobs.length === 0 && !loading ? <p className="rounded-xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-500">No MP4 render jobs yet.</p> : null}
            {playbackUrl ? <video key={playbackUrl} controls playsInline className="w-full rounded-xl border border-zinc-800 bg-black" src={playbackUrl}>Your browser does not support MP4 playback.</video> : null}
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
            {exports.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"><div><p className="font-bold text-white">{item.title || item.format}</p><p className="mt-1 text-xs text-zinc-500">{item.format.replace(/-/g, " ")} | {item.manifest.clipCount} clips | saved {new Date(item.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => downloadExportPackage(item)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200">Download again</button></article>)}
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
