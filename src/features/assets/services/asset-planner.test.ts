import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateAssetProgress } from "./asset-completion";
import {
  planAssetsFromProduction,
  selectNewAssetProposals,
  type AssetCharacterInput,
  type AssetLocationInput,
  type AssetPanelInput,
  type AssetShotInput,
} from "./asset-planner";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCENE_ID = "33333333-3333-4333-8333-333333333333";
const LOCATION_ID = "44444444-4444-4444-8444-444444444444";
const OPERATOR_ID = "99999999-9999-4999-8999-999999999999";
const CLERK_ID = "88888888-8888-4888-8888-888888888888";
const SHOT_ID = "22222222-2222-4222-8222-222222222222";
const PANEL_ID = "66666666-6666-4666-8666-666666666666";

function character(partial: Partial<AssetCharacterInput> & Pick<AssetCharacterInput, "id" | "name">): AssetCharacterInput {
  return { productionId: PRODUCTION_ID, ...partial };
}
function location(partial: Partial<AssetLocationInput> & Pick<AssetLocationInput, "id" | "name">): AssetLocationInput {
  return { productionId: PRODUCTION_ID, ...partial };
}
function shot(partial: Partial<AssetShotInput> & Pick<AssetShotInput, "id" | "shotNumber">): AssetShotInput {
  return { productionId: PRODUCTION_ID, ...partial };
}
function panel(partial: Partial<AssetPanelInput> & Pick<AssetPanelInput, "id" | "panelNumber">): AssetPanelInput {
  return { productionId: PRODUCTION_ID, ...partial };
}

describe("planAssetsFromProduction", () => {
  it("creates reference assets from persisted characters and locations only", () => {
    const assets = planAssetsFromProduction({
      characters: [character({ id: OPERATOR_ID, name: "Radio operator", appearance: "narrow face, wool jumper", hairColor: "grey" })],
      locations: [location({ id: LOCATION_ID, name: "Radio booth", description: "A cramped cabin with a scratched mixer.", setting: "interior" })],
    });
    assert.equal(assets.length, 2);
    assert.equal(assets[0]?.assetType, "character-reference");
    assert.equal(assets[0]?.characterId, OPERATOR_ID);
    assert.match(assets[0]?.description ?? "", /wool jumper/i);
    assert.equal(assets[1]?.assetType, "location-reference");
    assert.equal(assets[1]?.locationId, LOCATION_ID);
    assert.equal(assets[0]?.fileUrl, undefined);
    assert.equal(assets[0]?.userApproved, false);
    assert.equal(assets[0]?.provenance, "production-derived");
    assert.equal(assets[0]?.progress, calculateAssetProgress(assets[0]));
    assert.equal(assets.some((asset) => /Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(asset))), false);
  });

  it("creates still and plate assets from shots and storyboard panels", () => {
    const assets = planAssetsFromProduction({
      shots: [shot({
        id: SHOT_ID, sceneId: SCENE_ID, shotNumber: 1, shotCode: "2A", subject: "Radio operator",
        visualDescription: "Operator leans into the microphone.",
        generationPrompt: "CU of the operator leaning into the microphone.",
        characterIds: [OPERATOR_ID], locationId: LOCATION_ID,
      })],
      panels: [panel({
        id: PANEL_ID, sceneId: SCENE_ID, shotId: SHOT_ID, panelNumber: 1, title: "2A",
        visualDescription: "Operator leans into the microphone.", composition: "CU · close-up",
        generationPrompt: "CU of the operator leaning into the microphone.",
        characterIds: [OPERATOR_ID], locationId: LOCATION_ID,
      })],
    });
    const plate = assets.find((asset) => asset.assetType === "shot-plate");
    const still = assets.find((asset) => asset.assetType === "storyboard-still");
    assert.ok(plate);
    assert.ok(still);
    assert.equal(plate.shotId, SHOT_ID);
    assert.equal(still.panelId, PANEL_ID);
    assert.match(plate.generationPrompt ?? "", /microphone/i);
    assert.equal(still.fileUrl, undefined);
    assert.equal(/Michael|Esther|Tunde|Kunle|The Message/i.test(JSON.stringify(assets)), false);
  });

  it("does not invent media or unused character facts when records are sparse", () => {
    const assets = planAssetsFromProduction({
      characters: [character({ id: CLERK_ID, name: "Harbour clerk" })],
      shots: [shot({ id: SHOT_ID, shotNumber: 8, subject: "Empty quay" })],
    });
    assert.equal(assets.every((asset) => !asset.fileUrl), true);
    assert.equal(assets.some((asset) => /invented|guess|probably/i.test(JSON.stringify(asset))), false);
    assert.equal(assets.some((asset) => asset.characterId === OPERATOR_ID), false);
  });
});

describe("selectNewAssetProposals", () => {
  it("does not duplicate a source entity that already has an asset", () => {
    const proposals = planAssetsFromProduction({ characters: [character({ id: OPERATOR_ID, name: "Radio operator" })] });
    const selected = selectNewAssetProposals(proposals, [{
      assetType: "character-reference", characterId: OPERATOR_ID, title: "Radio operator reference",
      userApproved: true, provenance: "user",
    }]);
    assert.equal(selected.length, 0);
  });

  it("keeps filmmaker-owned assets and still adds uncovered sources", () => {
    const proposals = planAssetsFromProduction({ locations: [location({ id: LOCATION_ID, name: "Radio booth" })] });
    const selected = selectNewAssetProposals(proposals, [{
      assetType: "prop", title: "Ledger book scan", userApproved: true, provenance: "user",
    }]);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.locationId, LOCATION_ID);
  });
});
