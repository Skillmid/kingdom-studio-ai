import assert from "node:assert/strict";
import { test } from "node:test";

import { characterExtractor } from "../extractors/character.extractor";
import { locationExtractor } from "../extractors/location.extractor";
import { sceneExtractor } from "../extractors/scene.extractor";
import {
  isScreenplayTransition,
  parseSceneHeading,
} from "../scene-heading";

const SAMPLE_SCREENPLAY = `
1. EXT. LAGOS BUS STOP – EVENING

Crowds press toward the arriving bus.

DAVID
I need to figure this out.

MUM
Don't forget your sister's school fees.

A Notification Appears
on David's cracked phone screen.

Another Message Follows
before he can lock it.

His Eyes Fall On
the verse he saved last night.

PROVERBS 10:9
Whoever walks in integrity walks securely.

His Phone Displays An Email
from an unknown sender.

A Message From Femi
pops up immediately after.

David Types
a reply he does not send.

Then Adds
nothing. He puts the phone away.

WOMAN
Are you boarding or not?

CONDUCTOR
Enter, oga. We no get time.

INTERCUT –

CUT TO:

FADE OUT:

2. INT. FAMILY HOUSE – EVENING

MUM
David?

TARA
I'm ready for school.

DAVID (V.O.)
I can still hear her voice.

3. EXT. SCHOOL GATE – MORNING

TARA
Bye, David!

FEMI
I heard you're looking for money.

DAVID
I'm not interested.

4. INT./EXT. BUS – NIGHT

David watches the city smear past the window.

5. EXT. ROADSIDE RESTAURANT – DAY

FEMI
You need money, right?

6. INT. DAVID'S ROOM – NIGHT

DAVID (PHONE)
I will call you back.

7. EXT. ROADSIDE – AFTERNOON

CONDUCTOR
Last seat!

8. EXT. LAGOS STREET – EVENING

WOMAN
God dey.

9. INT. FAMILY HOUSE – MORNING

TARA
Good morning.

10. EXT. LAGOS BUS STOP – DAWN

DAVID
I am late again.

11. EXT. SCHOOL GATE – AFTERNOON

FEMI
Think about it.
`;

test("rejects screenplay transitions as scene headings", () => {
  assert.equal(parseSceneHeading("INTERCUT –"), null);
  assert.equal(parseSceneHeading("INTERCUT"), null);
  assert.equal(parseSceneHeading("CUT TO:"), null);
  assert.equal(parseSceneHeading("FADE IN:"), null);
  assert.equal(parseSceneHeading("FADE OUT:"), null);
  assert.equal(parseSceneHeading("SMASH CUT TO:"), null);
  assert.equal(parseSceneHeading("DISSOLVE TO:"), null);
  assert.equal(parseSceneHeading("MATCH CUT TO:"), null);
  assert.equal(parseSceneHeading("JUMP CUT TO:"), null);
  assert.equal(parseSceneHeading("BACK TO:"), null);
  assert.equal(parseSceneHeading("CONTINUED:"), null);
  assert.equal(parseSceneHeading("CONT'D:"), null);
  assert.equal(isScreenplayTransition("INTERCUT –"), true);
});

test("parses numbered and dual scene headings", () => {
  const busStop = parseSceneHeading("1. EXT. LAGOS BUS STOP – EVENING");
  assert.ok(busStop);
  assert.equal(busStop.prefix, "EXT");
  assert.equal(busStop.locationName, "Lagos Bus Stop");
  assert.equal(busStop.timeOfDay, "EVENING");
  assert.equal(busStop.sceneNumber, 1);

  const house = parseSceneHeading("2. INT. FAMILY HOUSE – NIGHT");
  assert.ok(house);
  assert.equal(house.prefix, "INT");
  assert.equal(house.locationName, "Family House");

  const car = parseSceneHeading("INT./EXT. CAR – NIGHT");
  assert.ok(car);
  assert.equal(car.prefix, "BOTH");
  assert.equal(car.locationName, "Car");

  const houseBoth = parseSceneHeading("EXT./INT. HOUSE – DAY");
  assert.ok(houseBoth);
  assert.equal(houseBoth.prefix, "BOTH");

  const ieCar = parseSceneHeading("I/E CAR – NIGHT");
  assert.ok(ieCar);
  assert.equal(ieCar.prefix, "BOTH");
  assert.equal(ieCar.locationName, "Car");
});

test("extracts only spoken characters and normalizes cue variants", async () => {
  const characters = await characterExtractor.extract(SAMPLE_SCREENPLAY);
  const names = characters.map((character) => character.name).sort();

  assert.deepEqual(names, [
    "Conductor",
    "David",
    "Femi",
    "Mum",
    "Tara",
    "Woman",
  ]);

  const david = characters.find((character) => character.name === "David");
  assert.ok(david);
  assert.ok(david.dialogueCount >= 3);

  const forbidden = [
    "A Notification Appears",
    "Another Message Follows",
    "His Eyes Fall On",
    "Proverbs 10:9",
    "His Phone Displays An Email",
    "A Message From Femi",
    "David Types",
    "Then Adds",
    "Intercut",
    "Ercut",
  ].map((name) => name.toLowerCase());

  for (const character of characters) {
    assert.equal(forbidden.includes(character.name.toLowerCase()), false);
  }
});

test("extracts physical locations and ignores transitions", async () => {
  const locations = await locationExtractor.extract(SAMPLE_SCREENPLAY);
  const names = locations.map((location) => location.name).sort();

  assert.deepEqual(names, [
    "Bus",
    "David's Room",
    "Family House",
    "Lagos Bus Stop",
    "Lagos Street",
    "Roadside",
    "Roadside Restaurant",
    "School Gate",
  ]);

  assert.equal(
    locations.some((location) => /ercut|intercut|cut to|fade/i.test(location.name)),
    false
  );

  const familyHouse = locations.find((location) => location.name === "Family House");
  assert.ok(familyHouse);
  assert.equal(familyHouse.setting, "interior");

  const busStop = locations.find((location) => location.name === "Lagos Bus Stop");
  assert.ok(busStop);
  assert.equal(busStop.setting, "exterior");
  assert.ok(busStop.occurrences >= 2);

  const bus = locations.find((location) => location.name === "Bus");
  assert.ok(bus);
  assert.equal(bus.setting, "both");
});

test("extracts eleven real scenes and scene-level character appearances", async () => {
  const scenes = await sceneExtractor.extract(SAMPLE_SCREENPLAY);

  assert.equal(scenes.length, 11);
  assert.equal(scenes.some((scene) => /intercut/i.test(scene.heading)), false);

  const houseScene = scenes.find((scene) => scene.number === 2);
  assert.ok(houseScene);
  assert.equal(houseScene.locationName, "Family House");
  assert.deepEqual(houseScene.characterNames.sort(), ["David", "Mum", "Tara"]);

  const allAppearances = scenes.flatMap((scene) => scene.characterNames);
  const forbidden = [
    "A Notification Appears",
    "Another Message Follows",
    "His Eyes Fall On",
    "Proverbs 10:9",
    "His Phone Displays An Email",
    "A Message From Femi",
    "David Types",
    "Then Adds",
    "Intercut",
  ].map((name) => name.toLowerCase());

  for (const name of allAppearances) {
    assert.equal(forbidden.includes(name.toLowerCase()), false);
  }
});
