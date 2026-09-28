import { supabase } from "@/lib/supabase/client";
import {
  fromScreenplayAnalysisDatabase,
  toScreenplayAnalysisDatabase,
  type ScreenplayAnalysisRecord,
  type ScreenplayAnalysisRow,
} from "./screenplay-analysis.mapper";

export class ScreenplayAnalysisRepository {
  private readonly supabase = supabase;

  async getLatestByRevisionId(revisionId: string): Promise<ScreenplayAnalysisRecord | null> {
    const { data, error } = await this.supabase
      .from("screenplay_analyses")
      .select("*")
      .eq("revision_id", revisionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromScreenplayAnalysisDatabase(data as ScreenplayAnalysisRow) : null;
  }

  async create(record: Omit<ScreenplayAnalysisRecord, "id" | "createdAt">): Promise<ScreenplayAnalysisRecord> {
    const { data, error } = await this.supabase
      .from("screenplay_analyses")
      .insert(toScreenplayAnalysisDatabase(record))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromScreenplayAnalysisDatabase(data as ScreenplayAnalysisRow);
  }
}

export const screenplayAnalysisRepository = new ScreenplayAnalysisRepository();
