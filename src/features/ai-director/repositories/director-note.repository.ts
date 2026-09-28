import { supabase } from "@/lib/supabase/client";
import { directorNoteSchema } from "../validation/director-note.schema";
import type { DirectorNote } from "../types/director-note";
import { fromDirectorNoteDatabase, toDirectorNoteDatabase, type DirectorNoteRow } from "./director-note.mapper";

export class DirectorNoteRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<DirectorNote[]> {
    const { data, error } = await this.supabase
      .from("director_notes")
      .select("*")
      .eq("production_id", productionId)
      .order("note_number");
    if (error) throw new Error(error.message);
    return ((data ?? []) as DirectorNoteRow[]).map(fromDirectorNoteDatabase);
  }

  async create(note: Partial<DirectorNote>): Promise<DirectorNote> {
    const validated = directorNoteSchema.parse(note);
    const { data, error } = await this.supabase
      .from("director_notes")
      .insert(toDirectorNoteDatabase(validated, true))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromDirectorNoteDatabase(data as DirectorNoteRow);
  }

  async update(id: string, updates: Partial<DirectorNote>): Promise<DirectorNote> {
    const validated = directorNoteSchema.partial().parse(updates);
    const { data, error } = await this.supabase
      .from("director_notes")
      .update(toDirectorNoteDatabase(validated))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromDirectorNoteDatabase(data as DirectorNoteRow);
  }
}

export const directorNoteRepository = new DirectorNoteRepository();
