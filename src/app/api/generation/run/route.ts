import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

import type { GenerationJob } from "@/features/assets/types/generation-job";
import { dispatchGenerationJob } from "@/platform/generation";
import { canDispatchPersistedJob } from "@/platform/generation/dispatch-authorization";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jobId?: unknown };
    const parsed = z.string().uuid().safeParse(body.jobId);
    if (!parsed.success) {
      return NextResponse.json({ error: "A persisted generation job ID is required." }, { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }
    const { data: row, error: jobError } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("id", parsed.data)
      .maybeSingle();
    if (jobError) return NextResponse.json({ error: "Unable to load generation job." }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Generation job not found or access denied." }, { status: 404 });
    const { data: assetRow, error: assetError } = row.asset_id
      ? await supabase.from("assets").select("id, production_id, user_approved").eq("id", row.asset_id).maybeSingle()
      : { data: null, error: null };
    if (assetError) return NextResponse.json({ error: "Unable to verify asset approval." }, { status: 500 });
    const asset = assetRow && {
      id: assetRow.id,
      productionId: assetRow.production_id,
      userApproved: assetRow.user_approved,
    };
    const job: GenerationJob = {
      id: row.id,
      productionId: row.production_id,
      assetId: row.asset_id ?? undefined,
      jobType: row.job_type,
      status: row.status,
      provider: row.provider ?? undefined,
      model: row.model ?? undefined,
      prompt: row.prompt ?? undefined,
      parameters: row.parameters ?? {},
      sourceEntityType: row.source_entity_type ?? undefined,
      sourceEntityId: row.source_entity_id ?? undefined,
      outputUrl: row.output_url ?? undefined,
      errorMessage: row.error_message ?? undefined,
      attemptCount: row.attempt_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    if (!canDispatchPersistedJob(job, asset ?? null)) {
      return NextResponse.json({ error: "Only queued jobs for creator-approved assets can be dispatched." }, { status: 409 });
    }
    return NextResponse.json({ job: await dispatchGenerationJob(job) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation dispatch failed." },
      { status: 500 },
    );
  }
}
