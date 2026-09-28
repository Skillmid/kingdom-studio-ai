import { supabase } from "@/lib/supabase/client";
import {
  fromScreenplayReviewDatabase,
  toScreenplayReviewDatabase,
  type FocusedReviewType,
  type ScreenplayReviewRecord,
  type ScreenplayReviewRow,
} from "./screenplay-review.mapper";

export class ScreenplayReviewRepository {
  private readonly supabase = supabase;

  async getByRevisionId(revisionId: string): Promise<ScreenplayReviewRecord[]> {
    const { data, error } = await this.supabase
      .from("screenplay_reviews")
      .select("*")
      .eq("revision_id", revisionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as ScreenplayReviewRow[]).map(fromScreenplayReviewDatabase);
  }

  async create(record: Omit<ScreenplayReviewRecord, "id" | "createdAt">): Promise<ScreenplayReviewRecord> {
    const { data, error } = await this.supabase
      .from("screenplay_reviews")
      .insert(toScreenplayReviewDatabase(record))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromScreenplayReviewDatabase(data as ScreenplayReviewRow);
  }
}

export const screenplayReviewRepository = new ScreenplayReviewRepository();
export type { FocusedReviewType };
