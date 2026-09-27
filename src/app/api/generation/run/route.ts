import { NextResponse } from "next/server";

import type { GenerationJob } from "@/features/assets/types/generation-job";
import { generationJobSchema } from "@/features/assets/validation/generation-job.schema";
import { dispatchGenerationJob } from "@/platform/generation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { job?: unknown };
    const parsed = generationJobSchema.safeParse(body.job);
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid generation job payload is required." }, { status: 400 });
    }
    const input = parsed.data;
    const job: GenerationJob = {
      id: input.id ?? "00000000-0000-4000-8000-000000000000",
      productionId: input.productionId,
      assetId: input.assetId,
      jobType: input.jobType,
      status: input.status ?? "queued",
      provider: input.provider,
      model: input.model,
      prompt: input.prompt,
      parameters: input.parameters ?? {},
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      outputUrl: input.outputUrl,
      errorMessage: input.errorMessage,
      attemptCount: input.attemptCount ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ job: await dispatchGenerationJob(job) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation dispatch failed." },
      { status: 500 },
    );
  }
}
