import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildApprovedSceneInput,
  createRevisionBoundSceneProposals,
  getSceneExtractionSource,
} from "./scene-extraction-provenance";

const screenplay = { id: "screenplay-1", version: 4 };
const revisions = [
  { id: "revision-4", screenplayId: "screenplay-1", version: 4 },
  { id: "revision-3", screenplayId: "screenplay-1", version: 3 },
];
const drafts = [{ number: 1, heading: "EXT. MARKET - DAY", summary: "A vendor opens the stall.", status: "draft" as const, progress: 0 }];

describe("revision-bound scene extraction provenance", () => {
  it("selects the exact current saved revision for extraction", () => {
    assert.deepEqual(getSceneExtractionSource(screenplay, revisions, false), {
      screenplayId: "screenplay-1",
      revisionId: "revision-4",
      screenplayVersion: 4,
    });
  });

  it("rejects extraction from changed or unsaved screenplay text", () => {
    assert.equal(getSceneExtractionSource(screenplay, revisions, true), null);
    assert.equal(getSceneExtractionSource(null, revisions, false), null);
  });

  it("carries the saved revision into every reviewable proposal", () => {
    const source = getSceneExtractionSource(screenplay, revisions, false)!;
    const [proposal] = createRevisionBoundSceneProposals(drafts, source);
    assert.equal(proposal?.sourceScreenplayId, source.screenplayId);
    assert.equal(proposal?.sourceRevisionId, source.revisionId);
    assert.equal(proposal?.sourceScreenplayVersion, source.screenplayVersion);
  });

  it("preserves parsed screenplay action, dialogue, heading details, and exact source text", () => {
    const source = getSceneExtractionSource(screenplay, revisions, false)!;
    const parsedScene = {
      number: 1,
      heading: "EXT. MARKET - DAY",
      sceneType: "EXT" as const,
      timeOfDay: "DAY",
      summary: "A vendor opens the stall.",
      action: "A vendor opens the stall.",
      dialogue: "MARA: The market is awake.",
      dialogues: [{ character: "MARA", text: "The market is awake." }],
      sourceText: "EXT. MARKET - DAY\nA vendor opens the stall.\nMARA\nThe market is awake.",
    };
    const [proposal] = createRevisionBoundSceneProposals(
      drafts,
      source,
      [parsedScene],
    );
    const accepted = buildApprovedSceneInput(
      {
        ...proposal!,
        clientId: "proposal-1",
        selected: true,
      },
      "production-1",
      source,
    );

    assert.equal(accepted.sceneType, "EXT");
    assert.equal(accepted.timeOfDay, "DAY");
    assert.equal(accepted.action, parsedScene.action);
    assert.equal(accepted.dialogue, parsedScene.dialogue);
    assert.equal(accepted.sourceText, parsedScene.sourceText);
    assert.equal(accepted.summary, drafts[0]?.summary);
  });

  it("persists accepted scenes only while their proposal source remains current", () => {
    const source = getSceneExtractionSource(screenplay, revisions, false)!;
    const proposal = {
      ...createRevisionBoundSceneProposals(drafts, source)[0]!,
      clientId: "proposal-1",
      selected: true,
    };
    const accepted = buildApprovedSceneInput(proposal, "production-1", source);
    assert.equal(accepted.productionId, "production-1");
    assert.equal(accepted.sourceScreenplayId, "screenplay-1");
    assert.equal(accepted.sourceRevisionId, "revision-4");
    assert.equal(accepted.sourceScreenplayVersion, 4);
    assert.equal("cameraDirection" in accepted, false);
    assert.equal("mood" in accepted, false);
    assert.equal("musicNotes" in accepted, false);
    assert.equal("videoPrompt" in accepted, false);
    assert.throws(
      () => buildApprovedSceneInput(proposal, "production-1", null),
      /saved screenplay revision changed/i,
    );
  });
});
