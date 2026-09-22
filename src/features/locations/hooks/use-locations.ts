"use client";

import { useCallback, useEffect, useState } from "react";

import { locationExtractor } from "@/features/import-engine/extractors/location.extractor";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";

import { locationRepository } from "../repositories/location.repository";
import type { Location } from "../types/location";

export function useLocations(productionId: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    if (!productionId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await locationRepository.getByProductionId(productionId);

      setLocations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load locations."
      );
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  async function createLocation(location: Partial<Location>) {
    try {
      setSaving(true);
      setError(null);

      const created = await locationRepository.create({
        ...location,
        productionId,
      });

      setLocations((current) => [...current, created]);

      return created;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create location.";

      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateLocation(
    id: string,
    updates: Partial<Location>
  ) {
    try {
      setSaving(true);
      setError(null);

      const updated = await locationRepository.update(id, updates);

      setLocations((current) =>
        current.map((location) =>
          location.id === id ? updated : location
        )
      );

      return updated;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update location.";

      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(id: string) {
    try {
      setSaving(true);
      setError(null);

      await locationRepository.delete(id);

      setLocations((current) =>
        current.filter((location) => location.id !== id)
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete location.";

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

      const extracted = await locationExtractor.extract(screenplay.content);

      if (extracted.length === 0) {
        return { createdCount: 0, totalExtracted: 0 };
      }

      const existingNames = new Set(
        locations.map((location) => location.name.trim().toLowerCase())
      );

      const newLocations = extracted.filter(
        (location) => !existingNames.has(location.name.trim().toLowerCase())
      );

      if (newLocations.length === 0) {
        return { createdCount: 0, totalExtracted: extracted.length };
      }

      const toInsert: Partial<Location>[] = newLocations.map((location) => ({
        productionId,
        name: location.name,
        setting: location.setting,
        description: `Extracted from screenplay scene heading: ${location.sourceHeading}`,
        notes: `Appears in ${location.occurrences} scene${location.occurrences === 1 ? "" : "s"}. Review and refine this location before production.` ,
        status: "draft",
        progress: 10,
      }));

      const created = await locationRepository.createMany(toInsert);

      setLocations((current) => [...current, ...created]);

      return {
        createdCount: created.length,
        totalExtracted: extracted.length,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sync locations from screenplay.";

      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }

  async function refresh() {
    await loadLocations();
  }

  return {
    locations,
    loading,
    saving,
    syncing,
    error,
    refresh,
    createLocation,
    updateLocation,
    deleteLocation,
    syncFromScreenplay,
  };
}
