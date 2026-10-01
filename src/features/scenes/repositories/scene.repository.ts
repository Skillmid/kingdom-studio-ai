import { supabase } from "@/lib/supabase/client";

import type { Scene, SceneCreateInput, SceneUpdateInput } from "../types/scene";
import { fromSceneDatabase, toSceneDatabase, toSceneUpdateDatabase, type SceneRow } from "./scene.mapper";

const TABLE_NAME = "scenes";

export class SceneRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<Scene[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("scene_number", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => fromSceneDatabase(row as SceneRow));
  }

  async getById(id: string): Promise<Scene | null> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return fromSceneDatabase(data as SceneRow);
  }

  async create(scene: SceneCreateInput): Promise<Scene> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(toSceneDatabase(scene))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return fromSceneDatabase(data as SceneRow);
  }

  async createMany(scenes: SceneCreateInput[]): Promise<Scene[]> {
    if (scenes.length === 0) return [];

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(scenes.map((scene) => toSceneDatabase(scene)))
      .select();

    if (error) throw new Error(error.message);
    return ((data ?? []) as SceneRow[]).map(fromSceneDatabase);
  }

  async update(id: string, updates: SceneUpdateInput): Promise<Scene> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(toSceneUpdateDatabase(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return fromSceneDatabase(data as SceneRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const sceneRepository = new SceneRepository();
