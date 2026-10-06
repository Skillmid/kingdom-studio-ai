import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Asset } from "@/features/assets/types/asset";
import {
  buildCharacterReferenceProposal,
  filterCharacterReferenceAssets,
  getCharacterReferenceLibraryState,
} from "./character-reference-assets";

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    id: "asset-1",
    productionId: "production-1",
    characterId: "character-1",
    kind: "character-reference",
    sourceKind: "character",
    provenance: "user",
    userApproved: true,
    status: "ready",
    progress: 100,
    createdAt: "2026-10-06T00:00:00.000Z",
    updatedAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("character-reference asset filtering", () => {
  it("returns references for the requested character and production", () => {
    const expected = makeAsset({
      id: "match",
      characterId: "char-1",
      fileUrl: "https://assets.test/portrait.jpg",
    });

    assert.deepEqual(
      filterCharacterReferenceAssets([expected], "production-1", "char-1"),
      [expected],
    );
  });

  it("excludes references belonging to another character", () => {
    const asset = makeAsset({ id: "other-char", characterId: "char-2" });
    assert.deepEqual(
      filterCharacterReferenceAssets([asset], "production-1", "char-1"),
      [],
    );
  });

  it("excludes references belonging to another production", () => {
    const asset = makeAsset({
      productionId: "production-2",
      characterId: "char-1",
    });
    assert.deepEqual(
      filterCharacterReferenceAssets([asset], "production-1", "char-1"),
      [],
    );
  });

  it("excludes assets that are not character-reference assets", () => {
    const asset = makeAsset({
      kind: "location-reference",
      characterId: "char-1",
    });
    assert.deepEqual(
      filterCharacterReferenceAssets([asset], "production-1", "char-1"),
      [],
    );
  });

  it("returns empty library state when no assets exist", () => {
    assert.deepEqual(getCharacterReferenceLibraryState([]), { kind: "empty" });
  });

  it("derives approved, pending, and primary reference from asset list", () => {
    const pending = makeAsset({
      id: "pending-1",
      userApproved: false,
      status: "draft",
    });
    const approved = makeAsset({
      id: "approved-1",
      userApproved: true,
      fileUrl: "https://assets.test/hero.png",
    });

    const state = getCharacterReferenceLibraryState([pending, approved]);
    assert.equal(state.kind, "assets");
    if (state.kind === "assets") {
      assert.equal(state.approvedCount, 1);
      assert.equal(state.pendingCount, 1);
      assert.equal(state.primaryApproved?.id, "approved-1");
    }
  });

  it("builds a grounded character reference proposal", () => {
    const proposal = buildCharacterReferenceProposal({
      productionId: "prod-1",
      characterId: "char-1",
      characterName: "Elijah",
      title: "Desert Robes Stills",
      description: "Tall prophet in rough linen garments",
      prompt: "Cinematic portrait of Elijah in rough linen garments, desert setting",
      sourceEvidence: "ELIJAH: The Lord lives",
      userApproved: false,
    });

    assert.equal(proposal.productionId, "prod-1");
    assert.equal(proposal.characterId, "char-1");
    assert.equal(proposal.kind, "character-reference");
    assert.equal(proposal.title, "Desert Robes Stills");
    assert.equal(proposal.description, "Tall prophet in rough linen garments");
    assert.equal(proposal.userApproved, false);
    assert.equal(proposal.status, "draft");
    assert.equal(proposal.provenance, "production-derived");
  });

  it("builds a ready proposal when a file URL is provided", () => {
    const proposal = buildCharacterReferenceProposal({
      productionId: "prod-1",
      characterId: "char-1",
      characterName: "Elijah",
      fileUrl: "https://cdn.example.com/elijah.png",
      userApproved: true,
    });

    assert.equal(proposal.fileUrl, "https://cdn.example.com/elijah.png");
    assert.equal(proposal.userApproved, true);
    assert.equal(proposal.status, "ready");
    assert.equal(proposal.provenance, "user");
  });
});

