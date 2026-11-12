import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

import testAuth from "./test-auth.cjs";

const {
  createTestAccessToken,
  testForeignUserId,
  testOwnerId,
  testProductionId,
  verifyTestAccessToken,
} = testAuth;

const port = Number(process.env.E2E_SUPABASE_PORT ?? 54321);
const renderWorkerKey = process.env.E2E_RENDER_WORKER_KEY ?? "e2e-render-worker-test-service-role-key";
const readySequenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const failingSequenceId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const production = {
  id: testProductionId,
  owner_id: testOwnerId,
  created_by: testOwnerId,
  title: "Server Auth Production",
  slug: "server-auth-production",
  logline: null,
  synopsis: null,
  genre: null,
  target_audience: null,
  art_style: null,
  language: "English",
  aspect_ratio: "16:9",
  target_duration_seconds: 90,
  cover_image_url: null,
  status: "concept",
  visibility: "private",
  created_at: "2026-10-09T00:00:00.000Z",
  updated_at: "2026-10-09T00:00:00.000Z",
  last_opened_at: null,
  deleted_at: null,
};

const screenplayRouteProduction = {
  ...production,
  id: "86794874-c848-495f-9043-f983a88cea4b",
  title: "Screenplay Route Verification",
  slug: "screenplay-route-verification",
};

const productions = new Map([
  [production.id, { ...production }],
  [screenplayRouteProduction.id, { ...screenplayRouteProduction }],
]);

const screenplays = new Map();
const screenplayRevisions = new Map();

const renderSequences = [
  {
    id: readySequenceId,
    production_id: testProductionId,
    title: "Two-clip local render",
    status: "ready",
    progress: 100,
    item_count: 2,
    ready_item_count: 2,
    missing_media_count: 0,
    total_duration_seconds: 2,
    uncertainty_notes: null,
    source_evidence: "Local render integration fixture",
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-09T00:00:00.000Z",
    updated_at: "2026-10-09T00:00:00.000Z",
  },
  {
    id: failingSequenceId,
    production_id: testProductionId,
    title: "Failing render fixture",
    status: "ready",
    progress: 100,
    item_count: 1,
    ready_item_count: 1,
    missing_media_count: 0,
    total_duration_seconds: 1,
    uncertainty_notes: null,
    source_evidence: "Local failure integration fixture",
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-08T00:00:00.000Z",
    updated_at: "2026-10-08T00:00:00.000Z",
  },
];

const renderClips = [
  ...[1, 2].map((sequenceNumber) => ({
    id: `cccccccc-cccc-4ccc-8ccc-${String(sequenceNumber).padStart(12, "0")}`,
    production_id: testProductionId,
    render_id: readySequenceId,
    sequence_number: sequenceNumber,
    scene_id: null,
    shot_id: null,
    panel_id: null,
    asset_id: null,
    title: `Approved test clip ${sequenceNumber}`,
    description: "Synthetic color slate for local ffmpeg integration testing.",
    media_url: null,
    duration_seconds: 1,
    source_kind: "scene",
    source_id: null,
    source_evidence: null,
    uncertainty_notes: null,
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-09T00:00:00.000Z",
    updated_at: "2026-10-09T00:00:00.000Z",
  })),
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    production_id: testProductionId,
    render_id: failingSequenceId,
    sequence_number: 1,
    scene_id: null,
    shot_id: null,
    panel_id: null,
    asset_id: null,
    title: "Invalid network source",
    description: "Deliberately unavailable source for failure-state testing.",
    media_url: "https://127.0.0.1:1/unavailable.mp4",
    duration_seconds: 1,
    source_kind: "scene",
    source_id: null,
    source_evidence: null,
    uncertainty_notes: null,
    provenance: "user",
    user_approved: true,
    created_at: "2026-10-08T00:00:00.000Z",
    updated_at: "2026-10-08T00:00:00.000Z",
  },
];

const videoRenderJobs = new Map();

