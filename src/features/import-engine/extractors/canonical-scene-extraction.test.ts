import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sceneExtractor } from "./scene.extractor";
import { parseSceneHeading, splitScreenplayLines } from "../scene-heading";

describe("canonical screenplay scene heading parsing", () => {
  it("parses standard Fountain / master scene headings", () => {
    const heading1 = parseSceneHeading("INT. WAREHOUSE - NIGHT");
    assert.ok(heading1);
    assert.equal(heading1.prefix, "INT");
    assert.equal(heading1.locationName, "WAREHOUSE");
    assert.equal(heading1.timeOfDay, "NIGHT");

    const heading2 = parseSceneHeading("EXT. DESERT HIGHWAY - DAY");
    assert.ok(heading2);
    assert.equal(heading2.prefix, "EXT");
    assert.equal(heading2.locationName, "DESERT HIGHWAY");
    assert.equal(heading2.timeOfDay, "DAY");
  });

  it("parses dual / combined location headings", () => {
    const both1 = parseSceneHeading("INT./EXT. CAR (MOVING) - NIGHT");
    assert.ok(both1);
    assert.equal(both1.prefix, "BOTH");
    assert.equal(both1.locationName, "CAR (MOVING)");
    assert.equal(both1.timeOfDay, "NIGHT");

    const both2 = parseSceneHeading("I/E SPEEDBOAT - DUSK");
    assert.ok(both2);
    assert.equal(both2.prefix, "BOTH");
    assert.equal(both2.locationName, "SPEEDBOAT");
    assert.equal(both2.timeOfDay, "DUSK");

    const both3 = parseSceneHeading("INT/EXT CABIN - DAWN");
    assert.ok(both3);
    assert.equal(both3.prefix, "BOTH");
    assert.equal(both3.locationName, "CABIN");
    assert.equal(both3.timeOfDay, "DAWN");
  });

  it("parses numbered scene headings and stripping prefixes", () => {
    const num1 = parseSceneHeading("1. INT. KITCHEN - MORNING");
    assert.ok(num1);
    assert.equal(num1.prefix, "INT");
    assert.equal(num1.locationName, "KITCHEN");
    assert.equal(num1.timeOfDay, "MORNING");

    const num2 = parseSceneHeading("SCENE 4: EXT. HIGHWAY - SUNSET");
    assert.ok(num2);
    assert.equal(num2.prefix, "EXT");
    assert.equal(num2.locationName, "HIGHWAY");
    assert.equal(num2.timeOfDay, "SUNSET");

    const num3 = parseSceneHeading("SCENE #12 - INT. ATTIC - NIGHT");
    assert.ok(num3);
    assert.equal(num3.prefix, "INT");
    assert.equal(num3.locationName, "ATTIC");
    assert.equal(num3.timeOfDay, "NIGHT");
  });

  it("handles case-insensitivity and markdown/html formatting", () => {
    const lower = parseSceneHeading("int. living room - day");
    assert.ok(lower);
    assert.equal(lower.prefix, "INT");
    assert.equal(lower.locationName, "living room");
    assert.equal(lower.timeOfDay, "DAY");

    const bold = parseSceneHeading("**EXT. SEATTLE PIER - CONTINUOUS**");
    assert.ok(bold);
    assert.equal(bold.prefix, "EXT");
    assert.equal(bold.locationName, "SEATTLE PIER");
    assert.equal(bold.timeOfDay, "CONTINUOUS");

    const htmlEntities = parseSceneHeading("&lt;b&gt;INT. ST. JUDE&#39;S CATHEDRAL - EVENING&lt;/b&gt;");
    assert.ok(htmlEntities);
    assert.equal(htmlEntities.prefix, "INT");
    assert.equal(htmlEntities.locationName, "ST. JUDE'S CATHEDRAL");
    assert.equal(htmlEntities.timeOfDay, "EVENING");
  });

  it("handles time of day variations without standard hyphens", () => {
    const trailingTime = parseSceneHeading("INT. COUNCIL CHAMBER LATER");
    assert.ok(trailingTime);
    assert.equal(trailingTime.prefix, "INT");
    assert.equal(trailingTime.locationName, "COUNCIL CHAMBER");
    assert.equal(trailingTime.timeOfDay, "LATER");

    const daysLater = parseSceneHeading("EXT. HARBOUR - 3 DAYS LATER");
    assert.ok(daysLater);
    assert.equal(daysLater.prefix, "EXT");
    assert.equal(daysLater.locationName, "HARBOUR");
    assert.equal(daysLater.timeOfDay, "3 DAYS LATER");
  });
});

