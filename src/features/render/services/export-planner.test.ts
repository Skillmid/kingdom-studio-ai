import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildExportManifest, serializeExportPackage } from "./export-planner";
import { downloadExportPackage } from "./export-download";

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

  it("keeps the download URL alive until after the browser click has been dispatched", () => {
    const events: string[] = [];
    let deferredRevocation: (() => void) | undefined;

    downloadExportPackage(
      {
        title: "Harbour Assembly",
        format: "edit-decision-list",
        serializedPackage: "TITLE: Harbour Assembly",
      },
      {
        createObjectURL: (blob) => {
          assert.ok(blob instanceof Blob);
          events.push("create");
          return "blob:export";
        },
        clickDownload: (url, fileName) => {
          assert.equal(url, "blob:export");
          assert.equal(fileName, "Harbour-Assembly.edl");
          events.push("click");
        },
        defer: (callback) => {
          events.push("defer");
          deferredRevocation = callback;
        },
        revokeObjectURL: (url) => {
          assert.equal(url, "blob:export");
          events.push("revoke");
        },
      },
    );

    assert.deepEqual(events, ["create", "click", "defer"]);
    assert.ok(deferredRevocation);
    deferredRevocation();
    assert.deepEqual(events, ["create", "click", "defer", "revoke"]);
  });
});
