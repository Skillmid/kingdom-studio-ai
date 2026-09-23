import assert from "node:assert/strict";
import { test } from "node:test";

import { extractFromScreenplay } from "../extract-from-screenplay";

const SCREENPLAY = `
1. EXT. LAGOS BUS STOP – EVENING

DAVID
I am late again.

MUM
Your sister is waiting.

His younger sister, TARA, 16, is asleep at the dining table beside her school books.

A Message From Femi appears on David's phone.

WOMAN
Are you boarding or not?

CONDUCTOR
Enter, oga.

2. EXT. SCHOOL GATE – MORNING

Tara walks through the school gate. She turns and waves at David.

FEMI
I heard you're looking for money.

DAVID
I'm not interested.
`;

test("extracts named characters introduced only in action", () => {
  const extracted = extractFromScreenplay(SCREENPLAY);
  const names = extracted.characters.map((character) => character.name).sort();

  assert.deepEqual(names, [
    "Conductor",
    "David",
    "Femi",
    "Mum",
    "Tara",
    "Woman",
  ]);

  const tara = extracted.characters.find((character) => character.name === "Tara");
  assert.ok(tara);
  assert.equal(tara.dialogueCount, 0);
  assert.equal(tara.role, "supporting");
});

test("does not turn action labels, verses, or message text into characters", () => {
  const extracted = extractFromScreenplay(`
1. EXT. LAGOS BUS STOP – EVENING
A Notification Appears
on David's phone.

PROVERBS 10:9
Whoever walks in integrity walks securely.

A Message From Femi
pops up.

David Types
a reply.

Then Adds
nothing.

DAVID
I will call you later.
`);

  const names = extracted.characters.map((character) => character.name.toLowerCase());

  for (const forbidden of [
    "a notification appears",
    "proverbs",
    "a message from",
    "david types",
    "then adds",
  ]) {
    assert.equal(names.includes(forbidden), false);
  }

  assert.equal(names.includes("david"), true);
  assert.equal(names.includes("femi"), true);
});

test("includes action-only character in scene cast", () => {
  const extracted = extractFromScreenplay(`
1. INT. FAMILY HOUSE – NIGHT
TARA, 16, is asleep beside her school books.

2. EXT. SCHOOL GATE – MORNING
Tara walks through the gate.
`);

  assert.deepEqual(extracted.scenes[0]?.characterNames, ["Tara"]);
  assert.deepEqual(extracted.scenes[1]?.characterNames, ["Tara"]);
});
