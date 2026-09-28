import { supabase } from "@/lib/supabase/client";
import type { ExportPackage, RenderClip, RenderSequence } from "../types/render";
import {
  fromExportPackageDatabase,
  fromRenderClipDatabase,
  fromRenderSequenceDatabase,
  type ExportPackageRow,
  type RenderClipRow,
  type RenderSequenceRow,
  toExportPackageDatabase,
  toRenderClipDatabase,
  toRenderSequenceDatabase,
} from "./render.mapper";

export class RenderRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<RenderSequence[]> {
    const { data, error } = await this.supabase.from("render_sequences").select("*").eq("production_id", productionId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as RenderSequenceRow[]).map(fromRenderSequenceDatabase);
  }
  async create(sequence: Partial<RenderSequence>): Promise<RenderSequence> {
    const { data, error } = await this.supabase.from("render_sequences").insert(toRenderSequenceDatabase(sequence, true)).select().single();
    if (error) throw new Error(error.message);
    return fromRenderSequenceDatabase(data as RenderSequenceRow);
  }
  async update(id: string, updates: Partial<RenderSequence>): Promise<RenderSequence> {
    const { data, error } = await this.supabase.from("render_sequences").update(toRenderSequenceDatabase(updates)).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return fromRenderSequenceDatabase(data as RenderSequenceRow);
  }
}

export class RenderClipRepository {
  private readonly supabase = supabase;
  async getByRenderId(renderId: string): Promise<RenderClip[]> {
    const { data, error } = await this.supabase.from("render_clips").select("*").eq("render_id", renderId).order("sequence_number");
    if (error) throw new Error(error.message);
    return ((data ?? []) as RenderClipRow[]).map(fromRenderClipDatabase);
  }
  async createMany(clips: Partial<RenderClip>[]): Promise<RenderClip[]> {
    if (clips.length === 0) return [];
    const { data, error } = await this.supabase.from("render_clips").insert(clips.map((clip) => toRenderClipDatabase(clip, true))).select();
    if (error) throw new Error(error.message);
    return ((data ?? []) as RenderClipRow[]).map(fromRenderClipDatabase);
  }
  async update(id: string, updates: Partial<RenderClip>): Promise<RenderClip> {
    const { data, error } = await this.supabase.from("render_clips").update(toRenderClipDatabase(updates)).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return fromRenderClipDatabase(data as RenderClipRow);
  }
}

export class ExportPackageRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<ExportPackage[]> {
    const { data, error } = await this.supabase.from("export_packages").select("*").eq("production_id", productionId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as ExportPackageRow[]).map(fromExportPackageDatabase);
  }
  async create(item: Partial<ExportPackage>): Promise<ExportPackage> {
    const { data, error } = await this.supabase.from("export_packages").insert(toExportPackageDatabase(item, true)).select().single();
    if (error) throw new Error(error.message);
    return fromExportPackageDatabase(data as ExportPackageRow);
  }
}

export const renderRepository = new RenderRepository();
export const renderClipRepository = new RenderClipRepository();
export const exportPackageRepository = new ExportPackageRepository();
