import assert from "node:assert/strict";
import { it } from "node:test";
import { extractJson, parseCharacterAIProfile } from "./parse-character-ai-profile";

it("parses the strict fields and fieldEvidence response contract", () => {
  const parsed = parseCharacterAIProfile(extractJson(JSON.stringify({
    fields: {
      age: null,
      occupation: "Doctor",
      biography: "A physician who reviews the test results.",
      role: "supporting",
    },
    fieldEvidence: {
      age: null,
      occupation: "DOCTOR LANRE reviews a medical file.",
      biography: "DOCTOR LANRE reviews a medical file.",
      role: "DOCTOR LANRE reviews a medical file.",
    },
  })));
  assert.equal(parsed.fields.age, undefined);
  assert.equal(parsed.fields.occupation, "Doctor");
  assert.equal(parsed.fields.role, "supporting");
  assert.equal(parsed.fieldEvidence.occupation, "DOCTOR LANRE reviews a medical file.");
});

it("accepts JSON wrapped in a code fence or short surrounding prose", () => {
  assert.deepEqual(extractJson('Result:\n```json\n{"fields":{},"fieldEvidence":{}}\n```'), {
    fields: {},
    fieldEvidence: {},
  });
});

it("rejects malformed JSON rather than silently accepting an empty profile", () => {
  assert.throws(() => extractJson("No structured answer was returned."));
});
