import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildExportManifest, serializeExportPackage } from "./export-planner";

describe("export package planning", () => {
  it("sorts arbitrary production clips and preserves missing media explicitly", () => {
    const manifest = buildExportManifest("production-id", [
      { sequenceNumber: 2, title: "Night exterior", durationSeconds: 8, sourceKind: "shot", mediaUrl: "https://cdn.example/shot.mp4" },
      { sequenceNumber: 1, title: "Opening frame", durationSeconds: 4, sourceKind: "panel", uncertaintyNotes: "No media URL is attached." },
    ], undefined, "2026-09-28T00:00:00.000Z");
    assert.deepEqual(manifest.clips.map((clip) => clip.sequenceNumber), [1, 2]);
    assert.equal(manifest.readyClipCount, 1);
    assert.equal(manifest.missingMediaCount, 1);
    const edl = serializeExportPackage("edit-decision-list", manifest);
    assert.match(edl, /MEDIA MISSING/);
    assert.doesNotMatch(edl, /fabricated/i);
  });
});
