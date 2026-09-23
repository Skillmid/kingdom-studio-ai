import assert from "node:assert/strict";
import { test } from "node:test";

import { extractFromScreenplay } from "../extract-from-screenplay";
import { validateScreenplayAnalysis } from "@/features/script-intelligence/services/screenplay-analysis.service";
import type { ScreenplayAnalysis } from "@/features/script-intelligence/types/screenplay-analysis";

const ANALYSIS: ScreenplayAnalysis = {
  schemaVersion: 1,
  title: "The Return",
  logline: "A man confronts the consequences of his choices.",
  storyBible: {
    synopsis: "A man is forced to face the consequences of his choices and seek restoration.",
    theme: "Redemption",
    core_message: "Restoration begins with truth.",
    beginning: "The protagonist is introduced in a difficult situation.",
    conflict: "He must confront the consequences of his choices.",
    climax: "He makes the decisive choice to face the truth.",
    ending: "He begins the journey toward restoration.",
    genre: "Drama",
    duration_minutes: 15,
  },
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

test("canonical screenplay analysis preserves Story Bible intelligence", () => {
  const validated = validateScreenplayAnalysis(ANALYSIS);

  assert.equal(validated.storyBible.theme, "Redemption");
  assert.equal(validated.storyBible.core_message, "Restoration begins with truth.");
  assert.equal(validated.storyBible.duration_minutes, 15);
  assert.equal(validated.characters[0]?.name, "David");
  assert.equal(validated.locations[0]?.name, "Family House");
  assert.equal(validated.scenes[0]?.locationName, "Family House");
});
