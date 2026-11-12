import { expect, test } from "@playwright/test";

import testAuth from "./support/test-auth.cjs";

const { createAuthCookie, createTestAccessToken, testForeignUserId, testOwnerId } = testAuth;

function requestState(cookie: { name: string; value: string } | null) {
  return {
    cookies: cookie
      ? [
          {
            ...cookie,
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: "Lax" as const,
          },
        ]
      : [],
    origins: [],
  };
}

test("signed-out visitors are redirected before Studio content renders", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: { cookies: [], origins: [] },
  });
  try {
    const response = await request.get("/studio", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/login");
  } finally {
    await request.dispose();
  }
});

test("signed-out requests to a production URL are redirected", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: { cookies: [], origins: [] },
  });
  try {
    const response = await request.get("/studio/productions/not-a-uuid", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/login");
  } finally {
    await request.dispose();
  }
});

test("an authenticated owner can render the production workspace from server-loaded data", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(createAuthCookie()),
  });
  try {
    const response = await request.get("/studio/productions/11111111-1111-4111-8111-111111111111");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Server Auth Production");
  } finally {
    await request.dispose();
  }
});

test("the requested screenplay URL renders for its authenticated production owner", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(createAuthCookie()),
  });
  try {
    const response = await request.get(
      "/studio/productions/86794874-c848-495f-9043-f983a88cea4b/screenplay",
    );
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("Screenplay");
  } finally {
    await request.dispose();
  }
});

test("a foreign session cannot render another user's production", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(createAuthCookie(testForeignUserId)),
  });
  try {
    const response = await request.get("/studio/productions/11111111-1111-4111-8111-111111111111");
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toContain("Server Auth Production");
    expect(body).toContain("The requested production could not be found.");
  } finally {
    await request.dispose();
  }
});

test("an authenticated owner receives not-found for a nonexistent production", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(createAuthCookie()),
  });
  try {
    const response = await request.get("/studio/productions/33333333-3333-4333-8333-333333333333");
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).not.toContain("Server Auth Production");
    expect(body).toContain("The requested production could not be found.");
  } finally {
    await request.dispose();
  }
});

test("missing and expired sessions are rejected by protected routes", async ({ playwright }) => {
  const unauthenticated = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(null),
  });
  try {
    const response = await unauthenticated.get("/studio", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/login");
  } finally {
    await unauthenticated.dispose();
  }

  const expired = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    storageState: requestState(
      createAuthCookie(undefined, {
        expiresAt: Math.floor(Date.now() / 1000) - 60,
        sessionExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      }),
    ),
  });
  try {
    const response = await expired.get("/studio", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/login");
  } finally {
    await expired.dispose();
  }
});

test("auth endpoints: login, token refresh, and invalid credentials flow", async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:54321",
  });
  try {
    // 1. Password login with valid credentials
    const loginRes = await request.post("/auth/v1/token?grant_type=password", {
      data: { email: "creator@example.com", password: "ValidPassword123!" },
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.access_token).toBeDefined();
    expect(loginData.refresh_token).toBe("e2e-valid-refresh-token");
    expect(loginData.user.id).toBe(testOwnerId);

    // 2. Password login with invalid credentials
    const badLoginRes = await request.post("/auth/v1/token?grant_type=password", {
      data: { email: "creator@example.com", password: "wrong-password" },
    });
    expect(badLoginRes.status()).toBe(400);
    const badData = await badLoginRes.json();
    expect(badData.error).toBe("invalid_grant");

    // 3. Token refresh with valid refresh token
    const refreshRes = await request.post("/auth/v1/token?grant_type=refresh_token", {
      data: { refresh_token: "e2e-valid-refresh-token" },
    });
    expect(refreshRes.status()).toBe(200);
    const refreshData = await refreshRes.json();
    expect(refreshData.access_token).toBeDefined();
    expect(refreshData.user.id).toBe(testOwnerId);

    // 4. Token refresh with invalid refresh token
    const badRefreshRes = await request.post("/auth/v1/token?grant_type=refresh_token", {
      data: { refresh_token: "invalid-refresh-token" },
    });
    expect(badRefreshRes.status()).toBe(400);

    // 5. Logout
    const logoutRes = await request.post("/auth/v1/logout");
    expect(logoutRes.status()).toBe(200);
  } finally {
    await request.dispose();
  }
});

