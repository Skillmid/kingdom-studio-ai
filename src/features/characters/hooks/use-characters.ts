"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "../repositories/character.repository";
import { characterExtractor } from "@/features/import-engine/extractors/character.extractor";
import { screenplayRepository } from "@/features/script-intelligence/repositories/screenplay.repository";
import type { Character } from "../types/character";

export function useCharacters(productionId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    if (!productionId) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await characterRepository.getByProductionId(productionId);
      setCharacters(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load characters."
      );
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  async function createCharacter(character: Partial<Character>) {
    try {
      setSaving(true);
      setError(null);

      const created = await characterRepository.create({
        ...character,
        productionId,
      });

      setCharacters((current) => [...current, created]);
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create character.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateCharacter(id: string, updates: Partial<Character>) {
    try {
      setSaving(true);
      setError(null);

      const updated = await characterRepository.update(id, updates);

      setCharacters((current) =>
        current.map((character) =>
          character.id === id ? updated : character
        )
      );

      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update character.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCharacter(id: string) {
    try {
      setSaving(true);
      setError(null);

      await characterRepository.delete(id);
      setCharacters((current) =>
        current.filter((character) => character.id !== id)
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete character.";
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
      const screenplay = await screenplayRepository.getByProductionId(productionId);

      if (!screenplay || !screenplay.content.trim()) {
        throw new Error(
          "No screenplay content found for this production. Save or import a script first."
        );
      }

      const extracted = await characterExtractor.extract(screenplay.content);
      if (extracted.length === 0) {
        return { createdCount: 0, totalExtracted: 0 };
      }

      // Read the database again at sync time so repeated clicks/tabs cannot
      // create duplicates from stale React state.
      const existingCharacters = await characterRepository.getByProductionId(
        productionId
      );
      const existingNames = new Set(
        existingCharacters.map((character) =>
          character.name.trim().toLowerCase()
        )
      );

      const newCharacters = extracted.filter((character) => {
        const key = character.name.trim().toLowerCase();
        if (existingNames.has(key)) {
          return false;
        }
        existingNames.add(key);
        return true;
      });

      if (newCharacters.length === 0) {
        setCharacters(existingCharacters);
        return { createdCount: 0, totalExtracted: extracted.length };
      }

      const toInsert: Partial<Character>[] = newCharacters.map((character) => ({
        productionId,
        name: character.name,
        role: character.role,
        status: "draft",
        biography: character.description,
        progress: 10,
      }));

      const created = await characterRepository.createMany(toInsert);
      setCharacters([...existingCharacters, ...created]);

      return {
        createdCount: created.length,
        totalExtracted: extracted.length,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sync characters from screenplay.";
      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }

  async function refresh() {
    await loadCharacters();
  }

  return {
    characters,
    loading,
    saving,
    syncing,
    error,
    refresh,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    syncFromScreenplay,
  };
}
