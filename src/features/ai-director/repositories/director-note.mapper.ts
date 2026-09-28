import type { DirectorNote } from "../types/director-note";

export type DirectorNoteRow = {
  id: string;
  production_id: string;
  scene_id: string | null;
  shot_id: string | null;
  panel_id: string | null;
  note_number: number;
  title: string | null;
  scene_intent: string | null;
  blocking: string | null;
  camera: string | null;
  composition: string | null;
  lighting: string | null;
  pacing: string | null;
  sound: string | null;
  emotion: string | null;
  continuity: string | null;
  uncertainty_notes: string | null;
  source_evidence: string | null;
  character_ids: string[] | null;
  location_id: string | null;
  provenance: DirectorNote["provenance"] | null;
  user_approved: boolean | null;
  status: DirectorNote["status"] | null;
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export function toDirectorNoteDatabase(note: Partial<DirectorNote>, defaults = false) {
  const row = {
    production_id: note.productionId,
    scene_id: note.sceneId,
    shot_id: note.shotId,
    panel_id: note.panelId,
    note_number: note.noteNumber,
    title: note.title,
    scene_intent: note.sceneIntent,
    blocking: note.blocking,
    camera: note.camera,
    composition: note.composition,
    lighting: note.lighting,
    pacing: note.pacing,
    sound: note.sound,
    emotion: note.emotion,
    continuity: note.continuity,
    uncertainty_notes: note.uncertaintyNotes,
    source_evidence: note.sourceEvidence,
    character_ids: note.characterIds ?? (defaults ? [] : undefined),
    location_id: note.locationId,
    provenance: note.provenance ?? (defaults ? "user" : undefined),
    user_approved: note.userApproved ?? (defaults ? false : undefined),
    status: note.status ?? (defaults ? "draft" : undefined),
    progress: note.progress ?? (defaults ? 0 : undefined),
  };
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

export function fromDirectorNoteDatabase(row: DirectorNoteRow): DirectorNote {
  return {
    id: row.id,
    productionId: row.production_id,
    sceneId: row.scene_id ?? undefined,
    shotId: row.shot_id ?? undefined,
    panelId: row.panel_id ?? undefined,
    noteNumber: row.note_number,
    title: row.title ?? undefined,
    sceneIntent: row.scene_intent ?? undefined,
    blocking: row.blocking ?? undefined,
    camera: row.camera ?? undefined,
    composition: row.composition ?? undefined,
    lighting: row.lighting ?? undefined,
    pacing: row.pacing ?? undefined,
    sound: row.sound ?? undefined,
    emotion: row.emotion ?? undefined,
    continuity: row.continuity ?? undefined,
    uncertaintyNotes: row.uncertainty_notes ?? undefined,
    sourceEvidence: row.source_evidence ?? undefined,
    characterIds: row.character_ids ?? [],
    locationId: row.location_id ?? undefined,
    provenance: row.provenance ?? "user",
    userApproved: Boolean(row.user_approved),
    status: row.status ?? "draft",
    progress: row.progress ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
