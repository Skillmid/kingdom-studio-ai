import { NextResponse } from "next/server";
import { z } from "zod";

import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { SupabaseVideoRenderJobRepository } from "@/features/render/repositories/video-render-job.repository";
import { getRenderRequestContext, verifyRenderProductionAccess } from "@/features/render/services/render-job-http";

export async function POST(
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
    if (job.status !== "failed") {
      return NextResponse.json({ error: `Cannot retry a job with status '${job.status}'.` }, { status: 409 });
    }
    if (job.attempts >= job.maxAttempts) {
      return NextResponse.json({ error: "This render job has reached its retry limit." }, { status: 409 });
    }

    const retriedJob = await repository.retry(id);
    return NextResponse.json({ job: retriedJob }, { status: 200 });
  } catch (caught) {
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    console.error("Unable to retry render job.", caught);
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Unable to retry render job." }, { status: 409 });
  }
}
