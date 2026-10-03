"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { sceneRepository } from "@/features/scenes/repositories/scene.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";

import { storyboardRepository } from "../repositories/storyboard.repository";
import { withCalculatedProgress } from "../services/storyboard-completion";
import { loadStoryboardPlanInputs } from "../services/storyboard-plan-inputs";
import { planPanelsFromShots, selectNewPanelProposals } from "../services/storyboard-planner";
import type { StoryboardPanel } from "../types/storyboard-panel";

export function useStoryboard(productionId: string) {
  const [panels, setPanels] = useState<StoryboardPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [reordering, setReordering] = useState(false);
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

  async function toggleApproval(id: string) {
    const current = panels.find((panel) => panel.id === id);
    if (!current) throw new Error("Panel not found.");

    return updatePanel(id, { userApproved: !current.userApproved });
  }

  async function approveAll(): Promise<number> {
    const unapproved = panels.filter((panel) => !panel.userApproved);
    if (unapproved.length === 0) return 0;

    try {
      setSaving(true);
      setError(null);
      await storyboardRepository.approveMany(unapproved.map((panel) => panel.id));
      setPanels((current) => current.map((panel) => ({ ...panel, userApproved: true })));
      return unapproved.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve panels.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function reorder(orderedIds: string[]): Promise<StoryboardPanel[]> {
    if (!productionId) throw new Error("Production ID is required.");
    if (orderedIds.length === 0) return panels;

    try {
      setReordering(true);
      setError(null);
      const updated = await storyboardRepository.reorder(productionId, orderedIds);
      setPanels(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder storyboard panels.");
      throw err;
    } finally {
      setReordering(false);
    }
  }

  async function movePanel(panelId: string, direction: "up" | "down"): Promise<void> {
    const sorted = [...panels].sort((a, b) => a.panelNumber - b.panelNumber);
    const currentIndex = sorted.findIndex((panel) => panel.id === panelId);

    if (currentIndex === -1) return;
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === sorted.length - 1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...sorted];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await reorder(reordered.map((panel) => panel.id));
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
      const { shots, existingPanels: existing, scenes, characters, locations } =
        await loadStoryboardPlanInputs({
          getShots: () => shotRepository.getByProductionId(productionId),
          getExistingPanels: () => storyboardRepository.getByProductionId(productionId),
          getScenes: () => sceneRepository.getByProductionId(productionId),
          getCharacters: () => characterRepository.getByProductionId(productionId),
          getLocations: () => locationRepository.getByProductionId(productionId),
        });

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
    reordering,
    error,
    refresh,
    createPanel,
    updatePanel,
    deletePanel,
    toggleApproval,
    approveAll,
    reorder,
    movePanel,
    planFromShots,
    nextPanelNumber,
  };
}
