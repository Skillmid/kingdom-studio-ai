import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GenerationJob } from "@/features/assets/types/generation-job";
import { dispatchGenerationJob } from "./dispatch";
import { OpenAIImageProvider } from "./providers/openai-image.provider";
import { parseStorageReference } from "@/features/assets/services/storage-media";

const NOW = "2026-11-16T12:00:00.000Z";

function job(): GenerationJob {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    productionId: "11111111-1111-4111-8111-111111111111",
    assetId: "22222222-2222-4222-8222-222222222222",
    jobType: "image",
    status: "queued",
    prompt: "A cinematic character portrait, neutral background.",
    parameters: { aspect_ratio: "16:9" },
    attemptCount: 1,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("durable generated media", () => {
  it("parses stable private storage references without treating them as public URLs", () => {
    assert.deepEqual(
      parseStorageReference("storage://production-media/production-id/asset-id/job-id-1.png"),
      { bucket: "production-media", path: "production-id/asset-id/job-id-1.png" },
    );
    assert.equal(parseStorageReference("https://cdn.example.com/image.png"), null);
    assert.equal(parseStorageReference("storage://bad"), null);
  });

  it("allows GPT Image inline output only when the production media bucket is configured", async () => {
    let requestBody: Record<string, unknown> = {};
    const provider = new OpenAIImageProvider(
      { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "gpt-image-1", SUPABASE_MEDIA_BUCKET: "production-media" },
      (async (_input: RequestInfo | URL, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ data: [{ b64_json: "aGVsbG8=" }] }), { status: 200 });
      }) as typeof fetch,
    );

    const result = await provider.generate({ jobType: "image", prompt: "A portrait." });

    assert.equal(result.status, "completed");
    assert.equal(result.outputBase64, "aGVsbG8=");
    assert.equal(result.outputMimeType, "image/png");
    assert.equal(result.outputUrl, undefined);
    assert.equal("response_format" in requestBody, false);
    assert.equal(provider.canDeliverUrl("image"), true);
  });

  it("uploads inline output through the server storage adapter before marking the job completed", async () => {
    let stored: { jobId: string; base64: string; mimeType: string } | undefined;
    const result = await dispatchGenerationJob(job(), {
      now: () => NOW,
      resolveProvider: (_type, _env, wrapped) =>
        new OpenAIImageProvider(
          { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "gpt-image-1", SUPABASE_MEDIA_BUCKET: "production-media" },
          wrapped,
        ),
      fetchImpl: (async () =>
        new Response(JSON.stringify({ data: [{ b64_json: "aGVsbG8=" }] }), { status: 200 })) as typeof fetch,
      storeGeneratedImage: async (currentJob, base64, mimeType) => {
        stored = { jobId: currentJob.id, base64, mimeType };
        return "storage://production-media/production-id/asset-id/job-id-1.png";
      },
    });

    assert.equal(result.status, "completed");
    assert.equal(result.outputUrl, "storage://production-media/production-id/asset-id/job-id-1.png");
    assert.deepEqual(stored, {
      jobId: "33333333-3333-4333-8333-333333333333",
      base64: "aGVsbG8=",
      mimeType: "image/png",
    });
  });

  it("does not call GPT Image when storage has not been configured", async () => {
    let called = false;
    const provider = new OpenAIImageProvider(
      { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "gpt-image-1" },
      (async () => {
        called = true;
        return new Response("{}");
      }) as typeof fetch,
    );

    const result = await provider.generate({ jobType: "image", prompt: "A portrait." });

    assert.equal(called, false);
    assert.equal(result.status, "failed");
    assert.equal(result.failureKind, "inline-data-requires-storage");
  });
});
