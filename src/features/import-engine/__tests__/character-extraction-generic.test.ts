import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { extractFromScreenplay } from "../extract-from-screenplay";

const fixtures = [
  {
    name: "drama",
    screenplay: `INT. CLINIC - DAY\n\nAMINA checks the chart.\n\nAMINA\nWe need to leave now.\n\nJONAS enters and takes the bag.\n\nJONAS\nI am ready.`,
    expected: ["AMINA", "JONAS"],
  },
  {
    name: "sparse action-only",
    screenplay: `EXT. MARKET - NIGHT\n\nA WOMAN runs through the stalls. A DRIVER follows her.\n\nThe WOMAN drops a letter.`,
    expected: ["WOMAN", "DRIVER"],
  },
  {
    name: "role cues and headings",
    screenplay: `INT. OFFICE - MORNING\n\nDEPUTY DIRECTOR enters.\n\nDEPUTY DIRECTOR\nCall the team.\n\nCUT TO:\nEXT. STREET - DAY\n\nA POLICE OFFICER waits.`,
    expected: ["DEPUTY DIRECTOR", "POLICE OFFICER"],
  },
];

test("character extraction works across unrelated screenplay fixtures", () => {
  for (const fixture of fixtures) {
    const result = extractFromScreenplay(fixture.screenplay);
    const names = result.characters.map((character) => character.name);
    for (const expected of fixture.expected) {
      assert.ok(names.includes(expected), `${fixture.name} should extract ${expected}`);
    }
  }
});

test("character extraction does not depend on a fixed cast", () => {
  const first = extractFromScreenplay(fixtures[0].screenplay).characters.map((character) => character.name);
  const second = extractFromScreenplay(fixtures[1].screenplay).characters.map((character) => character.name);
  assert.notDeepEqual(first.sort(), second.sort());
});

test("production logic contains no THE MESSAGE character names", () => {
  const sourceRoot = path.resolve(process.cwd(), "src");
  const forbidden = /\b(?:Michael|Esther|Tunde|Kunle)\b/g;
  const testRoot = path.resolve(sourceRoot, "features");

  function visit(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") visit(fullPath);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      assert.equal(forbidden.test(content), false, `Forbidden fixture name found in ${fullPath}`);
      forbidden.lastIndex = 0;
    }
  }

  visit(testRoot);
});
