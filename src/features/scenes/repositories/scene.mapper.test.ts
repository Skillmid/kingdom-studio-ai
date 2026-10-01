import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SceneUpdateInput } from "../types/scene";
import { fromSceneDatabase, toSceneDatabase, toSceneUpdateDatabase, type SceneRow } from "./scene.mapper";

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
      camera_direction: null,
      mood: null,
      music_notes: null,
      props: [],
      wardrobe: null,
      sound_notes: null,
      continuity_notes: null,
      vfx_notes: null,
      production_notes: null,
      ai_prompt: null,
      video_prompt: null,
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

  it("round-trips independent creator-entered scene details without changing existing fields", () => {
    const input = {
      productionId: "33333333-3333-4333-8333-333333333333",
      number: 8,
      heading: "INT. STATION - NIGHT",
      cameraDirection: "Locked wide shot.",
      mood: "Tense and quiet.",
      musicNotes: "No score until the final beat.",
      videoPrompt: "A static wide frame with practical fluorescent light.",
      visualDirection: "Cold palette, hard reflections.",
      emotionalBeat: "Confidence gives way to doubt.",
      soundNotes: "Train rumble under dialogue.",
      aiPrompt: "Reference still in graphic novel style.",
      sourceText: "Original screenplay passage.",
      sourceScreenplayId: "11111111-1111-4111-8111-111111111111",
      sourceRevisionId: "22222222-2222-4222-8222-222222222222",
      sourceScreenplayVersion: 3,
    };
    const write = toSceneDatabase(input);

    assert.equal(write.camera_direction, input.cameraDirection);
    assert.equal(write.mood, input.mood);
    assert.equal(write.music_notes, input.musicNotes);
    assert.equal(write.video_prompt, input.videoPrompt);
    assert.equal(write.visual_direction, input.visualDirection);
    assert.equal(write.emotional_beat, input.emotionalBeat);
    assert.equal(write.sound_notes, input.soundNotes);
    assert.equal(write.ai_prompt, input.aiPrompt);
    assert.equal(write.source_text, input.sourceText);
    assert.equal(write.source_screenplay_id, input.sourceScreenplayId);

    const mapped = fromSceneDatabase({
      ...write,
      id: "44444444-4444-4444-8444-444444444444",
      scene_type: "INT",
      time_of_day: null,
      summary: null,
      action: null,
      dialogue: null,
      character_ids: [],
      location_id: null,
      purpose: null,
      story_beat: null,
      props: [],
      wardrobe: null,
      continuity_notes: null,
      vfx_notes: null,
      production_notes: null,
      estimated_duration_seconds: null,
      status: "draft",
      progress: 0,
      created_at: "2026-09-29T00:00:00.000Z",
      updated_at: "2026-09-29T00:00:00.000Z",
    } as unknown as SceneRow);

    assert.equal(mapped.cameraDirection, input.cameraDirection);
    assert.equal(mapped.mood, input.mood);
    assert.equal(mapped.musicNotes, input.musicNotes);
    assert.equal(mapped.videoPrompt, input.videoPrompt);
    assert.equal(mapped.visualDirection, input.visualDirection);
    assert.equal(mapped.emotionalBeat, input.emotionalBeat);
    assert.equal(mapped.soundNotes, input.soundNotes);
    assert.equal(mapped.aiPrompt, input.aiPrompt);
    assert.equal(mapped.sourceText, input.sourceText);
    assert.equal(mapped.sourceScreenplayId, input.sourceScreenplayId);
  });

  it("maps only supplied update fields and never changes production or screenplay source data", () => {
    const update = toSceneUpdateDatabase({
      mood: "More hopeful.",
      productionId: "55555555-5555-4555-8555-555555555555",
    } as unknown as SceneUpdateInput);

    assert.deepEqual(update, { mood: "More hopeful." });
    assert.equal("production_id" in update, false);
    assert.equal("source_text" in update, false);
    assert.equal("source_screenplay_id" in update, false);
    assert.equal("source_revision_id" in update, false);
    assert.equal("source_screenplay_version" in update, false);

    const cleared = toSceneUpdateDatabase({ mood: undefined });
    assert.deepEqual(cleared, { mood: null });
  });
});
