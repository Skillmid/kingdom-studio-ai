import { supabase } from "@/lib/supabase/client";

import type { Production } from "../types/production";
import type { CreateProductionDTO } from "../validation/production.schema";

export class ProductionRepository {
  async create(dto: CreateProductionDTO) {
    const { data, error } = await supabase
      .from("productions")
      .insert(dto)
      .select()
      .single();

    if (error) {
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

    return data as Production;
  }

  async getAll() {
    const { data, error } = await supabase
      .from("productions")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []) as Production[];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from("productions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data as Production;
  }

  async update(
    id: string,
    updates: Partial<Production>
  ) {
    const { data, error } = await supabase
      .from("productions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
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
    const production =
      await this.getById(id);

    const duplicate = {
      ...production,
      title: `${production.title} Copy`,
    };

    delete (duplicate as Record<string, unknown>).id;
    delete (duplicate as Record<string, unknown>).created_at;
    delete (duplicate as Record<string, unknown>).updated_at;

    const { data, error } = await supabase
      .from("productions")
      .insert(duplicate)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Production;
  }

  async archive(id: string) {
    const { error } = await supabase
      .from("productions")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  async restore(id: string) {
    const { error } = await supabase
      .from("productions")
      .update({
        deleted_at: null,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  async archiveAll() {
    const { error } = await supabase
      .from("productions")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .is("deleted_at", null);

    if (error) {
      throw error;
    }
  }

  async delete(id: string) {
    return this.archive(id);
  }
}

export const productionRepository =
  new ProductionRepository();