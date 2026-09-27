import { supabase } from "@/lib/supabase/client";
import type { ExportPackage, RenderClip, RenderSequence } from "../types/render";

export class RenderRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<RenderSequence[]> {
    const { data, error } = await this.supabase.from("render_sequences").select("*").eq("production_id", productionId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as RenderSequence[];
  }
  async create(sequence: Partial<RenderSequence>): Promise<RenderSequence> {
    const { data, error } = await this.supabase.from("render_sequences").insert({
      production_id: sequence.productionId,
      title: sequence.title,
      status: sequence.status ?? "draft",
      progress: sequence.progress ?? 0,
      item_count: sequence.itemCount ?? 0,
      ready_item_count: sequence.readyItemCount ?? 0,
      missing_media_count: sequence.missingMediaCount ?? 0,
      total_duration_seconds: sequence.totalDurationSeconds ?? 0,
      uncertainty_notes: sequence.uncertaintyNotes,
      source_evidence: sequence.sourceEvidence,
      provenance: sequence.provenance ?? "user",
      user_approved: sequence.userApproved ?? false,
    }).select().single();
    if (error) throw new Error(error.message);
    return data as RenderSequence;
  }
}

export class RenderClipRepository {
  private readonly supabase = supabase;
  async getByRenderId(renderId: string): Promise<RenderClip[]> {
    const { data, error } = await this.supabase.from("render_clips").select("*").eq("render_id", renderId).order("sequence_number");
    if (error) throw new Error(error.message);
    return (data ?? []) as RenderClip[];
  }
}

export class ExportPackageRepository {
  private readonly supabase = supabase;
  async getByProductionId(productionId: string): Promise<ExportPackage[]> {
    const { data, error } = await this.supabase.from("export_packages").select("*").eq("production_id", productionId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ExportPackage[];
  }
}

export const renderRepository = new RenderRepository();
export const renderClipRepository = new RenderClipRepository();
export const exportPackageRepository = new ExportPackageRepository();
