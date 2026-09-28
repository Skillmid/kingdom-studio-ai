import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toDirectorNoteDatabase } from "./director-note.mapper";

describe("director note persistence mapper", () => {
  it("keeps partial edits compact so unspecified creator fields are preserved", () => {
    assert.deepEqual(
      toDirectorNoteDatabase({ userApproved: true, provenance: "user" }),
      { user_approved: true, provenance: "user" },
    );
  });

  it("persists accepted production proposals with source evidence and approval", () => {
    const row = toDirectorNoteDatabase({
      productionId: "production-id",
      sceneId: "scene-id",
      noteNumber: 4,
      title: "INT. SIGNAL ROOM - NIGHT",
      sceneIntent: "The operator listens.",
      sourceEvidence: "A receiver clicks in the quiet room.",
      characterIds: ["character-id"],
      provenance: "production-derived",
      userApproved: true,
    }, true);

    assert.equal(row.production_id, "production-id");
    assert.equal(row.scene_id, "scene-id");
    assert.equal(row.source_evidence, "A receiver clicks in the quiet room.");
    assert.deepEqual(row.character_ids, ["character-id"]);
    assert.equal(row.user_approved, true);
  });
});
