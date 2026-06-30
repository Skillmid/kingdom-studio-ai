import { supabase } from "@/lib/supabase/client";

import type { Production } from "../types/production";
import type { CreateProductionDTO } from "../validation/production.schema";

export class ProductionRepository {
  async create(dto: CreateProductionDTO) {
    console.log("================================");
    console.log("Creating Production...");
    console.log("DTO:", dto);

    const { data, error } = await supabase
      .from("productions")
      .insert(dto)
      .select()
      .single();

    console.log("Supabase Response");
    console.log("Data:", data);
    console.log("Error:", error);
    console.log("================================");

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

    return data as Production[];
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

  async delete(id: string) {
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
}

export const productionRepository =
  new ProductionRepository();