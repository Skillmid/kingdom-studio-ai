"use client";

import { useCallback, useEffect, useState } from "react";

import { characterRepository } from "../repositories/character.repository";
import type { Character } from "../types/character";

export function useCharacters(productionId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const data = await characterRepository.getByProductionId(
        productionId
      );

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

  async function createCharacter(
    character: Partial<Character>
  ) {
    try {
      setSaving(true);

      const created =
        await characterRepository.create({
          ...character,
          productionId,
        });

      setCharacters((current) => [
        ...current,
        created,
      ]);

      return created;
    } finally {
      setSaving(false);
    }
  }

  async function updateCharacter(
    id: string,
    updates: Partial<Character>
  ) {
    try {
      setSaving(true);

      const updated =
        await characterRepository.update(
          id,
          updates
        );

      setCharacters((current) =>
        current.map((character) =>
          character.id === id
            ? updated
            : character
        )
      );

      return updated;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCharacter(id: string) {
    try {
      setSaving(true);

      await characterRepository.delete(id);

      setCharacters((current) =>
        current.filter(
          (character) =>
            character.id !== id
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    await loadCharacters();
  }

  return {
    characters,

    loading,

    saving,

    error,

    refresh,

    createCharacter,

    updateCharacter,

    deleteCharacter,
  };
}