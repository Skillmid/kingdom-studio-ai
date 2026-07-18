import { supabase } from "@/lib/supabase/client";

import type { StoryBible } from "../types/story-bible";
import type { StoryBibleDTO } from "../validation/story-bible.schema";

function throwSupabaseError(error: {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}): never {
  throw new Error(
    [
      error.code,
      error.message,
      error.details,
      error.hint,
    ]
      .filter(Boolean)
      .join(" | ")
  );
}

export class StoryBibleRepository {
  async create(
    productionId: string,
    dto: StoryBibleDTO
  ) {
    const payload = {
      production_id: productionId,
      ...dto,
    };

    const { data, error } = await supabase
      .from("story_bibles")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as StoryBible;
  }

  async getByProductionId(
    productionId: string
  ) {
    const { data, error } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("production_id", productionId)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return data as StoryBible | null;
  }

  async update(
    id: string,
    updates: Partial<StoryBibleDTO>
  ) {
    const { data, error } = await supabase
      .from("story_bibles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as StoryBible;
  }

  async upsert(
    productionId: string,
    dto: StoryBibleDTO
  ) {
    const existing =
      await this.getByProductionId(
        productionId
      );

    if (!existing) {
      return this.create(
        productionId,
        dto
      );
    }

    return this.update(
      existing.id,
      dto
    );
  }

  async delete(id: string) {
    const { error } = await supabase
      .from("story_bibles")
      .delete()
      .eq("id", id);

    if (error) {
      throwSupabaseError(error);
    }
  }
}

export const storyBibleRepository =
  new StoryBibleRepository();