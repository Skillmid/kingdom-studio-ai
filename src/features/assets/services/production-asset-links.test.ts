import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { productionAssetDestinations } from "./production-asset-links";

describe("productionAssetDestinations", () => {
  it("links active productions to their production-scoped asset workspaces", () => {
    const result = productionAssetDestinations([
      { id: "a-1", title: "A Story", deleted_at: null },
      { id: "b 2", title: "Another Story", deleted_at: null },
      { id: "archived", title: "Archived Story", deleted_at: "2026-01-01" },
    ]);

    assert.deepEqual(result, [
      { id: "a-1", title: "A Story", href: "/studio/productions/a-1/assets" },
      { id: "b 2", title: "Another Story", href: "/studio/productions/b%202/assets" },
    ]);
  });
});
