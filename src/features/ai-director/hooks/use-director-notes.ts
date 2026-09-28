"use client";

import { useCallback, useEffect, useState } from "react";
import { characterRepository } from "@/features/characters/repositories/character.repository";
import { locationRepository } from "@/features/locations/repositories/location.repository";
import { sceneRepository } from "@/features/scenes/repositories/scene.repository";
import { shotRepository } from "@/features/shots/repositories/shot.repository";
import { storyboardRepository } from "@/features/storyboard/repositories/storyboard.repository";
import { directorNoteRepository } from "../repositories/director-note.repository";
import {
  acceptDirectorNoteProposal,
  numberNewDirectorNotes,
  planDirectionFromScenes,
  selectNewDirectionNotes,
} from "../services/director-planner";
import type { DirectorNote, DirectorNoteProposal } from "../types/director-note";

type ProposalDraft = {
  original: DirectorNoteProposal;
  proposal: DirectorNoteProposal;
  edited: boolean;
};

const editableFields = [
  "title", "sceneIntent", "blocking", "camera", "composition", "lighting",
  "pacing", "sound", "emotion", "continuity", "uncertaintyNotes",
] as const;
type EditableField = (typeof editableFields)[number];

export function useDirectorNotes(productionId: string) {
  const [notes, setNotes] = useState<DirectorNote[]>([]);
  const [proposals, setProposals] = useState<ProposalDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [savingSceneId, setSavingSceneId] = useState<string>();
  const [approvingNoteId, setApprovingNoteId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    directorNoteRepository.getByProductionId(productionId).then((loadedNotes) => {
      if (!cancelled) setNotes(loadedNotes);
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load direction notes.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [productionId]);

  const planNotes = useCallback(async () => {
    setPlanning(true);
    setError(null);
    setNotice(null);
    try {
      const [scenes, shots, panels, characters, locations, existingNotes] = await Promise.all([
        sceneRepository.getByProductionId(productionId),
        shotRepository.getByProductionId(productionId),
        storyboardRepository.getByProductionId(productionId),
        characterRepository.getByProductionId(productionId),
        locationRepository.getByProductionId(productionId),
        directorNoteRepository.getByProductionId(productionId),
      ]);
      setNotes(existingNotes);
      const planned = planDirectionFromScenes(
        scenes.map((scene) => ({ ...scene, number: scene.number, productionId })),
        {
          shots: shots.filter((shot) => shot.userApproved),
          panels: panels.filter((panel) => panel.userApproved),
          characters,
          locations,
        },
      );
      const uncovered = selectNewDirectionNotes(planned, existingNotes);
      const numbered = numberNewDirectorNotes(uncovered, existingNotes);
      setProposals(numbered.map((proposal) => ({ original: proposal, proposal, edited: false })));
      setNotice(numbered.length > 0
        ? `${numbered.length} grounded direction proposal(s) are ready for review.`
        : scenes.length === 0
          ? "Add screenplay scenes before planning direction notes."
          : "Every scene already has a saved direction note.");
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "Unable to plan direction notes.");
    } finally {
      setPlanning(false);
    }
  }, [productionId]);

  function editProposal(sceneId: string, field: EditableField, value: string) {
    setProposals((current) => current.map((draft) => draft.proposal.sceneId === sceneId
      ? { ...draft, proposal: { ...draft.proposal, [field]: value }, edited: true }
      : draft));
  }

  async function acceptProposal(sceneId: string) {
    const draft = proposals.find((item) => item.proposal.sceneId === sceneId);
    if (!draft) return;
    setSavingSceneId(sceneId);
    setError(null);
    setNotice(null);
    const edits = draft.edited
      ? Object.fromEntries(editableFields.map((field) => [field, draft.proposal[field]])) as Partial<Pick<DirectorNoteProposal, EditableField>>
      : undefined;
    try {
      const accepted = acceptDirectorNoteProposal(draft.original, edits);
      const saved = await directorNoteRepository.create({ ...accepted, productionId, userApproved: true });
      setNotes((current) => [...current, saved].sort((a, b) => a.noteNumber - b.noteNumber));
      setProposals((current) => current.filter((item) => item.proposal.sceneId !== sceneId));
      setNotice(`Saved approved direction note for ${saved.title || `Scene ${saved.noteNumber}`}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the reviewed direction note.");
    } finally {
      setSavingSceneId(undefined);
    }
  }

  function rejectProposal(sceneId: string) {
    setProposals((current) => current.filter((item) => item.proposal.sceneId !== sceneId));
  }

  async function approveNote(note: DirectorNote) {
    if (note.userApproved) return;
    setApprovingNoteId(note.id);
    setError(null);
    try {
      const updated = await directorNoteRepository.update(note.id, { userApproved: true });
      setNotes((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Approved ${updated.title || `Scene ${updated.noteNumber}`}.`);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Unable to approve this direction note.");
    } finally {
      setApprovingNoteId(undefined);
    }
  }

  return {
    notes, proposals, loading, planning, savingSceneId, approvingNoteId, error, notice,
    planNotes, editProposal, acceptProposal, rejectProposal, approveNote,
  };
}
