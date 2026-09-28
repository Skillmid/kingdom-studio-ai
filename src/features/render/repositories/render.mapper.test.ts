import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toExportPackageDatabase, toRenderClipDatabase, toRenderSequenceDatabase } from "./render.mapper";

describe("render persistence mappers", () => {
  it("keeps partial updates compact", () => {
    assert.deepEqual(toRenderSequenceDatabase({ status: "ready", userApproved: true }), { status: "ready", user_approved: true });
    assert.deepEqual(toRenderClipDatabase({ sequenceNumber: 2, title: "Updated" }), { sequence_number: 2, title: "Updated" });
  });
  it("persists serialized export data with safe defaults", () => {
    const manifest = { productionId: "production", generatedAt: "now", clipCount: 0, readyClipCount: 0, missingMediaCount: 0, totalDurationSeconds: 0, clips: [] };
    const row = toExportPackageDatabase({ productionId: "production", manifest, serializedPackage: "{}", status: "packaged", userApproved: true }, true);
    assert.equal(row.production_id, "production");
    assert.equal(row.status, "packaged");
    assert.equal(row.user_approved, true);
    assert.equal(row.package_url, undefined);
    assert.equal(row.format, "delivery-manifest");
  });
});
