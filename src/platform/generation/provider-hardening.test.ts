import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GenerationJob } from "@/features/assets/types/generation-job";
import { closestAspectRatio, klingAspectRatio, openAIImageSize } from "./aspect-ratio";
import { dispatchGenerationJob } from "./dispatch";
import { KlingMediaProvider, KLING_MAX_PROMPT_LENGTH } from "./providers/kling.provider";
import { OpenAIImageProvider, openAIModelReturnsUrl } from "./providers/openai-image.provider";
import { resolveMediaProvider, selectMediaProvider } from "./registry";
import { createTimeoutFetch, isRequestDefinitelyNotSent, ProviderTimeoutError, withDeadline } from "./timeout";
import { KlingHttpError, klingCreateOutcomeIsUnknown } from "./providers/kling.provider";
import { hasUnknownProviderState } from "@/features/assets/services/generation-job";
import { INLINE_DATA_REQUIRES_STORAGE_ERROR, type MediaGenerationProvider } from "./types";

const NOW = "2026-10-08T12:00:00.000Z";

function job(partial: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    productionId: "11111111-1111-4111-8111-111111111111",
    assetId: "22222222-2222-4222-8222-222222222222",
    jobType: "image",
    status: "queued",
    prompt: "Ferry pier at dawn.",
    parameters: {},
    attemptCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe("OpenAI image provider without durable storage", () => {
  it("knows which models can return a URL", () => {
    assert.equal(openAIModelReturnsUrl("gpt-image-1"), false);
    assert.equal(openAIModelReturnsUrl("dall-e-3"), true);
    assert.equal(openAIModelReturnsUrl("dall-e-2"), true);
  });

  it("refuses gpt-image models before any paid request with a typed non-transient failure", async () => {
    let called = false;
    const provider = new OpenAIImageProvider({ OPENAI_API_KEY: "test-key" }, (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch);
    const result = await provider.generate({ jobType: "image", prompt: "x" });
    assert.equal(called, false);
    assert.equal(result.status, "failed");
    assert.equal(result.failureKind, "inline-data-requires-storage");
    assert.equal(result.errorMessage, INLINE_DATA_REQUIRES_STORAGE_ERROR);
    assert.equal(result.outputUrl, undefined);
  });

  it("never stores base64 as a URL when a URL-capable model returns inline data", async () => {
    const provider = new OpenAIImageProvider(
      { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "dall-e-3" },
      (async () => new Response(JSON.stringify({ data: [{ b64_json: "aGVsbG8=" }] }), { status: 200 })) as typeof fetch,
    );
    const result = await provider.generate({ jobType: "image", prompt: "x" });
    assert.equal(result.status, "failed");
    assert.equal(result.failureKind, "inline-data-requires-storage");
    assert.equal(result.outputUrl, undefined);
  });

  it("requests a hosted URL and an aspect-mapped size for DALL·E 3", async () => {
    let body: Record<string, unknown> = {};
    const provider = new OpenAIImageProvider(
      { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "dall-e-3" },
      (async (_input: RequestInfo | URL, init?: RequestInit) => {
        body = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ data: [{ url: "https://cdn.example.com/a.png" }] }), { status: 200 });
      }) as typeof fetch,
    );
    const result = await provider.generate({ jobType: "image", prompt: "x", parameters: { aspect_ratio: "9:16" } });
    assert.equal(result.status, "completed");
    assert.equal(body.response_format, "url");
    assert.equal(body.size, "1024x1792");
  });
});

describe("provider selection", () => {
  it("does not prefer OpenAI image when it cannot deliver a URL and Kling is configured", () => {
    const selected = resolveMediaProvider("image", { OPENAI_API_KEY: "k", KLING_API_KEY: "k" });
    assert.equal(selected.id, "kling");
  });

  it("still prefers OpenAI image when its model returns URLs", () => {
    const selected = resolveMediaProvider("image", { OPENAI_API_KEY: "k", OPENAI_IMAGE_MODEL: "dall-e-3", KLING_API_KEY: "k" });
    assert.equal(selected.id, "openai-image");
  });

  it("falls back to the configured-but-undeliverable provider so the job fails with a specific reason", () => {
    const selected = resolveMediaProvider("image", { OPENAI_API_KEY: "k" });
    assert.equal(selected.id, "openai-image");
  });

  it("ignores a pinned provider that can no longer deliver", () => {
    const stuck: MediaGenerationProvider = {
      id: "stuck",
      supports: ["image"],
      isConfigured: () => true,
      canDeliverUrl: () => false,
      generate: async () => ({ status: "failed", provider: "stuck" }),
    };
    const good: MediaGenerationProvider = {
      id: "good",
      supports: ["image"],
      isConfigured: () => true,
      generate: async () => ({ status: "failed", provider: "good" }),
    };
    assert.equal(selectMediaProvider([stuck, good], "image", "stuck").id, "good");
  });
});

