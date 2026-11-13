import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applySelectedProposalFields,
  defaultProposalSelection,
  effectiveProposalSelection,
  reviewProposalFields,
} from "./story-bible-proposal-merge";

const form = { title: "My Title", logline: "", theme: "Grace", duration_minutes: 10, genre: "" };

describe("story bible proposal merge", () => {
  it("classifies fields as fill, conflict or same and ignores unknown/empty values", () => {
    const reviews = reviewProposalFields(form, {
      title: "AI Title",
      logline: "A boy finds a bus.",
      theme: "Grace",
      unknown_field: "x",
      genre: "  ",
    });
    assert.deepEqual(
      reviews.map((review) => [review.key, review.status]),
      [["title", "conflict"], ["logline", "fill"], ["theme", "same"]],
    );
  });

  it("selects only empty fields by default", () => {
    const reviews = reviewProposalFields(form, { title: "AI Title", logline: "A boy finds a bus." });
    assert.deepEqual([...defaultProposalSelection(reviews)], ["logline"]);
  });

  it("never overwrites a non-empty creator value without an explicit selection", () => {
    const proposal = { title: "AI Title", logline: "A boy finds a bus.", duration_minutes: 25 };
    const reviews = reviewProposalFields(form, proposal);
    const applied = applySelectedProposalFields(form, proposal, defaultProposalSelection(reviews));
    assert.equal(applied.title, "My Title");
    assert.equal(applied.logline, "A boy finds a bus.");
    assert.equal(applied.duration_minutes, 10);
  });

  it("replaces a creator value only when that field is chosen, keeping number types", () => {
    const proposal = { title: "AI Title", duration_minutes: 25 };
    const applied = applySelectedProposalFields(form, proposal, new Set(["duration_minutes"]));
    assert.equal(applied.title, "My Title");
    assert.equal(applied.duration_minutes, 25);
  });

  it("does not mutate the current form", () => {
    const current = { ...form };
    applySelectedProposalFields(current, { logline: "New" }, new Set(["logline"]));
    assert.equal(current.logline, "");
  });

  it("layers explicit choices over the default and re-evaluates against the live form", () => {
    const proposal = { title: "AI Title", logline: "A boy finds a bus." };
    const choices = { title: true };
    assert.deepEqual([...effectiveProposalSelection(reviewProposalFields(form, proposal), choices)].sort(), ["logline", "title"]);
    assert.deepEqual([...effectiveProposalSelection(reviewProposalFields(form, proposal), { logline: false })], []);
    // The creator fills logline while the proposal is open: it is no longer pre-selected.
    const edited = { ...form, logline: "Creator logline" };
    const applied = applySelectedProposalFields(
      edited,
      proposal,
      effectiveProposalSelection(reviewProposalFields(edited, proposal), {}),
    );
    assert.equal(applied.logline, "Creator logline");
  });
});
