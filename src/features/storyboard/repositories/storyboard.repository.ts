import { supabase } from "@/lib/supabase/client";

import type { StoryboardPanel } from "../types/storyboard-panel";

const TABLE_NAME = "storyboard_panels";

type PanelRow = {
  id: string;
  production_id: string;
  scene_id: string | null;
  shot_id: string | null;
  panel_number: number;
  title: string | null;
  visual_description: string | null;
  composition: string | null;
  continuity_notes: string | null;
  generation_prompt: string | null;
  image_url: string | null;
  source_evidence: string | null;
  character_ids: string[] | null;
  location_id: string | null;
  provenance: StoryboardPanel["provenance"];
  user_approved: boolean | null;
  status: StoryboardPanel["status"];
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export class StoryboardRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<StoryboardPanel[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("panel_number", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapPanel(row as PanelRow));
  }

  async create(panel: Partial<StoryboardPanel>): Promise<StoryboardPanel> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(this.toDatabase(panel))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapPanel(data as PanelRow);
  }

  async createMany(panels: Partial<StoryboardPanel>[]): Promise<StoryboardPanel[]> {
    if (panels.length === 0) return [];

    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .insert(panels.map((panel) => this.toDatabase(panel)))
      .select();

    if (error) throw new Error(error.message);
    return ((data ?? []) as PanelRow[]).map((row) => this.mapPanel(row));
  }

  async update(id: string, updates: Partial<StoryboardPanel>): Promise<StoryboardPanel> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(this.toDatabase(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapPanel(data as PanelRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  private mapPanel(data: PanelRow): StoryboardPanel {
    return {
      id: data.id,
      productionId: data.production_id,
      sceneId: data.scene_id ?? undefined,
      shotId: data.shot_id ?? undefined,
      panelNumber: data.panel_number,
      title: data.title ?? undefined,
      visualDescription: data.visual_description ?? undefined,
      composition: data.composition ?? undefined,
      continuityNotes: data.continuity_notes ?? undefined,
      generationPrompt: data.generation_prompt ?? undefined,
      imageUrl: data.image_url ?? undefined,
      sourceEvidence: data.source_evidence ?? undefined,
      characterIds: data.character_ids ?? [],
      locationId: data.location_id ?? undefined,
      provenance: data.provenance,
      userApproved: data.user_approved ?? false,
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private toDatabase(panel: Partial<StoryboardPanel>) {
    const row: Record<string, unknown> = {};
    if (panel.productionId !== undefined) row.production_id = panel.productionId;
    if (panel.sceneId !== undefined) row.scene_id = panel.sceneId || null;
    if (panel.shotId !== undefined) row.shot_id = panel.shotId || null;
    if (panel.panelNumber !== undefined) row.panel_number = panel.panelNumber;
    if (panel.title !== undefined) row.title = panel.title || null;
    if (panel.visualDescription !== undefined) row.visual_description = panel.visualDescription || null;
    if (panel.composition !== undefined) row.composition = panel.composition || null;
    if (panel.continuityNotes !== undefined) row.continuity_notes = panel.continuityNotes || null;
    if (panel.generationPrompt !== undefined) row.generation_prompt = panel.generationPrompt || null;
    if (panel.imageUrl !== undefined) row.image_url = panel.imageUrl || null;
    if (panel.sourceEvidence !== undefined) row.source_evidence = panel.sourceEvidence || null;
    if (panel.characterIds !== undefined) row.character_ids = panel.characterIds;
    if (panel.locationId !== undefined) row.location_id = panel.locationId || null;
    if (panel.provenance !== undefined) row.provenance = panel.provenance;
    if (panel.userApproved !== undefined) row.user_approved = panel.userApproved;
    if (panel.status !== undefined) row.status = panel.status;
    if (panel.progress !== undefined) row.progress = panel.progress;
    return row;
  }
}

export const storyboardRepository = new StoryboardRepository();
