import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planAssetsFromProduction } from "./asset-planner";
import {
  buildCharacterReferencePrompt,
  composeVisualPrompt,
  MAX_COMPOSED_PROMPT_LENGTH,
  relevantDirectorNotes,
} from "./visual-context";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCENE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_SCENE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SHOT_ID = "44444444-4444-4444-8444-444444444444";
const OTHER_SHOT_ID = "45454545-4545-4545-8545-454545454545";
const PANEL_ID = "55555555-5555-4555-8555-555555555555";
const KEEPER_ID = "22222222-2222-4222-8222-222222222222";
const PIER_ID = "33333333-3333-4333-8333-333333333333";

const base = {
  productionId: PRODUCTION_ID,
  artStyle: "Hand-painted watercolour",
  aspectRatio: "2.39:1",
  storyBible: { visualConsistency: "Muted coastal palette, wool costumes", forbiddenElements: "modern vehicles, logos" },
  characters: [{ id: KEEPER_ID, name: "Lighthouse Keeper", appearance: "grey beard, oilskin coat" }],
  locations: [{ id: PIER_ID, name: "North Pier", setting: "exterior", description: "Weathered timber pier" }],
};

describe("inherited visual context in asset planning", () => {
  it("applies Creative DNA and Story Bible rules to shots that already have a generation prompt", () => {
    const [proposal] = planAssetsFromProduction({
      ...base,
      characters: base.characters,
      locations: base.locations,
      shots: [{
        id: SHOT_ID,
        sceneId: SCENE_ID,
        shotNumber: 1,
        generationPrompt: "Wide shot of the keeper walking the pier at dusk",
        characterIds: [KEEPER_ID],
        locationId: PIER_ID,
      }],
    }).filter((item) => item.sourceKind === "shot");
    const prompt = proposal?.prompt ?? "";
    assert.match(prompt, /^Wide shot of the keeper walking the pier at dusk\./);
    assert.match(prompt, /\[Creative Direction: Visual style: Hand-painted watercolour, Framing: 2\.39:1\]/);
    assert.match(prompt, /Visual consistency: Muted coastal palette, wool costumes\./);
    assert.match(prompt, /Avoid: modern vehicles, logos\./);
    assert.match(prompt, /Characters: Lighthouse Keeper \(grey beard, oilskin coat\)\./);
    assert.match(prompt, /Location: North Pier \(exterior, Weathered timber pier\)\./);
  });

  it("applies the same context to storyboard panels", () => {
    const [proposal] = planAssetsFromProduction({
      ...base,
      panels: [{ id: PANEL_ID, sceneId: SCENE_ID, shotId: SHOT_ID, generationPrompt: "Keeper raises a lantern", characterIds: [KEEPER_ID] }],
    }).filter((item) => item.sourceKind === "panel");
    assert.match(proposal?.prompt ?? "", /Creative Direction/);
    assert.match(proposal?.prompt ?? "", /Lighthouse Keeper/);
  });

  it("only uses approved director notes linked to the same panel, shot or scene", () => {
    const notes = [
      { id: "n1", sceneId: SCENE_ID, shotId: SHOT_ID, userApproved: true, lighting: "single lantern key light" },
      { id: "n2", sceneId: SCENE_ID, userApproved: true, composition: "keep horizon low" },
      { id: "n3", sceneId: SCENE_ID, shotId: OTHER_SHOT_ID, userApproved: true, camera: "handheld" },
      { id: "n4", sceneId: OTHER_SCENE_ID, userApproved: true, composition: "other scene" },
      { id: "n5", sceneId: SCENE_ID, shotId: SHOT_ID, userApproved: false, lighting: "unapproved idea" },
    ];
    const selected = relevantDirectorNotes(notes, { sceneId: SCENE_ID, shotId: SHOT_ID }).map((note) => note.id);
    assert.deepEqual(selected, ["n1", "n2"]);

    const [proposal] = planAssetsFromProduction({
      ...base,
      directorNotes: notes.map((note, index) => ({ ...note, noteNumber: index + 1, characterIds: [] })),
      shots: [{ id: SHOT_ID, sceneId: SCENE_ID, shotNumber: 1, generationPrompt: "Keeper at the rail" }],
    }).filter((item) => item.sourceKind === "shot");
    const prompt = proposal?.prompt ?? "";
    assert.match(prompt, /single lantern key light/);
    assert.match(prompt, /keep horizon low/);
    assert.doesNotMatch(prompt, /handheld|other scene|unapproved idea/);
  });

  it("does not duplicate context the creator prompt already states", () => {
    const prompt = composeVisualPrompt({
      intent: "Keeper at dusk. Avoid: modern vehicles, logos.",
      storyBible: { forbiddenElements: "modern vehicles, logos" },
    });
    assert.equal(prompt?.match(/modern vehicles/g)?.length, 1);
  });

  it("does not invent context when records are empty", () => {
    assert.equal(composeVisualPrompt({ intent: "Empty room" }), "Empty room.");
    assert.equal(composeVisualPrompt({}), undefined);
  });

  it("stays within the provider prompt budget, keeping intent, style and avoid rules", () => {
    const prompt = composeVisualPrompt({
      intent: "Keeper at dusk",
      creative: { artStyle: "Watercolour", aspectRatio: "16:9" },
      storyBible: { visualConsistency: "x".repeat(3000), forbiddenElements: "logos" },
      location: { name: "Pier", description: "y".repeat(500) },
    }) ?? "";
    assert.ok(prompt.length <= MAX_COMPOSED_PROMPT_LENGTH);
    assert.match(prompt, /Keeper at dusk/);
    assert.match(prompt, /Creative Direction/);
    assert.match(prompt, /Avoid: logos/);
  });

  it("builds character reference prompts from production style, not a hard-coded look", () => {
    const prompt = buildCharacterReferencePrompt(
      { name: "Lighthouse Keeper", appearance: "grey beard" },
      { artStyle: "Hand-painted watercolour", aspectRatio: "1:1" },
      null,
    );
    assert.match(prompt, /Hand-painted watercolour/);
    assert.doesNotMatch(prompt, /Photorealistic|Cinematic/);
  });
});
