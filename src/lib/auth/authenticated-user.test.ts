import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAuthenticatedUser } from "./authenticated-user";

describe("getAuthenticatedUser", () => {
  it("returns the subject from a verified JWT claim", async () => {
    const result = await getAuthenticatedUser(async () => ({
      data: { claims: { sub: "user-1" } },
      error: null,
    }));

    assert.deepEqual(result, { id: "user-1" });
  });

  it("rejects missing, malformed, and errored claims", async () => {
    assert.equal(
      await getAuthenticatedUser(async () => ({
        data: { claims: null },
        error: null,
      })),
      null,
    );
    assert.equal(
      await getAuthenticatedUser(async () => ({
        data: null,
        error: new Error("token verification failed"),
      })),
      null,
    );
    assert.equal(
      await getAuthenticatedUser(async () => ({
        data: { claims: { sub: 42 } },
        error: null,
      })),
      null,
    );
    assert.equal(
      await getAuthenticatedUser(async () => ({
        data: { claims: null },
        error: new Error("expired session"),
      })),
      null,
    );
  });
});
