import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sceneSchema } from "./scene.schema";

const manualScene = {
  productionId: "11111111-1111-4111-8111-111111111111",
  number: 1,
  heading: "INT. STUDIO - NIGHT",
};

describe("scene screenplay provenance validation", () => {
  it("allows manually created scenes without screenplay provenance", () => {
    assert.equal(sceneSchema.safeParse(manualScene).success, true);
  });

  it("requires screenplay, revision, and version provenance together", () => {
    assert.equal(sceneSchema.safeParse({ ...manualScene, sourceRevisionId: "22222222-2222-4222-8222-222222222222" }).success, false);
    assert.equal(sceneSchema.safeParse({
      ...manualScene,
      sourceScreenplayId: "33333333-3333-4333-8333-333333333333",
      sourceRevisionId: "22222222-2222-4222-8222-222222222222",
      sourceScreenplayVersion: 2,
    }).success, true);
  });

  it("accepts distinct creator-entered scene direction fields", () => {
    const result = sceneSchema.safeParse({
      ...manualScene,
      cameraDirection: "Slow lateral track toward the doorway.",
      mood: "Uneasy and restrained.",
      musicNotes: "Low strings enter after the reveal.",
      videoPrompt: "Wide frame, dusk light, gradual push-in.",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.cameraDirection, "Slow lateral track toward the doorway.");
      assert.equal(result.data.mood, "Uneasy and restrained.");
      assert.equal(result.data.musicNotes, "Low strings enter after the reveal.");
      assert.equal(result.data.videoPrompt, "Wide frame, dusk light, gradual push-in.");
    }
  });

  it("keeps all four new fields optional for screenplay-derived proposals", () => {
    const result = sceneSchema.safeParse({
      ...manualScene,
      sourceScreenplayId: "33333333-3333-4333-8333-333333333333",
      sourceRevisionId: "22222222-2222-4222-8222-222222222222",
      sourceScreenplayVersion: 2,
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.cameraDirection, undefined);
      assert.equal(result.data.mood, undefined);
      assert.equal(result.data.musicNotes, undefined);
      assert.equal(result.data.videoPrompt, undefined);
    }
  });
});
