import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLocationDetailFields } from "./location-detail-model";
import type { Location } from "../types/location";

const location: Location = {
  id: "location-1",
  productionId: "production-1",
  name: "Main House",
  description: "Family home interior.",
  setting: "interior",
  timePeriod: "Contemporary",
  weather: "Rainy season",
  architecture: "Concrete urban home",
  lighting: "Cool window light",
  mood: "Quiet and tense",
  notes: "Appears in two scenes.",
  status: "in-progress",
  progress: 45,
  createdAt: "2026-09-30T00:00:00.000Z",
  updatedAt: "2026-09-30T01:00:00.000Z",
};

describe("Location Bible detail fields", () => {
  it("formats the canonical location fields for read-only display", () => {
    assert.deepEqual(getLocationDetailFields(location), {
      setting: "Interior",
      status: "In Progress",
      progress: 45,
      description: "Family home interior.",
      notes: "Appears in two scenes.",
      timePeriod: "Contemporary",
      weather: "Rainy season",
      architecture: "Concrete urban home",
      lighting: "Cool window light",
      mood: "Quiet and tense",
    });
  });

  it("uses explicit fallbacks when optional detail fields are empty", () => {
    assert.deepEqual(
      getLocationDetailFields({
        ...location,
        description: " ",
        notes: undefined,
        timePeriod: undefined,
        weather: undefined,
        architecture: undefined,
        lighting: undefined,
        mood: undefined,
      }),
      {
        setting: "Interior",
        status: "In Progress",
        progress: 45,
        description: "No location description yet.",
        notes: "No production notes yet.",
        timePeriod: "Not defined yet.",
        weather: "Not defined yet.",
        architecture: "Not defined yet.",
        lighting: "Not defined yet.",
        mood: "Not defined yet.",
      },
    );
  });
});