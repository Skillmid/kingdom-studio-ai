"use client";

import { useCallback, useEffect, useState } from "react";

import { locationRepository } from "../repositories/location.repository";
import type { Location } from "../types/location";

export function useLocations(productionId: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const data = await locationRepository.getByProductionId(
        productionId
      );

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

  async function refresh() {
    await loadLocations();
  }

  return {
    locations,
    loading,
    saving,
    error,
    refresh,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
