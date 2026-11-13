import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildApprovedSceneInput } from "@/features/script-intelligence/services/scene-extraction-provenance";
import { persistApprovedSceneProposals } from "@/features/script-intelligence/services/approved-scene-persistence";
import type { ProposedScene } from "@/features/script-intelligence/types/scene-proposal";
import type { SceneCreateInput } from "../types/scene";
import { matchCharacterIds, normaliseLocationName, resolveSceneLinks } from "./scene-linking";

const characters = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Tara" },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", name: "David" },
  { id: "aaaaaaaa-0000-4000-8000-000000000003", name: "Adébáyọ̀" },
  { id: "aaaaaaaa-0000-4000-8000-000000000004", name: "X" },
];
const locationId = "11111111-1111-4111-8111-111111111111";
const locations = [{ id: locationId, name: "Bus Stop - Night" }];
const SCREENPLAY_ID = "33333333-3333-4333-8333-333333333333";
const REVISION_ID = "44444444-4444-4444-8444-444444444444";
const source = { screenplayId: SCREENPLAY_ID, revisionId: REVISION_ID, screenplayVersion: 2 };

function proposal(overrides: Partial<ProposedScene> = {}): ProposedScene {
  return {
    clientId: "p-1",
    number: 1,
    heading: "EXT. BUS STOP - NIGHT",
    summary: "Tara waits.",
    status: "draft",
    progress: 10,
    selected: true,
    sourceScreenplayId: SCREENPLAY_ID,
    sourceRevisionId: REVISION_ID,
    sourceScreenplayVersion: 2,
    ...overrides,
  };
}

describe("scene linking", () => {
  it("matches whole names only, Unicode-aware", () => {
    assert.deepEqual(matchCharacterIds("He plays the guitar.", characters), []);
    assert.deepEqual(matchCharacterIds("TARA\nWhere is DAVID?", characters), ["aaaaaaaa-0000-4000-8000-000000000001", "aaaaaaaa-0000-4000-8000-000000000002"]);
    assert.deepEqual(matchCharacterIds("ADÉBÁYỌ̀ enters.", characters), ["aaaaaaaa-0000-4000-8000-000000000003"]);
  });

  it("normalises location names with time-of-day suffixes", () => {
    assert.equal(normaliseLocationName("Bus Stop - Night"), "bus stop");
    assert.equal(normaliseLocationName("BUS  STOP"), "bus stop");
  });

  it("derives the location from the heading when no location name is given", () => {
    const links = resolveSceneLinks({ heading: "EXT. BUS STOP - NIGHT", sourceText: "TARA\nHello." }, { characters, locations });
    assert.deepEqual(links, { characterIds: ["aaaaaaaa-0000-4000-8000-000000000001"], locationId });
  });

  it("falls back to summary/action/dialogue text when the proposal has no source text", () => {
    const input = buildApprovedSceneInput(proposal({ summary: "David and Tara argue." }), "production-1", source, {
      characters,
      locations,
    });
    assert.deepEqual(input.characterIds, ["aaaaaaaa-0000-4000-8000-000000000001", "aaaaaaaa-0000-4000-8000-000000000002"]);
    assert.equal(input.locationId, locationId);
  });

  it("keeps the previous unlinked behaviour when no link context is supplied", () => {
    const input = buildApprovedSceneInput(proposal(), "production-1", source);
    assert.deepEqual(input.characterIds, []);
    assert.equal(input.locationId, undefined);
  });

  it("persists linked AI-approved scenes through the schema", async () => {
    const written: SceneCreateInput[][] = [];
    await persistApprovedSceneProposals(
      [proposal({ sourceText: "EXT. BUS STOP - NIGHT\nTARA\nIt is late." })],
      "22222222-2222-4222-8222-222222222222",
      source,
      { createMany: async (scenes) => { written.push(scenes); return []; } },
      { characters, locations },
    );
    assert.deepEqual(written[0]?.[0]?.characterIds, ["aaaaaaaa-0000-4000-8000-000000000001"]);
    assert.equal(written[0]?.[0]?.locationId, locationId);
  });
});
