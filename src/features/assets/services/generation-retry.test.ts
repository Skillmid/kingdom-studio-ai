import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GenerationJob } from "../types/generation-job";
import { GenerationJobRepository } from "../repositories/generation-job.repository";
import {
  acknowledgeUnknownProviderState,
  canRetryJob,
  draftJobFromAsset,
  hasUnknownProviderState,
  isStalledJob,
  markStalledJobFailed,
  MAX_GENERATION_ATTEMPTS,
  retryJob,
  retryPersistencePatch,
  selectNewJobProposals,
  STALLED_JOB_ERROR,
  STALLED_RUNNING_JOB_MS,
  withUnknownProviderState,
} from "./generation-job";

const NOW = "2026-10-08T12:00:00.000Z";

function job(partial: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    productionId: "11111111-1111-4111-8111-111111111111",
    assetId: "22222222-2222-4222-8222-222222222222",
    jobType: "image",
    status: "failed",
    provider: "openai-image",
    prompt: "Ferry pier at dawn.",
    parameters: { aspect_ratio: "16:9", providerJobId: "old-task", lastFailureKind: "inline-data-requires-storage" },
    attemptCount: 1,
    errorMessage: "old error",
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe("explicit retry", () => {
  it("unpins a provider that failed for a non-transient reason and clears stale task state", () => {
    const retried = retryJob(job());
    assert.equal(retried.status, "queued");
    assert.equal(retried.provider, undefined);
    assert.equal(retried.parameters.providerJobId, undefined);
    assert.equal(retried.parameters.lastFailureKind, undefined);
    assert.equal(retried.parameters.aspect_ratio, "16:9");
  });

  it("keeps the provider for a transient failure", () => {
    const retried = retryJob(job({ provider: "kling", parameters: { lastFailureKind: "provider" } }));
    assert.equal(retried.provider, "kling");
  });

  it("caps attempts", () => {
    assert.equal(canRetryJob(job({ attemptCount: MAX_GENERATION_ATTEMPTS })), false);
    assert.throws(() => retryJob(job({ attemptCount: MAX_GENERATION_ATTEMPTS })), /attempts/);
    assert.equal(canRetryJob(job({ status: "running" })), false);
  });

  it("writes explicit nulls so stale values are cleared in the database", () => {
    const patch = retryPersistencePatch(retryJob(job()));
    assert.equal(patch.error_message, null);
    assert.equal(patch.output_url, null);
    assert.equal(patch.provider, null);
    assert.equal(patch.status, "queued");
  });
});

describe("stalled running jobs", () => {
  const now = Date.parse(NOW) + STALLED_RUNNING_JOB_MS + 1;
  // Stalled detection is based on the server-written started_at (set by the atomic claim).
  it("flags running jobs without a task ID whose started_at is past the threshold", () => {
    assert.equal(isStalledJob(job({ status: "running", startedAt: NOW, parameters: {} }), now), true);
  });
  it("never flags jobs with a provider task or a recent start", () => {
    assert.equal(isStalledJob(job({ status: "running", startedAt: NOW, parameters: { providerJobId: "t" } }), now), false);
    assert.equal(isStalledJob(job({ status: "running", startedAt: NOW, parameters: {} }), Date.parse(NOW) + 1000), false);
    assert.equal(isStalledJob(job({ status: "queued", startedAt: NOW, parameters: {} }), now), false);
  });
});

describe("stalled-job rule uses started_at only (v2)", () => {
  const startedAt = "2026-10-08T12:00:00.000Z";
  const started = Date.parse(startedAt);
  const running = (partial: Partial<GenerationJob> = {}) =>
    job({ status: "running", startedAt, parameters: {}, errorMessage: undefined, ...partial });

  it("1. running job with a recent started_at is NOT stalled", () => {
    assert.equal(isStalledJob(running(), started + 60_000), false);
    assert.equal(isStalledJob(running(), started + STALLED_RUNNING_JOB_MS - 1), false);
  });

  it("2. running job beyond the threshold IS eligible as stalled", () => {
    assert.equal(isStalledJob(running(), started + STALLED_RUNNING_JOB_MS), true);
    assert.equal(isStalledJob(running(), started + 2 * STALLED_RUNNING_JOB_MS), true);
  });

  it("3. queued job is NOT stalled, even long after creation", () => {
    assert.equal(isStalledJob(job({ status: "queued", startedAt: undefined, parameters: {} }), started + 10 * STALLED_RUNNING_JOB_MS), false);
  });

  it("4. completed job is NOT stalled", () => {
    assert.equal(isStalledJob(job({ status: "completed", startedAt, parameters: {} }), started + 10 * STALLED_RUNNING_JOB_MS), false);
  });

  it("5. failed (and cancelled) jobs are NOT stalled", () => {
    assert.equal(isStalledJob(job({ status: "failed", startedAt, parameters: {} }), started + 10 * STALLED_RUNNING_JOB_MS), false);
    assert.equal(isStalledJob(job({ status: "cancelled", startedAt, parameters: {} }), started + 10 * STALLED_RUNNING_JOB_MS), false);
  });

  it("a running job without started_at is NOT stalled, and updated_at is ignored", () => {
    assert.equal(isStalledJob(running({ startedAt: undefined }), started + 10 * STALLED_RUNNING_JOB_MS), false);
    // An old updated_at (e.g. no hosted trigger) must not make a just-started job look stalled.
    const justStarted = running({ startedAt: new Date(started + 10 * STALLED_RUNNING_JOB_MS).toISOString(), updatedAt: "2026-01-01T00:00:00.000Z" });
    assert.equal(isStalledJob(justStarted, started + 10 * STALLED_RUNNING_JOB_MS + 5_000), false);
    assert.equal(isStalledJob(running({ startedAt: "not-a-date" }), started + 10 * STALLED_RUNNING_JOB_MS), false);
  });

  it("marking a stalled job records an UNKNOWN provider state and never makes it retryable", () => {
    const failed = markStalledJobFailed(running({ attemptCount: 1 }), started + STALLED_RUNNING_JOB_MS);
    assert.equal(failed.status, "failed");
    assert.equal(failed.errorMessage, STALLED_JOB_ERROR);
    assert.equal(failed.parameters.providerStateUnknownReason, "stalled");
    assert.equal(hasUnknownProviderState(failed), true);
    assert.equal(canRetryJob(failed), false);
    assert.throws(() => retryJob(failed), /status is unknown/);
    assert.throws(() => markStalledJobFailed(running(), started + 1_000), /can be marked stalled/);
  });

  it("the mark-stalled UPDATE is conditional on running + same started_at + no task ID, never on updated_at", async () => {
    const calls: Array<[string, ...unknown[]]> = [];
    let written: Record<string, unknown> = {};
    const row = { id: "33333333-3333-4333-8333-333333333333", production_id: "p", job_type: "image", status: "failed", parameters: {}, attempt_count: 1, created_at: NOW, updated_at: NOW };
    const builder = {
      update(patch: Record<string, unknown>) { written = patch; calls.push(["update"]); return builder; },
      eq(column: string, value: unknown) { calls.push(["eq", column, value]); return builder; },
      is(column: string, value: unknown) { calls.push(["is", column, value]); return builder; },
      select() { return builder; },
      async maybeSingle() { return { data: row, error: null }; },
    };
    const repository = new GenerationJobRepository({ from: () => builder } as never);
    await repository.markStalledFailed(running(), started + STALLED_RUNNING_JOB_MS);
    assert.deepEqual(calls.filter((call) => call[0] !== "update"), [
      ["eq", "id", "33333333-3333-4333-8333-333333333333"],
      ["eq", "status", "running"],
      ["eq", "started_at", startedAt],
      ["is", "parameters->>providerJobId", null],
    ]);
    assert.equal(calls.some((call) => call[1] === "updated_at"), false);
    assert.equal(written.status, "failed");
    assert.equal((written.parameters as Record<string, unknown>).providerStateUnknownReason, "stalled");
    assert.equal("updated_at" in written, false);
  });
});

describe("unknown provider state blocks automatic retries", () => {
  const unknown = () =>
    withUnknownProviderState(
      job({ provider: "kling", parameters: { lastFailureKind: "timeout", externalTaskId: "ks-x-1" } }),
      NOW,
      "timeout",
    );

  it("is not retryable and retryJob refuses with an honest message", () => {
    assert.equal(canRetryJob(unknown()), false);
    assert.throws(() => retryJob(unknown()), /Kling may have accepted this request; its status is unknown/);
  });

  it("blocks a new job proposal for the same asset", () => {
    const draft = draftJobFromAsset({ id: "22222222-2222-4222-8222-222222222222", productionId: "p", kind: "image", prompt: "x", sourceKind: "shot" });
    assert.equal(selectNewJobProposals([draft], [unknown()]).length, 0);
    assert.equal(selectNewJobProposals([draft], [job({ parameters: {} })]).length, 1);
  });

  it("becomes retryable (within the cap) only after explicit creator confirmation; markers are kept", () => {
    const confirmed = acknowledgeUnknownProviderState(unknown(), "2026-10-08T12:30:00.000Z");
    assert.equal(hasUnknownProviderState(confirmed), false);
    assert.equal(canRetryJob(confirmed), true);
    const retried = retryJob(confirmed);
    assert.equal(retried.parameters.providerStateUnknownAt, NOW);
    assert.equal(retried.parameters.externalTaskId, undefined);
    assert.equal(canRetryJob({ ...confirmed, attemptCount: MAX_GENERATION_ATTEMPTS }), false);
  });

  it("a new unknown outcome clears an earlier confirmation", () => {
    const confirmed = acknowledgeUnknownProviderState(unknown(), "2026-10-08T12:30:00.000Z");
    assert.equal(hasUnknownProviderState(withUnknownProviderState(confirmed, "2026-10-08T13:00:00.000Z", "network")), true);
  });

  it("the creator confirmation UPDATE is conditional on the same unknown marker", async () => {
    const calls: unknown[][] = [];
    let written: Record<string, unknown> = {};
    const row = { id: "33333333-3333-4333-8333-333333333333", production_id: "p", job_type: "image", status: "failed", parameters: {}, attempt_count: 1, created_at: NOW, updated_at: NOW };
    const builder = {
      update(patch: Record<string, unknown>) { written = patch; return builder; },
      eq(column: string, value: unknown) { calls.push(["eq", column, value]); return builder; },
      in(column: string, values: unknown) { calls.push(["in", column, values]); return builder; },
      select() { return builder; },
      async maybeSingle() { return { data: row, error: null }; },
    };
    const repository = new GenerationJobRepository({ from: () => builder } as never);
    await repository.confirmProviderChecked(unknown(), "2026-10-08T12:30:00.000Z");
    assert.deepEqual(calls, [
      ["eq", "id", "33333333-3333-4333-8333-333333333333"],
      ["in", "status", ["failed", "queued"]],
      ["eq", "parameters->>providerStateUnknownAt", NOW],
    ]);
    assert.equal((written.parameters as Record<string, unknown>).providerStateAcknowledgedAt, "2026-10-08T12:30:00.000Z");
    assert.equal(Object.keys(written).join(","), "parameters");
  });

  it("a known (definite) failure remains retryable", () => {
    assert.equal(canRetryJob(job({ parameters: { lastFailureKind: "provider" } })), true);
  });
});

describe("job parameters", () => {
  it("carries the production aspect ratio for provider mapping", () => {
    const draft = draftJobFromAsset(
      { id: "a", productionId: "p", kind: "image", prompt: "x", sourceKind: "shot" },
      { aspectRatio: "2.39:1" },
    );
    assert.deepEqual(draft.parameters, { aspect_ratio: "2.39:1" });
  });
});
