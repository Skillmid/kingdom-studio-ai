import { supabase } from "@/lib/supabase/client";

import type { Production } from "../types/production";
import type { CreateProductionDTO } from "../validation/production.schema";

function throwSupabaseError(error: {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}): never {
  // The message format is unchanged; code and details are also kept on the Error so callers can
  // recognise specific database errors (for example a slug unique violation) without parsing text.
  throw Object.assign(
    new Error(
      [
        error.code,
        error.message,
        error.details,
        error.hint,
      ]
        .filter(Boolean)
        .join(" | ")
    ),
    { code: error.code, details: error.details ?? undefined },
  );
}

type SupabaseLike = Pick<typeof supabase, "from">;

export class ProductionRepository {
  private readonly supabase: SupabaseLike;

  constructor(client: SupabaseLike = supabase) {
    this.supabase = client;
  }

  async create(dto: CreateProductionDTO) {
    const { data, error } = await this.supabase
      .from("productions")
      .insert(dto)
      .select()
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as Production;
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from("productions")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as Production[];
  }

  async getArchived() {
    const { data, error } = await this.supabase
      .from("productions")
      .select("*")
      .not("deleted_at", "is", null)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as Production[];
  }

  async getAllIncludingArchived() {
    const { data, error } = await this.supabase
      .from("productions")
      .select("*")
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as Production[];
  }

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from("productions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as Production;
  }

  async update(
    id: string,
    updates: Partial<Production>
  ) {
    // Strip immutable primary identity and ownership fields to prevent accidental or malicious reassignment
    const safeUpdates: Partial<Production> = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.owner_id;
    delete safeUpdates.created_by;

    const { data, error } = await this.supabase
      .from("productions")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as Production;
  }

  async rename(
    id: string,
    title: string
  ) {
    return this.update(id, {
      title,
    });
  }

  async duplicate(id: string) {
    const original =
      await this.getById(id);

    const unique =
      Date.now().toString();

    const duplicate = {
      owner_id: original.owner_id,
      created_by: original.created_by,

      title: `${original.title} Copy`,

      slug: `${original.slug}-copy-${unique}`,

      logline: original.logline,
      synopsis: original.synopsis,

      genre: original.genre,
      target_audience:
        original.target_audience,

      art_style:
        original.art_style,

      language:
        original.language,

      aspect_ratio:
        original.aspect_ratio,

      target_duration_seconds:
        original.target_duration_seconds,

      cover_image_url:
        original.cover_image_url,

      status: "concept",

      visibility:
        original.visibility,

      last_opened_at: null,

      deleted_at: null,
    };

    const { data, error } =
      await this.supabase
        .from("productions")
        .insert(duplicate)
        .select()
        .single();

    if (error) {
      throwSupabaseError(error);
    }

    return data as Production;
  }

  async archive(id: string) {
    const { error } =
      await this.supabase
        .from("productions")
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      throwSupabaseError(error);
    }
  }

  async restore(id: string) {
    const { error } =
      await this.supabase
        .from("productions")
        .update({
          deleted_at: null,
        })
        .eq("id", id);

    if (error) {
      throwSupabaseError(error);
    }
  }

  async deleteForever(id: string) {
    const { error } =
      await this.supabase
        .from("productions")
        .delete()
        .eq("id", id);

    if (error) {
      throwSupabaseError(error);
    }
  }

  async delete(id: string) {
    return this.archive(id);
  }
}

export const productionRepository =
  new ProductionRepository();