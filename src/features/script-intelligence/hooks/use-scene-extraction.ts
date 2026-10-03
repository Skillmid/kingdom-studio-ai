"use client";

import { useCallback, useState } from "react";

import { sceneRepository } from "@/features/scenes/repositories/scene.repository";
import { sceneSchema } from "@/features/scenes/validation/scene.schema";
import { sceneExtractor } from "@/features/import-engine/extractors/scene.extractor";

import { scriptIntelligence } from "../services/script-intelligence.service";
import type { ProposedScene } from "../types/scene-proposal";
import {
  buildApprovedSceneInput,
  createRevisionBoundSceneProposals,
  type SceneExtractionSource,
} from "../services/scene-extraction-provenance";

function createClientId() {
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSceneExtraction(productionId: string) {
  const [proposals, setProposals] = useState<ProposedScene[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const extractScenes = useCallback(
    async (screenplay: string, source: SceneExtractionSource | null) => {
      if (!screenplay.trim()) {
        setError("Save or paste a screenplay before extracting scenes.");
        return;
      }
      if (!source) {
        const message = "Save the current screenplay as a revision before extracting scenes.";
        setError(message);
        throw new Error(message);
      }

      setExtracting(true);
      setError(null);
      setNotice(null);

      try {
        const [drafts, parsedDocument] = await Promise.all([
          scriptIntelligence.extractScenes(screenplay),
          sceneExtractor.parse(screenplay),
        ]);

        setProposals(
          createRevisionBoundSceneProposals(drafts, source, parsedDocument.scenes).map((draft) => ({
            clientId: createClientId(),
            ...draft,
            selected: true,
          })),
        );

        if (drafts.length === 0) {
          setNotice("No scenes could be identified in this screenplay.");
        } else {
          setNotice(
            `${drafts.length} proposed scene${drafts.length === 1 ? "" : "s"} ready for review. Nothing has been saved yet.`,
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to extract scenes from the screenplay.";
        setError(message);
        throw err;
      } finally {
        setExtracting(false);
      }
    },
    [],
  );

  const updateProposal = useCallback(
    (clientId: string, updates: Partial<ProposedScene>) => {
      setProposals((current) =>
        current.map((proposal) =>
          proposal.clientId === clientId
            ? { ...proposal, ...updates }
            : proposal,
        ),
      );
    },
    [],
  );

  const toggleProposal = useCallback((clientId: string) => {
    setProposals((current) =>
      current.map((proposal) =>
        proposal.clientId === clientId
          ? { ...proposal, selected: !proposal.selected }
          : proposal,
      ),
    );
  }, []);

  const persistScenes = useCallback(
    async (scenes: ProposedScene[], currentSource: SceneExtractionSource | null) => {
      if (!productionId) {
        throw new Error("Production ID is required.");
      }

      setSaving(true);
      setError(null);

      try {
        const validated = scenes.map((scene) => {
          const input = buildApprovedSceneInput(scene, productionId, currentSource);
          const result = sceneSchema.safeParse(input);
          if (!result.success) {
            const firstIssue = result.error.issues[0];
            throw new Error(firstIssue?.message ?? `Scene ${scene.number} is not valid and was not saved.`);
          }
          return result.data;
        });
        const created = [];

        for (const scene of validated) {
          created.push(await sceneRepository.create(scene));
        }

        const savedIds = new Set(scenes.map((scene) => scene.clientId));
        setProposals((current) =>
          current.filter((proposal) => !savedIds.has(proposal.clientId)),
        );

        setNotice(
          `Saved ${created.length} scene${created.length === 1 ? "" : "s"} to this production.`,
        );

        return created;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to save approved scenes.";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [productionId],
  );

  const approveScene = useCallback(
    async (clientId: string, currentSource: SceneExtractionSource | null) => {
      const scene = proposals.find((item) => item.clientId === clientId);

      if (!scene) {
        return;
      }

      await persistScenes([scene], currentSource);
    },
    [persistScenes, proposals],
  );

  const approveSelected = useCallback(async (currentSource: SceneExtractionSource | null) => {
    const selected = proposals.filter((scene) => scene.selected);

    if (selected.length === 0) {
      setError("Select at least one proposed scene to approve.");
      return;
    }

    await persistScenes(selected, currentSource);
  }, [persistScenes, proposals]);

  const approveAll = useCallback(async (currentSource: SceneExtractionSource | null) => {
    if (proposals.length === 0) {
      setError("There are no proposed scenes to approve.");
      return;
    }

    await persistScenes(proposals, currentSource);
  }, [persistScenes, proposals]);

  const clearProposals = useCallback(() => {
    setProposals([]);
    setNotice(null);
    setError(null);
  }, []);

  return {
    proposals,
    extracting,
    saving,
    error,
    notice,
    extractScenes,
    updateProposal,
    toggleProposal,
    approveScene,
    approveSelected,
    approveAll,
    clearProposals,
  };
}
