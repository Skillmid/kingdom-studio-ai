import { supabase } from "@/lib/supabase/client";

import type { Scene } from "../types/scene";

const TABLE_NAME = "scenes";

type SceneRow = {
  id: string;
  production_id: string;
  scene_number: number;
  heading: string;
  summary: string | null;
  character_ids: string[] | null;
  location_id: string | null;
  status: Scene["status"];
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export class SceneRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<Scene[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("scene_number", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      this.mapScene(row as SceneRow)
    );
  }

  async getById(id: string): Promise<Scene | null> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(error.message);
    }

    return this.mapScene(data as SceneRow);
  }

  async create(scene: Partial<Scene>): Promise<Scene> {
    const payload = this.toDatabase(scene);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapScene(data as SceneRow);
  }

  async createMany(scenes: Partial<Scene>[]): Promise<Scene[]> {
    if (scenes.length === 0) {
      return [];
    }

    const payloads = scenes.map((scene) => this.toDatabase(scene));

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(payloads)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as SceneRow[]).map((row) =>
      this.mapScene(row)
    );
  }

  async update(
    id: string,
    updates: Partial<Scene>
  ): Promise<Scene> {
    const payload = this.toDatabase(updates);

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapScene(data as SceneRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapScene(data: SceneRow): Scene {
    return {
      id: data.id,
      productionId: data.production_id,
      number: data.scene_number,
      heading: data.heading,
      summary: data.summary ?? undefined,
      characterIds: data.character_ids ?? [],
      locationId: data.location_id ?? undefined,
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(scene: Partial<Scene>) {
    return {
      production_id: scene.productionId,
      scene_number: scene.number,
      heading: scene.heading,
      summary: scene.summary,
      character_ids: scene.characterIds ?? [],
      location_id: scene.locationId,
      status: scene.status ?? "draft",
      progress: scene.progress ?? 0,
    };
  }
}

export const sceneRepository = new SceneRepository();
