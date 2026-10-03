import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import { dispatchGenerationJob } from "./dispatch";
import type { MediaGenerationProvider, MediaJobType } from "./types";
import { UNCONFIGURED_MEDIA_ERROR, UNCONFIGURED_MEDIA_PROVIDER } from "./types";
import { KlingMediaProvider } from "./providers/kling.provider";

const NOW = "2026-09-27T20:00:00.000Z";

function job(partial: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    productionId: "11111111-1111-4111-8111-111111111111",
    assetId: "22222222-2222-4222-8222-222222222222",
    jobType: "image",
    status: "queued",
    prompt: "Harbour clerk at a wooden desk, dawn light, ledger open.",
    parameters: {},
    attemptCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe("dispatchGenerationJob", () => {
  it("constructs the Kling provider with injected dependencies", () => {
    const provider = new KlingMediaProvider({}, async () => new Response("{}"));
    assert.equal(provider.isConfigured(), false);
  });

  it("fails recoverably without inventing a URL when no provider is configured", async () => {
    const result = await dispatchGenerationJob(job(), { env: {}, now: () => NOW });
    assert.equal(result.status, "failed");
    assert.equal(result.provider, UNCONFIGURED_MEDIA_PROVIDER);
    assert.equal(result.outputUrl, undefined);
    assert.equal(result.errorMessage, UNCONFIGURED_MEDIA_ERROR);
  });

  it("completes only when the provider returns a real media URL", async () => {
    const provider: MediaGenerationProvider = {
      id: "openai-image",
      supports: ["image"] as readonly MediaJobType[],
      isConfigured: () => true,
      generate: async () => ({ status: "completed", provider: "openai-image", outputUrl: "https://cdn.example.com/harbour-clerk.png" }),
    };
    const result = await dispatchGenerationJob(job(), { now: () => NOW, resolveProvider: () => provider });
    assert.equal(result.status, "completed");
    assert.equal(result.outputUrl, "https://cdn.example.com/harbour-clerk.png");
  });

  it("checks an existing provider task instead of starting another generation", async () => {
    let checkedProviderJobId = "";
    const provider: MediaGenerationProvider = {
      id: "kling",
      supports: ["video"],
      isConfigured: () => true,
      generate: async () => {
        throw new Error("Status checks must not create another provider job.");
      },
      checkStatus: async (providerJobId, jobType) => {
        checkedProviderJobId = `${jobType}:${providerJobId}`;
        return {
          status: "completed",
          provider: "kling",
          outputUrl: "https://cdn.example.com/harbour-video.mp4",
        };
      },
    };
    const runningJob = job({
      jobType: "video",
      status: "running",
      provider: "kling",
      parameters: { providerJobId: "provider-task-123" },
    });

    const result = await dispatchGenerationJob(runningJob, {
      now: () => NOW,
      resolveProvider: () => provider,
    });

    assert.equal(checkedProviderJobId, "video:provider-task-123");
    assert.equal(result.status, "completed");
    assert.equal(result.outputUrl, "https://cdn.example.com/harbour-video.mp4");
  });

  it("does not restart a provider task when its provider has no status endpoint", async () => {
    let generationStarted = false;
    const provider: MediaGenerationProvider = {
      id: "openai-image",
      supports: ["image"],
      isConfigured: () => true,
      generate: async () => {
        generationStarted = true;
        return { status: "running", provider: "openai-image" };
      },
    };

    const result = await dispatchGenerationJob(
      job({
        status: "running",
        provider: "openai-image",
        parameters: { providerJobId: "provider-task-456" },
      }),
      { now: () => NOW, resolveProvider: () => provider },
    );

    assert.equal(generationStarted, false);
    assert.equal(result.status, "failed");
    assert.match(result.errorMessage ?? "", /cannot check the status/);
  });

  it("fails safely when a running provider response has no task ID", async () => {
    const provider: MediaGenerationProvider = {
      id: "kling",
      supports: ["image"],
      isConfigured: () => true,
      generate: async () => ({ status: "running", provider: "kling" }),
      checkStatus: async () => ({ status: "running", provider: "kling" }),
    };
    const result = await dispatchGenerationJob(job(), {
      now: () => NOW,
      resolveProvider: () => provider,
    });

    assert.equal(result.status, "failed");
    assert.equal(result.parameters.providerJobId, undefined);
    assert.match(result.errorMessage ?? "", /without a task ID/);
  });
});

describe("Kling task status checks", () => {
  it("checks image and video tasks using their corresponding endpoints", async () => {
    const requestedUrls: string[] = [];
    const provider = new KlingMediaProvider(
      { KLING_API_KEY: "test-api-key", KLING_API_BASE_URL: "https://kling.example" },
      (async (input: RequestInfo | URL) => {
        requestedUrls.push(String(input));
        return new Response(JSON.stringify({
          data: {
            task_id: "provider-task-789",
            task_status: "succeed",
            task_result: { videos: [{ url: "https://cdn.example.com/result.mp4" }] },
          },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch,
    );

    const imageResult = await provider.checkStatus("image-id", "image");
    const videoResult = await provider.checkStatus("video-id", "video");

    assert.deepEqual(requestedUrls, [
      "https://kling.example/v1/images/generations/image-id",
      "https://kling.example/v1/videos/text2video/video-id",
    ]);
    assert.equal(imageResult.status, "completed");
    assert.equal(videoResult.status, "completed");
  });
});