describe("SceneExtractor canonical extraction", () => {
  it("extracts multiple scenes with accurate numbering, dialogue and action", async () => {
    const screenplay = `
INT. JERUSALEM GATE - DAY

The morning sun rises above the ancient limestone wall. Dust hangs in the cool air.

BARTHOLOMEW
(quietly)
The travellers have arrived.

He turns to look toward the valley below.

EXT. VALLEY OF THE SHADOW - NIGHT

Shadows stretch across the rocky terrain. A chilling wind whispers through the cedar trees.

MARY
Do not be afraid. We walk by faith.
`;

    const scenes = await sceneExtractor.extract(screenplay);
    assert.equal(scenes.length, 2);

    const first = scenes[0];
    assert.equal(first.number, 1);
    assert.equal(first.sceneType, "INT");
    assert.equal(first.locationName, "JERUSALEM GATE");
    assert.equal(first.timeOfDay, "DAY");
    assert.ok(first.action.includes("The morning sun rises"));
    assert.ok(first.action.includes("He turns to look toward the valley below"));
    assert.ok(first.dialogue.includes("The travellers have arrived"));
    assert.equal(first.dialogues.length, 1);
    assert.equal(first.dialogues[0].character, "BARTHOLOMEW");
    assert.ok(first.dialogues[0].text.includes("The travellers have arrived"));

    const second = scenes[1];
    assert.equal(second.number, 2);
    assert.equal(second.sceneType, "EXT");
    assert.equal(second.locationName, "VALLEY OF THE SHADOW");
    assert.equal(second.timeOfDay, "NIGHT");
    assert.ok(second.action.includes("Shadows stretch across the rocky terrain"));
    assert.ok(second.dialogue.includes("Do not be afraid"));
    assert.equal(second.dialogues.length, 1);
    assert.equal(second.dialogues[0].character, "MARY");
  });

  it("does not mistake action lines in all-caps for character dialogue cues", async () => {
    const screenplay = `
INT. STUDY - NIGHT

PETER sits in the high-backed wooden chair.

HE TYPES RAPIDLY.

THE LAST LIGHT FADES IN THE DISTANCE.

PETER
(whispering)
It is finished.
`;

    const scenes = await sceneExtractor.extract(screenplay);
    assert.equal(scenes.length, 1);
    const scene = scenes[0];

    // Peter is the only character speaker
    assert.equal(scene.dialogues.length, 1);
    assert.equal(scene.dialogues[0].character, "PETER");
    assert.ok(scene.dialogues[0].text.includes("It is finished"));

    // Action lines are properly part of action
    assert.ok(scene.action.includes("HE TYPES RAPIDLY."));
    assert.ok(scene.action.includes("THE LAST LIGHT FADES IN THE DISTANCE."));
  });

  it("handles HTML-wrapped screenplays from rich-text paste", async () => {
    const htmlScreenplay = `
<p>INT. TEMPLE COURTYARD - MORNING</p>
<p>Priests gather at the altar as incense rises into the skylight.</p>
<p><b>NICODEMUS</b></p>
<p>Rabbi, we know You are a teacher who has come from God.</p>
`;

    const scenes = await sceneExtractor.extract(htmlScreenplay);
    assert.equal(scenes.length, 1);
    assert.equal(scenes[0].heading, "INT. TEMPLE COURTYARD - MORNING");
    assert.equal(scenes[0].locationName, "TEMPLE COURTYARD");
    assert.equal(scenes[0].dialogues.length, 1);
    assert.equal(scenes[0].dialogues[0].character, "NICODEMUS");
  });
});
