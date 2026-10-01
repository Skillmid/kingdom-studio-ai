import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterLocationReferenceAssets,
  getLocationReferenceLibraryState,
} from "./location-reference-assets";
import type { Asset } from "../types/asset";

function makeAsset(overrides: Partial<Asset>): Asset {
  return {
    id: "asset-1",
    productionId: "production-1",
    kind: "location-reference",
    sourceKind: "location",
    provenance: "user",
    userApproved: true,
    status: "ready",
    progress: 100,
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("location-reference asset filtering", () => {
  it("returns references for the requested location and production", () => {
    const expected = makeAsset({ id: "match", locationId: "location-1", fileUrl: "https://assets.test/house.jpg" });
    assert.deepEqual(
      filterLocationReferenceAssets([expected], "production-1", "location-1"),
      [expected],
    );
  });

  it("excludes references belonging to another location", () => {
    const asset = makeAsset({ id: "other-location", locationId: "location-2" });
    assert.deepEqual(filterLocationReferenceAssets([asset], "production-1", "location-1"), []);
  });

  it("excludes references belonging to another production", () => {
    const asset = makeAsset({ productionId: "production-2", locationId: "location-1" });
    assert.deepEqual(filterLocationReferenceAssets([asset], "production-1", "location-1"), []);
  });

  it("excludes assets that are not location-reference assets", () => {
    const asset = makeAsset({ kind: "image", locationId: "location-1" });
    assert.deepEqual(filterLocationReferenceAssets([asset], "production-1", "location-1"), []);
  });

  it("selects the empty reference-library state when there are no assets", () => {
    assert.deepEqual(getLocationReferenceLibraryState([]), { kind: "empty" });
  });
});