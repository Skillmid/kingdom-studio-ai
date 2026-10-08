import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCreativePromptDirective,
  getProductionCreativeDNA,
  isStandardVisualFormat,
  isValidAspectRatio,
  normalizeAspectRatio,
  resolveAspectRatioOption,
} from "./production-creative-dna";

describe("production creative DNA", () => {
  it("normalizes standard aspect ratios", () => {
    assert.equal(normalizeAspectRatio("16:9"), "16:9");
    assert.equal(normalizeAspectRatio("2.39:1"), "2.39:1");
    assert.equal(normalizeAspectRatio("4:3"), "4:3");
    assert.equal(normalizeAspectRatio("9:16"), "9:16");
    assert.equal(normalizeAspectRatio("1:1"), "1:1");
  });

  it("defaults invalid or missing aspect ratio to 16:9", () => {
    assert.equal(normalizeAspectRatio(null), "16:9");
    assert.equal(normalizeAspectRatio(""), "16:9");
    assert.equal(normalizeAspectRatio("   "), "16:9");
    assert.equal(normalizeAspectRatio("invalid-ratio"), "16:9");
  });

  it("validates aspect ratio format correctly", () => {
    assert.equal(isValidAspectRatio("16:9"), true);
    assert.equal(isValidAspectRatio("2.39:1"), true);
    assert.equal(isValidAspectRatio("1.85:1"), true);
    assert.equal(isValidAspectRatio("not-a-ratio"), false);
  });

  it("resolves aspect ratio options with descriptions", () => {
    const scopeOption = resolveAspectRatioOption("2.39:1");
    assert.equal(scopeOption.value, "2.39:1");
    assert.equal(scopeOption.label, "2.39:1");
    assert.equal(scopeOption.ratioWidth, 239);

    const fallbackOption = resolveAspectRatioOption("invalid");
    assert.equal(fallbackOption.value, "16:9");
  });

  it("identifies standard visual formats and custom formats", () => {
    assert.equal(isStandardVisualFormat("Live Action / Photorealistic"), true);
    assert.equal(isStandardVisualFormat("2D Animation"), true);
    assert.equal(isStandardVisualFormat("3D Animation"), true);
    assert.equal(isStandardVisualFormat("Custom Cyberpunk Noir"), false);
    assert.equal(isStandardVisualFormat(null), false);
  });

  it("derives production creative DNA from production record", () => {
    const dna = getProductionCreativeDNA({
      art_style: "Cinematic Realism",
      aspect_ratio: "2.39:1",
    });

    assert.equal(dna.artStyle, "Cinematic Realism");
    assert.equal(dna.aspectRatio, "2.39:1");
    assert.equal(dna.isCustomStyle, false);
    assert.equal(
      dna.directiveText,
      "Visual Style: Cinematic Realism • Framing: 2.39:1",
    );
  });

  it("handles production with unset art_style cleanly", () => {
    const dna = getProductionCreativeDNA({
      art_style: null,
      aspect_ratio: "16:9",
    });

    assert.equal(dna.artStyle, null);
    assert.equal(dna.aspectRatio, "16:9");
    assert.equal(dna.isCustomStyle, false);
    assert.equal(dna.directiveText, "Framing: 16:9");
  });

  it("formats creative prompt directives for downstream planning", () => {
    const directive = formatCreativePromptDirective({
      artStyle: "3D Animation",
      aspectRatio: "16:9",
    });

    assert.equal(
      directive,
      "[Creative Direction: Visual style: 3D Animation, Framing: 16:9]",
    );
  });

  it("returns undefined directive when style and framing are empty", () => {
    const emptyDirective = formatCreativePromptDirective({
      artStyle: null,
      aspectRatio: "",
    });

    assert.equal(emptyDirective, undefined);
  });
});

