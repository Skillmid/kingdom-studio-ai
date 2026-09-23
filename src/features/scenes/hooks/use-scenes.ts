"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { sceneExtractor } from "@/features/import-engine/extractors/scene.extractor";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import { sceneRepository } from "../repositories/scene.repository";
import type { Scene } from "../types/scene";

function normaliseLocationName(value: string): string {
  return value
    .replace(/\s+-\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME|SUNSET|SUNRISE)\s*$/i, "")
    .replace(/\s+(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|LATER|CONTINUOUS|SAME|SUNSET|SUNRISE)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchCharacterIds(sourceText: string, characters: Array<{ id: string; name: string }>) {
  const source = sourceText.toLowerCase();
  return characters
    .filter((character) => character.name.trim().length > 1 && source.includes(character.name.trim().toLowerCase()))
    .map((character) => character.id);
}

export function useScenes(productionId: string) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScenes = useCallback(async () => {
    if (!productionId) {
      setScenes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setScenes(await sceneRepository.getByProductionId(productionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scenes.");
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

    sceneRepository
      .getByProductionId(productionId)
      .then((data) => {
        if (cancelled) return;
        setScenes(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load scenes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId]);

  async function createScene(scene: Partial<Scene>) {
    try {
      setSaving(true);
      setError(null);
      const created = await sceneRepository.create({ ...scene, productionId });
      setScenes((current) => [...current, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scene.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateScene(id: string, updates: Partial<Scene>) {
    try {
      setSaving(true);
      setError(null);
      const updated = await sceneRepository.update(id, updates);
      setScenes((current) => current.map((scene) => (scene.id === id ? updated : scene)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update scene.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteScene(id: string) {
    try {
      setSaving(true);
      setError(null);
      await sceneRepository.delete(id);
      setScenes((current) => current.filter((scene) => scene.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete scene.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function syncFromScreenplay(): Promise<{
    createdCount: number;
    totalExtracted: number;
    linkedLocationCount: number;
    linkedCharacterCount: number;
  }> {
    if (!productionId) throw new Error("Production ID is required.");

    setSyncing(true);
    setError(null);

    try {
      const screenplay = await screenplayRepository.getByProductionId(productionId);
      if (!screenplay || !screenplay.content.trim()) {
        throw new Error("No screenplay content found for this production. Save or import a script first.");
      }

      const extracted = await sceneExtractor.extract(screenplay.content);
      if (extracted.length === 0) {
        return { createdCount: 0, totalExtracted: 0, linkedLocationCount: 0, linkedCharacterCount: 0 };
      }

      const [existingScenes, existingLocations, existingCharacters] = await Promise.all([
        sceneRepository.getByProductionId(productionId),
        locationRepository.getByProductionId(productionId),
        characterRepository.getByProductionId(productionId),
      ]);

      const existingNumbers = new Set(existingScenes.map((scene) => scene.number));
      const locationIds = new Map(
        existingLocations.map((location) => [normaliseLocationName(location.name), location.id])
      );

      const newScenes = extracted.filter((scene) => {
        if (existingNumbers.has(scene.number)) return false;
        existingNumbers.add(scene.number);
        return true;
      });

      if (newScenes.length === 0) {
        setScenes(existingScenes);
        return {
          createdCount: 0,
          totalExtracted: extracted.length,
          linkedLocationCount: extracted.filter((scene) =>
            scene.locationName ? locationIds.has(normaliseLocationName(scene.locationName)) : false
          ).length,
          linkedCharacterCount: existingScenes.reduce((count, scene) => count + scene.characterIds.length, 0),
        };
      }

      let linkedLocationCount = 0;
      let linkedCharacterCount = 0;

      const toInsert: Partial<Scene>[] = newScenes.map((scene) => {
        const locationId = scene.locationName
          ? locationIds.get(normaliseLocationName(scene.locationName))
          : undefined;
        const characterIds = matchCharacterIds(scene.sourceText, existingCharacters);

        if (locationId) linkedLocationCount += 1;
        linkedCharacterCount += characterIds.length;

        return {
          productionId,
          number: scene.number,
          heading: scene.heading,
          sceneType: scene.sceneType,
          timeOfDay: scene.timeOfDay,
          summary: scene.summary || undefined,
          action: scene.action || undefined,
          dialogue: scene.dialogue || undefined,
          sourceText: scene.sourceText || undefined,
          characterIds,
          locationId,
          status: "draft",
          progress: 10,
        };
      });

      const created = await sceneRepository.createMany(toInsert);
      setScenes([...existingScenes, ...created]);

      return {
        createdCount: created.length,
        totalExtracted: extracted.length,
        linkedLocationCount,
        linkedCharacterCount,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync scenes from screenplay.");
      throw err;
    } finally {
      setSyncing(false);
    }
  }

  async function refresh() {
    await loadScenes();
  }

  return {
    scenes,
    loading,
    saving,
    syncing,
    error,
    refresh,
    createScene,
    updateScene,
    deleteScene,
    syncFromScreenplay,
  };
}
