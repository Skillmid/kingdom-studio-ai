import { supabase } from "@/lib/supabase/client";

import { toGenerationJobDatabase } from "./asset.mapper";
import type {
  GenerationJob,
  GenerationJobStatus,
  GenerationJobType,
  GenerationSourceEntityType,
} from "../types/generation-job";

const TABLE_NAME = "generation_jobs";

type JobRow = {
  id: string;
  production_id: string;
  asset_id: string | null;
  job_type: GenerationJobType;
  status: GenerationJobStatus;
  provider: string | null;
  model: string | null;
  prompt: string | null;
  parameters: Record<string, unknown> | null;
  source_entity_type: GenerationSourceEntityType | null;
  source_entity_id: string | null;
  output_url: string | null;
  error_message: string | null;
  attempt_count: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export class GenerationJobRepository {
  private readonly supabase = supabase;

  async getByProductionId(productionId: string): Promise<GenerationJob[]> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("production_id", productionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapJob(row as JobRow));
  }

  async create(job: Partial<GenerationJob>): Promise<GenerationJob> {
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(toGenerationJobDatabase(job, { includeDefaults: true })).select().single();
    if (error) throw new Error(error.message);
    return this.mapJob(data as JobRow);
  }

  async createMany(jobs: Partial<GenerationJob>[]): Promise<GenerationJob[]> {
    if (jobs.length === 0) return [];
    const { data, error } = await this.supabase.from(TABLE_NAME).insert(jobs.map((job) => toGenerationJobDatabase(job, { includeDefaults: true }))).select();
    if (error) throw new Error(error.message);
    return ((data ?? []) as JobRow[]).map((row) => this.mapJob(row));
  }

  async update(id: string, updates: Partial<GenerationJob>): Promise<GenerationJob> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(toGenerationJobDatabase(updates))
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.mapJob(data as JobRow);
  }

  private mapJob(data: JobRow): GenerationJob {
    return {
      id: data.id,
      productionId: data.production_id,
      assetId: data.asset_id ?? undefined,
      jobType: data.job_type,
      status: data.status,
      provider: data.provider ?? undefined,
      model: data.model ?? undefined,
      prompt: data.prompt ?? undefined,
      parameters: data.parameters ?? {},
      sourceEntityType: data.source_entity_type ?? undefined,
      sourceEntityId: data.source_entity_id ?? undefined,
      outputUrl: data.output_url ?? undefined,
      errorMessage: data.error_message ?? undefined,
      attemptCount: data.attempt_count ?? 0,
      startedAt: data.started_at ?? undefined,
      completedAt: data.completed_at ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

}

export const generationJobRepository = new GenerationJobRepository();
