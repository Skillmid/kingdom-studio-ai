import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sceneExtractor } from "./scene.extractor";
import type { ParsedScreenplayDocument } from "../types/parsed-screenplay-document";

describe("scene extractor parsed document", () => {
  it("returns scenes with structured dialogue cues", async () => {
    const document: ParsedScreenplayDocument = await sceneExtractor.parse(
      [
        "INT. KITCHEN - NIGHT",
        "MAYA (V.O.)",
        "We should leave now.",
        "JONAH",
        "I agree.",
      ].join("\n"),
    );

    assert.equal(document.scenes.length, 1);
    assert.equal(document.scenes[0]?.heading, "INT. KITCHEN - NIGHT");
    assert.deepEqual(document.scenes[0]?.dialogues, [
      { character: "MAYA", text: "We should leave now." },
      { character: "JONAH", text: "I agree." },
    ]);
    assert.equal(document.scenes[0]?.dialogue, "We should leave now. I agree.");
  });

  it("returns an empty parsed scene list for blank input", async () => {
    assert.deepEqual(await sceneExtractor.parse(" \n "), { scenes: [] });
  });
});