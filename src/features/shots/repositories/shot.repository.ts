import { supabase } from "@/lib/supabase/client";

import type {
  CameraAngle,
  CameraMovement,
  Shot,
  ShotFraming,
  ShotProvenance,
  ShotStatus,
  ShotType,
} from "../types/shot";

const TABLE_NAME = "shots";

type ShotRow = {
  id: string;
  production_id: string;
  scene_id: string | null;
  shot_number: number;
  shot_code: string | null;
  shot_type: ShotType;
  framing: ShotFraming;
  camera_angle: CameraAngle | null;
  camera_movement: CameraMovement | null;
  lens: string | null;
  subject: string | null;
  action: string | null;
  dialogue_reference: string | null;
  visual_description: string | null;
  continuity_notes: string | null;
  generation_prompt: string | null;
  source_evidence: string | null;
  character_ids: string[] | null;
  location_id: string | null;
  estimated_duration_seconds: number | null;
  provenance: ShotProvenance;
  user_approved: boolean | null;
  status: ShotStatus;
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export class ShotRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<Shot[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("shot_number", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapShot(row as ShotRow));
  }

  async getById(id: string): Promise<Shot | null> {
    const { data, error } = await this.supabase.from(TABLE_NAME).select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return this.mapShot(data as ShotRow);
  }

  async create(shot: Partial<Shot>): Promise<Shot> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(this.toDatabase(shot))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapShot(data as ShotRow);
  }

  async createMany(shots: Partial<Shot>[]): Promise<Shot[]> {
    if (shots.length === 0) return [];

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(shots.map((shot) => this.toDatabase(shot)))
      .select();

    if (error) throw new Error(error.message);
    return ((data ?? []) as ShotRow[]).map((row) => this.mapShot(row));
  }

  async update(id: string, updates: Partial<Shot>): Promise<Shot> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(this.toDatabase(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapShot(data as ShotRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapShot(data: ShotRow): Shot {
    return {
      id: data.id,
      productionId: data.production_id,
      sceneId: data.scene_id ?? undefined,
      shotNumber: data.shot_number,
      shotCode: data.shot_code ?? undefined,
      shotType: data.shot_type ?? "medium",
      framing: data.framing ?? "MS",
      cameraAngle: data.camera_angle ?? undefined,
      cameraMovement: data.camera_movement ?? undefined,
      lens: data.lens ?? undefined,
      subject: data.subject ?? undefined,
      action: data.action ?? undefined,
      dialogueReference: data.dialogue_reference ?? undefined,
      visualDescription: data.visual_description ?? undefined,
      continuityNotes: data.continuity_notes ?? undefined,
      generationPrompt: data.generation_prompt ?? undefined,
      sourceEvidence: data.source_evidence ?? undefined,
      characterIds: data.character_ids ?? [],
      locationId: data.location_id ?? undefined,
      estimatedDurationSeconds: data.estimated_duration_seconds ?? undefined,
      provenance: data.provenance ?? "user",
      userApproved: data.user_approved ?? false,
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(shot: Partial<Shot>) {
    return {
      production_id: shot.productionId,
      scene_id: shot.sceneId,
      shot_number: shot.shotNumber,
      shot_code: shot.shotCode,
      shot_type: shot.shotType,
      framing: shot.framing,
      camera_angle: shot.cameraAngle,
      camera_movement: shot.cameraMovement,
      lens: shot.lens,
      subject: shot.subject,
      action: shot.action,
      dialogue_reference: shot.dialogueReference,
      visual_description: shot.visualDescription,
      continuity_notes: shot.continuityNotes,
      generation_prompt: shot.generationPrompt,
      source_evidence: shot.sourceEvidence,
      character_ids: shot.characterIds ?? [],
      location_id: shot.locationId,
      estimated_duration_seconds: shot.estimatedDurationSeconds,
      provenance: shot.provenance ?? "user",
      user_approved: shot.userApproved ?? false,
      status: shot.status ?? "draft",
      progress: shot.progress ?? 0,
    };
  }
}

export const shotRepository = new ShotRepository();
