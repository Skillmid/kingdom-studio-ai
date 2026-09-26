import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateStoryboardProgress } from "./storyboard-completion";
import {
  planPanelsFromShots,
  selectNewPanelProposals,
  type StoryboardShotInput,
} from "./storyboard-planner";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCENE_ID = "33333333-3333-4333-8333-333333333333";
const LOCATION_ID = "44444444-4444-4444-8444-444444444444";
const CLERK_ID = "88888888-8888-4888-8888-888888888888";
const OPERATOR_ID = "99999999-9999-4999-8999-999999999999";

function shot(
  partial: Partial<StoryboardShotInput> & Pick<StoryboardShotInput, "id" | "shotNumber">,
): StoryboardShotInput {
  return {
    productionId: PRODUCTION_ID,
    shotType: "medium",
    framing: "MS",
    characterIds: [],
    ...partial,
  };
}

describe("planPanelsFromShots", () => {
  it("creates one panel per shot using shot intelligence only", () => {
    const panels = planPanelsFromShots([
      shot({
        id: "22222222-2222-4222-8222-222222222222",
        sceneId: SCENE_ID,
        shotNumber: 1,
        shotCode: "1A",
        shotType: "establishing",
        framing: "EWS",
        cameraAngle: "high",
        subject: "Harbour gate",
        action: "Dawn light hits the ledger desk.",
        visualDescription: "Wide of the harbour gate at dawn.",
        generationPrompt: "EWS establishing shot of a harbour gate at dawn.",
        locationId: LOCATION_ID,
      }),
      shot({
        id: "55555555-5555-4555-8555-555555555555",
        shotNumber: 2,
        shotCode: "1B",
        shotType: "close-up",
        framing: "CU",
        subject: "Clerk",
        visualDescription: "Close-up of the clerk.",
      }),
    ]);

    assert.equal(panels.length, 2);
    assert.equal(panels[0]?.shotId, "22222222-2222-4222-8222-222222222222");
    assert.equal(panels[0]?.provenance, "shot-derived");
    assert.equal(panels[0]?.userApproved, false);
    assert.equal(panels[0]?.locationId, LOCATION_ID);
    assert.match(panels[0]?.composition ?? "", /EWS/);
    assert.equal(panels[1]?.title, "1B");
    assert.equal(
      panels.some((panel) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(panel))),
      false,
    );
    assert.equal(panels[0]?.progress, calculateStoryboardProgress(panels[0]));
  });

  it("enriches panels with persisted scene, character and location intelligence", () => {
    const panels = planPanelsFromShots(
      [
        shot({
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          sceneId: SCENE_ID,
          shotNumber: 1,
          shotCode: "2A",
          shotType: "close-up",
          framing: "CU",
          subject: "Radio operator",
          action: "The operator leans toward the microphone.",
        }),
      ],
      {
        scenes: [
          {
            id: SCENE_ID,
            heading: "INT. RADIO BOOTH - NIGHT",
            timeOfDay: "NIGHT",
            visualDirection: "Green monitor glow on the mixer.",
            continuityNotes: "Keep the headset on the left ear.",
            characterIds: [OPERATOR_ID],
            locationId: LOCATION_ID,
          },
        ],
        characters: [
          {
            id: OPERATOR_ID,
            name: "Radio operator",
            appearance: "narrow face, wool jumper",
            hairColor: "grey",
          },
          {
            id: CLERK_ID,
            name: "Harbour clerk",
            appearance: "ink-stained cuffs",
          },
        ],
        locations: [
          {
            id: LOCATION_ID,
            name: "Radio booth",
            description: "A cramped cabin with a scratched mixer.",
            setting: "interior",
          },
        ],
      },
    );

    const panel = panels[0];
    assert.ok(panel);
    assert.equal(panel.locationId, LOCATION_ID);
    assert.deepEqual(panel.characterIds, [OPERATOR_ID]);
    assert.match(panel.visualDescription ?? "", /operator leans/i);
    assert.match(panel.visualDescription ?? "", /Green monitor glow/i);
    assert.match(panel.continuityNotes ?? "", /headset on the left ear/i);
    assert.match(panel.continuityNotes ?? "", /Radio booth/i);
    assert.match(panel.generationPrompt ?? "", /wool jumper/i);
    assert.match(panel.generationPrompt ?? "", /scratched mixer/i);
    assert.equal(/Harbour clerk|ink-stained/.test(JSON.stringify(panel)), false);
    assert.equal(/Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(panel)), false);
  });

  it("does not invent visual facts when downstream records are sparse", () => {
    const panels = planPanelsFromShots(
      [
        shot({
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          shotNumber: 8,
          shotCode: "8A",
          subject: "Empty quay",
          action: "Fog covers the bollards.",
        }),
      ],
      { scenes: [], characters: [], locations: [] },
    );

    assert.equal(panels[0]?.locationId, undefined);
    assert.deepEqual(panels[0]?.characterIds, []);
    assert.equal(panels[0]?.visualDescription, "Fog covers the bollards. Empty quay");
    assert.equal(/invented|guess|probably/i.test(JSON.stringify(panels[0])), false);
  });
});

describe("selectNewPanelProposals", () => {
  it("does not duplicate a shot that already has a panel", () => {
    const proposals = planPanelsFromShots([
      shot({
        id: "66666666-6666-4666-8666-666666666666",
        shotNumber: 3,
        shotCode: "3A",
        subject: "Radio booth",
        action: "The operator leans in.",
      }),
    ]);

    const selected = selectNewPanelProposals(proposals, [
      {
        shotId: "66666666-6666-4666-8666-666666666666",
        panelNumber: 1,
        title: "3A",
        userApproved: true,
        provenance: "user",
      },
    ]);

    assert.equal(selected.length, 0);
  });

  it("keeps filmmaker-owned panels and still adds uncovered shots", () => {
    const proposals = planPanelsFromShots([
      shot({
        id: "77777777-7777-4777-8777-777777777777",
        shotNumber: 4,
        shotCode: "4A",
        subject: "Archive lamp",
        action: "The lamp flickers over the shelves.",
      }),
    ]);

    const selected = selectNewPanelProposals(proposals, [
      {
        panelNumber: 1,
        title: "Hand-drawn insert",
        userApproved: true,
        provenance: "user",
      },
    ]);

    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.shotId, "77777777-7777-4777-8777-777777777777");
  });
});
