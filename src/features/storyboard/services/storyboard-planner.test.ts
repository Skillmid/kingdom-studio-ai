import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Shot } from "@/features/shots/types/shot";

import { calculateStoryboardProgress } from "./storyboard-completion";
import { planPanelsFromShots, selectNewPanelProposals } from "./storyboard-planner";

function shot(partial: Partial<Shot> & Pick<Shot, "id" | "shotNumber">): Shot {
  return {
    productionId: "11111111-1111-4111-8111-111111111111",
    shotType: "medium",
    framing: "MS",
    characterIds: [],
    provenance: "scene-derived",
    userApproved: false,
    status: "draft",
    progress: 0,
    createdAt: "2026-09-26T00:00:00.000Z",
    updatedAt: "2026-09-26T00:00:00.000Z",
    ...partial,
  };
}

describe("planPanelsFromShots", () => {
  it("creates one panel per shot using shot intelligence only", () => {
    const panels = planPanelsFromShots([
      shot({
        id: "22222222-2222-4222-8222-222222222222",
        sceneId: "33333333-3333-4333-8333-333333333333",
        shotNumber: 1,
        shotCode: "1A",
        shotType: "establishing",
        framing: "EWS",
        cameraAngle: "high",
        subject: "Harbour gate",
        action: "Dawn light hits the ledger desk.",
        visualDescription: "Wide of the harbour gate at dawn.",
        generationPrompt: "EWS establishing shot of a harbour gate at dawn.",
        locationId: "44444444-4444-4444-8444-444444444444",
      }),
      shot({
        id: "55555555-5555-4555-8555-555555555555",
        shotNumber: 2,
        shotCode: "1B",
        shotType: "close-up",
        framing: "CU",
        subject: "Clerk",
        dialogueReference: "Clerk: The tide is early.",
        visualDescription: "Close-up of the clerk.",
      }),
    ]);

    assert.equal(panels.length, 2);
    assert.equal(panels[0]?.shotId, "22222222-2222-4222-8222-222222222222");
    assert.equal(panels[0]?.provenance, "shot-derived");
    assert.equal(panels[0]?.userApproved, false);
    assert.equal(panels[0]?.locationId, "44444444-4444-4444-8444-444444444444");
    assert.match(panels[0]?.composition ?? "", /EWS/);
    assert.equal(panels[1]?.title, "1B");
    assert.equal(
      panels.some((panel) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(panel))),
      false,
    );
    assert.equal(panels[0]?.progress, calculateStoryboardProgress(panels[0]));
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
});
