import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { storyboardPanelSchema } from "./storyboard-panel.schema";

describe("storyboardPanelSchema", () => {
  it("accepts a generic valid panel", () => {
    const result = storyboardPanelSchema.safeParse({
      productionId: "11111111-1111-4111-8111-111111111111",
      shotId: "22222222-2222-4222-8222-222222222222",
      panelNumber: 1,
      title: "Harbour gate",
      visualDescription: "Dawn over the dock rail.",
    });

    assert.equal(result.success, true);
  });

  it("rejects an invalid panel number", () => {
    const result = storyboardPanelSchema.safeParse({
      productionId: "not-a-uuid",
      panelNumber: 0,
    });

    assert.equal(result.success, false);
  });
});
