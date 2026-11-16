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
import { DEFAULT_PRODUCTION_MEDIA_BUCKET, hydrateAssetMedia } from "@/features/assets/services/storage-media";

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
    async storeGeneratedImage(job, base64, mimeType) {
      if (!job.assetId) throw new Error("A generated image must be attached to a production asset.");
      const extensionByMime: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
      const extension = extensionByMime[mimeType];
      if (!extension) throw new Error("The image provider returned an unsupported image format.");
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) throw new Error("The image provider returned malformed base64 image data.");
      const bytes = Buffer.from(base64, "base64");
      if (bytes.length === 0 || bytes.length > 20 * 1024 * 1024) throw new Error("Generated image must be between 1 byte and 20 MB.");
      if (bytes.toString("base64").replace(/=+$/, "") !== base64.replace(/=+$/, "")) throw new Error("The image provider returned invalid base64 image data.");
      const objectPath = job.productionId + "/" + job.assetId + "/" + job.id + "-" + job.attemptCount + "." + extension;
      const { error: uploadError } = await supabase.storage.from(DEFAULT_PRODUCTION_MEDIA_BUCKET).upload(objectPath, bytes, { contentType: mimeType, cacheControl: "31536000", upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      return "storage://" + DEFAULT_PRODUCTION_MEDIA_BUCKET + "/" + objectPath;
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
      return data ? hydrateAssetMedia(fromAssetRow(data as AssetRow), supabase) : null;
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
