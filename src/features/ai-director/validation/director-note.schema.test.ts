import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { directorNoteSchema } from "./director-note.schema";

describe("directorNoteSchema", () => {
  it("accepts a generic valid director note", () => {
    const result = directorNoteSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      sceneId: "33333333-3333-4333-8333-333333333333",
      noteNumber: 1,
      title: "EXT. HARBOUR GATE - DAWN",
      sceneIntent: "Establish the harbour routine.",
    });

    assert.equal(result.success, true);
  });

  it("rejects an invalid note number", () => {
    const result = directorNoteSchema.safeParse({
      productionId: "not-a-uuid",
      noteNumber: 0,
    });

    assert.equal(result.success, false);
  });
});
