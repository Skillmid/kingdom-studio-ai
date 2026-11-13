import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { StoryBibleRepository } from "./story-bible.repository";
import type { StoryBible } from "../types/story-bible";
import type { StoryBibleDTO } from "../validation/story-bible.schema";

const PRODUCTION_ID = "55555555-5555-4555-8555-555555555555";
const BIBLE_ID = "66666666-6666-4666-8666-666666666666";
const NOW = "2026-10-13T10:00:00.000Z";

interface QueryCall {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

function createMockSupabase(handlers: {
  storyBibleRow?: unknown;
  error?: { message: string; code?: string; details?: string } | null;
}) {
  const calls: QueryCall[] = [];

  const client = {
    from(table: string) {
      let operation: "select" | "insert" | "update" | "delete" = "select";
      let payload: unknown;
      const filters: Array<[string, unknown]> = [];

      const builder = {
        select() {
          return builder;
        },
        insert(data: unknown) {
          operation = "insert";
          payload = data;
          return builder;
        },
        update(data: unknown) {
          operation = "update";
          payload = data;
          return builder;
        },
        delete() {
          operation = "delete";
          return builder;
        },
        eq(col: string, val: unknown) {
          filters.push([col, val]);
          return builder;
        },
        async single() {
          calls.push({ table, operation, payload, filters });
          if (handlers.error) return { data: null, error: handlers.error };
          return { data: handlers.storyBibleRow ?? null, error: null };
        },
        async maybeSingle() {
          calls.push({ table, operation, payload, filters });
          if (handlers.error) return { data: null, error: handlers.error };
          return { data: handlers.storyBibleRow ?? null, error: null };
        },
      };

      return builder;
    },
  };

  return { client, calls };
}

describe("StoryBibleRepository persistence & lifecycle", () => {
  const sampleDTO: StoryBibleDTO = {
    title: "The Narrow Path",
    logline: "A lone traveler seeks the ancient truth.",
    synopsis: "In a divided kingdom, one person must deliver the message of hope.",
    burden: null,
    truth: null,
    human_problem: null,
    theme: "Redemption",
    core_message: null,
    scripture_foundation: null,
    kingdom_objective: null,
    target_audience: null,
    genre: "Drama",
    tone: null,
    language: "English",
    visual_style: null,
    aspect_ratio: "16:9",
    duration_minutes: 90,
    universe: null,
    time_period: null,
    primary_location: null,
    beginning: null,
    conflict: null,
    midpoint: null,
    climax: null,
    ending: null,
    ai_context: null,
    ai_rules: null,
    forbidden_elements: null,
    preferred_vocabulary: null,
    visual_consistency: null,
  };

  it("creates a Story Bible record bound to the production_id", async () => {
    const createdRow: StoryBible = {
      ...sampleDTO,
      id: BIBLE_ID,
      production_id: PRODUCTION_ID,
      created_at: NOW,
      updated_at: NOW,
    };

    const { client, calls } = createMockSupabase({ storyBibleRow: createdRow });
    const repo = new StoryBibleRepository(client as never);

    const result = await repo.create(PRODUCTION_ID, sampleDTO);
    assert.equal(result.id, BIBLE_ID);
    assert.equal(result.production_id, PRODUCTION_ID);
    assert.equal(result.title, "The Narrow Path");

    const insertCall = calls.find((c) => c.table === "story_bibles" && c.operation === "insert");
    assert.ok(insertCall, "insert was executed");
    const payload = insertCall.payload as Record<string, unknown>;
    assert.equal(payload.production_id, PRODUCTION_ID);
    assert.equal(payload.title, "The Narrow Path");
  });

  it("retrieves a Story Bible by productionId using maybeSingle", async () => {
    const existingRow: StoryBible = {
      ...sampleDTO,
      id: BIBLE_ID,
      production_id: PRODUCTION_ID,
      created_at: NOW,
      updated_at: NOW,
    };

    const { client, calls } = createMockSupabase({ storyBibleRow: existingRow });
    const repo = new StoryBibleRepository(client as never);

    const result = await repo.getByProductionId(PRODUCTION_ID);
    assert.ok(result);
    assert.equal(result.id, BIBLE_ID);

    const selectCall = calls.find((c) => c.table === "story_bibles" && c.operation === "select");
    assert.ok(selectCall, "select was executed");
    const prodFilter = selectCall.filters.find(([col]) => col === "production_id");
    assert.ok(prodFilter);
    assert.equal(prodFilter[1], PRODUCTION_ID);
  });

  it("upsert calls create when no prior Story Bible exists", async () => {
    const createdRow: StoryBible = {
      ...sampleDTO,
      id: BIBLE_ID,
      production_id: PRODUCTION_ID,
      created_at: NOW,
      updated_at: NOW,
    };

    const { client } = createMockSupabase({ storyBibleRow: createdRow });
    const repo = new StoryBibleRepository(client as never);
    repo.getByProductionId = async () => null;

    let createCalledWith: { productionId: string; dto: StoryBibleDTO } | null = null;
    repo.create = async (productionId, dto) => {
      createCalledWith = { productionId, dto };
      return createdRow;
    };

    const result = await repo.upsert(PRODUCTION_ID, sampleDTO);
    assert.equal(result.id, BIBLE_ID);
    assert.ok(createCalledWith);
    assert.equal((createCalledWith as { productionId: string }).productionId, PRODUCTION_ID);
  });

  it("upsert calls update when a prior Story Bible exists", async () => {
    const existingRow: StoryBible = {
      ...sampleDTO,
      id: BIBLE_ID,
      production_id: PRODUCTION_ID,
      created_at: NOW,
      updated_at: NOW,
    };

    const updatedDTO: StoryBibleDTO = {
      ...sampleDTO,
      logline: "An updated logline that preserves creator intent.",
    };

    const updatedRow: StoryBible = {
      ...existingRow,
      logline: updatedDTO.logline,
    };

    const { client } = createMockSupabase({});
    const repo = new StoryBibleRepository(client as never);
    repo.getByProductionId = async () => existingRow;

    let updateCalledWith: { id: string; dto: Partial<StoryBibleDTO> } | null = null;
    repo.update = async (id, dto) => {
      updateCalledWith = { id, dto };
      return updatedRow;
    };

    const result = await repo.upsert(PRODUCTION_ID, updatedDTO);
    assert.equal(result.logline, updatedDTO.logline);
    assert.ok(updateCalledWith);
    assert.equal((updateCalledWith as { id: string }).id, BIBLE_ID);
  });

  it("propagates database errors thrown during persistence failures", async () => {
    const { client } = createMockSupabase({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const repo = new StoryBibleRepository(client as never);

    await assert.rejects(
      async () => repo.create(PRODUCTION_ID, sampleDTO),
      { message: /duplicate key value violates unique constraint/ },
    );
  });
});
