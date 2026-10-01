import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planScreenplayLocationCreates } from "./screenplay-location-sync";
import type { Location } from "../types/location";

const productionId = "11111111-1111-4111-8111-111111111111";
const now = "2026-09-30T00:00:00.000Z";

const existingLocation: Location = {
  id: "22222222-2222-4222-8222-222222222222",
  productionId,
  name: "Main House",
  setting: "interior",
  timePeriod: "Contemporary",
  weather: "Rainy season",
  architecture: "Concrete urban home",
  lighting: "Cool window light",
  mood: "Quiet and tense",
  status: "in-progress",
  progress: 65,
  createdAt: now,
  updatedAt: now,
};

describe("screenplay location sync planning", () => {
  it("leaves environment fields unset for new screenplay-derived locations", () => {
    const planned = planScreenplayLocationCreates(productionId, [
      {
        name: "Street",
        setting: "exterior",
        occurrences: 2,
        sourceHeading: "EXT. STREET - EVENING",
      },
    ], []);

    assert.equal(planned.length, 1);
    assert.equal(planned[0]?.name, "Street");
    assert.equal(planned[0]?.setting, "exterior");
    assert.equal(planned[0]?.description, "Extracted from screenplay scene heading: EXT. STREET - EVENING");
    assert.equal(planned[0]?.timePeriod, undefined);
    assert.equal(planned[0]?.weather, undefined);
    assert.equal(planned[0]?.architecture, undefined);
    assert.equal(planned[0]?.lighting, undefined);
    assert.equal(planned[0]?.mood, undefined);
  });

  it("does not plan an update for a matched location with creator-authored environment fields", () => {
    const before = structuredClone(existingLocation);
    const planned = planScreenplayLocationCreates(productionId, [
      {
        name: "  MAIN HOUSE ",
        setting: "exterior",
        occurrences: 5,
        sourceHeading: "EXT. MAIN HOUSE - DAY",
      },
    ], [existingLocation]);

    assert.deepEqual(planned, []);
    assert.deepEqual(existingLocation, before);
  });
});