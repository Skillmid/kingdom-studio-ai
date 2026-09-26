"use client";

import { useCallback, useEffect, useState } from "react";

import { sceneRepository } from "@/features/scenes/repositories/scene.repository";

import { shotRepository } from "../repositories/shot.repository";
import { planShotsFromScenes, selectNewShotProposals } from "../services/shot-planner";
import { withCalculatedProgress } from "../services/shot-completion";
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

  async function createShot(shot: Partial<Shot>) {
    try {
      setSaving(true);
      setError(null);
      const created = await shotRepository.create(
        withCalculatedProgress({ ...shot, productionId, provenance: shot.provenance ?? "user" }),
      );
      setShots((current) => [...current, created].sort((a, b) => a.shotNumber - b.shotNumber));
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
      const updated = await shotRepository.update(id, withCalculatedProgress({ ...updates }));
      setShots((current) => current.map((shot) => (shot.id === id ? updated : shot)));
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

  async function planFromScenes(): Promise<{
    createdCount: number;
    proposedCount: number;
    sceneCount: number;
    preservedCount: number;
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
        return { createdCount: 0, proposedCount: 0, sceneCount: 0, preservedCount: existing.length };
      }

      const nextNumberStart =
        existing.length === 0 ? 1 : Math.max(...existing.map((shot) => shot.shotNumber)) + 1;
      const proposals = planShotsFromScenes({ productionId, scenes }).map((proposal, index) => ({
        ...proposal,
        shotNumber: nextNumberStart + index,
      }));
      const selected = selectNewShotProposals(proposals, existing);

      if (selected.length === 0) {
        setShots(existing);
        return {
          createdCount: 0,
          proposedCount: proposals.length,
          sceneCount: scenes.length,
          preservedCount: existing.length,
        };
      }

      const created = await shotRepository.createMany(selected);
      const merged = [...existing, ...created].sort((a, b) => a.shotNumber - b.shotNumber);
      setShots(merged);

      return {
        createdCount: created.length,
        proposedCount: proposals.length,
        sceneCount: scenes.length,
        preservedCount: existing.filter((shot) => shot.userApproved || shot.provenance === "user").length,
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
    planFromScenes,
  };
}
