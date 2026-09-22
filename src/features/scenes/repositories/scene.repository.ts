import { supabase } from "@/lib/supabase/client";

import type { Scene } from "../types/scene";

const TABLE_NAME = "scenes";

type SceneRow = {
  id: string;
  production_id: string;
  scene_number: number;
  heading: string;
  scene_type: Scene["sceneType"];
  time_of_day: string | null;
  summary: string | null;
  action: string | null;
  dialogue: string | null;
  character_ids: string[] | null;
  location_id: string | null;
  purpose: string | null;
  emotional_beat: string | null;
  story_beat: string | null;
  visual_direction: string | null;
  props: string[] | null;
  wardrobe: string | null;
  sound_notes: string | null;
  continuity_notes: string | null;
  vfx_notes: string | null;
  production_notes: string | null;
  ai_prompt: string | null;
  source_text: string | null;
  estimated_duration_seconds: number | null;
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
      .order("scene_number", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapScene(row as SceneRow));
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

    return this.mapScene(data as SceneRow);
  }

  async create(scene: Partial<Scene>): Promise<Scene> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(this.toDatabase(scene))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapScene(data as SceneRow);
  }

  async createMany(scenes: Partial<Scene>[]): Promise<Scene[]> {
    if (scenes.length === 0) return [];

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(scenes.map((scene) => this.toDatabase(scene)))
      .select();

    if (error) throw new Error(error.message);
    return ((data ?? []) as SceneRow[]).map((row) => this.mapScene(row));
  }

  async update(id: string, updates: Partial<Scene>): Promise<Scene> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(this.toDatabase(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapScene(data as SceneRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapScene(data: SceneRow): Scene {
    return {
      id: data.id,
      productionId: data.production_id,
      number: data.scene_number,
      heading: data.heading,
      sceneType: data.scene_type ?? "INT",
      timeOfDay: data.time_of_day ?? undefined,
      summary: data.summary ?? undefined,
      action: data.action ?? undefined,
      dialogue: data.dialogue ?? undefined,
      characterIds: data.character_ids ?? [],
      locationId: data.location_id ?? undefined,
      purpose: data.purpose ?? undefined,
      emotionalBeat: data.emotional_beat ?? undefined,
      storyBeat: data.story_beat ?? undefined,
      visualDirection: data.visual_direction ?? undefined,
      props: data.props ?? [],
      wardrobe: data.wardrobe ?? undefined,
      soundNotes: data.sound_notes ?? undefined,
      continuityNotes: data.continuity_notes ?? undefined,
      vfxNotes: data.vfx_notes ?? undefined,
      productionNotes: data.production_notes ?? undefined,
      aiPrompt: data.ai_prompt ?? undefined,
      sourceText: data.source_text ?? undefined,
      estimatedDurationSeconds: data.estimated_duration_seconds ?? undefined,
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
      scene_type: scene.sceneType,
      time_of_day: scene.timeOfDay,
      summary: scene.summary,
      action: scene.action,
      dialogue: scene.dialogue,
      character_ids: scene.characterIds ?? [],
      location_id: scene.locationId,
      purpose: scene.purpose,
      emotional_beat: scene.emotionalBeat,
      story_beat: scene.storyBeat,
      visual_direction: scene.visualDirection,
      props: scene.props ?? [],
      wardrobe: scene.wardrobe,
      sound_notes: scene.soundNotes,
      continuity_notes: scene.continuityNotes,
      vfx_notes: scene.vfxNotes,
      production_notes: scene.productionNotes,
      ai_prompt: scene.aiPrompt,
      source_text: scene.sourceText,
      estimated_duration_seconds: scene.estimatedDurationSeconds,
      status: scene.status ?? "draft",
      progress: scene.progress ?? 0,
    };
  }
}

export const sceneRepository = new SceneRepository();
