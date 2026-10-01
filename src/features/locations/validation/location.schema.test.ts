import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { locationSchema } from "./location.schema";

const baseLocation = {
  productionId: "11111111-1111-4111-8111-111111111111",
  name: "Main House",
};

describe("location environment validation", () => {
  it("accepts and trims the five optional environment fields", () => {
    const result = locationSchema.parse({
      ...baseLocation,
      timePeriod: " Contemporary ",
      weather: " Rainy season ",
      architecture: " Concrete urban home ",
      lighting: " Cool window light ",
      mood: " Quiet and tense ",
    });

    assert.equal(result.timePeriod, "Contemporary");
    assert.equal(result.weather, "Rainy season");
    assert.equal(result.architecture, "Concrete urban home");
    assert.equal(result.lighting, "Cool window light");
    assert.equal(result.mood, "Quiet and tense");
  });

  it("keeps environment fields optional for existing and screenplay-created locations", () => {
    const result = locationSchema.parse(baseLocation);

    assert.equal(result.timePeriod, undefined);
    assert.equal(result.weather, undefined);
    assert.equal(result.architecture, undefined);
    assert.equal(result.lighting, undefined);
    assert.equal(result.mood, undefined);
  });

  it("rejects non-text environment values", () => {
    const result = locationSchema.safeParse({ ...baseLocation, weather: 12 });
    assert.equal(result.success, false);
  });
});