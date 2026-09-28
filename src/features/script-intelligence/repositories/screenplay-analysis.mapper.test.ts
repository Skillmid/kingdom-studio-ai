import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toScreenplayAnalysisDatabase } from "./screenplay-analysis.mapper";

describe("screenplay analysis persistence mapper", () => {
  it("stores analysis with its exact screenplay revision provenance", () => {
    const analysis = {
      screenplay: { title: "A Quiet Crossing", pages: 3, acts: 1, scenes: 2, format: "Fountain" },
      story: { genre: "Drama", theme: "Trust", logline: "A traveller waits.", synopsis: "A sparse story.", strengths: [], weaknesses: [], recommendations: [] },
      characters: [], scenes: [],
      dialogue: { score: 0, strengths: [], improvements: [] },
      spirituality: { biblicalAlignment: 0, kingdomMessage: "", scriptureReferences: [], recommendations: [] },
      culture: { country: "", culture: "", language: "", authenticity: 0, recommendations: [] },
      professional: { score: 0, screenplayFormat: [], industryJargon: [], continuity: [], clarity: [], recommendations: [] },
      production: { budget: "", complexity: "", risks: [], recommendations: [] },
    };
    const row = toScreenplayAnalysisDatabase({
      productionId: "production-id",
      screenplayId: "screenplay-id",
      revisionId: "revision-id",
      screenplayVersion: 3,
      analysis,
    });

    assert.equal(row.production_id, "production-id");
    assert.equal(row.screenplay_id, "screenplay-id");
    assert.equal(row.revision_id, "revision-id");
    assert.equal(row.screenplay_version, 3);
    assert.deepEqual(row.analysis, analysis);
  });
});
