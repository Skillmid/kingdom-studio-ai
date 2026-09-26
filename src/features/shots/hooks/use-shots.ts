"use client";

import { useCallback, useEffect, useState } from "react";

import { sceneRepository } from "@/features/scenes/repositories/scene.repository";

import { shotRepository } from "../repositories/shot.repository";
import { withCalculatedProgress } from "../services/shot-completion";
import { planShotsFromScenes, selectNewShotProposals } from "../services/shot-planner";
import type { Shot } from "../types/shot";

export function useShots(productionId: string) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShots = useCallback(async () => {
    if (!productionId) {
      setShots([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShots(await shotRepository.getByProductionId(productionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shots.");
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

    shotRepository
      .getByProductionId(productionId)
      .then((data) => {
        if (cancelled) return;
        setShots(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load shots.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId]);

  function nextShotNumber(sceneId?: string, current: Shot[] = shots) {
    const relevant = current.filter((shot) => (sceneId ? shot.sceneId === sceneId : !shot.sceneId));
    const pool = relevant.length > 0 ? relevant : current;
    return pool.length === 0 ? 1 : Math.max(...pool.map((shot) => shot.shotNumber)) + 1;
  }

  async function createShot(shot: Partial<Shot>) {
    try {
      setSaving(true);
      setError(null);
      const payload = withCalculatedProgress({
        ...shot,
        productionId,
        shotNumber: shot.shotNumber ?? nextShotNumber(shot.sceneId),
        provenance: shot.provenance ?? "user",
        userApproved: shot.userApproved ?? true,
        characterIds: shot.characterIds ?? [],
      });
      const created = await shotRepository.create(payload);
      setShots((current) => [...current, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shot.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateShot(id: string, updates: Partial<Shot>) {
    try {
      setSaving(true);
      setError(null);
      const current = shots.find((shot) => shot.id === id);
      const payload = current ? withCalculatedProgress({ ...current, ...updates }) : updates;
      const updated = await shotRepository.update(id, payload);
      setShots((list) => list.map((shot) => (shot.id === id ? updated : shot)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shot.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteShot(id: string) {
    try {
      setSaving(true);
      setError(null);
      await shotRepository.delete(id);
      setShots((current) => current.filter((shot) => shot.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete shot.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function approveShot(id: string) {
    return updateShot(id, { userApproved: true });
  }

  async function planFromScenes(): Promise<{
    createdCount: number;
    sceneCount: number;
    existingCount: number;
  }> {
    if (!productionId) throw new Error("Production ID is required.");

    setPlanning(true);
    setError(null);

    try {
      const [scenes, existing] = await Promise.all([
        sceneRepository.getByProductionId(productionId),
        shotRepository.getByProductionId(productionId),
      ]);

      if (scenes.length === 0) {
        setShots(existing);
        return { createdCount: 0, sceneCount: 0, existingCount: existing.length };
      }

      const proposals = planShotsFromScenes(scenes);
      const incoming = selectNewShotProposals(proposals, existing).map((proposal) =>
        withCalculatedProgress({
          ...proposal,
          productionId,
        }),
      );

      const created = await shotRepository.createMany(incoming);
      setShots([...existing, ...created]);

      return {
        createdCount: created.length,
        sceneCount: scenes.length,
        existingCount: existing.length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan shots from scenes.");
      throw err;
    } finally {
      setPlanning(false);
    }
  }

  async function refresh() {
    await loadShots();
  }

  return {
    shots,
    loading,
    saving,
    planning,
    error,
    refresh,
    createShot,
    updateShot,
    deleteShot,
    approveShot,
    planFromScenes,
    nextShotNumber,
  };
}
