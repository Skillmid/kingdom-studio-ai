import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { characterExtractor } from "./character.extractor";
import { classifyScreenplayLine } from "../screenplay-elements";

const LAST_BUS = `THE LAST BUS

FADE IN:

THE LAST LIGHT

INT. APARTMENT - NIGHT

HE TYPES.

INSIDE IS A HARD DRIVE LABELLED "ARCHIVE".

CLOSE ON THE SCREEN.

SFX: BUS ENGINE

DAVID
We missed the last bus.

EXT. BUS STOP - NIGHT

FEMI
They will not wait.

MUM
Come home.

TARA
(quietly)
I saw her.

WOMAN
Is this seat taken?

CONDUCTOR
Tickets.

DAVID (V.O.)
I keep hearing the engine.

CUT TO:
`;

describe("character extraction integrity", () => {
  it("keeps speaking roles from THE LAST BUS and rejects title, action, and object lines", async () => {
    const extracted = await characterExtractor.extract(LAST_BUS);
    const names = extracted.map((character) => character.name).sort();

    assert.deepEqual(names, ["Conductor", "David", "Femi", "Mum", "Tara", "Woman"]);
    assert.equal(extracted.find((character) => character.name === "David")?.dialogueCount, 2);
    assert.equal(
      extracted.some((character) =>
        /the last light|he types|hard drive|the last bus|fade in|close on/i.test(character.name),
      ),
      false,
    );
  });

  it("classifies the known false positives by structure, not by phrase blacklist", () => {
    assert.equal(classifyScreenplayLine("THE LAST LIGHT", { isDocumentTitle: true }), "title");
    assert.equal(classifyScreenplayLine("HE TYPES."), "action");
    assert.equal(classifyScreenplayLine("INSIDE IS A HARD DRIVE LABELLED"), "object");
    assert.equal(classifyScreenplayLine("INT. APARTMENT - NIGHT"), "scene_heading");
    assert.equal(classifyScreenplayLine("CUT TO:"), "transition");
    assert.equal(classifyScreenplayLine("CLOSE ON THE SCREEN."), "camera");
    assert.equal(classifyScreenplayLine("SFX: BUS ENGINE"), "sound");
    assert.equal(classifyScreenplayLine("DAVID"), "character_cue");
    assert.equal(classifyScreenplayLine("CONDUCTOR"), "character_cue");
  });

  it("accepts explicit name cues in plain-text scripts", async () => {
    const extracted = await characterExtractor.extract(`David:
We missed the last bus.

Femi:
They will not wait.
`);
    assert.deepEqual(
      extracted.map((character) => character.name).sort(),
      ["David", "Femi"],
    );
  });

  it("does not invent a character when evidence is only an action line", async () => {
    const extracted = await characterExtractor.extract(`He types.
Inside is a hard drive labelled "ARCHIVE".
`);
    assert.deepEqual(extracted, []);
  });
});
