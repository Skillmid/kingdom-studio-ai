import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPrepareExport } from "./export-readiness";

describe("export readiness", () => {
  it("blocks clips belonging to the previously selected sequence", () => {
    const sequence = { id: "current", userApproved: true, status: "ready" as const };
    assert.equal(canPrepareExport(sequence, "previous", "current", false), false);
  });

  it("allows an approved sequence only after its clips finish loading", () => {
    const sequence = { id: "current", userApproved: true, status: "ready" as const };
    assert.equal(canPrepareExport(sequence, "current", "current", false), true);
    assert.equal(canPrepareExport(sequence, "current", "current", true), false);
  });

  it("blocks unapproved or failed sequences", () => {
    assert.equal(canPrepareExport({ id: "draft", userApproved: false, status: "ready" }, "draft", "draft", false), false);
    assert.equal(canPrepareExport({ id: "failed", userApproved: true, status: "failed" }, "failed", "failed", false), false);
  });
});
