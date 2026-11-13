import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bearerToken, readJsonBody } from "./json-body";

function request(body: string | undefined, headers: Record<string, string> = {}) {
  return new Request("https://app.example/api", { method: "POST", body, headers });
}

describe("readJsonBody", () => {
  it("returns 400 for empty and malformed bodies instead of throwing", async () => {
    assert.deepEqual(await readJsonBody(request(undefined), 1024), { ok: false, status: 400, error: "A JSON request body is required." });
    assert.deepEqual(await readJsonBody(request("{not json"), 1024), { ok: false, status: 400, error: "Request body must be valid JSON." });
  });

  it("returns 413 for oversized bodies", async () => {
    const result = await readJsonBody(request(JSON.stringify({ text: "x".repeat(2000) })), 1024);
    assert.equal(result.ok, false);
    assert.equal(result.ok ? 0 : result.status, 413);
  });

  it("parses valid JSON", async () => {
    assert.deepEqual(await readJsonBody(request('{"jobId":"a"}'), 1024), { ok: true, value: { jobId: "a" } });
  });

  it("extracts bearer tokens case-insensitively", () => {
    assert.equal(bearerToken(request("{}", { authorization: "bearer abc" })), "abc");
    assert.equal(bearerToken(request("{}")), undefined);
  });
});
