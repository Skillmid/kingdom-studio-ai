import type { Scene } from "../types/scene";

export interface SceneRow {
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
  source_screenplay_id: string | null;
  source_revision_id: string | null;
  source_screenplay_version: number | null;
  estimated_duration_seconds: number | null;
  status: Scene["status"];
  progress: number | null;
  created_at: string;
  updated_at: string;
}

export function fromSceneDatabase(data: SceneRow): Scene {
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
    sourceScreenplayId: data.source_screenplay_id ?? undefined,
    sourceRevisionId: data.source_revision_id ?? undefined,
    sourceScreenplayVersion: data.source_screenplay_version ?? undefined,
    estimatedDurationSeconds: data.estimated_duration_seconds ?? undefined,
    status: data.status,
    progress: data.progress ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function toSceneDatabase(scene: Partial<Scene>): Record<string, unknown> {
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
    source_screenplay_id: scene.sourceScreenplayId,
    source_revision_id: scene.sourceRevisionId,
    source_screenplay_version: scene.sourceScreenplayVersion,
    estimated_duration_seconds: scene.estimatedDurationSeconds,
    status: scene.status ?? "draft",
    progress: scene.progress ?? 0,
  };
}