test("screenplay persistence, reload survival, and revision ledger under RLS", async ({ playwright }) => {
  const ownerToken = createTestAccessToken(testOwnerId);
  const foreignToken = createTestAccessToken(testForeignUserId);
  const productionId = "86794874-c848-495f-9043-f983a88cea4b";

  const ownerClient = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:54321",
    extraHTTPHeaders: {
      Authorization: `Bearer ${ownerToken}`,
      apikey: "e2e-only-publishable-key",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  const foreignClient = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:54321",
    extraHTTPHeaders: {
      Authorization: `Bearer ${foreignToken}`,
      apikey: "e2e-only-publishable-key",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  try {
    // 1. Foreign user cannot insert screenplay into another user's production (RLS 403)
    const foreignInsertRes = await foreignClient.post("/rest/v1/screenplays", {
      data: {
        production_id: productionId,
        title: "Malicious Screenplay",
        content: "EXT. HIJACK - NIGHT",
        source: "internal",
        status: "draft",
        version: 1,
      },
    });
    expect(foreignInsertRes.status()).toBe(403);

    // 2. Owner creates initial screenplay (version 1)
    const ownerInsertRes = await ownerClient.post("/rest/v1/screenplays", {
      data: {
        production_id: productionId,
        title: "Kingdom Chronicles: The Calling",
        content: "EXT. JERUSALEM - DAWN\n\nA golden sunrise crests the ancient stone walls.",
        source: "internal",
        status: "draft",
        version: 1,
      },
    });
    expect(ownerInsertRes.status()).toBe(201);
    const createdScreenplay = (await ownerInsertRes.json())[0];
    expect(createdScreenplay.id).toBeDefined();
    expect(createdScreenplay.version).toBe(1);

    // 3. Create initial revision record in the immutable ledger
    const rev1Res = await ownerClient.post("/rest/v1/screenplay_revisions", {
      data: {
        screenplay_id: createdScreenplay.id,
        version: 1,
        title: "Kingdom Chronicles: The Calling",
        content: "EXT. JERUSALEM - DAWN\n\nA golden sunrise crests the ancient stone walls.",
        reason: "initial-save",
      },
    });
    expect(rev1Res.status()).toBe(201);

    // 4. Foreign user cannot read owner's screenplay (RLS returns empty)
    const foreignReadRes = await foreignClient.get(
      `/rest/v1/screenplays?production_id=eq.${productionId}`,
    );
    expect(foreignReadRes.status()).toBe(200);
    expect(await foreignReadRes.json()).toEqual([]);

    // 5. Owner edits and saves updated screenplay (version 2)
    const ownerUpdateRes = await ownerClient.patch(
      `/rest/v1/screenplays?id=eq.${createdScreenplay.id}`,
      {
        data: {
          title: "Kingdom Chronicles: The Calling - Revised",
          content: "EXT. JERUSALEM - DAWN\n\nA golden sunrise crests the ancient stone walls.\n\nELIJAH\nThe time has come.",
          status: "revised",
          version: 2,
        },
      },
    );
    expect(ownerUpdateRes.status()).toBe(200);
    const updatedScreenplay = (await ownerUpdateRes.json())[0];
    expect(updatedScreenplay.version).toBe(2);

    // 6. Record immutable revision 2
    const rev2Res = await ownerClient.post("/rest/v1/screenplay_revisions", {
      data: {
        screenplay_id: createdScreenplay.id,
        version: 2,
        title: "Kingdom Chronicles: The Calling - Revised",
        content: "EXT. JERUSALEM - DAWN\n\nA golden sunrise crests the ancient stone walls.\n\nELIJAH\nThe time has come.",
        reason: "added-dialogue",
      },
    });
    expect(rev2Res.status()).toBe(201);

    // 7. Verify data survives reload: fetching screenplay returns latest version 2
    const reloadScreenplayRes = await ownerClient.get(
      `/rest/v1/screenplays?production_id=eq.${productionId}`,
    );
    expect(reloadScreenplayRes.status()).toBe(200);
    const reloadedScreenplay = (await reloadScreenplayRes.json())[0];
    expect(reloadedScreenplay.version).toBe(2);
    expect(reloadedScreenplay.title).toBe("Kingdom Chronicles: The Calling - Revised");
    expect(reloadedScreenplay.content).toContain("ELIJAH");

    // 8. Verify complete revision history is preserved in descending order
    const revisionsRes = await ownerClient.get(
      `/rest/v1/screenplay_revisions?screenplay_id=eq.${createdScreenplay.id}`,
    );
    expect(revisionsRes.status()).toBe(200);
    const revisions = await revisionsRes.json();
    expect(revisions.length).toBe(2);
    expect(revisions[0].version).toBe(2);
    expect(revisions[0].reason).toBe("added-dialogue");
    expect(revisions[1].version).toBe(1);
    expect(revisions[1].reason).toBe("initial-save");

    // 9. Foreign user cannot read revision history (RLS returns empty)
    const foreignRevRes = await foreignClient.get(
      `/rest/v1/screenplay_revisions?screenplay_id=eq.${createdScreenplay.id}`,
    );
    expect(foreignRevRes.status()).toBe(200);
    expect(await foreignRevRes.json()).toEqual([]);
  } finally {
    await ownerClient.dispose();
    await foreignClient.dispose();
  }
});
