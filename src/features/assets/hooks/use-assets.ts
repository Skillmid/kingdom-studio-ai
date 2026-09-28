"use client";

import { useCallback, useEffect, useState } from "react";

import { directorNoteRepository } from "@/features/ai-director/repositories/director-note.repository";
import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";
import { storyboardRepository } from "@/features/storyboard/repositories/storyboard.repository";

import { assetRepository } from "../repositories/asset.repository";
import { generationJobRepository } from "../repositories/generation-job.repository";
import { planAssetsFromProduction, selectNewAssetProposals } from "../services/asset-planner";
import { withCalculatedProgress } from "../services/asset-completion";
import {
  applyJobResultToAsset,
  canGenerateAsset,
  draftJobFromAsset,
  jobPersistencePatch,
  planJobsFromAssets,
  selectNewJobProposals,
} from "../services/generation-job";
import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";

async function dispatchJob(queued: GenerationJob): Promise<GenerationJob> {
  const response = await fetch("/api/generation/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job: queued }),
  });
  const payload = (await response.json()) as { job?: GenerationJob; error?: string };
  if (!response.ok || !payload.job) {
    throw new Error(payload.error || "Generation dispatch failed.");
  }
  return payload.job;
}

export function useAssets(productionId: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!productionId) {
      setAssets([]);
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextAssets, nextJobs] = await Promise.all([
        assetRepository.getByProductionId(productionId),
        generationJobRepository.getByProductionId(productionId),
      ]);
      setAssets(nextAssets);
      setJobs(nextJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets.");
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    let cancelled = false;

    if (!productionId) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all([
      assetRepository.getByProductionId(productionId),
      generationJobRepository.getByProductionId(productionId),
    ])
      .then(([nextAssets, nextJobs]) => {
        if (cancelled) return;
        setAssets(nextAssets);
        setJobs(nextJobs);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load assets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId]);

  async function createAsset(asset: Partial<Asset>) {
    try {
      setSaving(true);
      setError(null);
      const created = await assetRepository.create(
        withCalculatedProgress({ ...asset, productionId, provenance: asset.provenance ?? "user" }),
      );
      setAssets((current) => [...current, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateAsset(id: string, updates: Partial<Asset>) {
    try {
      setSaving(true);
      setError(null);
      const current = assets.find((asset) => asset.id === id);
      const scored = withCalculatedProgress({ ...current, ...updates });
      const updated = await assetRepository.update(id, {
        ...updates,
        progress: scored.progress,
        status: updates.status ?? scored.status,
      });
      setAssets((currentAssets) => currentAssets.map((asset) => (asset.id === id ? updated : asset)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update asset.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteAsset(id: string) {
    try {
      setSaving(true);
      setError(null);
      await assetRepository.delete(id);
      setAssets((current) => current.filter((asset) => asset.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete asset.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function approveAsset(id: string) {
    return updateAsset(id, { userApproved: true });
  }

  async function planFromProduction(): Promise<{
    createdCount: number;
    proposedCount: number;
    sourceCount: number;
    preservedCount: number;
  }> {
    if (!productionId) throw new Error("Production ID is required.");

    setPlanning(true);
    setError(null);

    try {
      const [characters, locations, shots, panels, directorNotes, existing] = await Promise.all([
        characterRepository.getByProductionId(productionId),
        locationRepository.getByProductionId(productionId),
        shotRepository.getByProductionId(productionId),
        storyboardRepository.getByProductionId(productionId),
        directorNoteRepository.getByProductionId(productionId),
        assetRepository.getByProductionId(productionId),
      ]);

      const sourceCount = characters.length + locations.length + shots.length + panels.length + directorNotes.length;
      const proposals = planAssetsFromProduction({
        productionId,
        characters,
        locations,
        shots,
        panels,
        directorNotes,
      });
      const selected = selectNewAssetProposals(proposals, existing);

      if (selected.length === 0) {
        setAssets(existing);
        return {
          createdCount: 0,
          proposedCount: proposals.length,
          sourceCount,
          preservedCount: existing.filter((asset) => asset.userApproved || asset.provenance === "user").length,
        };
      }

      const created = await assetRepository.createMany(selected);
      const merged = [...existing, ...created];
      setAssets(merged);

      return {
        createdCount: created.length,
        proposedCount: proposals.length,
        sourceCount,
        preservedCount: existing.filter((asset) => asset.userApproved || asset.provenance === "user").length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan assets from production records.");
      throw err;
    } finally {
      setPlanning(false);
    }
  }

  async function persistDispatch(asset: Asset, queued: GenerationJob, dispatched: GenerationJob) {
    const persistedJob = await generationJobRepository.update(queued.id, jobPersistencePatch(dispatched));
    const assetPatch = applyJobResultToAsset(asset, persistedJob);
    const scored = withCalculatedProgress({ ...asset, ...assetPatch });
    const persistedAsset = await assetRepository.update(asset.id, {
      ...assetPatch,
      progress: scored.progress,
      status: assetPatch.status,
    });
    setJobs((current) => {
      const without = current.filter((item) => item.id !== persistedJob.id);
      return [persistedJob, ...without];
    });
    setAssets((current) => current.map((item) => (item.id === persistedAsset.id ? persistedAsset : item)));
    return { asset: persistedAsset, job: persistedJob };
  }

  async function queueAsset(asset: Asset) {
    if (!asset.userApproved) {
      throw new Error("Approve this asset before starting generation.");
    }
    if (!canGenerateAsset(asset)) {
      throw new Error("A generation job requires a prompt grounded in production records or filmmaker input.");
    }

    setQueueing(true);
    setError(null);

    try {
      const existing = jobs.filter((job) => job.assetId === asset.id);
      const drafts = selectNewJobProposals(planJobsFromAssets([asset]), existing);
      let queued: GenerationJob | undefined;
      if (drafts.length > 0) {
        queued = await generationJobRepository.create({ ...draftJobFromAsset(asset), productionId });
      } else {
        queued = existing.find((job) => job.status === "queued" || job.status === "failed" || job.status === "cancelled");
      }

      if (!queued) {
        if (existing.some((job) => job.status === "running" || job.status === "completed")) {
          throw new Error("This asset already has an active or completed generation job.");
        }
        throw new Error("No generation job could be queued for this asset.");
      }

      await assetRepository.update(asset.id, { status: "generating" });
      setAssets((current) =>
        current.map((item) => (item.id === asset.id ? { ...item, status: "generating" } : item)),
      );

      const dispatched = await dispatchJob(queued);
      return persistDispatch(asset, queued, dispatched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue generation.");
      throw err;
    } finally {
      setQueueing(false);
    }
  }

  async function queueMissing(): Promise<{ queuedCount: number; skippedCount: number }> {
    setQueueing(true);
    setError(null);

    try {
      const existingJobs = await generationJobRepository.getByProductionId(productionId);
      const approvedAssets = assets.filter((asset) => asset.userApproved);
      const drafts = selectNewJobProposals(planJobsFromAssets(approvedAssets), existingJobs);
      const created = await generationJobRepository.createMany(
        drafts.map((draft) => ({ ...draft, productionId })),
      );
      setJobs((current) => [...created, ...current]);

      let queuedCount = 0;
      for (const job of created) {
        const asset = assets.find((item) => item.id === job.assetId);
        if (!asset) continue;
        const dispatched = await dispatchJob(job);
        await persistDispatch(asset, job, dispatched);
        queuedCount += 1;
      }

      return { queuedCount, skippedCount: assets.length - drafts.length };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue generation jobs.");
      throw err;
    } finally {
      setQueueing(false);
    }
  }

  async function refresh() {
    await load();
  }

  return {
    assets,
    jobs,
    loading,
    saving,
    planning,
    queueing,
    error,
    refresh,
    createAsset,
    updateAsset,
    deleteAsset,
    approveAsset,
    planFromProduction,
    queueAsset,
    queueMissing,
  };
}
