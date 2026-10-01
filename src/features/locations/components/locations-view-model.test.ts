import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterLocations } from "./locations-view-model";
import type { Location } from "../types/location";

const locations: Location[] = [
  {
    id: "location-interior",
    productionId: "production-1",
    name: "Main House",
    description: "Family home interior",
    setting: "interior",
    status: "in-progress",
    progress: 40,
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
  },
  {
    id: "location-exterior",
    productionId: "production-1",
    name: "Old Railway Station",
    notes: "Appears in 2 scenes",
    setting: "exterior",
    status: "draft",
    progress: 10,
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
  },
];

describe("Locations list filtering", () => {
  it("searches extracted names and notes without case sensitivity", () => {
    assert.deepEqual(
      filterLocations(locations, "  RAILWAY  ", "all").map(({ id }) => id),
      ["location-exterior"]
    );
    assert.deepEqual(
      filterLocations(locations, "2 scenes", "all").map(({ id }) => id),
      ["location-exterior"]
    );
  });

  it("combines search and setting/status filters and returns no matches distinctly", () => {
    assert.deepEqual(
      filterLocations(locations, "family", "in-progress").map(({ id }) => id),
      ["location-interior"]
    );
    assert.deepEqual(filterLocations(locations, "missing", "all"), []);
  });
});