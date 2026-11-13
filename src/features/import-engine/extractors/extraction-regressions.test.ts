import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { characterExtractor } from "./character.extractor";
import { sceneExtractor } from "./scene.extractor";
import {
  findDocumentTitle,
  formatCharacterName,
  isTimeMarker,
  parseInlineColonCue,
  readsAsSceneDescription,
} from "../screenplay-elements";

async function names(screenplay: string): Promise<string[]> {
  return (await characterExtractor.extract(screenplay)).map((character) => character.name).sort();
}

describe("title detection without a title page", () => {
  it("keeps a multi-word cue that opens the script body as a character", async () => {
    const script = "FADE IN:\n\nINT. HOUSE - DAY\n\nMRS. OKAFOR\nSit down, David.\n\nDAVID\nYes, ma.\n\nMRS. OKAFOR\nGood.\n";
    assert.equal(findDocumentTitle(script.split("\n")), null);
    const extracted = await characterExtractor.extract(script);
    assert.deepEqual(extracted.map((c) => c.name).sort(), ["David", "Mrs. Okafor"]);
    assert.equal(extracted.find((c) => c.name === "Mrs. Okafor")?.dialogueCount, 2);
  });

  it("keeps a cue with dialogue as the very first line instead of treating it as a title", async () => {
    assert.deepEqual(await names("PASTOR JAMES\nLet us pray.\n\nINT. CHURCH - DAY\n"), ["Pastor James"]);
  });

  it("still recognises a real title page", async () => {
    const script = "HARBOUR LIGHTS\n\nWritten by\n\nA. Writer\n\nFADE IN:\n\nINT. DOCK - NIGHT\n\nNNEKA\nWho left the lamp on?\n";
    assert.equal(findDocumentTitle(script.split("\n")), "HARBOUR LIGHTS");
    assert.deepEqual(await names(script), ["Nneka"]);
  });

  it("treats a title followed directly by a byline as the title", () => {
    assert.equal(findDocumentTitle(["MOON RIVER", "written by A. Writer"]), "MOON RIVER");
  });
});

describe("slug lines directly followed by action", () => {
  const script = [
    "THE LAST BUS",
    "",
    "INT. HOUSE - DAY",
    "",
    "DAVID",
    "Hello.",
    "",
    "MOMENTS LATER",
    "The room is empty.",
    "",
    "SILENCE",
    "Nobody moves.",
    "",
    "BLACK",
    "A phone rings.",
    "",
    "FLASHBACK",
    "A young boy runs.",
    "",
    "CONTINUOUS",
    "She keeps walking.",
    "",
  ].join("\n");

  it("does not cast time markers or slug words as characters", async () => {
    assert.deepEqual(await names(script), ["David"]);
  });

  it("rejects a repeated slug word whose every occurrence is followed by description", async () => {
    assert.deepEqual(await names(`${script}\nSILENCE\nThe kettle clicks off.\n`), ["David"]);
  });

  it("keeps a single-line character when the name is introduced in the action", async () => {
    assert.deepEqual(
      await names("INT. CAFE - DAY\n\nA tired WAITER wipes the counter.\n\nWAITER\nThe kitchen is closed.\n"),
      ["Waiter"],
    );
    assert.deepEqual(
      await names("INT. CAFE - DAY\n\nThe door opens and Kemi walks in.\n\nKEMI\nThe kitchen is closed.\n"),
      ["Kemi"],
    );
  });

  it("classifies time markers and description structurally", () => {
    assert.equal(isTimeMarker("MOMENTS LATER"), true);
    assert.equal(isTimeMarker("CONTINUOUS"), true);
    assert.equal(isTimeMarker("DORIS DAY"), false);
    assert.equal(readsAsSceneDescription("Nobody moves."), true);
    assert.equal(readsAsSceneDescription("She keeps walking."), true);
    assert.equal(readsAsSceneDescription("They will not wait."), false);
    assert.equal(readsAsSceneDescription("The bus is late, you know."), false);
    assert.equal(readsAsSceneDescription("Is this seat taken?"), false);
  });
});

describe("cue formats", () => {
  it("accepts inline colon dialogue with a capitalised name", async () => {
    assert.deepEqual(parseInlineColonCue("DAVID: We missed the bus."), { cue: "DAVID", dialogue: "We missed the bus." });
    assert.equal(parseInlineColonCue("SFX: THUNDER"), null);
    assert.equal(parseInlineColonCue("Note: call the office."), null);
    assert.deepEqual(await names("DAVID: We missed the bus.\nFEMI: They will not wait.\n"), ["David", "Femi"]);
  });

  it("accepts shouted all-caps dialogue", async () => {
    assert.deepEqual(await names("INT. HALL - NIGHT\n\nDAVID\nNO!\n"), ["David"]);
  });

  it("accepts generational suffixes and initials ending in a period", async () => {
    assert.deepEqual(await names("INT. HALL - NIGHT\n\nJOHN JR.\nI am here.\n\nT.J.\nMe too.\n"), ["John Jr.", "T.J."]);
  });

  it("keeps extensions, role nouns and honorifics", async () => {
    const script =
      "TITLE PAGE NAME\n\nINT. STATION - DAY\n\nFEMI (CONT'D)\nThey will not wait.\n\nDAVID (V.O.)\nI remember.\n\nTHE DRIVER\nTickets.\n\nOLD MAN\nGo home.\n\nDR. ADE\nThe results are in.\n";
    assert.deepEqual(await names(script), ["David", "Dr. Ade", "Femi", "Old Man", "The Driver"]);
  });
});

describe("Unicode-safe names", () => {
  it("formats accented and apostrophe names sensibly", async () => {
    assert.equal(formatCharacterName("ADÉBÁYỌ̀"), "Adébáyọ̀");
    assert.equal(formatCharacterName("O'BRIEN"), "O'Brien");
    assert.equal(formatCharacterName("MRS. OKAFOR"), "Mrs. Okafor");
    assert.deepEqual(await names("INT. HOUSE - DAY\n\nADÉBÁYỌ̀\nWelcome home.\n"), ["Adébáyọ̀"]);
  });
});

describe("scene extractor shares the classifier", () => {
  it("keeps all-caps action lines as action instead of phantom speakers", async () => {
    const document = await sceneExtractor.parse(
      "INT. ROOM - NIGHT\nHE TYPES.\nCLOSE ON THE SCREEN.\nDAVID\nWe missed the bus.\nINSIDE IS A HARD DRIVE.\n",
    );
    const scene = document.scenes[0];
    assert.deepEqual(scene?.dialogues, [{ character: "DAVID", text: "We missed the bus." }]);
    assert.match(scene?.action ?? "", /HE TYPES\./);
    assert.match(scene?.action ?? "", /INSIDE IS A HARD DRIVE\./);
  });

  it("splits inline colon dialogue into speaker and text", async () => {
    const document = await sceneExtractor.parse("INT. ROOM - NIGHT\nDAVID: We missed the bus.\nThe rain starts.\n");
    assert.deepEqual(document.scenes[0]?.dialogues, [{ character: "DAVID", text: "We missed the bus." }]);
    assert.match(document.scenes[0]?.action ?? "", /The rain starts\./);
  });
});
