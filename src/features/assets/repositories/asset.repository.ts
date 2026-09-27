import { supabase } from "@/lib/supabase/client";
import type { Asset, AssetKind, AssetProvenance, AssetSourceKind, AssetStatus } from "../types/asset";

const TABLE_NAME = "assets";

type AssetRow = {
  id: string;
  production_id: string;
  scene_id: string | null;
  shot_id: string | null;
  panel_id: string | null;
  character_id: string | null;
  location_id: string | null;
  director_note_id: string | null;
  kind: AssetKind;
  title: string | null;
  description: string | null;
  prompt: string | null;
  file_url: string | null;
  mime_type: string | null;
  source_kind: AssetSourceKind;
  source_id: string | null;
  uncertainty_notes: string | null;
  source_evidence: string | null;
  provenance: AssetProvenance;
  user_approved: boolean | null;
  status: AssetStatus;
  progress: number | null;
  created_at: string;
  updated_at: string;
};

export class AssetRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<Asset[]> {
    const { data, error } = await this.supabase.from(TABLE_NAME).select("*").eq("production_id", productionId).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapAsset(row as AssetRow));
  }
  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(this.toDatabase(asset)).select().single();
    if (error) throw new Error(error.message);
    return this.mapAsset(data as AssetRow);
  }
  async createMany(assets: Partial<Asset>[]): Promise<Asset[]> {
    if (assets.length === 0) return [];
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(assets.map((asset) => this.toDatabase(asset))).select();
    if (error) throw new Error(error.message);
    return ((data ?? []) as AssetRow[]).map((row) => this.mapAsset(row));
  }
  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await this.supabase.from(TABLE_NAME).update(this.toDatabase(updates)).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return this.mapAsset(data as AssetRow);
  }
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  private mapAsset(data: AssetRow): Asset {
    return {
      id: data.id,
      productionId: data.production_id,
      sceneId: data.scene_id ?? undefined,
      shotId: data.shot_id ?? undefined,
      panelId: data.panel_id ?? undefined,
      characterId: data.character_id ?? undefined,
      locationId: data.location_id ?? undefined,
      directorNoteId: data.director_note_id ?? undefined,
      kind: data.kind,
      title: data.title ?? undefined,
      description: data.description ?? undefined,
      prompt: data.prompt ?? undefined,
      fileUrl: data.file_url ?? undefined,
      mimeType: data.mime_type ?? undefined,
      sourceKind: data.source_kind,
      sourceId: data.source_id ?? undefined,
      uncertaintyNotes: data.uncertainty_notes ?? undefined,
      sourceEvidence: data.source_evidence ?? undefined,
      provenance: data.provenance,
      userApproved: Boolean(data.user_approved),
      status: data.status,
      progress: data.progress ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
  private toDatabase(asset: Partial<Asset>) {
    return {
      production_id: asset.productionId,
      scene_id: asset.sceneId,
      shot_id: asset.shotId,
      panel_id: asset.panelId,
      character_id: asset.characterId,
      location_id: asset.locationId,
      director_note_id: asset.directorNoteId,
      kind: asset.kind,
      title: asset.title,
      description: asset.description,
      prompt: asset.prompt,
      file_url: asset.fileUrl,
      mime_type: asset.mimeType,
      source_kind: asset.sourceKind ?? "user",
      source_id: asset.sourceId,
      uncertainty_notes: asset.uncertaintyNotes,
      source_evidence: asset.sourceEvidence,
      provenance: asset.provenance ?? "user",
      user_approved: asset.userApproved ?? false,
      status: asset.status ?? "draft",
      progress: asset.progress ?? 0,
    };
  }
}

export const assetRepository = new AssetRepository();
