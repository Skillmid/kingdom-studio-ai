"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { sceneRepository } from "@/features/scenes/repositories/scene.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";

import { storyboardRepository } from "../repositories/storyboard.repository";
import { withCalculatedProgress } from "../services/storyboard-completion";
import { planPanelsFromShots, selectNewPanelProposals } from "../services/storyboard-planner";
import type { StoryboardPanel } from "../types/storyboard-panel";

export function useStoryboard(productionId: string) {
  const [panels, setPanels] = useState<StoryboardPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPanels = useCallback(async () => {
    if (!productionId) {
      setPanels([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPanels(await storyboardRepository.getByProductionId(productionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load storyboard panels.");
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

    storyboardRepository
      .getByProductionId(productionId)
      .then((data) => {
        if (cancelled) return;
        setPanels(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load storyboard panels.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId]);

  function nextPanelNumber(current: StoryboardPanel[] = panels) {
    return current.length === 0 ? 1 : Math.max(...current.map((panel) => panel.panelNumber)) + 1;
  }

  async function createPanel(panel: Partial<StoryboardPanel>) {
    try {
      setSaving(true);
      setError(null);
      const created = await storyboardRepository.create(
        withCalculatedProgress({
          ...panel,
          productionId,
          panelNumber: panel.panelNumber ?? nextPanelNumber(),
          provenance: panel.provenance ?? "user",
          userApproved: panel.userApproved ?? true,
          characterIds: panel.characterIds ?? [],
        }),
      );
      setPanels((current) => [...current, created].sort((a, b) => a.panelNumber - b.panelNumber));
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create panel.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updatePanel(id: string, updates: Partial<StoryboardPanel>) {
    try {
      setSaving(true);
      setError(null);
      const current = panels.find((panel) => panel.id === id);
      const payload = current ? withCalculatedProgress({ ...current, ...updates }) : updates;
      const updated = await storyboardRepository.update(id, payload);
      setPanels((list) => list.map((panel) => (panel.id === id ? updated : panel)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update panel.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deletePanel(id: string) {
    try {
      setSaving(true);
      setError(null);
      await storyboardRepository.delete(id);
      setPanels((current) => current.filter((panel) => panel.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete panel.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function planFromShots(): Promise<{
    createdCount: number;
    shotCount: number;
    existingCount: number;
  }> {
    if (!productionId) throw new Error("Production ID is required.");

    setPlanning(true);
    setError(null);

    try {
      const [shots, existing, scenes, characters, locations] = await Promise.all([
        shotRepository.getByProductionId(productionId),
        storyboardRepository.getByProductionId(productionId),
        sceneRepository.getByProductionId(productionId).catch(() => []),
        characterRepository.getByProductionId(productionId).catch(() => []),
        locationRepository.getByProductionId(productionId).catch(() => []),
      ]);

      if (shots.length === 0) {
        setPanels(existing);
        return { createdCount: 0, shotCount: 0, existingCount: existing.length };
      }

      const nextNumber = nextPanelNumber(existing);
      const proposals = planPanelsFromShots(shots, { scenes, characters, locations }).map(
        (proposal, index) =>
          withCalculatedProgress({
            ...proposal,
            productionId,
            panelNumber: nextNumber + index,
          }),
      );
      const incoming = selectNewPanelProposals(proposals, existing);
      const created = await storyboardRepository.createMany(incoming);
      setPanels([...existing, ...created].sort((a, b) => a.panelNumber - b.panelNumber));

      return {
        createdCount: created.length,
        shotCount: shots.length,
        existingCount: existing.length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plan storyboard from shots.");
      throw err;
    } finally {
      setPlanning(false);
    }
  }

  async function refresh() {
    await loadPanels();
  }

  return {
    panels,
    loading,
    saving,
    planning,
    error,
    refresh,
    createPanel,
    updatePanel,
    deletePanel,
    planFromShots,
    nextPanelNumber,
  };
}
