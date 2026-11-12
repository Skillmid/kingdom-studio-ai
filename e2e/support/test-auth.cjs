/* eslint-disable @typescript-eslint/no-require-imports */
const { createHmac, timingSafeEqual } = require("node:crypto");

const testAuthSecret = "kingdom-studio-e2e-only-secret";
const testOwnerId = "22222222-2222-4222-8222-222222222222";
const testForeignUserId = "99999999-9999-4999-8999-999999999999";
const testProductionId = "11111111-1111-4111-8111-111111111111";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function createTestAccessToken(userId, { expiresAt = Math.floor(Date.now() / 1000) + 3600 } = {}) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    aud: "authenticated",
    exp: expiresAt,
    iat: Math.floor(Date.now() / 1000),
    iss: "http://127.0.0.1:54321/auth/v1",
    role: "authenticated",
    sub: userId,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", testAuthSecret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

function verifyTestAccessToken(token) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const signingInput = `${header}.${payload}`;
  const expected = createHmac("sha256", testAuthSecret).update(signingInput).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.sub !== "string" || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function createAuthCookie(userId = testOwnerId, options = {}) {
  const accessToken = createTestAccessToken(userId, options);
  const session = {
    access_token: accessToken,
    refresh_token: "e2e-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: options.sessionExpiresAt ?? options.expiresAt ?? Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: `e2e-${userId}@example.invalid`,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };

  return {
    name: "sb-127-auth-token",
    value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
  };
}

module.exports = {
  createAuthCookie,
  createTestAccessToken,
  testAuthSecret,
  testForeignUserId,
  testOwnerId,
  testProductionId,
  verifyTestAccessToken,
};
