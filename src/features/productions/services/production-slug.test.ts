import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createProductionSlug,
  createWithUniqueSlug,
  isSlugUniqueViolation,
  MAX_SLUG_BASE_LENGTH,
  MAX_SLUG_INSERT_ATTEMPTS,
  randomSlugSuffix,
  slugBase,
} from "./production-slug";

describe("production slugs", () => {
  it("folds accents instead of dropping letters", () => {
    assert.equal(slugBase("Adébáyọ̀'s Journey"), "adebayo-s-journey");
    assert.equal(slugBase("Crème Brûlée"), "creme-brulee");
  });

  it("keeps non-Latin titles and never returns an empty slug", () => {
    assert.equal(slugBase("天国の門"), "天国の門");
    assert.equal(slugBase("!!!"), "production");
    assert.equal(slugBase("   "), "production");
  });

  it("collapses separators and trims length", () => {
    assert.equal(slugBase("  The  Last -- Bus!  "), "the-last-bus");
    assert.ok(slugBase("a".repeat(200)).length <= MAX_SLUG_BASE_LENGTH);
    assert.equal(slugBase(`${"a".repeat(59)} b`).endsWith("-"), false);
  });

  it("appends a short random suffix so identical titles do not collide", () => {
    assert.equal(createProductionSlug("The Last Bus", "abc123"), "the-last-bus-abc123");
    const suffix = randomSlugSuffix();
    assert.match(suffix, /^[a-z0-9]{6}$/);
    const fixed = randomSlugSuffix((array) => array.fill(0));
    assert.equal(fixed, "aaaaaa");
    assert.notEqual(createProductionSlug("Same"), createProductionSlug("Same"));
  });
});

describe("production slugs (v2 brief cases)", () => {
  it("normal title", () => {
    assert.equal(createProductionSlug("The River Crossing", "k3m9q2"), "the-river-crossing-k3m9q2");
  });

  it("duplicate titles share a base but get different random suffixes", () => {
    assert.equal(slugBase("Kingdom Come"), slugBase("Kingdom Come"));
    const slugs = new Set(Array.from({ length: 50 }, () => createProductionSlug("Kingdom Come")));
    assert.equal(slugs.size, 50);
    for (const slug of slugs) assert.match(slug, /^kingdom-come-[a-z0-9]{6}$/);
  });

  it("emoji-only title never produces an empty slug", () => {
    assert.equal(slugBase("🎬🎥✨"), "production");
    assert.match(createProductionSlug("🎬🎥✨"), /^production-[a-z0-9]{6}$/);
  });

  it("accented title folds accents", () => {
    assert.equal(slugBase("Àṣẹ: Ọ̀rọ̀ Ìyá"), "ase-oro-iya");
    assert.equal(slugBase("Ñandú São Paulo"), "nandu-sao-paulo");
  });

  it("empty and whitespace titles fall back to 'production'", () => {
    assert.equal(slugBase(""), "production");
    assert.equal(slugBase(" \t\n "), "production");
  });

  it("slug base is deterministic", () => {
    const title = "Adébáyọ̀'s  Last -- Light!";
    assert.equal(slugBase(title), slugBase(title));
    assert.equal(createProductionSlug(title, "aaaaaa"), createProductionSlug(title, "aaaaaa"));
  });
});

describe("slug collision retry (v2)", () => {
  const slugViolation = () =>
    Object.assign(new Error('23505 | duplicate key value violates unique constraint "productions_slug_key" | Key (slug)=(x) already exists.'), {
      code: "23505",
      details: "Key (slug)=(x) already exists.",
    });

  it("recognises only a unique violation on the slug", () => {
    assert.equal(isSlugUniqueViolation(slugViolation()), true);
    assert.equal(isSlugUniqueViolation({ code: "23505", message: 'duplicate key value violates unique constraint "productions_pkey"', details: "Key (id)=(1) already exists." }), false);
    assert.equal(isSlugUniqueViolation({ code: "42501", message: "permission denied for slug" }), false);
    assert.equal(isSlugUniqueViolation(new Error("network")), false);
    assert.equal(isSlugUniqueViolation(null), false);
  });

  it("retries a slug collision with a fresh suffix and succeeds", async () => {
    const suffixes = ["aaaaaa", "bbbbbb", "cccccc"];
    const attempted: string[] = [];
    const created = await createWithUniqueSlug(
      "Same Title",
      async (slug) => {
        attempted.push(slug);
        if (attempted.length === 1) throw slugViolation();
        return { slug };
      },
      { suffix: () => suffixes.shift()! },
    );
    assert.deepEqual(attempted, ["same-title-aaaaaa", "same-title-bbbbbb"]);
    assert.equal(created.slug, "same-title-bbbbbb");
  });

  it("does not retry a non-slug 23505 or any other error", async () => {
    for (const error of [
      Object.assign(new Error('duplicate key value violates unique constraint "productions_pkey"'), { code: "23505", details: "Key (id)=(1) already exists." }),
      Object.assign(new Error("new row violates row-level security policy"), { code: "42501" }),
    ]) {
      let calls = 0;
      await assert.rejects(
        createWithUniqueSlug("T", async () => {
          calls += 1;
          throw error;
        }),
        (thrown) => thrown === error,
      );
      assert.equal(calls, 1);
    }
  });

  it("stops after the retry limit and surfaces the last collision", async () => {
    let calls = 0;
    await assert.rejects(
      createWithUniqueSlug("T", async () => {
        calls += 1;
        throw slugViolation();
      }),
      /productions_slug_key/,
    );
    assert.equal(calls, MAX_SLUG_INSERT_ATTEMPTS);
    assert.equal(MAX_SLUG_INSERT_ATTEMPTS, 3);
  });
});
