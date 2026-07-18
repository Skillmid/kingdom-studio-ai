"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { storyBibleRepository } from "../repositories/story-bible.repository";

import type { StoryBible } from "../types/story-bible";
import type { StoryBibleDTO } from "../validation/story-bible.schema";

interface UseStoryBibleResult {
  storyBible: StoryBible | null;

  loading: boolean;

  saving: boolean;

  error: string | null;

  refresh: () => Promise<void>;

  save: (
    values: StoryBibleDTO
  ) => Promise<StoryBible>;
}

export function useStoryBible(
  productionId: string
): UseStoryBibleResult {
  const [storyBible, setStoryBible] =
    useState<StoryBible | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const refresh = useCallback(
    async () => {
      if (!productionId) {
        return;
      }

      setLoading(true);

      try {
        const result =
          await storyBibleRepository.getByProductionId(
            productionId
          );

        setStoryBible(result);

        setError(null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load Story Bible."
        );
      } finally {
        setLoading(false);
      }
    },
    [productionId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(
    values: StoryBibleDTO
  ) {
    setSaving(true);

    try {
      const updated =
        await storyBibleRepository.upsert(
          productionId,
          values
        );

      setStoryBible(updated);

      setError(null);

      return updated;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save Story Bible.";

      setError(message);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  return {
    storyBible,

    loading,

    saving,

    error,

    refresh,

    save,
  };
}