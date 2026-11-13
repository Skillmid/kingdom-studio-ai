import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readJsonBody } from "@/lib/http/json-body";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createVideoRenderJobSchema } from "@/features/render/validation/render-job.schema";
import { SupabaseVideoRenderJobRepository } from "@/features/render/repositories/video-render-job.repository";
import {
  getRenderRequestContext,
  verifyRenderProductionAccess,
} from "@/features/render/services/render-job-http";
import type { VideoClipInput } from "@/features/render/services/video-render-engine";

export const maxDuration = 300;
const MAX_BODY_BYTES = 4 * 1024;
const MAX_CLIPS = 25;
const MAX_TOTAL_DURATION_SECONDS = 600;

class RenderRequestError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) {
    super(message);
  }
}

interface RenderSequenceRow {
  id: string;
  production_id: string;
  user_approved: boolean;
}

interface RenderClipRow {
  production_id: string;
  render_id: string;
  sequence_number: number;
  title: string | null;
  media_url: string | null;
  duration_seconds: number | null;
  source_kind: VideoClipInput["sourceKind"];
  source_id: string | null;
  uncertainty_notes: string | null;
  user_approved: boolean;
}

async function loadApprovedSequence(
  supabase: SupabaseClient,
  productionId: string,
  renderId: string,
): Promise<VideoClipInput[]> {
  const { data: sequence, error: sequenceError } = await supabase
    .from("render_sequences")
    .select("id, production_id, user_approved")
    .eq("id", renderId)
    .eq("production_id", productionId)
    .maybeSingle();
  if (sequenceError) throw new Error(`Unable to load render sequence: ${sequenceError.message}`);
  if (!sequence) throw new RenderRequestError("The selected render sequence was not found.", 404);
  const sequenceRow = sequence as RenderSequenceRow;
  if (!sequenceRow.user_approved) throw new RenderRequestError("Approve the selected render sequence before rendering.", 409);

  const { data: rows, error: clipsError } = await supabase
    .from("render_clips")
    .select("production_id, render_id, sequence_number, title, media_url, duration_seconds, source_kind, source_id, uncertainty_notes, user_approved")
    .eq("production_id", productionId)
    .eq("render_id", renderId)
    .order("sequence_number");
  if (clipsError) throw new Error(`Unable to load approved render clips: ${clipsError.message}`);

  const clipRows = (rows ?? []) as RenderClipRow[];
  if (clipRows.length === 0) throw new RenderRequestError("The selected sequence has no clips to render.", 400);
  if (clipRows.length > MAX_CLIPS) throw new RenderRequestError(`A render sequence can contain at most ${MAX_CLIPS} clips.`, 400);
  if (clipRows.some((clip) => !clip.user_approved)) {
    throw new RenderRequestError("Every clip in the selected sequence must be creator-approved before rendering.", 409);
  }

  const clips = clipRows.map((clip) => {
    const mediaUrl = clip.media_url?.trim() || undefined;
    if (mediaUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(mediaUrl);
      } catch {
        throw new RenderRequestError(`Clip ${clip.sequence_number} has an invalid media URL.`, 400);
      }
      if (parsedUrl.protocol !== "https:" || mediaUrl.length > 2048) {
        throw new RenderRequestError(`Clip ${clip.sequence_number} must use a valid HTTPS media URL.`, 400);
      }
    }
    return {
      sequenceNumber: clip.sequence_number,
      title: clip.title ?? undefined,
      mediaUrl,
      durationSeconds: clip.duration_seconds && clip.duration_seconds > 0 ? clip.duration_seconds : 5,
      sourceKind: clip.source_kind,
      sourceId: clip.source_id ?? undefined,
      uncertaintyNotes: clip.uncertainty_notes ?? undefined,
    };
  });
  const totalDuration = clips.reduce((total, clip) => total + clip.durationSeconds, 0);
  if (totalDuration > MAX_TOTAL_DURATION_SECONDS) {
    throw new RenderRequestError(`A render sequence cannot exceed ${MAX_TOTAL_DURATION_SECONDS} seconds.`, 400);
  }
  return clips;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, MAX_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const parsed = createVideoRenderJobSchema.safeParse(body.value);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json({ error: `Validation failed: ${issues}` }, { status: 400 });
    }

    const auth = await getRenderRequestContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const access = await verifyRenderProductionAccess(auth.supabase, parsed.data.productionId, auth.user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const clips = await loadApprovedSequence(auth.supabase, parsed.data.productionId, parsed.data.renderId);
    const repository = new SupabaseVideoRenderJobRepository(auth.supabase);
    const job = await repository.create({
      productionId: parsed.data.productionId,
      renderId: parsed.data.renderId,
      clips,
      config: { width: 1280, height: 720, fps: 24, timeoutMs: 240_000 },
      maxAttempts: 3,
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (caught) {
    if (caught instanceof RenderRequestError) {
      return NextResponse.json({ error: caught.message }, { status: caught.status });
    }
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    const message = caught instanceof Error ? caught.message : "Failed to create render job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productionId = url.searchParams.get("productionId");

    if (!productionId || !z.string().uuid().safeParse(productionId).success) {
      return NextResponse.json({ error: "A valid productionId query parameter is required." }, { status: 400 });
    }

    const auth = await getRenderRequestContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }
    const access = await verifyRenderProductionAccess(auth.supabase, productionId, auth.user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const repository = new SupabaseVideoRenderJobRepository(auth.supabase);
    const jobs = await repository.findByProductionId(productionId);
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (caught) {
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    const message = caught instanceof Error ? caught.message : "Failed to retrieve render jobs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
