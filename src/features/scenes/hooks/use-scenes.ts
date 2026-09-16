"use client";

import { useCallback, useEffect, useState } from "react";

import { sceneRepository } from "../repositories/scene.repository";
import type { Scene } from "../types/scene";

export function useScenes(productionId: string) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function refresh() {
    await loadScenes();
  }

  return {
    scenes,
    loading,
    saving,
    error,
    refresh,
    createScene,
    updateScene,
    deleteScene,
  };
}
