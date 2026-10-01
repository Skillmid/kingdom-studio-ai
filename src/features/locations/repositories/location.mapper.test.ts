import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fromLocationDatabase,
  toLocationInsert,
  toLocationUpdate,
  type LocationRow,
} from "./location.mapper";

const productionId = "11111111-1111-4111-8111-111111111111";

describe("location persistence mapping", () => {
  it("maps the canonical location model to and from database rows", () => {
    const input = {
      productionId,
      name: "Main House",
      setting: "interior" as const,
      timePeriod: "Contemporary",
      weather: "Rainy season",
      architecture: "Concrete urban home",
      lighting: "Cool window light",
      mood: "Quiet and tense",
      status: "draft" as const,
      progress: 0,
    };
    const insert = toLocationInsert(input);

    assert.deepEqual(insert, {
      production_id: productionId,
      name: "Main House",
      description: undefined,
      setting: "interior",
      time_period: "Contemporary",
      weather: "Rainy season",
      architecture: "Concrete urban home",
      lighting: "Cool window light",
      mood: "Quiet and tense",
      notes: undefined,
      status: "draft",
      progress: 0,
    });

    const row: LocationRow = {
      id: "22222222-2222-4222-8222-222222222222",
      production_id: productionId,
      name: "Main House",
      description: null,
      setting: "interior",
      time_period: "Contemporary",
      weather: "Rainy season",
      architecture: "Concrete urban home",
      lighting: "Cool window light",
      mood: "Quiet and tense",
      notes: null,
      status: "draft",
      progress: 0,
      created_at: "2026-09-30T00:00:00.000Z",
      updated_at: "2026-09-30T00:00:00.000Z",
    };

    assert.deepEqual(fromLocationDatabase(row), {
      id: row.id,
      productionId,
      name: "Main House",
      description: undefined,
      setting: "interior",
      timePeriod: "Contemporary",
      weather: "Rainy season",
      architecture: "Concrete urban home",
      lighting: "Cool window light",
      mood: "Quiet and tense",
      notes: undefined,
      status: "draft",
      progress: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it("preserves omitted fields in partial updates and never updates production ownership", () => {
    assert.deepEqual(toLocationUpdate({ name: "Renamed House" }), {
      name: "Renamed House",
    });
    assert.deepEqual(toLocationUpdate({ timePeriod: "Contemporary" }), {
      time_period: "Contemporary",
    });
    assert.deepEqual(toLocationUpdate({ progress: 0, notes: "Updated notes" }), {
      notes: "Updated notes",
      progress: 0,
    });
    assert.deepEqual(toLocationUpdate({}), {});
  });
});