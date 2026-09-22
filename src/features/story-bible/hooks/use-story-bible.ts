"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  screenplayRepository,
} from "@/features/script-intelligence/repositories/screenplay.repository";

import { storyBibleRepository } from "../repositories/story-bible.repository";

import {
  storyBibleScreenplaySync,
} from "../services/story-bible-screenplay-sync.service";

import type { StoryBible } from "../types/story-bible";
import type { StoryBibleScreenplayProposal } from "../services/story-bible-screenplay-sync.service";
import type { StoryBibleDTO } from "../validation/story-bible.schema";

interface UseStoryBibleResult {
  storyBible: StoryBible | null;
  loading: boolean;
  saving: boolean;
  syncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (values: StoryBibleDTO) => Promise<StoryBible>;
  syncFromScreenplay: () => Promise<{
    proposal: StoryBibleScreenplayProposal;
    screenplayTitle: string;
    screenplayVersion: number;
  }>;
}

export function useStoryBible(
  productionId: string
): UseStoryBibleResult {
  const [storyBible, setStoryBible] = useState<StoryBible | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!productionId) {
      return;
    }

    setLoading(true);

    try {
      const result = await storyBibleRepository.getByProductionId(productionId);
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
  }, [productionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save(values: StoryBibleDTO) {
    setSaving(true);

    try {
      const updated = await storyBibleRepository.upsert(
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

  const syncFromScreenplay = useCallback(async () => {
    if (!productionId) {
      throw new Error("Production ID is required.");
    }

    setSyncing(true);
    setError(null);

    try {
      const screenplay = await screenplayRepository.getByProductionId(
        productionId
      );

      if (!screenplay?.content.trim()) {
        throw new Error(
          "Add or save a screenplay before syncing the Story Bible."
        );
      }

      const proposal = await storyBibleScreenplaySync.propose(
        screenplay.content
      );

      return {
        proposal,
        screenplayTitle: screenplay.title,
        screenplayVersion: screenplay.version,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sync Story Bible from screenplay.";

      setError(message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [productionId]);

  return {
    storyBible,
    loading,
    saving,
    syncing,
    error,
    refresh,
    save,
    syncFromScreenplay,
  };
}
