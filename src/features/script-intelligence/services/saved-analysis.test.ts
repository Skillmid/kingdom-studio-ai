import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findPersistedAnalysisRevision } from "./saved-analysis";

const screenplay = { id: "screenplay-id", version: 3 } as const;
const revisions = [
  { id: "revision-3", screenplayId: "screenplay-id", version: 3 },
  { id: "revision-2", screenplayId: "screenplay-id", version: 2 },
];

describe("revision-bound Script Intelligence", () => {
  it("selects the saved revision matching the current screenplay version", () => {
    assert.equal(findPersistedAnalysisRevision(screenplay, revisions, false)?.id, "revision-3");
  });

  it("refuses to persist analysis for an unsaved screenplay draft", () => {
    assert.equal(findPersistedAnalysisRevision(screenplay, revisions, true), null);
  });

  it("does not attach analysis when the exact saved revision is missing", () => {
    assert.equal(findPersistedAnalysisRevision(screenplay, [revisions[1]!], false), null);
    assert.equal(findPersistedAnalysisRevision(null, revisions, false), null);
  });
});
