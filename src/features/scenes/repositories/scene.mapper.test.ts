import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromSceneDatabase, toSceneDatabase, type SceneRow } from "./scene.mapper";

const provenance = {
  sourceScreenplayId: "11111111-1111-4111-8111-111111111111",
  sourceRevisionId: "22222222-2222-4222-8222-222222222222",
  sourceScreenplayVersion: 3,
};

describe("scene persistence provenance mapping", () => {
  it("maps accepted source identifiers to and from database columns", () => {
    const write = toSceneDatabase({ productionId: "33333333-3333-4333-8333-333333333333", number: 1, heading: "EXT. PIER - DUSK", ...provenance });
    assert.equal(write.source_screenplay_id, provenance.sourceScreenplayId);
    assert.equal(write.source_revision_id, provenance.sourceRevisionId);
    assert.equal(write.source_screenplay_version, provenance.sourceScreenplayVersion);

    const row = {
      id: "44444444-4444-4444-8444-444444444444",
      production_id: "33333333-3333-4333-8333-333333333333",
      scene_number: 1,
      heading: "EXT. PIER - DUSK",
      scene_type: "EXT" as const,
      time_of_day: null,
      summary: null,
      action: null,
      dialogue: null,
      character_ids: [],
      location_id: null,
      purpose: null,
      emotional_beat: null,
      story_beat: null,
      visual_direction: null,
      props: [],
      wardrobe: null,
      sound_notes: null,
      continuity_notes: null,
      vfx_notes: null,
      production_notes: null,
      ai_prompt: null,
      source_text: null,
      status: "draft" as const,
      progress: 0,
      estimated_duration_seconds: null,
      created_at: "2026-09-29T00:00:00.000Z",
      updated_at: "2026-09-29T00:00:00.000Z",
      source_screenplay_id: provenance.sourceScreenplayId,
      source_revision_id: provenance.sourceRevisionId,
      source_screenplay_version: provenance.sourceScreenplayVersion,
    } as SceneRow;
    const mapped = fromSceneDatabase(row);
    assert.equal(mapped.sourceScreenplayId, provenance.sourceScreenplayId);
    assert.equal(mapped.sourceRevisionId, provenance.sourceRevisionId);
    assert.equal(mapped.sourceScreenplayVersion, provenance.sourceScreenplayVersion);
  });

  it("keeps provenance optional for manually created scenes", () => {
    const write = toSceneDatabase({ productionId: "33333333-3333-4333-8333-333333333333", number: 1, heading: "INT. STUDIO - NIGHT" });
    assert.equal(write.source_screenplay_id, undefined);
    assert.equal(write.source_revision_id, undefined);
    assert.equal(write.source_screenplay_version, undefined);
  });
});
