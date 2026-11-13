import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { bearerToken, readJsonBody } from "@/lib/http/json-body";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  fromAssetRow,
  fromGenerationJobRow,
  toAssetPatchDatabase,
  toJobResultDatabase,
  type AssetRow,
  type GenerationJobRow,
} from "@/features/assets/repositories/asset.mapper";
import { runPersistedGenerationJob, type PersistedJobStore } from "@/platform/generation/run-persisted-job";

// Provider calls are capped at PROVIDER_REQUEST_TIMEOUT_MS (45s); leave headroom for claim + persistence.
export const maxDuration = 60;

const MAX_BODY_BYTES = 4 * 1024;
const bodySchema = z.object({ jobId: z.string().uuid() });

function createSupabaseJobStore(supabase: SupabaseClient): PersistedJobStore {
  return {
    async loadJob(jobId) {
      const { data, error } = await supabase.from("generation_jobs").select("*").eq("id", jobId).maybeSingle();
      if (error) throw new Error("Unable to load generation job.");
      return data ? fromGenerationJobRow(data as GenerationJobRow) : null;
    },
    async loadAsset(assetId) {
      const { data, error } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
      if (error) throw new Error("Unable to verify asset approval.");
      return data ? fromAssetRow(data as AssetRow) : null;
    },
    async loadAssetJobs(assetId) {
      const { data, error } = await supabase.from("generation_jobs").select("*").eq("asset_id", assetId);
      if (error) throw new Error("Unable to load generation jobs for this asset.");
      return ((data ?? []) as GenerationJobRow[]).map((row) => fromGenerationJobRow(row));
    },
    async claimQueuedJob(job, startedAt) {
      // Atomic claim: only one request can move this row out of "queued".
      const { data, error } = await supabase
        .from("generation_jobs")
        .update({
          status: "running",
          started_at: startedAt,
          completed_at: null,
          error_message: null,
          output_url: null,
          attempt_count: job.attemptCount + 1,
        })
        .eq("id", job.id)
        .eq("status", "queued")
        .eq("attempt_count", job.attemptCount)
        .select("*")
        .maybeSingle();
      if (error) throw new Error("Unable to claim generation job.");
      return data ? fromGenerationJobRow(data as GenerationJobRow) : null;
    },
    async saveJobResult(job) {
      const { data, error } = await supabase
        .from("generation_jobs")
        .update(toJobResultDatabase(job))
        .eq("id", job.id)
        .eq("status", "running")
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? fromGenerationJobRow(data as GenerationJobRow) : null;
    },
    async updateAsset(assetId, patch) {
      const { data, error } = await supabase
        .from("assets")
        .update(toAssetPatchDatabase(patch))
        .eq("id", assetId)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? fromAssetRow(data as AssetRow) : null;
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, MAX_BODY_BYTES);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
    const parsed = bodySchema.safeParse(body.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "A persisted generation job ID is required." }, { status: 400 });
    }

    const accessToken = bearerToken(request);
    const supabase = await createClient(accessToken);
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    // All reads and writes go through the caller's RLS-scoped client (production owner only).
    const outcome = await runPersistedGenerationJob(parsed.data.jobId, createSupabaseJobStore(supabase));
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error, job: outcome.job }, { status: outcome.status });
    }
    return NextResponse.json({ job: outcome.job, asset: outcome.asset, warning: outcome.warning });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation dispatch failed." },
      { status: 500 },
    );
  }
}
