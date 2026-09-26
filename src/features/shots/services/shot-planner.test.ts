import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractBeats,
  inferActionShotType,
  planShotsFromScenes,
  selectNewShotProposals,
  type ShotPlanScene,
} from "./shot-planner";
import { calculateShotProgress } from "./shot-completion";

function scene(partial: ShotPlanScene): ShotPlanScene {
  return {
    sceneType: "INT",
    characterIds: [],
    ...partial,
  };
}

describe("extractBeats", () => {
  it("treats scene headings as structure, not speakers", () => {
    const beats = extractBeats(`1. EXT. HARBOUR GATE - DAWN
A clerk checks the ledger.
CLERK
The tide is early.
He closes the book.`);

    assert.deepEqual(
      beats.map((beat) => beat.kind),
      ["action", "dialogue", "action"],
    );
    assert.equal(beats[1]?.speaker, "CLERK");
    assert.equal(
      beats.some((beat) => beat.speaker?.includes("HARBOUR") || beat.speaker?.includes("EXT")),
      false,
    );
  });
});

describe("inferActionShotType", () => {
  it("maps coverage from action language without inventing plot", () => {
    assert.equal(inferActionShotType("She sprints after the departing cart."), "tracking");
    assert.equal(inferActionShotType("He picks up the letter."), "insert");
    assert.equal(inferActionShotType("A crowd gathers at the gate."), "group");
  });
});

describe("planShotsFromScenes", () => {
  it("plans generic coverage from arbitrary scene records", () => {
    const proposals = planShotsFromScenes({
      productionId: "11111111-1111-4111-8111-111111111111",
      scenes: [
        scene({
          id: "22222222-2222-4222-8222-222222222222",
          number: 1,
          heading: "EXT. HARBOUR GATE - DAWN",
          sceneType: "EXT",
          summary: "A clerk opens the harbour for the morning tide.",
          action: "A clerk checks the ledger.\nHe picks up the letter.",
          dialogue: "CLERK\nThe tide is early.",
          sourceText: `EXT. HARBOUR GATE - DAWN
A clerk checks the ledger.
CLERK
The tide is early.
He picks up the letter.`,
        }),
      ],
    });

    assert.ok(proposals.length >= 2);
    assert.equal(proposals[0]?.shotType, "establishing");
    assert.equal(proposals.every((item) => item.provenance === "scene-derived"), true);
    assert.equal(
      proposals.some((item) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(item))),
      false,
    );
    assert.ok(proposals.some((item) => item.dialogueReference?.includes("The tide is early.")));
  });

  it("calculates deterministic progress from planned fields", () => {
    const proposals = planShotsFromScenes({
      productionId: "11111111-1111-4111-8111-111111111111",
      scenes: [
        scene({
          id: "33333333-3333-4333-8333-333333333333",
          number: 2,
          heading: "INT. ARCHIVE ROOM - NIGHT",
          action: "Rows of shelves disappear into shadow.",
        }),
      ],
    });

    assert.ok(proposals[0]);
    assert.equal(proposals[0].progress, calculateShotProgress(proposals[0]));
    assert.ok(proposals[0].progress > 0);
  });
});

describe("selectNewShotProposals", () => {
  it("preserves user-approved and user-created coverage", () => {
    const proposals = planShotsFromScenes({
      productionId: "11111111-1111-4111-8111-111111111111",
      scenes: [
        scene({
          id: "44444444-4444-4444-8444-444444444444",
          number: 3,
          heading: "INT. RADIO BOOTH - NIGHT",
          action: "The operator leans into the microphone.",
        }),
      ],
    });

    const approved = proposals[0];
    assert.ok(approved);

    const selected = selectNewShotProposals(proposals, [
      {
        sceneId: approved.sceneId,
        shotCode: approved.shotCode,
        subject: approved.subject,
        action: approved.action,
        dialogueReference: approved.dialogueReference,
        userApproved: true,
        provenance: "scene-derived",
      },
    ]);

    assert.equal(
      selected.some(
        (item) => item.shotCode === approved.shotCode && item.subject === approved.subject,
      ),
      false,
    );
  });
});