function json(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "apikey, authorization, content-type, x-client-info, prefer, accept-profile, content-profile",
    "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function matchesFilters(row, searchParams) {
  for (const [key, filter] of searchParams.entries()) {
    if (key === "select" || key === "order") continue;
    if (filter.startsWith("eq.") && String(row[key] ?? "") !== filter.slice(3)) return false;
  }
  return true;
}

function postgrestJson(response, request, status, rows) {
  const asObject = request.headers.accept?.includes("vnd.pgrst.object+json");
  if (asObject && rows.length === 0) {
    json(response, 406, { message: "No rows found" });
    return;
  }
  json(response, status, asObject ? rows[0] : rows);
}

function workerRpc(name, body) {
  const now = Date.now();
  const job = videoRenderJobs.get(body.p_job_id);
  if (name === "claim_video_render_job") {
    for (const candidate of videoRenderJobs.values()) {
      if (candidate.status === "running" && Date.parse(candidate.lease_expires_at ?? "") <= now) {
        if (candidate.cancel_requested) {
          Object.assign(candidate, { status: "cancelled", failure_code: "cancelled", retryable: false, completed_at: new Date(now).toISOString() });
        } else if (candidate.attempts >= candidate.max_attempts) {
          Object.assign(candidate, { status: "failed", failure_code: "worker_lease_expired", retryable: false, completed_at: new Date(now).toISOString() });
        } else {
          Object.assign(candidate, { status: "queued", failure_code: "worker_lease_expired", retryable: true, next_attempt_at: new Date(now + 5 * 2 ** (candidate.attempts - 1) * 1000).toISOString() });
        }
        Object.assign(candidate, { lease_owner: null, lease_token: null, lease_expires_at: null });
      }
    }
    const candidate = [...videoRenderJobs.values()]
      .filter((row) => row.status === "queued" && !row.cancel_requested && row.attempts < row.max_attempts && Date.parse(row.next_attempt_at ?? "") <= now)
      .sort((left, right) => Date.parse(left.next_attempt_at) - Date.parse(right.next_attempt_at))[0];
    if (!candidate) return [];
    Object.assign(candidate, {
      status: "running",
      progress: Math.max(candidate.progress, 1),
      attempts: candidate.attempts + 1,
      started_at: new Date(now).toISOString(),
      lease_owner: body.p_worker_id,
      lease_token: randomUUID(),
      lease_expires_at: new Date(now + (body.p_lease_seconds ?? 90) * 1000).toISOString(),
    });
    return [candidate];
  }
  if (!job) return [];
  if (name === "heartbeat_video_render_job") {
    if (job.status !== "running" || job.lease_token !== body.p_lease_token || Date.parse(job.lease_expires_at ?? "") <= now) return [];
    if (!job.cancel_requested) job.lease_expires_at = new Date(now + (body.p_lease_seconds ?? 90) * 1000).toISOString();
    return [job];
  }
  if (name === "update_video_render_progress") {
    if (job.status !== "running" || job.cancel_requested || job.lease_token !== body.p_lease_token) return [];
    job.progress = Math.max(job.progress, Math.min(99, body.p_progress));
    return [job];
  }
  if (name === "complete_video_render_job") {
    if (job.status !== "running" || job.cancel_requested || job.lease_token !== body.p_lease_token || Date.parse(job.lease_expires_at ?? "") <= now) return [];
    Object.assign(job, {
      status: "completed",
      progress: 100,
      storage_key: body.p_storage_key,
      storage_url: body.p_storage_url,
      file_size_bytes: body.p_file_size_bytes,
      duration_seconds: body.p_duration_seconds,
      warnings: body.p_warnings ?? [],
      retryable: false,
      completed_at: new Date(now).toISOString(),
      lease_owner: null,
      lease_token: null,
      lease_expires_at: null,
    });
    return [job];
  }
  if (name === "fail_video_render_job") {
    if (job.status !== "running" || job.lease_token !== body.p_lease_token || Date.parse(job.lease_expires_at ?? "") <= now) return [];
    if (job.cancel_requested) {
      Object.assign(job, { status: "cancelled", failure_code: "cancelled", retryable: false, completed_at: new Date(now).toISOString() });
    } else {
      const retryable = Boolean(body.p_retryable) && job.attempts < job.max_attempts;
      Object.assign(job, {
        status: retryable ? "queued" : "failed",
        failure_code: body.p_failure_code,
        error: String(body.p_error ?? "").slice(0, 4000),
        retryable,
        next_attempt_at: retryable ? new Date(now + Math.min(900, 5 * 2 ** (job.attempts - 1)) * 1000).toISOString() : job.next_attempt_at,
        completed_at: retryable ? null : new Date(now).toISOString(),
      });
    }
    Object.assign(job, { lease_owner: null, lease_token: null, lease_expires_at: null });
    return [job];
  }
  if (name === "release_video_render_job") {
    if (job.status !== "running" || job.lease_token !== body.p_lease_token) return [];
    Object.assign(job, {
      status: job.cancel_requested ? "cancelled" : "queued",
      progress: job.cancel_requested ? job.progress : 0,
      failure_code: job.cancel_requested ? "cancelled" : "worker_shutdown",
      error: job.cancel_requested ? "Render cancelled by creator." : "Worker released the job during shutdown.",
      completed_at: job.cancel_requested ? new Date(now).toISOString() : null,
      lease_owner: null,
      lease_token: null,
      lease_expires_at: null,
    });
    return [job];
  }
  return [];
}