describe("aspect ratio mapping", () => {
  it("maps production ratios to provider-supported values", () => {
    assert.equal(klingAspectRatio("2.39:1", "video"), "16:9");
    assert.equal(klingAspectRatio("4:3", "video"), "16:9");
    assert.equal(klingAspectRatio("9:16", "video"), "9:16");
    assert.equal(klingAspectRatio("2.39:1", "image", "kling-v1"), "16:9");
    assert.equal(klingAspectRatio("2.39:1", "image", "kling-v2"), "21:9");
    assert.equal(klingAspectRatio("4:3", "image"), "4:3");
    assert.equal(klingAspectRatio(undefined, "image"), "16:9");
    assert.equal(openAIImageSize("1:1", "dall-e-3"), "1024x1024");
    assert.equal(openAIImageSize("2.39:1", "dall-e-2"), "1024x1024");
    assert.equal(closestAspectRatio("nonsense", ["1:1", "16:9"]), "16:9");
  });

  it("sends the mapped ratio to Kling", async () => {
    let body: Record<string, unknown> = {};
    const provider = new KlingMediaProvider({ KLING_API_KEY: "k", KLING_API_BASE_URL: "https://kling.example" }, (async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ code: 0, data: { task_id: "t1", task_status: "submitted" } }), { status: 200 });
    }) as typeof fetch);
    const result = await provider.generate({ jobType: "video", prompt: "x", parameters: { aspect_ratio: "2.39:1" } });
    assert.equal(body.aspect_ratio, "16:9");
    assert.equal(result.status, "running");
  });

  it("rejects prompts longer than Kling accepts without calling the API", async () => {
    let called = false;
    const provider = new KlingMediaProvider({ KLING_API_KEY: "k" }, (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch);
    const result = await provider.generate({ jobType: "image", prompt: "a".repeat(KLING_MAX_PROMPT_LENGTH + 1) });
    assert.equal(called, false);
    assert.equal(result.failureKind, "unsupported-job");
  });
});

