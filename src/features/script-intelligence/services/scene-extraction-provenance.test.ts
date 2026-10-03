import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildApprovedSceneInput,
  createRevisionBoundSceneProposals,
  getSceneExtractionSource,
} from "./scene-extraction-provenance";
import { persistApprovedSceneProposals } from "./approved-scene-persistence";
import type { Scene, SceneCreateInput } from "@/features/scenes/types/scene";

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

  it("validates all selected scenes before writing them as one batch", async () => {
    const source = {
      screenplayId: "11111111-1111-4111-8111-111111111111",
      revisionId: "22222222-2222-4222-8222-222222222222",
      screenplayVersion: 4,
    };
    const [proposal] = createRevisionBoundSceneProposals(drafts, source);
    const approvedProposal = {
      ...proposal!,
      clientId: "proposal-1",
      selected: true,
    };
    const secondProposal = {
      ...approvedProposal,
      clientId: "proposal-2",
      number: 2,
    };
    const writes: unknown[][] = [];
    const repository = {
      async createMany(scenes: SceneCreateInput[]) {
        writes.push(scenes);
        return [] as Scene[];
      },
    };

    await persistApprovedSceneProposals(
      [approvedProposal, { ...approvedProposal, clientId: "proposal-2", heading: "" }],
      "33333333-3333-4333-8333-333333333333",
      source,
      repository,
    ).then(
      () => assert.fail("Invalid proposals must not be written."),
      (error: unknown) => assert.match(
        error instanceof Error ? error.message : "",
        /heading/i,
      ),
    );

    assert.equal(writes.length, 0);
    await persistApprovedSceneProposals(
      [approvedProposal],
      "33333333-3333-4333-8333-333333333333",
      source,
      repository,
    );
    assert.equal(writes.length, 1);
    assert.equal(writes[0]?.length, 1);

    await persistApprovedSceneProposals(
      [approvedProposal, secondProposal],
      "33333333-3333-4333-8333-333333333333",
      source,
      repository,
    );
    assert.equal(writes.length, 2);
    assert.equal(writes[1]?.length, 2);
  });
});
