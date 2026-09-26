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
  location_id: string | null;
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
      shotType: data.shot_type,
      framing: data.framing,
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
      provenance: data.provenance,
      userApproved: Boolean(data.user_approved),
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(shot: Partial<Shot>) {
    const row: Record<string, unknown> = {};
    if (shot.productionId !== undefined) row.production_id = shot.productionId;
    if (shot.sceneId !== undefined) row.scene_id = shot.sceneId;
    if (shot.locationId !== undefined) row.location_id = shot.locationId;
    if (shot.shotNumber !== undefined) row.shot_number = shot.shotNumber;
    if (shot.shotCode !== undefined) row.shot_code = shot.shotCode;
    if (shot.shotType !== undefined) row.shot_type = shot.shotType;
    if (shot.framing !== undefined) row.framing = shot.framing;
    if (shot.cameraAngle !== undefined) row.camera_angle = shot.cameraAngle;
    if (shot.cameraMovement !== undefined) row.camera_movement = shot.cameraMovement;
    if (shot.lens !== undefined) row.lens = shot.lens;
    if (shot.subject !== undefined) row.subject = shot.subject;
    if (shot.action !== undefined) row.action = shot.action;
    if (shot.dialogueReference !== undefined) row.dialogue_reference = shot.dialogueReference;
    if (shot.visualDescription !== undefined) row.visual_description = shot.visualDescription;
    if (shot.continuityNotes !== undefined) row.continuity_notes = shot.continuityNotes;
    if (shot.generationPrompt !== undefined) row.generation_prompt = shot.generationPrompt;
    if (shot.sourceEvidence !== undefined) row.source_evidence = shot.sourceEvidence;
    if (shot.characterIds !== undefined) row.character_ids = shot.characterIds;
    if (shot.estimatedDurationSeconds !== undefined) {
      row.estimated_duration_seconds = shot.estimatedDurationSeconds;
    }
    if (shot.provenance !== undefined) row.provenance = shot.provenance;
    if (shot.userApproved !== undefined) row.user_approved = shot.userApproved;
    if (shot.status !== undefined) row.status = shot.status;
    if (shot.progress !== undefined) row.progress = shot.progress;
    return row;
  }
}

export const shotRepository = new ShotRepository();