function getProductionOwner(prodId) {
  const p = productions.get(prodId);
  return p ? p.owner_id : null;
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "apikey, authorization, content-type, x-client-info, prefer, accept-profile, content-profile",
      "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    });
    response.end();
    return;
  }

  if (url.pathname === "/health") {
    json(response, 200, { status: "ok" });
    return;
  }

  // --- Auth endpoints ---
  if (url.pathname === "/auth/v1/token") {
    const grantType = url.searchParams.get("grant_type");
    void readBody(request).then((body) => {
      if (grantType === "password") {
        if (!body.email || !body.password || body.password === "wrong-password") {
          json(response, 400, {
            error: "invalid_grant",
            error_description: "Invalid login credentials",
          });
          return;
        }
        const targetUserId = body.email.includes("foreign") ? testForeignUserId : testOwnerId;
        const accessToken = createTestAccessToken(targetUserId);
        json(response, 200, {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "e2e-valid-refresh-token",
          user: {
            id: targetUserId,
            aud: "authenticated",
            role: "authenticated",
            email: body.email,
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: { full_name: "Kingdom Creator" },
            created_at: "2026-10-09T00:00:00.000Z",
          },
        });
        return;
      }
      if (grantType === "refresh_token") {
        if (!body.refresh_token || body.refresh_token === "invalid-refresh-token") {
          json(response, 400, {
            error: "invalid_grant",
            error_description: "Invalid Refresh Token: Refresh Token Not Found",
          });
          return;
        }
        const accessToken = createTestAccessToken(testOwnerId);
        json(response, 200, {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "e2e-refreshed-token",
          user: {
            id: testOwnerId,
            aud: "authenticated",
            role: "authenticated",
            email: "e2e-owner@example.invalid",
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: {},
            created_at: "2026-10-09T00:00:00.000Z",
          },
        });
        return;
      }
      json(response, 400, { error: "unsupported_grant_type" });
    }).catch(() => json(response, 400, { message: "Invalid JSON" }));
    return;
  }

  if (url.pathname === "/auth/v1/logout") {
    json(response, 200, {});
    return;
  }

  if (url.pathname === "/auth/v1/signup") {
    void readBody(request).then((body) => {
      const newUserId = randomUUID();
      const accessToken = createTestAccessToken(newUserId);
      json(response, 200, {
        id: newUserId,
        aud: "authenticated",
        role: "authenticated",
        email: body.email,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: body.options?.data ?? {},
        created_at: new Date().toISOString(),
        session: {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "e2e-signup-refresh-token",
          user: {
            id: newUserId,
            aud: "authenticated",
            role: "authenticated",
            email: body.email,
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: body.options?.data ?? {},
            created_at: new Date().toISOString(),
          },
        },
      });
    }).catch(() => json(response, 400, { message: "Invalid JSON" }));
    return;
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  const claims = verifyTestAccessToken(token);
  const isRenderWorker = token === renderWorkerKey;

  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    const name = url.pathname.slice("/rest/v1/rpc/".length);
    void readBody(request).then((body) => {
      if (isRenderWorker && [
        "claim_video_render_job",
        "heartbeat_video_render_job",
        "update_video_render_progress",
        "complete_video_render_job",
        "fail_video_render_job",
        "release_video_render_job",
      ].includes(name)) {
        json(response, 200, workerRpc(name, body));
        return;
      }
      if (!claims || (name !== "cancel_video_render_job" && name !== "retry_video_render_job")) {
        json(response, 401, { message: "Invalid RPC authorization." });
        return;
      }
      const job = videoRenderJobs.get(body.p_job_id);
      if (!job || job.production_id !== production.id || claims.sub !== production.owner_id) {
        json(response, 200, []);
        return;
      }
      if (name === "cancel_video_render_job" && ["queued", "running"].includes(job.status)) {
        Object.assign(job, {
          status: job.status === "queued" ? "cancelled" : "running",
          cancel_requested: true,
          failure_code: "cancelled",
          retryable: false,
          error: body.p_reason || "Render cancelled by creator.",
          completed_at: job.status === "queued" ? new Date().toISOString() : null,
        });
        json(response, 200, [job]);
        return;
      }
      if (name === "retry_video_render_job" && job.status === "failed" && job.retryable && job.attempts < job.max_attempts) {
        Object.assign(job, {
          status: "queued",
          progress: 0,
          error: null,
          failure_code: null,
          retryable: true,
          cancel_requested: false,
          started_at: null,
          completed_at: null,
          next_attempt_at: new Date().toISOString(),
        });
        json(response, 200, [job]);
        return;
      }
      json(response, 200, []);
    }).catch(() => json(response, 400, { message: "Invalid JSON" }));
    return;
  }

  if (!claims && url.pathname === "/rest/v1/productions" && request.method === "GET") {
    postgrestJson(response, request, 200, []);
    return;
  }

  if (url.pathname === "/auth/v1/user") {
    if (!claims) {
      json(response, 401, { message: "Invalid or expired test session" });
      return;
    }
    json(response, 200, {
      id: claims.sub,
      aud: "authenticated",
      role: "authenticated",
      email: `e2e-${claims.sub}@example.invalid`,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-10-09T00:00:00.000Z",
    });
    return;
  }

  if (url.pathname.startsWith("/rest/v1/")) {
    if (!claims && !isRenderWorker) {
      json(response, 401, { message: "Missing or invalid test bearer token" });
      return;
    }
    const table = url.pathname.slice("/rest/v1/".length);

    // --- Productions table ---
    if (table === "productions" && request.method === "GET") {
      const rows = [...productions.values()].filter(
        (row) => claims.sub === row.owner_id && matchesFilters(row, url.searchParams),
      );
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "productions" && request.method === "POST") {
      void readBody(request).then((row) => {
        if (claims.sub !== row.owner_id) {
          json(response, 403, { message: "Row-level security policy denied insert." });
          return;
        }
        const created = {
          ...row,
          id: row.id ?? randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        productions.set(created.id, created);
        postgrestJson(response, request, 201, [created]);
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }

    // --- Screenplays table ---
    if (table === "screenplays" && request.method === "GET") {
      const rows = [...screenplays.values()].filter((row) => {
        const owner = getProductionOwner(row.production_id);
        return claims.sub === owner && matchesFilters(row, url.searchParams);
      });
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "screenplays" && request.method === "POST") {
      void readBody(request).then((row) => {
        const owner = getProductionOwner(row.production_id);
        if (!owner || claims.sub !== owner) {
          json(response, 403, { message: "Row-level security policy denied insert." });
          return;
        }
        const created = {
          ...row,
          id: row.id ?? randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        screenplays.set(created.id, created);
        postgrestJson(response, request, 201, [created]);
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }

    if (table === "screenplays" && request.method === "PATCH") {
      void readBody(request).then((patch) => {
        const matching = [...screenplays.values()].filter((row) => {
          const owner = getProductionOwner(row.production_id);
          return claims.sub === owner && matchesFilters(row, url.searchParams);
        });
        if (matching.length === 0) {
          postgrestJson(response, request, 200, []);
          return;
        }
        const updatedRows = [];
        for (const existing of matching) {
          const updated = {
            ...existing,
            ...patch,
            updated_at: new Date().toISOString(),
          };
          screenplays.set(updated.id, updated);
          updatedRows.push(updated);
        }
        postgrestJson(response, request, 200, updatedRows);
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }

    // --- Screenplay Revisions table ---
    if (table === "screenplay_revisions" && request.method === "GET") {
      const rows = [...screenplayRevisions.values()].filter((row) => {
        const screenplay = screenplays.get(row.screenplay_id);
        const owner = screenplay ? getProductionOwner(screenplay.production_id) : null;
        return claims.sub === owner && matchesFilters(row, url.searchParams);
      }).sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "screenplay_revisions" && request.method === "POST") {
      void readBody(request).then((row) => {
        const screenplay = screenplays.get(row.screenplay_id);
        const owner = screenplay ? getProductionOwner(screenplay.production_id) : null;
        if (!owner || claims.sub !== owner) {
          json(response, 403, { message: "Row-level security policy denied insert." });
          return;
        }
        const created = {
          ...row,
          id: row.id ?? randomUUID(),
          created_at: new Date().toISOString(),
        };
        screenplayRevisions.set(created.id, created);
        postgrestJson(response, request, 201, [created]);
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }

    // --- Render Sequences & Clips ---
    if (table === "render_sequences" && request.method === "GET") {
      const rows = claims.sub === production.owner_id
        ? renderSequences.filter((row) => matchesFilters(row, url.searchParams))
        : [];
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "render_clips" && request.method === "GET") {
      const rows = claims.sub === production.owner_id
        ? renderClips.filter((row) => matchesFilters(row, url.searchParams))
        : [];
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "video_render_jobs" && request.method === "POST") {
      void readBody(request).then((row) => {
        if (claims.sub !== production.owner_id || row.production_id !== production.id) {
          json(response, 403, { message: "Row-level security policy denied insert." });
          return;
        }
        const job = {
          ...row,
          next_attempt_at: row.next_attempt_at ?? new Date().toISOString(),
          lease_owner: null,
          lease_token: null,
          lease_expires_at: null,
        };
        videoRenderJobs.set(row.id, job);
        postgrestJson(response, request, 201, [job]);
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }

    if (table === "video_render_jobs" && request.method === "GET") {
      const rows = isRenderWorker || claims?.sub === production.owner_id
        ? [...videoRenderJobs.values()].filter((row) => matchesFilters(row, url.searchParams))
        : [];
      postgrestJson(response, request, 200, rows);
      return;
    }

    if (table === "video_render_jobs" && request.method === "PATCH") {
      void readBody(request).then((patch) => {
        const rows = [...videoRenderJobs.values()].filter((row) =>
          claims.sub === production.owner_id &&
          row.production_id === production.id &&
          matchesFilters(row, url.searchParams)
        );
        for (const row of rows) {
          videoRenderJobs.set(row.id, { ...row, ...patch, updated_at: new Date().toISOString() });
        }
        postgrestJson(
          response,
          request,
          200,
          rows.map((row) => videoRenderJobs.get(row.id)),
        );
      }).catch(() => json(response, 400, { message: "Invalid JSON" }));
      return;
    }
    json(response, 200, []);
    return;
  }

  json(response, 404, { message: "Unknown local Supabase test endpoint" });
});

server.listen(port, "127.0.0.1");
