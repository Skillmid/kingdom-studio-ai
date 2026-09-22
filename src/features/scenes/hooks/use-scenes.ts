"use client";

import { useCallback, useEffect, useState } from "react";

import { sceneExtractor } from "@/features/import-engine/extractors/scene.extractor";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import { sceneRepository } from "../repositories/scene.repository";
import type { Scene } from "../types/scene";

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

      const data = await sceneRepository.getByProductionId(productionId);

      setScenes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load scenes."
      );
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    void loadScenes();
  }, [loadScenes]);

  async function createScene(scene: Partial<Scene>) {
    try {
      setSaving(true);
      setError(null);

      const created = await sceneRepository.create({
        ...scene,
        productionId,
      });

      setScenes((current) => [...current, created]);

      return created;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create scene.";

      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateScene(
    id: string,
    updates: Partial<Scene>
  ) {
    try {
      setSaving(true);
      setError(null);

      const updated = await sceneRepository.update(id, updates);

      setScenes((current) =>
        current.map((scene) =>
          scene.id === id ? updated : scene
        )
      );

      return updated;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update scene.";

      setError(message);
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

      setScenes((current) =>
        current.filter((scene) => scene.id !== id)
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete scene.";

      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function syncFromScreenplay(): Promise<{
    createdCount: number;
    totalExtracted: number;
  }> {
    if (!productionId) {
      throw new Error("Production ID is required.");
    }

    setSyncing(true);
    setError(null);

    try {
      const screenplay =
        await screenplayRepository.getByProductionId(productionId);

      if (!screenplay || !screenplay.content.trim()) {
        throw new Error(
          "No screenplay content found for this production. Save or import a script first."
        );
      }

      const extracted = await sceneExtractor.extract(screenplay.content);
      const existingNumbers = new Set(scenes.map((scene) => scene.number));
      const newScenes = extracted.filter(
        (scene) => !existingNumbers.has(scene.number)
      );

      if (newScenes.length === 0) {
        return {
          createdCount: 0,
          totalExtracted: extracted.length,
        };
      }

      const toInsert: Partial<Scene>[] = newScenes.map((scene) => ({
        productionId,
        number: scene.number,
        heading: scene.heading,
        summary: scene.summary || undefined,
        characterIds: [],
        status: "draft",
        progress: 10,
      }));

      const created = await sceneRepository.createMany(toInsert);

      setScenes((current) => [...current, ...created]);

      return {
        createdCount: created.length,
        totalExtracted: extracted.length,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sync scenes from screenplay.";

      setError(message);
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
