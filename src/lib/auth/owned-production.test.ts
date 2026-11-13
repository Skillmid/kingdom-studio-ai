import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getOwnedProduction } from "./owned-production";

const production = {
  id: "55555555-5555-4555-8555-555555555555",
  owner_id: "owner-1",
};

describe("getOwnedProduction", () => {
  it("returns a production only when the valid record belongs to the user", async () => {
    const result = await getOwnedProduction(
      production.id,
      "owner-1",
      async () => production,
    );
    assert.equal(result, production);
  });

  it("rejects malformed IDs, missing records, and foreign-owned records", async () => {
    assert.equal(
      await getOwnedProduction("invalid", "owner-1", async () => production),
      null,
    );
    assert.equal(
      await getOwnedProduction(production.id, "owner-1", async () => null),
      null,
    );
    assert.equal(
      await getOwnedProduction(production.id, "owner-2", async () => production),
      null,
    );
  });

  it("rejects unauthenticated or empty user IDs attempting access", async () => {
    assert.equal(
      await getOwnedProduction(production.id, "", async () => production),
      null,
    );
    assert.equal(
      await getOwnedProduction(production.id, undefined as unknown as string, async () => production),
      null,
    );
  });

  it("detects and rejects attempted ownership reassignment or ID spoofing", async () => {
    // If a hijacked lookup returns a production claiming to belong to attacker
    const hijackedProduction = {
      id: "55555555-5555-4555-8555-555555555555",
      owner_id: "attacker-user-id",
    };
    const legitimateUserResult = await getOwnedProduction(
      production.id,
      "legitimate-owner",
      async () => hijackedProduction,
    );
    assert.equal(legitimateUserResult, null, "Hijacked owner_id is rejected for legitimate owner");

    // If lookup returns a record whose ID does not match the requested ID
    const mismatchedIdProduction = {
      id: "66666666-6666-4666-8666-666666666666",
      owner_id: "owner-1",
    };
    const mismatchedResult = await getOwnedProduction(
      production.id,
      "owner-1",
      async () => mismatchedIdProduction,
    );
    assert.equal(mismatchedResult, null, "Mismatched production ID returned from lookup is rejected");
  });
});
