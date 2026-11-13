import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Asset } from "@/features/assets/types/asset";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import {
  acknowledgeUnknownProviderState,
  canRetryJob,
  hasUnknownProviderState,
  MAX_GENERATION_ATTEMPTS,
  retryJob,
} from "@/features/assets/services/generation-job";
import { KlingMediaProvider } from "./providers/kling.provider";
import { runPersistedGenerationJob, type PersistedJobStore, type RunDependencies } from "./run-persisted-job";
import type { MediaGenerationProvider } from "./types";

const NOW = "2026-10-08T12:00:00.000Z";
const JOB_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";

function job(partial: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: JOB_ID,
    productionId: PRODUCTION_ID,
    assetId: ASSET_ID,
    jobType: "image",
    status: "queued",
    prompt: "Lighthouse keeper at a storm window.",
    parameters: { aspect_ratio: "16:9" },
    attemptCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

function asset(partial: Partial<Asset> = {}): Asset {
  return {
    id: ASSET_ID,
    productionId: PRODUCTION_ID,
    kind: "image",
    title: "Storm window still",
    prompt: "Lighthouse keeper at a storm window.",
    sourceKind: "shot",
    provenance: "production-derived",
    userApproved: true,
    status: "draft",
    progress: 40,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

/** In-memory store that mimics the conditional UPDATE semantics of the Supabase store. */
function memoryStore(initialJob: GenerationJob | null, initialAsset: Asset | null, otherJobs: GenerationJob[] = []) {
  const state = { job: initialJob, asset: initialAsset, claims: 0, assetPatches: [] as Partial<Asset>[], otherJobs };
  const store: PersistedJobStore = {
    async loadJob() {
      return state.job ? { ...state.job } : null;
    },
    async loadAsset() {
      return state.asset ? { ...state.asset } : null;
    },
    async loadAssetJobs(assetId) {
      return [...(state.job ? [state.job] : []), ...state.otherJobs]
        .filter((item) => item.assetId === assetId)
        .map((item) => ({ ...item }));
    },
    async claimQueuedJob(expected, startedAt) {
      if (!state.job || state.job.status !== "queued" || state.job.attemptCount !== expected.attemptCount) return null;
      state.claims += 1;
      state.job = { ...state.job, status: "running", startedAt, attemptCount: state.job.attemptCount + 1 };
      return { ...state.job };
    },
    async saveJobResult(next) {
      if (!state.job || state.job.status !== "running") return null;
      state.job = { ...next };
      return { ...state.job };
    },
    async updateAsset(_id, patch) {
      state.assetPatches.push(patch);
      if (!state.asset) return null;
      state.asset = { ...state.asset, ...patch };
      return { ...state.asset };
    },
  };
  return { store, state };
}

function provider(result: Awaited<ReturnType<MediaGenerationProvider["generate"]>>, calls: { count: number }): MediaGenerationProvider {
  return {
    id: "kling",
    supports: ["image", "video"],
    isConfigured: () => true,
    generate: async () => {
      calls.count += 1;
      return result;
    },
    checkStatus: async () => ({ status: "completed", provider: "kling", outputUrl: "https://cdn.example.com/still.png" }),
  };
}

describe("runPersistedGenerationJob", () => {
  it("claims a queued job once, persists the provider task ID server-side, and keeps the asset generating", async () => {
    const { store, state } = memoryStore(job(), asset());
    const calls = { count: 0 };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "running", provider: "kling", providerJobId: "task-1" }, calls),
    });
    assert.equal(outcome.ok, true);
    assert.equal(calls.count, 1);
    assert.equal(state.claims, 1);
    assert.equal(state.job?.status, "running");
    assert.equal(state.job?.parameters.providerJobId, "task-1");
    assert.equal(state.job?.attemptCount, 1);
    assert.equal(state.asset?.status, "generating");
  });

  it("rejects a second dispatch of a finished job with 409 and never calls the provider twice", async () => {
    const { store } = memoryStore(job(), asset());
    const calls = { count: 0 };
    const deps = {
      now: () => NOW,
      resolveProvider: () => provider({ status: "completed", provider: "kling", outputUrl: "https://cdn.example.com/a.png" }, calls),
    };
    const first = await runPersistedGenerationJob(JOB_ID, store, deps);
    const second = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    assert.equal(second.ok ? 0 : second.status, 409);
    assert.equal(calls.count, 1);
  });

  it("treats a repeat request for a job with a provider task as a status check, not a new paid task", async () => {
    const { store } = memoryStore(job(), asset());
    const calls = { count: 0 };
    const deps = {
      now: () => NOW,
      resolveProvider: () => provider({ status: "running", provider: "kling", providerJobId: "task-1" }, calls),
    };
    await runPersistedGenerationJob(JOB_ID, store, deps);
    const repeat = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(repeat.ok, true);
    assert.equal(calls.count, 1);
  });

  it("serialises concurrent dispatches: only one request wins the claim", async () => {
    const { store } = memoryStore(job(), asset());
    const calls = { count: 0 };
    const deps = {
      now: () => NOW,
      resolveProvider: () => provider({ status: "completed", provider: "kling", outputUrl: "https://cdn.example.com/a.png" }, calls),
    };
    const results = await Promise.all([
      runPersistedGenerationJob(JOB_ID, store, deps),
      runPersistedGenerationJob(JOB_ID, store, deps),
    ]);
    assert.equal(results.filter((result) => result.ok).length, 1);
    assert.equal(calls.count, 1);
  });

  it("marks the asset failed (not generating) when the provider fails", async () => {
    const { store, state } = memoryStore(job(), asset());
    const calls = { count: 0 };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "failed", provider: "kling", errorMessage: "quota", failureKind: "provider" }, calls),
    });
    assert.equal(outcome.ok, true);
    assert.equal(state.job?.status, "failed");
    assert.equal(state.asset?.status, "failed");
    assert.equal(state.job?.parameters.lastFailureKind, "provider");
  });

  it("completes the asset with the provider URL and marks it generated", async () => {
    const { store, state } = memoryStore(job(), asset());
    const calls = { count: 0 };
    await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "completed", provider: "kling", outputUrl: "https://cdn.example.com/a.png" }, calls),
    });
    assert.equal(state.asset?.fileUrl, "https://cdn.example.com/a.png");
    assert.equal(state.asset?.status, "ready");
    assert.equal(state.asset?.provenance, "generated");
  });

  it("keeps creator-authored provenance when a user asset is generated", async () => {
    const { store, state } = memoryStore(job(), asset({ provenance: "user" }));
    const calls = { count: 0 };
    await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "completed", provider: "kling", outputUrl: "https://cdn.example.com/a.png" }, calls),
    });
    assert.equal(state.asset?.provenance, "user");
  });

  it("refuses unapproved assets, missing jobs and jobs at the attempt limit", async () => {
    const calls = { count: 0 };
    const deps = { now: () => NOW, resolveProvider: () => provider({ status: "completed", provider: "kling", outputUrl: "https://x.example/a.png" }, calls) };
    const unapproved = await runPersistedGenerationJob(JOB_ID, memoryStore(job(), asset({ userApproved: false })).store, deps);
    assert.equal(unapproved.ok ? 200 : unapproved.status, 409);
    const missing = await runPersistedGenerationJob(JOB_ID, memoryStore(null, null).store, deps);
    assert.equal(missing.ok ? 200 : missing.status, 404);
    const capped = await runPersistedGenerationJob(
      JOB_ID,
      memoryStore(job({ attemptCount: MAX_GENERATION_ATTEMPTS }), asset()).store,
      deps,
    );
    assert.equal(capped.ok ? 200 : capped.status, 409);
    assert.equal(calls.count, 0);
  });

  it("checks status for a running job with a task ID without re-claiming or regenerating", async () => {
    const { store, state } = memoryStore(
      job({ status: "running", provider: "kling", attemptCount: 1, parameters: { providerJobId: "task-9" } }),
      asset({ status: "generating" }),
    );
    const calls = { count: 0 };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "running", provider: "kling", providerJobId: "never" }, calls),
    });
    assert.equal(outcome.ok, true);
    assert.equal(calls.count, 0);
    assert.equal(state.claims, 0);
    assert.equal(state.job?.status, "completed");
    assert.equal(state.job?.attemptCount, 1);
  });

  it("reports 500 with the provider task ID when the result cannot be saved", async () => {
    const { store } = memoryStore(job(), asset());
    store.saveJobResult = async () => {
      throw new Error("connection reset");
    };
    const calls = { count: 0 };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, {
      now: () => NOW,
      resolveProvider: () => provider({ status: "running", provider: "kling", providerJobId: "task-77" }, calls),
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok ? 0 : outcome.status, 500);
    assert.match(outcome.ok ? "" : outcome.error, /task-77/);
  });
});