describe("provider timeouts", () => {
  it("aborts a hung fetch with a ProviderTimeoutError", async () => {
    const hanging = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as typeof fetch;
    await assert.rejects(createTimeoutFetch(hanging, 20)("https://x.example"), ProviderTimeoutError);
  });

  it("withDeadline rejects slow promises", async () => {
    await assert.rejects(withDeadline(new Promise(() => undefined), 20), ProviderTimeoutError);
  });

  it("fails a new job as a timeout without inventing media", async () => {
    const provider: MediaGenerationProvider = {
      id: "slow",
      supports: ["image"],
      isConfigured: () => true,
      generate: () => new Promise(() => undefined),
    };
    const result = await dispatchGenerationJob(job(), { now: () => NOW, timeoutMs: 20, resolveProvider: () => provider });
    assert.equal(result.status, "failed");
    assert.equal(result.parameters.lastFailureKind, "timeout");
    assert.equal(result.outputUrl, undefined);
    // v2: a timeout after the call started is an UNKNOWN provider state, never an ordinary retryable failure.
    assert.equal(hasUnknownProviderState(result), true);
  });

  it("keeps a running job checkable when a status check times out", async () => {
    const provider: MediaGenerationProvider = {
      id: "kling",
      supports: ["image"],
      isConfigured: () => true,
      generate: async () => ({ status: "failed", provider: "kling" }),
      checkStatus: () => new Promise(() => undefined),
    };
    const result = await dispatchGenerationJob(
      job({ status: "running", provider: "kling", parameters: { providerJobId: "task-1" } }),
      { now: () => NOW, timeoutMs: 20, resolveProvider: () => provider },
    );
    assert.equal(result.status, "running");
    assert.equal(result.parameters.providerJobId, "task-1");
  });

  it("keeps a running job checkable when the status endpoint has a network error", async () => {
    const provider = new KlingMediaProvider({ KLING_API_KEY: "k" }, (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    const result = await dispatchGenerationJob(
      job({ status: "running", provider: "kling", parameters: { providerJobId: "task-2" } }),
      { now: () => NOW, resolveProvider: () => provider },
    );
    assert.equal(result.status, "running");
    assert.equal(result.parameters.providerJobId, "task-2");
  });
});

describe("OpenAI image model behaviour (v2 documentation check)", () => {
  it("refuses the default gpt-image-1 before fetch is called, even through dispatch", async () => {
    let fetchCalls = 0;
    const countingFetch = (async () => {
      fetchCalls += 1;
      return new Response("{}");
    }) as typeof fetch;
    for (const env of [{ OPENAI_API_KEY: "test-key" }, { OPENAI_API_KEY: "test-key", OPENAI_IMAGE_MODEL: "gpt-image-1" }]) {
      const result = await dispatchGenerationJob(job(), {
        now: () => NOW,
        resolveProvider: (_type, _env, wrapped) => new OpenAIImageProvider(env, wrapped),
        fetchImpl: countingFetch,
      });
      assert.equal(result.status, "failed");
      assert.equal(result.parameters.lastFailureKind, "inline-data-requires-storage");
      assert.equal(result.outputUrl, undefined);
      assert.equal(hasUnknownProviderState(result), false, "refused before sending: state is known");
      assert.match(result.errorMessage ?? "", /OPENAI_IMAGE_MODEL to dall-e-3 or dall-e-2/);
    }
    assert.equal(fetchCalls, 0, "no paid OpenAI request was made");
  });

  it("a timeout on a URL-capable OpenAI model is an unknown provider state", async () => {
    const hanging = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as typeof fetch;
    const result = await dispatchGenerationJob(job(), {
      now: () => NOW,
      timeoutMs: 20,
      fetchImpl: hanging,
      resolveProvider: (_type, _env, wrapped) => new OpenAIImageProvider({ OPENAI_API_KEY: "k", OPENAI_IMAGE_MODEL: "dall-e-3" }, wrapped),
    });
    assert.equal(result.status, "failed");
    assert.equal(hasUnknownProviderState(result), true);
    assert.match(result.errorMessage ?? "", /OpenAI may have accepted this request/);
  });
});

describe("provider outcome classification (v2)", () => {
  it("only proves 'not sent' for connection-establishment errors", () => {
    const withCode = (code: string) => new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
    for (const code of ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]) {
      assert.equal(isRequestDefinitelyNotSent(withCode(code)), true, code);
    }
    for (const error of [withCode("ECONNRESET"), withCode("UND_ERR_SOCKET"), new ProviderTimeoutError(10), new TypeError("fetch failed"), new Error("?"), "x"]) {
      assert.equal(isRequestDefinitelyNotSent(error), false);
    }
  });

  it("treats Kling 4xx as definite and 5xx/timeouts/resets as unknown", () => {
    assert.equal(klingCreateOutcomeIsUnknown(new KlingHttpError("bad request", 400)), false);
    assert.equal(klingCreateOutcomeIsUnknown(new KlingHttpError("too many", 429)), false);
    assert.equal(klingCreateOutcomeIsUnknown(new KlingHttpError("internal timeout", 504)), true);
    assert.equal(klingCreateOutcomeIsUnknown(new KlingHttpError("server error", 500)), true);
    assert.equal(klingCreateOutcomeIsUnknown(new ProviderTimeoutError(10)), true);
    assert.equal(klingCreateOutcomeIsUnknown(new TypeError("fetch failed")), true);
  });

  it("does not call Kling when credentials cannot be built (definite pre-send failure)", async () => {
    let called = false;
    const provider = new KlingMediaProvider({ KLING_ACCESS_KEY: "only-access-key" }, (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch);
    const result = await provider.generate({ jobType: "image", prompt: "x" });
    assert.equal(called, false);
    assert.equal(result.status, "failed");
    assert.equal(result.providerStateUnknown, undefined);
  });
});
