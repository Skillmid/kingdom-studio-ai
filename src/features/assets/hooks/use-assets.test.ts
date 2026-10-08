import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GenerationJob } from "@/features/assets/types/generation-job";
import { supabase } from "@/lib/supabase/client";
import { dispatchJob } from "./use-assets";

type SupabaseSession = NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>;

const queuedJob: GenerationJob = {
  id: "44444444-4444-4444-8444-444444444444",
  productionId: "11111111-1111-4111-8111-111111111111",
  assetId: "22222222-2222-4222-8222-222222222222",
  jobType: "image",
  status: "queued",
  prompt: "Harbour clerk at a wooden desk.",
  parameters: {},
  attemptCount: 0,
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};

describe("bearer token extraction pattern", () => {
  function extractToken(authHeader: string | null | undefined): string | undefined {
    return authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  }

  it("extracts token from standard and case-insensitive Bearer headers", () => {
    assert.equal(extractToken("Bearer token-abc-123"), "token-abc-123");
    assert.equal(extractToken("bearer token-def-456"), "token-def-456");
    assert.equal(extractToken("BEARER token-ghi-789"), "token-ghi-789");
  });

  it("returns undefined for missing, empty, or non-Bearer headers", () => {
    assert.equal(extractToken(null), undefined);
    assert.equal(extractToken(undefined), undefined);
    assert.equal(extractToken(""), undefined);
    assert.equal(extractToken("Basic dXNlcjpwYXNz"), undefined);
    assert.equal(extractToken("Token abc"), undefined);
  });
});

describe("route generation authentication evaluation", () => {
  async function evaluateAuth(
    header: string | null | undefined,
    getUser: (token?: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>,
  ): Promise<{ status: 200 | 401; user: { id: string } | null; error?: string }> {
    const accessToken = header?.match(/^Bearer\s+(.+)$/i)?.[1];
    const { data: { user }, error: authError } = await getUser(accessToken);
    if (authError || !user) {
      return { status: 401, user: null, error: "Authentication is required." };
    }
    return { status: 200, user };
  }

  it("authenticates valid Bearer tokens and returns user", async () => {
    let capturedToken: string | undefined;
    const result = await evaluateAuth("Bearer valid-jwt-token", async (token) => {
      capturedToken = token;
      return { data: { user: { id: "user-creator-1" } }, error: null };
    });

    assert.equal(capturedToken, "valid-jwt-token");
    assert.equal(result.status, 200);
    assert.equal(result.user?.id, "user-creator-1");
  });

  it("returns 401 when token is missing and no session exists", async () => {
    const result = await evaluateAuth(null, async () => {
      return { data: { user: null }, error: null };
    });

    assert.equal(result.status, 401);
    assert.equal(result.user, null);
    assert.equal(result.error, "Authentication is required.");
  });

  it("returns 401 when token is invalid or rejected by auth provider", async () => {
    const result = await evaluateAuth("Bearer invalid-jwt-token", async () => {
      return { data: { user: null }, error: new Error("JWT expired") };
    });

    assert.equal(result.status, 401);
    assert.equal(result.user, null);
    assert.equal(result.error, "Authentication is required.");
  });
});

describe("useAssets dispatchJob authentication", () => {
  it("sends Bearer access_token when an active Supabase session exists", async () => {
    const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
    const mockSession: SupabaseSession = {
      access_token: "active-session-jwt-token-999",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 9999999999,
      refresh_token: "refresh-token-xyz",
      user: {
        id: "creator-user-uuid",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "2026-09-27T00:00:00.000Z",
      },
    };

    supabase.auth.getSession = async () => ({
      data: { session: mockSession },
      error: null,
    });

    let interceptedUrl = "";
    let interceptedHeaders: Record<string, string> = {};
    let interceptedBody = "";

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      interceptedUrl = String(input);
      interceptedHeaders = (init?.headers as Record<string, string>) ?? {};
      interceptedBody = String(init?.body ?? "");

      const returnedJob: GenerationJob = { ...queuedJob, status: "completed" };
      return new Response(JSON.stringify({ job: returnedJob }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const result = await dispatchJob(queuedJob, mockFetch);
      assert.equal(interceptedUrl, "/api/generation/run");
      assert.equal(interceptedHeaders["Authorization"], "Bearer active-session-jwt-token-999");
      assert.equal(interceptedHeaders["Content-Type"], "application/json");
      assert.equal(JSON.parse(interceptedBody).jobId, queuedJob.id);
      assert.equal(result.status, "completed");
    } finally {
      supabase.auth.getSession = originalGetSession;
    }
  });

  it("omits Authorization header when no Supabase session exists", async () => {
    const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

    supabase.auth.getSession = async () => ({
      data: { session: null },
      error: null,
    });

    let interceptedHeaders: Record<string, string> = {};

    const mockFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      interceptedHeaders = (init?.headers as Record<string, string>) ?? {};
      const returnedJob: GenerationJob = { ...queuedJob, status: "completed" };
      return new Response(JSON.stringify({ job: returnedJob }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await dispatchJob(queuedJob, mockFetch);
      assert.equal("Authorization" in interceptedHeaders, false);
      assert.equal(interceptedHeaders["Content-Type"], "application/json");
    } finally {
      supabase.auth.getSession = originalGetSession;
    }
  });

  it("throws an error when /api/generation/run responds with failure status", async () => {
    const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

    supabase.auth.getSession = async () => ({
      data: { session: null },
      error: null,
    });

    const mockFetch = (async () => {
      return new Response(JSON.stringify({ error: "Authentication is required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await assert.rejects(
        async () => {
          await dispatchJob(queuedJob, mockFetch);
        },
        {
          name: "Error",
          message: "Authentication is required.",
        },
      );
    } finally {
      supabase.auth.getSession = originalGetSession;
    }
  });
});

