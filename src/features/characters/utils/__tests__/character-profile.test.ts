import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateCharacterProgress,
  isExtractionStub,
} from "../character-progress";
import { mergeCharacterProfile } from "../merge-character-profile";

test("extraction stubs are not treated as real biography", () => {
  assert.equal(
    isExtractionStub("Speaks 4 times. Evidence: MICHAEL enters the office."),
    true
  );
  assert.equal(
    isExtractionStub("Michael owns the firm and is under pressure from lenders."),
    false
  );
});

test("progress is calculated from populated profile fields", () => {
  assert.equal(calculateCharacterProgress({ name: "Michael" }), 0);
  assert.equal(
    calculateCharacterProgress({
      biography: "A businessman under pressure.",
      personality: "Controlled and wary.",
      motivation: "Protect the company.",
    }),
    Math.round((3 / 26) * 100)
  );
});

test("bulk merge does not copy Kunle's occupation onto Michael", () => {
  const merged = mergeCharacterProfile(
    {
      name: "Michael",
      occupation: "business partner",
      biography: "Speaks 6 times. Evidence: MICHAEL waits for Kunle.",
    },
    {
      biography: "Michael runs the business and waits on Kunle, his partner.",
      personality: "Tense, status-conscious.",
      occupation: undefined,
    },
    { replaceOmittedFactualFields: true }
  );

  assert.equal(merged.occupation, "");
  assert.match(merged.biography ?? "", /Michael runs the business/);
  assert.equal(merged.personality, "Tense, status-conscious.");
});

test("single-character sync keeps a user-written occupation when AI omits it", () => {
  const merged = mergeCharacterProfile(
    {
      occupation: "Architect",
      biography: "User-written bio.",
    },
    {
      personality: "Quiet and exacting.",
    },
    { replaceOmittedFactualFields: false }
  );

  assert.equal(merged.occupation, "Architect");
  assert.equal(merged.biography, "User-written bio.");
  assert.equal(merged.personality, "Quiet and exacting.");
});
