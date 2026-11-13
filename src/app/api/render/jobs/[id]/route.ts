import { NextResponse } from "next/server";
import { z } from "zod";

import { SupabaseConfigurationError, resolveServerSupabaseConfig } from "@/lib/supabase/config";
import { SupabaseVideoRenderJobRepository } from "@/features/render/repositories/video-render-job.repository";
import { getRenderRequestContext, verifyRenderProductionAccess } from "@/features/render/services/render-job-http";
import { createRenderStorageAdapter, isLocalSupabaseUrl } from "@/features/render/services/render-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid render job ID format." }, { status: 400 });
    }

    const auth = await getRenderRequestContext(request);
    if (!auth) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

    const repository = new SupabaseVideoRenderJobRepository(auth.supabase);
    const job = await repository.findById(id);
    if (!job) return NextResponse.json({ error: "Render job not found." }, { status: 404 });

    const access = await verifyRenderProductionAccess(auth.supabase, job.productionId, auth.user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const url = new URL(request.url);
    const requestPlaybackUrl = url.searchParams.get("signedUrl") === "true";
    if (!requestPlaybackUrl) return NextResponse.json({ job }, { status: 200 });
    if (job.status !== "completed" || !job.storageUrl) {
      return NextResponse.json({ error: "Playback is available only for completed renders." }, { status: 409 });
    }

    const storageKey = job.storageKey;
    if (!storageKey) {
      return NextResponse.json({ error: "The completed render has no authorized storage reference." }, { status: 409 });
    }
    const expectedStorageUrl = `${isLocalSupabaseUrl(resolveServerSupabaseConfig()?.url) ? "local" : "storage"}://${storageKey}`;
    if (job.storageUrl !== expectedStorageUrl) {
      return NextResponse.json({ error: "The completed render has an invalid storage reference." }, { status: 409 });
    }

    let signedPlaybackUrl: string;
    let expiresAt: string;
    if (isLocalSupabaseUrl(resolveServerSupabaseConfig()?.url)) {
      const signedResult = await createRenderStorageAdapter(
        auth.supabase,
        resolveServerSupabaseConfig()?.url,
      ).createSignedPlaybackUrl(storageKey, 300);
      const localGrant = new URL(signedResult.signedUrl);
      signedPlaybackUrl = `/api/render/jobs/${id}/playback?${localGrant.searchParams.toString()}`;
      expiresAt = signedResult.expiresAt;
    } else {
      const signedResult = await createRenderStorageAdapter(
        auth.supabase,
        resolveServerSupabaseConfig()?.url,
      ).createSignedPlaybackUrl(storageKey, 300);
      signedPlaybackUrl = signedResult.signedUrl;
      expiresAt = signedResult.expiresAt;
    }

    return NextResponse.json({ job, signedPlaybackUrl, expiresAt }, { status: 200 });
  } catch (caught) {
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    console.error("Unable to load render job.", caught);
    return NextResponse.json({ error: "Unable to load render job." }, { status: 500 });
  }
}
