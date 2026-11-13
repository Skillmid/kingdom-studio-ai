import { supabase } from "@/lib/supabase/client";

import { fromGenerationJobRow, toGenerationJobDatabase, type GenerationJobRow } from "./asset.mapper";
import type { GenerationJob } from "../types/generation-job";
import {
  acknowledgeUnknownProviderState,
  markStalledJobFailed,
  PROVIDER_STATE_UNKNOWN_AT,
  retryPersistencePatch,
} from "../services/generation-job";

const TABLE_NAME = "generation_jobs";

type JobRow = GenerationJobRow;

type SupabaseLike = Pick<typeof supabase, "from">;

export class GenerationJobRepository {
  private readonly supabase: SupabaseLike;

  constructor(client: SupabaseLike = supabase) {
    this.supabase = client;
  }

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

  /**
   * Explicit creator retry. Conditional on the row still being failed/cancelled so a retry can
   * never resurrect a job another tab already re-queued or completed.
   */
  async requeueForRetry(job: GenerationJob, retried: GenerationJob): Promise<GenerationJob> {
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update(retryPersistencePatch(retried))
      .eq("id", job.id)
      .in("status", ["failed", "cancelled"])
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("This job changed in another tab or request. Refresh to see its current status.");
    return this.mapJob(data as JobRow);
  }

  /**
   * Marks a stalled running job (see isStalledJob) as failed with an UNKNOWN provider state.
   *
   * Conditional, without relying on any updated_at trigger: the row must still be `running`, still
   * have the same server-written `started_at` (so a retried/re-claimed attempt is never touched), and
   * still have no provider task ID (so a task ID saved late by the server is never overwritten).
   * Ownership is enforced by RLS. It never re-queues or retries the job.
   */
  async markStalledFailed(job: GenerationJob, now: number): Promise<GenerationJob> {
    const failed = markStalledJobFailed(job, now);
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update({
        status: failed.status,
        error_message: failed.errorMessage,
        completed_at: failed.completedAt,
        parameters: failed.parameters,
      })
      .eq("id", job.id)
      .eq("status", "running")
      .eq("started_at", job.startedAt as string)
      .is("parameters->>providerJobId", null)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("This job changed after it was loaded (for example the provider result was saved). Refresh to see its current status.");
    return this.mapJob(data as JobRow);
  }

  /**
   * Explicit creator confirmation (after checking the provider dashboard) that a job whose provider
   * state was unknown may be followed by a new paid attempt. Conditional on the row still carrying
   * the same unknown-state marker, so it cannot confirm a newer unknown request by accident.
   */
  async confirmProviderChecked(job: GenerationJob, confirmedAt: string): Promise<GenerationJob> {
    const confirmed = acknowledgeUnknownProviderState(job, confirmedAt);
    const { data, error } = await this.supabase
      .from(TABLE_NAME)
      .update({ parameters: confirmed.parameters })
      .eq("id", job.id)
      .in("status", ["failed", "queued"])
      .eq(`parameters->>${PROVIDER_STATE_UNKNOWN_AT}`, String(job.parameters[PROVIDER_STATE_UNKNOWN_AT]))
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("This job changed in another tab or request. Refresh to see its current status.");
    return this.mapJob(data as JobRow);
  }

  private mapJob(data: JobRow): GenerationJob {
    return fromGenerationJobRow(data);
  }

}

export const generationJobRepository = new GenerationJobRepository();