// ---------------------------------------------------------------------------------------------
// v2: Kling create-task outcomes. All network traffic is a mocked fetch; no real provider is called.
// ---------------------------------------------------------------------------------------------

const KLING_ENV = { KLING_API_KEY: "test-key", KLING_API_BASE_URL: "https://kling.test" };

interface FetchLog {
  posts: Array<Record<string, unknown>>;
  gets: string[];
}

function klingDeps(
  respond: (method: string, url: string, init?: RequestInit) => Promise<Response> | Response,
  log: FetchLog,
  timeoutMs = 50,
): RunDependencies {
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "POST") log.posts.push(JSON.parse(String(init?.body)));
    else log.gets.push(String(input));
    return respond(method, String(input), init);
  }) as typeof fetch;
  return {
    now: () => NOW,
    timeoutMs,
    fetchImpl,
    resolveProvider: (_jobType, _env, wrappedFetch) => new KlingMediaProvider(KLING_ENV, wrappedFetch),
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A provider that never answers; it only stops when the request is aborted by the timeout. */
function hangUntilAborted(init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
  });
}

describe("Kling create-task outcomes (v2)", () => {
  it("completes normally: task accepted, external_task_id sent and recorded, then status check completes", async () => {
    const { store, state } = memoryStore(job(), asset());
    const log: FetchLog = { posts: [], gets: [] };
    const deps = klingDeps(
      (method) =>
        method === "POST"
          ? json({ code: 0, data: { task_id: "kling-task-1", task_status: "submitted" } })
          : json({ code: 0, data: { task_id: "kling-task-1", task_status: "succeed", task_result: { images: [{ url: "https://cdn.kling.test/a.png" }] } } }),
      log,
    );
    const first = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(first.ok, true);
    assert.equal(log.posts.length, 1);
    assert.equal(log.posts[0].external_task_id, `ks-${JOB_ID}-1`);
    assert.equal(state.job?.status, "running");
    assert.equal(state.job?.parameters.providerJobId, "kling-task-1");
    assert.equal(state.job?.parameters.externalTaskId, `ks-${JOB_ID}-1`);
    const check = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(check.ok, true);
    assert.equal(log.posts.length, 1, "a status check must never create another paid task");
    assert.equal(state.job?.status, "completed");
    assert.equal(state.asset?.fileUrl, "https://cdn.kling.test/a.png");
  });

  it("definite failure before acceptance (Kling 4xx) is an ordinary failure that stays retryable within the cap", async () => {
    const { store, state } = memoryStore(job(), asset());
    const log: FetchLog = { posts: [], gets: [] };
    let reject = true;
    const deps = klingDeps(
      () => (reject ? json({ code: 1201, message: "Invalid aspect ratio" }, 400) : json({ code: 0, data: { task_id: "kling-task-2", task_status: "submitted" } })),
      log,
    );
    await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(state.job?.status, "failed");
    assert.equal(hasUnknownProviderState(state.job!), false);
    assert.match(state.job?.errorMessage ?? "", /Invalid aspect ratio/);
    assert.equal(canRetryJob(state.job!), true);

    // Explicit creator retry: re-queue (as requeueForRetry does) and dispatch again.
    state.job = retryJob(state.job!);
    reject = false;
    const retried = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(retried.ok, true);
    assert.equal(log.posts.length, 2);
    assert.equal(log.posts[1].external_task_id, `ks-${JOB_ID}-2`, "each attempt gets its own external task ID");
    assert.equal(state.job?.parameters.providerJobId, "kling-task-2");
  });

  it("a connection that was never established (ECONNREFUSED / DNS) is a definite, retryable failure", async () => {
    for (const code of ["ECONNREFUSED", "ENOTFOUND"]) {
      const { store, state } = memoryStore(job(), asset());
      const log: FetchLog = { posts: [], gets: [] };
      const deps = klingDeps(() => {
        throw new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
      }, log);
      await runPersistedGenerationJob(JOB_ID, store, deps);
      assert.equal(state.job?.status, "failed");
      assert.equal(hasUnknownProviderState(state.job!), false, code);
      assert.equal(canRetryJob(state.job!), true, code);
    }
  });

  it("timeout after sending → provider state UNKNOWN, honest message, external task ID kept", async () => {
    const { store, state } = memoryStore(job(), asset());
    const log: FetchLog = { posts: [], gets: [] };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, klingDeps((_m, _u, init) => hangUntilAborted(init), log, 20));
    assert.equal(outcome.ok, true);
    assert.equal(log.posts.length, 1);
    assert.equal(state.job?.status, "failed");
    assert.equal(hasUnknownProviderState(state.job!), true);
    assert.equal(state.job?.parameters.providerStateUnknownReason, "timeout");
    assert.equal(state.job?.parameters.externalTaskId, `ks-${JOB_ID}-1`);
    assert.match(state.job?.errorMessage ?? "", /Kling may have accepted this request; its status is unknown\. It was not retried to avoid a duplicate charge\./);
    assert.equal(state.asset?.status, "failed");
    assert.match(state.asset?.uncertaintyNotes ?? "", /status is unknown/);
    assert.equal(state.asset?.fileUrl, undefined);
    assert.equal(canRetryJob(state.job!), false);
  });

  it("Kling 5xx, connection reset, 2xx without task ID and unreadable 2xx are all UNKNOWN", async () => {
    const cases: Array<[string, () => Response]> = [
      ["provider-response", () => json({ code: 5002, message: "Server internal timeout" }, 504)],
      ["network", () => { throw new TypeError("fetch failed", { cause: Object.assign(new Error("reset"), { code: "ECONNRESET" }) }); }],
      ["no-task-id", () => json({ code: 0, data: { task_status: "submitted" } })],
      ["provider-response", () => new Response("<html>bad gateway</html>", { status: 502 })],
      ["provider-response", () => new Response("not json", { status: 200 })],
    ];
    for (const [reason, respond] of cases) {
      const { store, state } = memoryStore(job(), asset());
      const log: FetchLog = { posts: [], gets: [] };
      await runPersistedGenerationJob(JOB_ID, store, klingDeps(respond, log));
      assert.equal(state.job?.status, "failed", reason);
      assert.equal(hasUnknownProviderState(state.job!), true, reason);
      assert.equal(state.job?.parameters.providerStateUnknownReason, reason);
      assert.equal(canRetryJob(state.job!), false, reason);
    }
  });

  it("an UNKNOWN job is never dispatched again: server refuses even if a stale tab re-queues it", async () => {
    const { store, state } = memoryStore(job(), asset());
    const log: FetchLog = { posts: [], gets: [] };
    const deps = klingDeps((_m, _u, init) => hangUntilAborted(init), log, 20);
    await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(log.posts.length, 1);

    // Second click on the failed job: not dispatchable.
    const again = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(again.ok ? 200 : again.status, 409);

    // A stale client that re-queues it with the old retry logic (strips only providerJobId/lastFailureKind).
    const { providerJobId: _a, lastFailureKind: _b, ...kept } = state.job!.parameters;
    void _a;
    void _b;
    state.job = { ...state.job!, status: "queued", parameters: kept, errorMessage: undefined, completedAt: undefined };
    const requeued = await runPersistedGenerationJob(JOB_ID, store, deps);
    assert.equal(requeued.ok ? 200 : requeued.status, 409);
    assert.match(requeued.ok ? "" : requeued.error, /not retried to avoid a duplicate charge/);
    assert.equal(log.posts.length, 1, "no second paid Kling request");
    assert.equal(state.claims, 1, "no second claim");
  });

  it("a NEW job for the same asset is refused while a sibling job's provider state is unknown", async () => {
    const unknownSibling: GenerationJob = {
      ...job({ id: "44444444-4444-4444-8444-444444444444", status: "failed", attemptCount: 1, provider: "kling" }),
      parameters: { providerStateUnknownAt: NOW, providerStateUnknownReason: "timeout" },
    };
    const { store, state } = memoryStore(job(), asset(), [unknownSibling]);
    const log: FetchLog = { posts: [], gets: [] };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, klingDeps(() => json({ code: 0, data: { task_id: "x" } }), log));
    assert.equal(outcome.ok ? 200 : outcome.status, 409);
    assert.equal(log.posts.length, 0);
    assert.equal(state.claims, 0);

    // After the creator explicitly confirms the dashboard check, a new attempt is allowed.
    state.otherJobs = [acknowledgeUnknownProviderState(unknownSibling, "2026-10-08T12:10:00.000Z")];
    const allowed = await runPersistedGenerationJob(JOB_ID, store, klingDeps(() => json({ code: 0, data: { task_id: "x" } }), log));
    assert.equal(allowed.ok, true);
    assert.equal(log.posts.length, 1);
  });

  it("a completed job is protected from duplicate dispatch (409, no provider call)", async () => {
    const { store } = memoryStore(
      job({ status: "completed", attemptCount: 1, provider: "kling", outputUrl: "https://cdn.kling.test/a.png", parameters: { providerJobId: "t" } }),
      asset({ status: "ready", fileUrl: "https://cdn.kling.test/a.png" }),
    );
    const log: FetchLog = { posts: [], gets: [] };
    const outcome = await runPersistedGenerationJob(JOB_ID, store, klingDeps(() => json({ code: 0, data: { task_id: "x" } }), log));
    assert.equal(outcome.ok ? 200 : outcome.status, 409);
    assert.equal(log.posts.length + log.gets.length, 0);
  });
});
