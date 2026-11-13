import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProductionRepository } from "./production.repository";
import type { Production } from "../types/production";
import type { CreateProductionDTO } from "../validation/production.schema";

const PRODUCTION_ID = "55555555-5555-4555-8555-555555555555";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const ATTACKER_ID = "99999999-9999-4999-8999-999999999999";
const NOW = "2026-10-13T10:00:00.000Z";

interface QueryCall {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

function createMockSupabase(handlers: {
  productionRow?: unknown;
  productionsList?: unknown[];
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
        is(col: string, val: unknown) {
          filters.push([col, val]);
          return builder;
        },
        not(col: string, op: string, val: unknown) {
          filters.push([`${col}:${op}`, val]);
          return builder;
        },
        order() {
          return builder;
        },
        async single() {
          calls.push({ table, operation, payload, filters });
          if (handlers.error) return { data: null, error: handlers.error };
          return { data: handlers.productionRow ?? null, error: null };
        },
        async maybeSingle() {
          calls.push({ table, operation, payload, filters });
          if (handlers.error) return { data: null, error: handlers.error };
          return { data: handlers.productionRow ?? null, error: null };
        },
        then(resolve: (val: unknown) => void) {
          calls.push({ table, operation, payload, filters });
          if (handlers.error) {
            resolve({ data: null, error: handlers.error });
          } else {
            resolve({ data: handlers.productionsList ?? [], error: null });
          }
        },
      };

      return builder;
    },
  };

  return { client, calls };
}

describe("ProductionRepository ownership enforcement & persistence", () => {
  it("creates a production with explicit owner_id and created_by fields", async () => {
    const dto: CreateProductionDTO = {
      owner_id: OWNER_ID,
      created_by: OWNER_ID,
      title: "Kingdom Production",
      slug: "kingdom-production-1234",
      language: "English",
      aspect_ratio: "16:9",
      target_duration_seconds: 0,
      status: "concept",
      visibility: "private",
    };

    const createdRow: Production = {
      ...dto,
      id: PRODUCTION_ID,
      logline: null,
      synopsis: null,
      genre: null,
      target_audience: null,
      art_style: null,
      cover_image_url: null,
      last_opened_at: null,
      deleted_at: null,
      created_at: NOW,
      updated_at: NOW,
    };

    const { client, calls } = createMockSupabase({ productionRow: createdRow });
    const repo = new ProductionRepository(client as never);

    const result = await repo.create(dto);
    assert.equal(result.id, PRODUCTION_ID);
    assert.equal(result.owner_id, OWNER_ID);
    assert.equal(result.created_by, OWNER_ID);

    const insertCall = calls.find((c) => c.table === "productions" && c.operation === "insert");
    assert.ok(insertCall, "insert operation was executed");
    const inserted = insertCall.payload as Record<string, unknown>;
    assert.equal(inserted.owner_id, OWNER_ID);
    assert.equal(inserted.created_by, OWNER_ID);
  });

  it("strips attempted ownership reassignment (owner_id and created_by) from updates", async () => {
    const updatedRow: Production = {
      id: PRODUCTION_ID,
      owner_id: OWNER_ID,
      created_by: OWNER_ID,
      title: "Legitimate Title Update",
      slug: "kingdom-production-1234",
      logline: null,
      synopsis: null,
      genre: null,
      target_audience: null,
      art_style: null,
      language: "English",
      aspect_ratio: "16:9",
      target_duration_seconds: 0,
      cover_image_url: null,
      status: "concept",
      visibility: "private",
      last_opened_at: null,
      deleted_at: null,
      created_at: NOW,
      updated_at: NOW,
    };

    const { client, calls } = createMockSupabase({ productionRow: updatedRow });
    const repo = new ProductionRepository(client as never);

    // Attempted ownership hijack: passing owner_id and created_by
    const maliciousUpdate = {
      title: "Legitimate Title Update",
      owner_id: ATTACKER_ID,
      created_by: ATTACKER_ID,
      id: "99999999-9999-4999-8999-999999999999",
    } as unknown as Partial<Production>;

    const result = await repo.update(PRODUCTION_ID, maliciousUpdate);
    assert.equal(result.owner_id, OWNER_ID, "Returned owner remains the legitimate owner");

    const updateCall = calls.find((c) => c.table === "productions" && c.operation === "update");
    assert.ok(updateCall, "update operation was executed");
    const payload = updateCall.payload as Record<string, unknown>;

    // Confirm that malicious fields were stripped from the database payload
    assert.equal(payload.owner_id, undefined, "owner_id must not be sent in update payload");
    assert.equal(payload.created_by, undefined, "created_by must not be sent in update payload");
    assert.equal(payload.id, undefined, "id must not be sent in update payload");
    assert.equal(payload.title, "Legitimate Title Update", "Permitted field was updated");
  });

  it("propagates database errors thrown on unauthorized or cross-user operations", async () => {
    const { client } = createMockSupabase({
      error: { code: "42501", message: "new row violates row-level security policy for table productions" },
    });
    const repo = new ProductionRepository(client as never);

    await assert.rejects(
      async () => repo.update(PRODUCTION_ID, { title: "New Title" }),
      { message: /violates row-level security policy/ },
    );
  });

  it("filters non-deleted records for active production listings", async () => {
    const { client, calls } = createMockSupabase({ productionsList: [] });
    const repo = new ProductionRepository(client as never);

    await repo.getAll();

    const selectCall = calls.find((c) => c.table === "productions" && c.operation === "select");
    assert.ok(selectCall, "select was executed");
    const deletedAtFilter = selectCall.filters.find(([col]) => col === "deleted_at");
    assert.ok(deletedAtFilter, "deleted_at filter was applied");
    assert.equal(deletedAtFilter[1], null, "deleted_at must be null for active productions");
  });

  it("soft deletes a production by setting deleted_at timestamp", async () => {
    const { client, calls } = createMockSupabase({});
    const repo = new ProductionRepository(client as never);

    await repo.archive(PRODUCTION_ID);

    const updateCall = calls.find((c) => c.table === "productions" && c.operation === "update");
    assert.ok(updateCall, "update was executed for archive");
    const payload = updateCall.payload as Record<string, unknown>;
    assert.ok(typeof payload.deleted_at === "string", "deleted_at is set to an ISO timestamp");
    const idFilter = updateCall.filters.find(([col]) => col === "id");
    assert.equal(idFilter?.[1], PRODUCTION_ID);
  });
});
