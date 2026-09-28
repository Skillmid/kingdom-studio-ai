import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCharacterAIProfile } from "./parse-character-ai-profile";
import { calculateCharacterProgress, isExtractionStub } from "./character-progress";
import { hydrateCharacterForm } from "./hydrate-character-form";
import { applyAcceptedCharacterProposal } from "./review-character-proposal";
import { markCreatorEdit } from "./review-character-proposal";
import { characterProfileProvenancePatch } from "../repositories/character.mapper";

const source = { screenplayId: "script-1", revisionId: "revision-3", screenplayTitle: "A Canvas in Rain", screenplayVersion: 3 };

describe("Character AI profile workflow", () => {
  it("validates aliases and accepts arbitrary character names", () => {
    const result = parseCharacterAIProfile({
      characterName: "Ayo",
      fields: { "Eye Color": "Hazel", hair_color: "Black", occupation: "Unknown", role: "protagonist", inventedField: "ignored" },
      fieldEvidence: { eye_color: "Ayo studies a reflection.", hairColor: "Ayo's hair is wet." },
    });
    assert.equal(result.fields.eyeColor, "Hazel");
    assert.equal(result.fields.hairColor, "Black");
    assert.equal(result.fields.role, "lead");
    assert.equal(result.fields.occupation, undefined);
    assert.equal((result.fields as Record<string, unknown>).inventedField, undefined);
    assert.equal(result.fieldEvidence.eyeColor, "Ayo studies a reflection.");
  });

  it("leaves unsupported sparse fields empty and calculates actual completion", () => {
    const result = parseCharacterAIProfile({ fields: { biography: "Ayo waits at the station." }, fieldEvidence: { biography: "Ayo waits at the station." } });
    assert.deepEqual(result.fields, { biography: "Ayo waits at the station." });
    const form = hydrateCharacterForm({ name: "Ayo", biography: result.fields.biography, personality: "Unknown", progress: 99 });
    assert.equal(form.progress, calculateCharacterProgress({ biography: result.fields.biography }));
    assert.equal(isExtractionStub("Appears in screenplay with 2 dialogue cues."), true);
  });

  it("preserves existing values unless explicitly reviewed, and records provenance", () => {
    const existing = { name: "Ayo", occupation: "Architect", biography: "Creator-written." };
    const proposal = {
      fields: { occupation: "Courier", biography: "Ayo carries messages.", personality: "Observant." },
      fieldEvidence: { occupation: "Ayo reports for a courier shift.", biography: "Ayo carries an envelope.", personality: "Ayo studies each person." },
      source,
    };
    const rejected = applyAcceptedCharacterProposal(existing, proposal, [], "2026-09-28T01:00:00.000Z");
    assert.equal(rejected.occupation, undefined);
    assert.equal(rejected.profileProvenance, undefined);
    const accepted = applyAcceptedCharacterProposal(existing, proposal, ["biography", "personality"], "2026-09-28T01:00:00.000Z");
    assert.equal(accepted.biography, proposal.fields.biography);
    assert.equal(accepted.occupation, undefined);
    assert.equal(accepted.profileProvenance?.biography?.source.revisionId, source.revisionId);
    assert.equal(accepted.profileProvenance?.biography?.source.evidence, proposal.fieldEvidence.biography);
    const edited = markCreatorEdit(accepted.profileProvenance, "biography", "Creator edited this draft.");
    assert.equal(edited?.biography?.editedByCreator, true);
    const row = characterProfileProvenancePatch(accepted.profileProvenance);
    assert.equal(row.profile_provenance?.biography?.source.screenplayId, source.screenplayId);
  });

  it("permits a deliberate replacement of a populated creator field", () => {
    const proposal = { fields: { occupation: "Courier" }, fieldEvidence: { occupation: "Ayo reports for work." }, source };
    const accepted = applyAcceptedCharacterProposal({ occupation: "Architect" }, proposal, ["occupation"], "2026-09-28T01:00:00.000Z");
    assert.equal(accepted.occupation, "Courier");
  });
});
