import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planAssetsFromProduction, selectNewAssetProposals } from "./asset-planner";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";

describe("planAssetsFromProduction", () => {
  it("plans generic character and location references from arbitrary records", () => {
    const proposals = planAssetsFromProduction({
      productionId: PRODUCTION_ID,
      characters: [{ id: "22222222-2222-4222-8222-222222222222", name: "Harbour Clerk", appearance: "salt-stained coat" }],
      locations: [{ id: "33333333-3333-4333-8333-333333333333", name: "Harbour Gate", description: "Stone arch over the morning tide." }],
    });
    assert.equal(proposals.length, 2);
    assert.equal(proposals[0]?.kind, "character-reference");
    assert.equal(proposals[1]?.kind, "location-reference");
    assert.equal(proposals.every((item) => item.provenance === "production-derived"), true);
    assert.equal(proposals.some((item) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(item))), false);
  });

  it("skips shots and panels that have no grounded visual evidence", () => {
    const proposals = planAssetsFromProduction({
      productionId: PRODUCTION_ID,
      shots: [{ id: "44444444-4444-4444-8444-444444444444", shotNumber: 1 }],
      panels: [{ id: "55555555-5555-4555-8555-555555555555", panelNumber: 1 }],
    });
    assert.deepEqual(proposals, []);
  });

  it("incorporates canonical creative DNA into planned asset prompts when provided", () => {
    const proposals = planAssetsFromProduction({
      productionId: PRODUCTION_ID,
      artStyle: "Cinematic Realism",
      aspectRatio: "2.39:1",
      characters: [{ id: "22222222-2222-4222-8222-222222222222", name: "Harbour Clerk", appearance: "salt-stained coat" }],
      locations: [{ id: "33333333-3333-4333-8333-333333333333", name: "Harbour Gate", description: "Stone arch over the morning tide." }],
    });
    assert.equal(proposals.length, 2);
    assert.match(
      proposals[0]?.prompt ?? "",
      /\[Creative Direction: Visual style: Cinematic Realism, Framing: 2\.39:1\]/,
    );
    assert.match(
      proposals[1]?.prompt ?? "",
      /\[Creative Direction: Visual style: Cinematic Realism, Framing: 2\.39:1\]/,
    );
  });
});

describe("selectNewAssetProposals", () => {
  it("does not recreate an existing source asset or an approved title", () => {
    const proposals = planAssetsFromProduction({
      productionId: PRODUCTION_ID,
      characters: [
        { id: "22222222-2222-4222-8222-222222222222", name: "Harbour Clerk" },
        { id: "77777777-7777-4777-8777-777777777777", name: "Ledger Keeper" },
      ],
    });
    const selected = selectNewAssetProposals(proposals, [
      { sourceKind: "character", sourceId: "22222222-2222-4222-8222-222222222222", title: "Harbour Clerk reference", kind: "character-reference", userApproved: false, provenance: "production-derived" },
      { sourceKind: "user", title: "Ledger Keeper reference", kind: "image", userApproved: true, provenance: "user" },
    ]);
    assert.equal(selected.length, 0);
  });
});
