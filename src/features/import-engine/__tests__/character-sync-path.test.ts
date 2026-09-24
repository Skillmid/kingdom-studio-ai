import assert from "node:assert/strict";
import { test } from "node:test";

import { extractFromScreenplay } from "../extract-from-screenplay";

const LIVE_SYNC_SCREENPLAY = `
1. EXT. LAGOS BUS STOP – EVENING
DAVID
I need to figure this out.
MUM
Don't forget your sister's school fees.
A NOTIFICATION APPEARS
on David's cracked phone screen.
ANOTHER MESSAGE FOLLOWS
before he can lock it.
HIS EYES FALL ON
the verse he saved last night.
PROVERBS 10:9
Whoever walks in integrity walks securely.
WOMAN
Are you boarding or not?
CONDUCTOR
Enter, oga. We no get time.
INTERCUT –
2. INT. BUS – NIGHT
HIS PHONE DISPLAYS AN EMAIL
from an unknown sender.
3. EXT. ROADSIDE RESTAURANT – NIGHT
A MESSAGE FROM FEMI
pops up immediately after.
4. INT. DAVID'S ROOM – NIGHT
DAVID TYPES
a reply he does not send.
THEN ADDS
nothing.
5. INT. FAMILY HOUSE – NIGHT
MUM
David?
TARA
I'm ready for school.
6. EXT. ROADSIDE – NIGHT
CONDUCTOR
Last seat!
7. EXT. LAGOS STREET – NIGHT
WOMAN
God dey.
8. INT. FAMILY HOUSE – MORNING
TARA
Good morning.
9. EXT. SCHOOL GATE – MORNING
TARA
Bye, David!
FEMI
I heard you're looking for money.
DAVID
I'm not interested.
10. EXT. LAGOS STREET – SUNSET
FEMI
Think about it.
DAVID (V.O.)
I keep walking.
`;

test("Character Sync extraction path returns only spoken characters", () => {
  const extracted = extractFromScreenplay(LIVE_SYNC_SCREENPLAY);
  const names = extracted.characters.map((character) => character.name).sort();

  assert.deepEqual(names, ["Conductor", "David", "Femi", "Mum", "Tara", "Woman"]);
  assert.equal(extracted.scenes.some((scene) => /intercut/i.test(scene.heading)), false);
  assert.equal(
    extracted.locations.some((location) => /intercut|ercut/i.test(location.name)),
    false
  );

  const forbidden = [
    "1. Ext. Lagos Bus Stop – Evening",
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

  for (const character of extracted.characters) {
    assert.equal(forbidden.includes(character.name.toLowerCase()), false);
  }
});
