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
});
