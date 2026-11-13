import { NextResponse } from "next/server";
import { z } from "zod";

import { readJsonBody } from "@/lib/http/json-body";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { SupabaseVideoRenderJobRepository } from "@/features/render/repositories/video-render-job.repository";
import { getRenderRequestContext, verifyRenderProductionAccess } from "@/features/render/services/render-job-http";
import { cancelVideoRenderJobSchema } from "@/features/render/validation/render-job.schema";

const MAX_BODY_BYTES = 4 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid render job ID format." }, { status: 400 });
    }

    const body = await readJsonBody(request, MAX_BODY_BYTES);
    if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status });
    const parsed = cancelVideoRenderJobSchema.safeParse(body.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Cancellation reason must be 500 characters or fewer." }, { status: 400 });
    }

    const auth = await getRenderRequestContext(request);
    if (!auth) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

    const repository = new SupabaseVideoRenderJobRepository(auth.supabase);
    const job = await repository.findById(id);
    if (!job) return NextResponse.json({ error: "Render job not found." }, { status: 404 });

    const access = await verifyRenderProductionAccess(auth.supabase, job.productionId, auth.user.id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    if (job.status !== "queued" && job.status !== "running" && job.status !== "cancelled") {
      return NextResponse.json({ error: `Cannot cancel a job with status '${job.status}'.` }, { status: 409 });
    }

    const cancelledJob = await repository.cancel(id, parsed.data.reason);
    return NextResponse.json({ job: cancelledJob }, { status: 200 });
  } catch (caught) {
    if (caught instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: caught.message }, { status: 503 });
    }
    console.error("Unable to cancel render job.", caught);
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Unable to cancel render job." }, { status: 409 });
  }
}
