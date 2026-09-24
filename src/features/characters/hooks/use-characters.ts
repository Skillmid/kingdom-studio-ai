"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "../repositories/character.repository";
import { syncCharacterProfileWithAI } from "../services/character-ai-sync.service";
import { syncCharactersFromScreenplay } from "../services/character-screenplay-sync.service";
import type { Character } from "../types/character";

export function useCharacters(productionId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiSyncing, setAiSyncing] = useState(false);
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
    let cancelled = false;

    if (!productionId) {
      return () => {
        cancelled = true;
      };
    }

    characterRepository
      .getByProductionId(productionId)
      .then((data) => {
        if (cancelled) return;
        setCharacters(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load characters."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productionId]);

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

  async function syncCharacterWithAI(character: Character) {
    setAiSyncing(true);
    setError(null);

    try {
      return await syncCharacterProfileWithAI(productionId, character);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sync character profile with AI.";
      setError(message);
      throw err;
    } finally {
      setAiSyncing(false);
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
      const result = await syncCharactersFromScreenplay(productionId);
      const existing = await characterRepository.getByProductionId(productionId);
      setCharacters(existing);
      return {
        createdCount: result.createdCount,
        totalExtracted: result.totalExtracted,
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
    aiSyncing,
    error,
    refresh,
    createCharacter,
    updateCharacter,
    syncCharacterWithAI,
    deleteCharacter,
    syncFromScreenplay,
  };
}
