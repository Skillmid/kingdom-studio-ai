import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ScreenplayRepository } from "./screenplay.repository";
import type { Screenplay, ScreenplayRevision } from "../types/screenplay";

const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCREENPLAY_ID = "22222222-2222-4222-8222-222222222222";
const REVISION_ID = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-10-12T12:00:00.000Z";

interface QueryCall {
  table: string;
  operation: "select" | "insert" | "update";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

function createMockSupabase(handlers: {
  screenplayRow?: Record<string, unknown> | null;
  revisionRow?: Record<string, unknown> | null;
  revisionsList?: Array<Record<string, unknown>>;
  screenplayError?: { message: string } | null;
  revisionError?: { message: string } | null;
}) {
  const calls: QueryCall[] = [];

  const client = {
    from(table: string) {
      let operation: "select" | "insert" | "update" = "select";
      let payload: unknown;
      const filters: Array<[string, unknown]> = [];

      const builder = {
        select() {
          // Do not overwrite an existing insert or update operation when chained with select()
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
        eq(col: string, val: unknown) {
          filters.push([col, val]);
          return builder;
        },
        order() {
          return builder;
        },
        async single() {
          calls.push({ table, operation, payload, filters });
          if (table === "screenplays") {
            if (handlers.screenplayError) return { data: null, error: handlers.screenplayError };
            return { data: handlers.screenplayRow ?? null, error: null };
          }
          if (table === "screenplay_revisions") {
            if (handlers.revisionError) return { data: null, error: handlers.revisionError };
            return { data: handlers.revisionRow ?? null, error: null };
          }
          return { data: null, error: null };
        },
        async maybeSingle() {
          calls.push({ table, operation, payload, filters });
          if (table === "screenplays") {
            if (handlers.screenplayError) return { data: null, error: handlers.screenplayError };
            return { data: handlers.screenplayRow ?? null, error: null };
          }
          return { data: null, error: null };
        },
        then(resolve: (val: unknown) => void) {
          calls.push({ table, operation, payload, filters });
          if (table === "screenplay_revisions" && handlers.revisionsList) {
            resolve({ data: handlers.revisionsList, error: null });
          } else {
            resolve({ data: [], error: null });
          }
        },
      };

      return builder;
    },
  };

  return { client, calls };
}

describe("ScreenplayRepository persistence & revision ledger", () => {
  it("creates an initial screenplay with version 1 and an initial revision record", async () => {
    const createdRow = {
      id: SCREENPLAY_ID,
      production_id: PRODUCTION_ID,
      title: "Kingdom Chronicles",
      content: "EXT. GOLGOTHA - DAWN",
      source: "internal",
      source_file_name: null,
      version: 1,
      status: "draft",
      created_at: NOW,
      updated_at: NOW,
    };
    const revisionRow = {
      id: REVISION_ID,
      screenplay_id: SCREENPLAY_ID,
      version: 1,
      title: "Kingdom Chronicles",
      content: "EXT. GOLGOTHA - DAWN",
      reason: "initial-save",
      created_at: NOW,
    };

    const { client, calls } = createMockSupabase({
      screenplayRow: createdRow,
      revisionRow,
    });

    const repo = new ScreenplayRepository(client as never);
    repo.getByProductionId = async () => null;

    const result = await repo.save(PRODUCTION_ID, {
      title: "Kingdom Chronicles",
      content: "EXT. GOLGOTHA - DAWN",
    });

    assert.equal(result.version, 1);
    assert.equal(result.title, "Kingdom Chronicles");
    const screenplayInsert = calls.find((c) => c.table === "screenplays" && c.operation === "insert");
    assert.ok(screenplayInsert, "screenplays table was inserted");
    const revisionInsert = calls.find((c) => c.table === "screenplay_revisions" && c.operation === "insert");
    assert.ok(revisionInsert, "screenplay_revisions table was inserted");
    assert.equal((revisionInsert.payload as Record<string, unknown>).reason, "initial-save");
  });

  it("increments version on update and writes an immutable revision entry", async () => {
    const existingScreenplay: Screenplay = {
      id: SCREENPLAY_ID,
      productionId: PRODUCTION_ID,
      title: "Kingdom Chronicles",
      content: "EXT. GOLGOTHA - DAWN",
      source: "internal",
      sourceFileName: null,
      version: 3,
      status: "revised",
      createdAt: NOW,
      updatedAt: NOW,
    };
    const updatedRow = {
      id: SCREENPLAY_ID,
      production_id: PRODUCTION_ID,
      title: "Kingdom Chronicles - Revised",
      content: "EXT. GOLGOTHA - SUNSET",
      source: "internal",
      source_file_name: null,
      version: 4,
      status: "revised",
      created_at: NOW,
      updated_at: NOW,
    };
    const revisionRow = {
      id: REVISION_ID,
      screenplay_id: SCREENPLAY_ID,
      version: 4,
      title: "Kingdom Chronicles - Revised",
      content: "EXT. GOLGOTHA - SUNSET",
      reason: "dialogue-polish",
      created_at: NOW,
    };

    const { client, calls } = createMockSupabase({
      screenplayRow: updatedRow,
      revisionRow,
    });

    const repo = new ScreenplayRepository(client as never);
    repo.getByProductionId = async () => existingScreenplay;

    const result = await repo.save(PRODUCTION_ID, {
      title: "Kingdom Chronicles - Revised",
      content: "EXT. GOLGOTHA - SUNSET",
      reason: "dialogue-polish",
    });

    assert.equal(result.version, 4);
    const updateCall = calls.find((c) => c.table === "screenplays" && c.operation === "update");
    assert.ok(updateCall, "update was executed");
    assert.equal((updateCall.payload as Record<string, unknown>).version, 4);
    const revisionCall = calls.find((c) => c.table === "screenplay_revisions" && c.operation === "insert");
    assert.ok(revisionCall, "revision was created");
    assert.equal((revisionCall.payload as Record<string, unknown>).version, 4);
    assert.equal((revisionCall.payload as Record<string, unknown>).reason, "dialogue-polish");
  });

  it("rejects revision restore if the revision belongs to a different screenplay", async () => {
    const currentScreenplay: Screenplay = {
      id: SCREENPLAY_ID,
      productionId: PRODUCTION_ID,
      title: "Script A",
      content: "Content A",
      source: "internal",
      sourceFileName: null,
      version: 2,
      status: "draft",
      createdAt: NOW,
      updatedAt: NOW,
    };
    const foreignRevision: ScreenplayRevision = {
      id: "foreign-revision-id",
      screenplayId: "different-screenplay-uuid",
      version: 1,
      title: "Foreign Script",
      content: "Foreign Content",
      reason: "initial-save",
      createdAt: NOW,
    };

    const { client } = createMockSupabase({});
    const repo = new ScreenplayRepository(client as never);
    repo.getByProductionId = async () => currentScreenplay;
    repo.getRevisionById = async () => foreignRevision;

    await assert.rejects(
      async () => repo.restoreRevision(PRODUCTION_ID, "foreign-revision-id"),
      { message: "Revision does not belong to this screenplay." },
    );
  });

  it("rejects revision restore if the production has no current screenplay", async () => {
    const validRevision: ScreenplayRevision = {
      id: REVISION_ID,
      screenplayId: SCREENPLAY_ID,
      version: 1,
      title: "Script",
      content: "Content",
      reason: "initial-save",
      createdAt: NOW,
    };

    const { client } = createMockSupabase({});
    const repo = new ScreenplayRepository(client as never);
    repo.getByProductionId = async () => null;
    repo.getRevisionById = async () => validRevision;

    await assert.rejects(
      async () => repo.restoreRevision(PRODUCTION_ID, REVISION_ID),
      { message: "Screenplay not found." },
    );
  });

  it("propagates database errors thrown during screenplay retrieval", async () => {
    const { client } = createMockSupabase({
      screenplayError: { message: "database connection terminated" },
    });

    const repo = new ScreenplayRepository(client as never);
    await assert.rejects(
      async () => repo.getByProductionId(PRODUCTION_ID),
      { message: "database connection terminated" },
    );
  });
});
