import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateDirectorProgress } from "./director-completion";
import {
  planDirectionFromScenes,
  selectNewDirectionNotes,
  type DirectorSceneInput,
} from "./director-planner";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCENE_ID = "33333333-3333-4333-8333-333333333333";
const SECOND_SCENE_ID = "44444444-4444-4444-8444-444444444444";
const LOCATION_ID = "55555555-5555-4555-8555-555555555555";
const OPERATOR_ID = "99999999-9999-4999-8999-999999999999";
const SHOT_ID = "22222222-2222-4222-8222-222222222222";
const PANEL_ID = "66666666-6666-4666-8666-666666666666";

function scene(
  partial: Partial<DirectorSceneInput> & Pick<DirectorSceneInput, "id" | "number" | "heading">,
): DirectorSceneInput {
  return {
    productionId: PRODUCTION_ID,
    ...partial,
  };
}

describe("planDirectionFromScenes", () => {
  it("creates one note per scene using scene records only", () => {
    const notes = planDirectionFromScenes([
      scene({
        id: SCENE_ID,
        number: 1,
        heading: "INT. HARBOUR OFFICE - DAWN",
        timeOfDay: "DAWN",
        purpose: "The clerk opens the ledger.",
        action: "A clerk unlocks the harbour office.",
        locationId: LOCATION_ID,
      }),
      scene({
        id: SECOND_SCENE_ID,
        number: 2,
        heading: "EXT. QUAY - DAY",
        summary: "Fog covers the bollards.",
      }),
    ]);

    assert.equal(notes.length, 2);
    assert.equal(notes[0]?.sceneId, SCENE_ID);
    assert.equal(notes[0]?.provenance, "production-derived");
    assert.equal(notes[0]?.userApproved, false);
    assert.equal(notes[0]?.locationId, LOCATION_ID);
    assert.match(notes[0]?.sceneIntent ?? "", /ledger/i);
    assert.match(notes[0]?.lighting ?? "", /DAWN/);
    assert.equal(notes[1]?.title, "EXT. QUAY - DAY");
    assert.equal(
      notes.some((note) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(note))),
      false,
    );
    assert.equal(notes[0]?.progress, calculateDirectorProgress(notes[0]));
  });

  it("enriches notes with persisted shot, panel, character and location intelligence", () => {
    const notes = planDirectionFromScenes(
      [
        scene({
          id: SCENE_ID,
          number: 2,
          heading: "INT. RADIO BOOTH - NIGHT",
          timeOfDay: "NIGHT",
          purpose: "The operator sends the midnight report.",
          action: "The operator leans toward the microphone.",
          dialogue: "OPERATOR\nHarbour, this is night watch.",
          emotionalBeat: "Quiet urgency",
          visualDirection: "Green monitor glow on the mixer.",
          soundNotes: "Soft static under the voice.",
          continuityNotes: "Keep the headset on the left ear.",
          estimatedDurationSeconds: 18,
          characterIds: [OPERATOR_ID],
          locationId: LOCATION_ID,
        }),
      ],
      {
        shots: [
          {
            id: SHOT_ID,
            sceneId: SCENE_ID,
            shotNumber: 1,
            shotCode: "2A",
            shotType: "close-up",
            framing: "CU",
            cameraAngle: "eye-level",
            cameraMovement: "static",
            subject: "Radio operator",
          },
        ],
        panels: [
          {
            id: PANEL_ID,
            sceneId: SCENE_ID,
            shotId: SHOT_ID,
            composition: "CU · close-up · eye-level",
            visualDescription: "Operator leans into the microphone.",
          },
        ],
        characters: [{ id: OPERATOR_ID, name: "Radio operator" }],
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

    const note = notes[0];
    assert.ok(note);
    assert.equal(note.locationId, LOCATION_ID);
    assert.deepEqual(note.characterIds, [OPERATOR_ID]);
    assert.match(note.blocking ?? "", /leans toward the microphone/i);
    assert.match(note.blocking ?? "", /Radio operator/);
    assert.match(note.camera ?? "", /2A/);
    assert.match(note.camera ?? "", /CU/);
    assert.match(note.composition ?? "", /Operator leans/i);
    assert.match(note.lighting ?? "", /NIGHT/);
    assert.match(note.lighting ?? "", /Green monitor glow/i);
    assert.match(note.pacing ?? "", /18s/);
    assert.match(note.sound ?? "", /Soft static/i);
    assert.equal(note.emotion, "Quiet urgency");
    assert.match(note.continuity ?? "", /headset on the left ear/i);
    assert.match(note.continuity ?? "", /Radio booth/i);
    assert.equal(/Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(note)), false);
  });

  it("does not invent direction when downstream records are sparse", () => {
    const notes = planDirectionFromScenes(
      [
        scene({
          id: SCENE_ID,
          number: 8,
          heading: "EXT. EMPTY QUAY - NIGHT",
          action: "Fog covers the bollards.",
        }),
      ],
      { shots: [], panels: [], characters: [], locations: [] },
    );

    assert.equal(notes[0]?.locationId, undefined);
    assert.deepEqual(notes[0]?.characterIds, []);
    assert.equal(notes[0]?.camera, undefined);
    assert.equal(notes[0]?.composition, undefined);
    assert.equal(notes[0]?.emotion, undefined);
    assert.match(notes[0]?.uncertaintyNotes ?? "", /camera/);
    assert.match(notes[0]?.uncertaintyNotes ?? "", /emotion/);
    assert.equal(/invented|guess|probably/i.test(JSON.stringify(notes[0])), false);
  });
});

describe("selectNewDirectionNotes", () => {
  it("does not duplicate a scene that already has a note", () => {
    const proposals = planDirectionFromScenes([
      scene({
        id: SCENE_ID,
        number: 3,
        heading: "INT. ARCHIVE - NIGHT",
        action: "The lamp flickers over the shelves.",
      }),
    ]);

    const selected = selectNewDirectionNotes(proposals, [
      {
        sceneId: SCENE_ID,
        noteNumber: 1,
        title: "INT. ARCHIVE - NIGHT",
        userApproved: true,
        provenance: "user",
      },
    ]);

    assert.equal(selected.length, 0);
  });

  it("keeps filmmaker-owned notes and still adds uncovered scenes", () => {
    const proposals = planDirectionFromScenes([
      scene({
        id: SECOND_SCENE_ID,
        number: 4,
        heading: "EXT. PIER - DAWN",
        action: "Gulls lift off the rail.",
      }),
    ]);

    const selected = selectNewDirectionNotes(proposals, [
      {
        noteNumber: 1,
        title: "Handwritten blocking pass",
        userApproved: true,
        provenance: "user",
      },
    ]);

    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.sceneId, SECOND_SCENE_ID);
  });
});
