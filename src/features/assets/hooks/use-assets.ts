"use client";

import { useCallback, useEffect, useState } from "react";

import { directorNoteRepository } from "@/features/ai-director/repositories/director-note.repository";
import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { productionRepository } from "@/features/productions/repositories/production.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";
import { storyboardRepository } from "@/features/storyboard/repositories/storyboard.repository";
import { storyBibleRepository } from "@/features/story-bible/repositories/story-bible.repository";
import { supabase } from "@/lib/supabase/client";

import { assetRepository } from "../repositories/asset.repository";
import { generationJobRepository } from "../repositories/generation-job.repository";
import { planAssetsFromProduction, selectNewAssetProposals } from "../services/asset-planner";
import { withCalculatedProgress } from "../services/asset-completion";
import {
  canCheckGenerationJobStatus,
  canGenerateAsset,
  canRetryJob,
  draftJobFromAsset,
  hasUnknownProviderState,
  isAssetGenerationSupported,
  isStalledJob,
  jobParametersFromOptions,
  MAX_GENERATION_ATTEMPTS,
  planJobsFromAssets,
  providerStateUnknownMessage,
  retryJob,
  selectNewJobProposals,
  selectQueuedJobsForApprovedAssets,
  STALLED_JOB_ERROR,
} from "../services/generation-job";
import { normalizeAspectRatio } from "@/features/productions/services/production-creative-dna";
import type { Asset } from "../types/asset";
import type { GenerationJob } from "../types/generation-job";

export interface GenerationRunResult {
  job: GenerationJob;
  asset: Asset | null;
  warning?: string;
}

/**
 * Asks the server to claim and dispatch a persisted job. The server persists the provider
 * result itself; the client only reflects the returned rows (or refreshes from the database).
 */
export async function runGenerationJob(
  queued: Pick<GenerationJob, "id">,
  fetchImpl: typeof fetch = fetch,
): Promise<GenerationRunResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetchImpl("/api/generation/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ jobId: queued.id }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    job?: GenerationJob;
    asset?: Asset | null;
    warning?: string;
    error?: string;
  };
  if (!response.ok || !payload.job) {
    throw new Error(payload.error || `Generation dispatch failed (HTTP ${response.status}).`);
  }
  return { job: payload.job, asset: payload.asset ?? null, warning: payload.warning };
}

/**
 * Thrown when the creator asks to generate an asset whose previous provider request may have been
 * accepted. The UI must get an explicit confirmation (provider dashboard checked) before calling
 * queueAsset again with `confirmedProviderCheck: true`. Nothing is dispatched until then.
 */
export class ProviderStateUnknownError extends Error {
  readonly job: GenerationJob;

  constructor(job: GenerationJob) {
    super(providerStateUnknownMessage(job));
    this.name = "ProviderStateUnknownError";
    this.job = job;
  }
}

