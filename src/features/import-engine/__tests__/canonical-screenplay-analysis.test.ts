import assert from "node:assert/strict";
import { test } from "node:test";

import { extractFromScreenplay } from "../extract-from-screenplay";
import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";

const ANALYSIS: ScreenplayAnalysis = {
  schemaVersion: 1,
  characters: [
    {
      name: "David",
      kind: "named",
      speaks: true,
      dialogueCount: 2,
      evidence: [{ sceneNumber: 1, text: "DAVID\nI am late again." }],
    },
    {
      name: "Tara",
      kind: "named",
      speaks: false,
      dialogueCount: 0,
      introduction: "His younger sister, TARA, 16, is asleep at the dining table.",
      evidence: [{ sceneNumber: 1, text: "His younger sister, TARA, 16, is asleep at the dining table." }],
    },
    {
      name: "Mum",
      kind: "named",
      speaks: true,
      dialogueCount: 1,
      evidence: [{ sceneNumber: 1, text: "MUM\nYour sister is waiting." }],
    },
  ],
  locations: [
    {
      name: "Family House",
      setting: "interior",
      sourceHeading: "1. INT. FAMILY HOUSE – NIGHT",
      sceneNumbers: [1],
    },
  ],
  scenes: [
    {
      number: 1,
      heading: "1. INT. FAMILY HOUSE – NIGHT",
      sceneType: "INT",
      locationName: "Family House",
      timeOfDay: "NIGHT",
      action: ["His younger sister, TARA, 16, is asleep at the dining table."],
      dialogue: [
        { character: "DAVID", dialogue: "I am late again." },
        { character: "MUM", dialogue: "Your sister is waiting." },
      ],
      characterNames: ["David", "Mum", "Tara"],
      sourceText: "1. INT. FAMILY HOUSE – NIGHT\n\nHis younger sister, TARA, 16, is asleep at the dining table.",
    },
  ],
};

test("canonical screenplay analysis is the source of truth", () => {
  const extracted = extractFromScreenplay("DAVID TYPES\nPROVERBS 10:9", ANALYSIS);

  assert.deepEqual(extracted.characters.map((character) => character.name), ["David", "Mum", "Tara"]);
  assert.deepEqual(extracted.scenes[0]?.characterNames, ["David", "Mum", "Tara"]);
  assert.equal(extracted.locations[0]?.name, "Family House");
  assert.equal(extracted.locations[0]?.setting, "interior");
  assert.equal(extracted.scenes[0]?.sourceText.includes("TARA"), true);
});
