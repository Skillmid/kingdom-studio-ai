import { supabase } from "@/lib/supabase/client";
import type { DirectorNote } from "../types/director-note";

export class DirectorNoteRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<DirectorNote[]> {
    const { data, error } = await this.supabase.from("director_notes").select("*").eq("production_id", productionId).order("note_number");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      productionId: String(row.production_id),
      noteNumber: Number(row.note_number),
      title: (row.title as string | null) ?? undefined,
      sceneIntent: (row.scene_intent as string | null) ?? undefined,
      blocking: (row.blocking as string | null) ?? undefined,
      camera: (row.camera as string | null) ?? undefined,
      composition: (row.composition as string | null) ?? undefined,
      lighting: (row.lighting as string | null) ?? undefined,
      pacing: (row.pacing as string | null) ?? undefined,
      sound: (row.sound as string | null) ?? undefined,
      emotion: (row.emotion as string | null) ?? undefined,
      continuity: (row.continuity as string | null) ?? undefined,
      uncertaintyNotes: (row.uncertainty_notes as string | null) ?? undefined,
      sourceEvidence: (row.source_evidence as string | null) ?? undefined,
      characterIds: (row.character_ids as string[] | null) ?? [],
      provenance: (row.provenance as DirectorNote["provenance"]) ?? "user",
      userApproved: Boolean(row.user_approved),
      status: (row.status as DirectorNote["status"]) ?? "draft",
      progress: Number(row.progress ?? 0),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }
}

export const directorNoteRepository = new DirectorNoteRepository();