export async function dispatchJob(
  queued: GenerationJob,
  fetchImpl: typeof fetch = fetch,
): Promise<GenerationJob> {
  return (await runGenerationJob(queued, fetchImpl)).job;
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
      const [characters, locations, shots, panels, directorNotes, existing, production, storyBible] = await Promise.all([
        characterRepository.getByProductionId(productionId),
        locationRepository.getByProductionId(productionId),
        shotRepository.getByProductionId(productionId),
        storyboardRepository.getByProductionId(productionId),
        directorNoteRepository.getByProductionId(productionId),
        assetRepository.getByProductionId(productionId),
        productionRepository.getById(productionId).catch(() => null),
        storyBibleRepository.getByProductionId(productionId).catch(() => null),
      ]);

      const sourceCount = characters.length + locations.length + shots.length + panels.length + directorNotes.length;
      const proposals = planAssetsFromProduction({
        productionId,
        artStyle: production?.art_style,
        aspectRatio: production?.aspect_ratio,
        storyBible: storyBible
          ? { visualConsistency: storyBible.visual_consistency, forbiddenElements: storyBible.forbidden_elements }
          : null,
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

  function applyRunResult(result: GenerationRunResult) {
    setJobs((current) => [result.job, ...current.filter((item) => item.id !== result.job.id)]);
    if (result.asset) {
      const asset = result.asset;
      setAssets((current) => current.map((item) => (item.id === asset.id ? asset : item)));
    }
    return result;
  }

  /** Server is the persister. On any transport/server error, re-read the truth from the database. */
  async function runAndReflect(job: GenerationJob): Promise<GenerationRunResult> {
    try {
      return applyRunResult(await runGenerationJob(job));
    } catch (err) {
      await load();
      throw err;
    }
  }

  async function productionAspectRatio(): Promise<string | undefined> {
    const production = await productionRepository.getById(productionId).catch(() => null);
    return production?.aspect_ratio ? normalizeAspectRatio(production.aspect_ratio) : undefined;
  }

  async function checkJobStatus(job: GenerationJob) {
    if (!canCheckGenerationJobStatus(job)) {
      throw new Error("This generation job does not have a provider task that can be checked.");
    }
    setQueueing(true);
    setError(null);
    try {
      const result = await runAndReflect(job);
      const asset = result.asset ?? assets.find((item) => item.id === job.assetId);
      if (!asset) throw new Error("The asset for this generation job could not be found.");
      return { job: result.job, asset };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check generation status.");
      throw err;
    } finally {
      setQueueing(false);
    }
  }

  async function queueAsset(asset: Asset, options: { confirmedProviderCheck?: boolean } = {}) {
    if (!asset.userApproved) {
      throw new Error("Approve this asset before starting generation.");
    }
    if (!isAssetGenerationSupported(asset)) {
      throw new Error("Generation is currently supported for image and video assets only.");
    }
    if (!canGenerateAsset(asset)) {
      throw new Error("A generation job requires a prompt grounded in production records or filmmaker input.");
    }
    setQueueing(true);
    setError(null);
    try {
      let existing = jobs.filter((job) => job.assetId === asset.id);
      const unknown = existing.filter((job) => hasUnknownProviderState(job));
      if (unknown.length > 0) {
        // A previous request may have been accepted by the provider: never start another paid task
        // without the creator's explicit confirmation that they checked the provider dashboard.
        if (!options.confirmedProviderCheck) throw new ProviderStateUnknownError(unknown[0]);
        const confirmedAt = new Date().toISOString();
        const confirmed = await Promise.all(
          unknown.map((job) => generationJobRepository.confirmProviderChecked(job, confirmedAt)),
        );
        const confirmedById = new Map(confirmed.map((job) => [job.id, job]));
        existing = existing.map((job) => confirmedById.get(job.id) ?? job);
        setJobs((current) => current.map((job) => confirmedById.get(job.id) ?? job));
      }
      const drafts = selectNewJobProposals(planJobsFromAssets([asset]), existing);
      let queued: GenerationJob | undefined;
      if (drafts.length > 0) {
        const aspectRatio = await productionAspectRatio();
        queued = await generationJobRepository.create({ ...draftJobFromAsset(asset, { aspectRatio }), productionId });
      } else {
        queued = existing.find((job) => job.status === "queued" || job.status === "failed" || job.status === "cancelled");
      }
      if (!queued) {
        if (existing.some((job) => job.status === "running")) {
          throw new Error("This asset already has a running generation job. Check its provider status instead.");
        }
        if (existing.some((job) => job.status === "completed")) {
          throw new Error(
            "This asset already has a completed generation. Regenerating would overwrite its only file URL; multiple takes are not supported yet.",
          );
        }
        throw new Error("No generation job could be queued for this asset.");
      }
      if (queued.status === "failed" || queued.status === "cancelled") {
        if (!canRetryJob(queued)) {
          throw new Error(
            `This generation job has used ${queued.attemptCount} of ${MAX_GENERATION_ATTEMPTS} attempts. Review the prompt and provider configuration before trying again.`,
          );
        }
        queued = await generationJobRepository.requeueForRetry(queued, retryJob(queued));
      }
      setJobs((current) => [queued!, ...current.filter((item) => item.id !== queued!.id)]);
      const result = await runAndReflect(queued);
      return { job: result.job, asset: result.asset ?? asset, warning: result.warning };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue generation.");
      throw err;
    } finally {
      setQueueing(false);
    }
  }

  async function queueMissing(): Promise<{ queuedCount: number; skippedCount: number; failedCount: number }> {
    setQueueing(true);
    setError(null);
    try {
      const existingJobs = await generationJobRepository.getByProductionId(productionId);
      const approvedAssets = assets.filter((asset) => asset.userApproved);
      const queuedJobs = selectQueuedJobsForApprovedAssets(productionId, existingJobs, approvedAssets);
      const drafts = selectNewJobProposals(planJobsFromAssets(approvedAssets), existingJobs);
      const aspectRatio = drafts.length > 0 ? await productionAspectRatio() : undefined;
      const created = await generationJobRepository.createMany(
        drafts.map((draft) => ({
          ...draft,
          parameters: { ...(draft.parameters ?? {}), ...jobParametersFromOptions({ aspectRatio }) },
          productionId,
        })),
      );
      const assetsById = new Map(approvedAssets.map((asset) => [asset.id, asset]));
      const dispatchQueue = [
        ...queuedJobs.flatMap(({ job, assetId }) => (assetsById.has(assetId) ? [job] : [])),
        ...created.filter((job) => job.assetId && assetsById.has(job.assetId)),
      ];
      setJobs((current) => {
        const combined = [...dispatchQueue, ...current];
        return [...new Map(combined.map((job) => [job.id, job])).values()];
      });
      let failedCount = 0;
      const errors: string[] = [];
      for (const job of dispatchQueue) {
        try {
          applyRunResult(await runGenerationJob(job));
        } catch (err) {
          failedCount += 1;
          errors.push(err instanceof Error ? err.message : "Generation dispatch failed.");
        }
      }
      if (failedCount > 0) {
        await load();
        setError(`${failedCount} job(s) could not be dispatched: ${[...new Set(errors)].join(" ")}`);
      }
      const queuedAssetIds = new Set(dispatchQueue.map((job) => job.assetId));
      return {
        queuedCount: dispatchQueue.length - failedCount,
        skippedCount: assets.length - queuedAssetIds.size,
        failedCount,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue generation jobs.");
      throw err;
    } finally {
      setQueueing(false);
    }
  }

  /**
   * Creator action for a job whose server request died between claim and persistence. Records the
   * job as failed with an UNKNOWN provider state; it never retries or re-dispatches anything.
   */
  async function recoverStalledJob(job: GenerationJob) {
    const now = Date.now();
    if (!isStalledJob(job, now)) {
      throw new Error("Only running jobs without a provider task that started at least 10 minutes ago can be marked stalled.");
    }
    setQueueing(true);
    setError(null);
    try {
      const failed = await generationJobRepository.markStalledFailed(job, now);
      const asset = assets.find((item) => item.id === job.assetId);
      if (asset && asset.status === "generating") {
        const updated = await assetRepository.update(asset.id, { status: "failed", uncertaintyNotes: STALLED_JOB_ERROR });
        setAssets((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      setJobs((current) => [failed, ...current.filter((item) => item.id !== failed.id)]);
      return failed;
    } catch (err) {
      await load();
      setError(err instanceof Error ? err.message : "Unable to mark the job as stalled.");
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
    checkJobStatus,
    recoverStalledJob,
  };
}
