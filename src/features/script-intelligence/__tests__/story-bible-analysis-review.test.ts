import assert from "node:assert/strict";
import { test } from "node:test";

import { validateScreenplayAnalysis } from "../services/screenplay-analysis.service";

test("preserves Story Bible facts, interpretations, and uncertainties separately", () => {
  const analysis = validateScreenplayAnalysis({
    schemaVersion: 1,
    title: "THE MESSAGE",
    storyBible: {
      title: "THE MESSAGE",
      conflict: "Esther has been followed and Michael is trying to find her.",
    },
    storyBibleReview: {
      facts: [
        "Esther says she was followed by a man she did not recognize.",
        "Kunle says Esther was taken before he arrived.",
        "Kunle does not identify who was driving the car.",
      ],
      interpretations: [
        "Kunle's presence creates suspicion around Michael's inner circle.",
      ],
      uncertainties: [
        "The screenplay does not reveal who was driving the car.",
        "The screenplay does not confirm whether Kunle was involved.",
      ],
    },
    characters: [
      {
        name: "Michael",
        kind: "named",
        speaks: true,
        dialogueCount: 1,
        evidence: [{ sceneNumber: 1, text: "Michael stopped." }],
      },
    ],
    locations: [
      {
        name: "Street",
        setting: "exterior",
        sourceHeading: "EXT. STREET - EVENING",
        sceneNumbers: [1],
      },
    ],
    scenes: [
      {
        number: 1,
        heading: "EXT. STREET - EVENING",
        sceneType: "EXT",
        locationName: "Street",
        timeOfDay: "EVENING",
        action: ["Michael walked quickly toward the main road."],
        dialogue: [],
        characterNames: ["Michael"],
        sourceText: "EXT. STREET - EVENING",
      },
    ],
  });

  assert.deepEqual(analysis.storyBibleReview.facts, [
    "Esther says she was followed by a man she did not recognize.",
    "Kunle says Esther was taken before he arrived.",
    "Kunle does not identify who was driving the car.",
  ]);
  assert.deepEqual(analysis.storyBibleReview.interpretations, [
    "Kunle's presence creates suspicion around Michael's inner circle.",
  ]);
  assert.deepEqual(analysis.storyBibleReview.uncertainties, [
    "The screenplay does not reveal who was driving the car.",
    "The screenplay does not confirm whether Kunle was involved.",
  ]);
});

test("defaults missing Story Bible review metadata to empty lists", () => {
  const analysis = validateScreenplayAnalysis({
    schemaVersion: 1,
    characters: [
      {
        name: "Michael",
        kind: "named",
        speaks: true,
        dialogueCount: 1,
        evidence: [],
      },
    ],
    locations: [],
    scenes: [],
    storyBible: {},
  });

  assert.deepEqual(analysis.storyBibleReview, {
    facts: [],
    interpretations: [],
    uncertainties: [],
  });
});
