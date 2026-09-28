"use client";

import { useEffect, useState } from "react";
import { assetRepository } from "@/features/assets/repositories/asset.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";
import { storyboardRepository } from "@/features/storyboard/repositories/storyboard.repository";
import type { ExportFormat, ExportPackage, ExportPackageProposal, RenderClip, RenderClipProposal, RenderSequence, RenderSequenceProposal } from "../types/render";
import { exportPackageRepository, renderClipRepository, renderRepository } from "../repositories/render.repository";
import { planExportPackage } from "../services/export-planner";
import { canPrepareExport } from "../services/export-readiness";
import { planRenderClipsFromProduction, planRenderSequenceFromClips } from "../services/render-planner";

export function useRender(productionId: string) {
  const [sequences, setSequences] = useState<RenderSequence[]>([]);
  const [clips, setClips] = useState<RenderClip[]>([]);
  const [clipsLoadedForRenderId, setClipsLoadedForRenderId] = useState<string>();
  const [clipsLoadFailedForRenderId, setClipsLoadFailedForRenderId] = useState<string>();
  const [exports, setExports] = useState<ExportPackage[]>([]);
  const [selectedRenderId, setSelectedRenderId] = useState("");
  const [clipPreview, setClipPreview] = useState<RenderClipProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      renderRepository.getByProductionId(productionId),
      exportPackageRepository.getByProductionId(productionId),
    ]).then(([nextSequences, nextExports]) => {
      if (cancelled) return;
      setSequences(nextSequences);
      setExports(nextExports);
      setSelectedRenderId((current) => nextSequences.some((item) => item.id === current) ? current : nextSequences[0]?.id ?? "");
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load render and export records.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [productionId]);
  useEffect(() => {
    let cancelled = false;
    if (!selectedRenderId) return () => { cancelled = true; };
    renderClipRepository.getByRenderId(selectedRenderId).then((rows) => {
      if (!cancelled) {
        setClips(rows);
        setClipsLoadedForRenderId(selectedRenderId);
        setClipsLoadFailedForRenderId(undefined);
      }
    }).catch((loadError) => {
      if (!cancelled) {
        setClipsLoadFailedForRenderId(selectedRenderId);
        setError(loadError instanceof Error ? loadError.message : "Unable to load render clips.");
      }
    });
    return () => { cancelled = true; };
  }, [selectedRenderId]);
  const clipsLoading = Boolean(selectedRenderId && clipsLoadedForRenderId !== selectedRenderId && clipsLoadFailedForRenderId !== selectedRenderId);
  const selectedClips = clipsLoadedForRenderId === selectedRenderId ? clips : [];

  async function planSequence(): Promise<RenderSequenceProposal> {
    setPlanning(true);
    setError(null);
    try {
      const [shots, panels, assets] = await Promise.all([
        shotRepository.getByProductionId(productionId),
        storyboardRepository.getByProductionId(productionId),
        assetRepository.getByProductionId(productionId),
      ]);
      const proposed = planRenderClipsFromProduction({
        productionId,
        shots: shots.filter((item) => item.userApproved),
        panels: panels.filter((item) => item.userApproved),
        assets: assets.filter((item) => item.userApproved),
      });
      setClipPreview(proposed);
      return planRenderSequenceFromClips(productionId, proposed);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "Unable to plan a render sequence.");
      throw planError;
    } finally {
      setPlanning(false);
    }
  }

  async function saveSequence(title: string): Promise<RenderSequence> {
    if (clipPreview.length === 0) throw new Error("Plan at least one approved shot, panel, or media asset before saving an assembly.");
    setSaving(true);
    setError(null);
    const proposal = planRenderSequenceFromClips(productionId, clipPreview, title.trim() || undefined);
    try {
      const sequence = await renderRepository.create({ ...proposal, userApproved: true });
      try {
        const createdClips = await renderClipRepository.createMany(clipPreview.map((clip) => ({ ...clip, renderId: sequence.id, userApproved: true })));
        setSequences((current) => [sequence, ...current]);
        setSelectedRenderId(sequence.id);
        setClips(createdClips);
        setClipsLoadedForRenderId(sequence.id);
        setClipsLoadFailedForRenderId(undefined);
        setClipPreview([]);
        return sequence;
      } catch (clipError) {
        await renderRepository.update(sequence.id, { status: "failed", userApproved: false, uncertaintyNotes: "Sequence clip persistence failed. Refresh and repair this assembly before export." });
        throw clipError;
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the reviewed assembly.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  function removePreviewClip(index: number) {
    setClipPreview((current) => current.filter((_, currentIndex) => currentIndex !== index).map((clip, currentIndex) => ({ ...clip, sequenceNumber: currentIndex + 1 })));
  }

  async function approveSequence(sequence: RenderSequence) {
    if (sequence.status === "failed") throw new Error("Repair failed clip persistence before approving this sequence.");
    const updated = await renderRepository.update(sequence.id, { userApproved: true });
    setSequences((current) => current.map((item) => item.id === updated.id ? updated : item));
    return updated;
  }

  function planExport(format: ExportFormat): ExportPackageProposal {
    const sequence = sequences.find((item) => item.id === selectedRenderId);
    if (!sequence) throw new Error("Choose a saved render sequence first.");
    if (!canPrepareExport(sequence, clipsLoadedForRenderId, selectedRenderId, clipsLoading)) {
      throw new Error("Wait for the selected approved sequence and its clips to finish loading before preparing an export.");
    }
    return planExportPackage(productionId, selectedClips, format, sequence);
  }

  async function saveExport(proposal: ExportPackageProposal): Promise<ExportPackage> {
    if (!proposal.serializedPackage.trim()) throw new Error("The export package is empty.");
    setSaving(true);
    setError(null);
    try {
      const saved = await exportPackageRepository.create({ ...proposal, status: "packaged", userApproved: true });
      setExports((current) => [saved, ...current]);
      return saved;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the export package.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  return {
    sequences, clips: selectedClips, exports, selectedRenderId, setSelectedRenderId, clipPreview,
    loading, clipsLoading, canExportSelected: canPrepareExport(sequences.find((item) => item.id === selectedRenderId), clipsLoadedForRenderId, selectedRenderId, clipsLoading),
    planning, saving, error, planSequence, saveSequence,
    approveSequence, removePreviewClip, planExport, saveExport,
  };
}
