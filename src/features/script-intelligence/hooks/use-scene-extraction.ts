"use client";

import { useCallback, useState } from "react";

import { sceneRepository } from "@/features/scenes/repositories/scene.repository";
import { sceneSchema } from "@/features/scenes/validation/scene.schema";
import type { SceneStatus } from "@/features/scenes/types/scene";

import { scriptIntelligence } from "../services/script-intelligence.service";
import type { ProposedScene } from "../types/scene-proposal";

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
    async (screenplay: string) => {
      if (!screenplay.trim()) {
        setError("Save or paste a screenplay before extracting scenes.");
        return;
      }

      setExtracting(true);
      setError(null);
      setNotice(null);

      try {
        const drafts = await scriptIntelligence.extractScenes(screenplay);

        setProposals(
          drafts.map((draft) => ({
            clientId: createClientId(),
            number: draft.number,
            heading: draft.heading,
            summary: draft.summary,
            status: draft.status,
            progress: draft.progress,
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
    async (scenes: ProposedScene[]) => {
      if (!productionId) {
        throw new Error("Production ID is required.");
      }

      const validated = scenes.map((scene) => {
        const result = sceneSchema.safeParse({
          productionId,
          number: scene.number,
          heading: scene.heading,
          summary: scene.summary.trim() ? scene.summary.trim() : undefined,
          characterIds: [],
          status: scene.status,
          progress: scene.progress,
        });

        if (!result.success) {
          const firstIssue = result.error.issues[0];
          throw new Error(
            firstIssue?.message ??
              `Scene ${scene.number} is not valid and was not saved.`,
          );
        }

        return result.data;
      });

      setSaving(true);
      setError(null);

      try {
        const created = [];

        for (const scene of validated) {
          created.push(
            await sceneRepository.create({
              productionId: scene.productionId,
              number: scene.number,
              heading: scene.heading,
              summary: scene.summary,
              characterIds: scene.characterIds,
              status: scene.status as SceneStatus,
              progress: scene.progress,
            }),
          );
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
    async (clientId: string) => {
      const scene = proposals.find((item) => item.clientId === clientId);

      if (!scene) {
        return;
      }

      await persistScenes([scene]);
    },
    [persistScenes, proposals],
  );

  const approveSelected = useCallback(async () => {
    const selected = proposals.filter((scene) => scene.selected);

    if (selected.length === 0) {
      setError("Select at least one proposed scene to approve.");
      return;
    }

    await persistScenes(selected);
  }, [persistScenes, proposals]);

  const approveAll = useCallback(async () => {
    if (proposals.length === 0) {
      setError("There are no proposed scenes to approve.");
      return;
    }

    await persistScenes(proposals);
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
