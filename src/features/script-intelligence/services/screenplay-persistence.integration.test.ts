import test from "node:test";
import assert from "node:assert/strict";

import { getAuthenticatedUser } from "@/lib/auth/authenticated-user";
import { getOwnedProduction } from "@/lib/auth/owned-production";
import { ScreenplayRepository } from "../repositories/screenplay.repository";
import { ProductionRepository } from "@/features/productions/repositories/production.repository";
import type { Screenplay, ScreenplayRevision } from "../types/screenplay";
import type { Production } from "@/features/productions/types/production";

const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const FOREIGN_USER_ID = "99999999-9999-4999-8999-999999999999";
const PRODUCTION_ID = "11111111-1111-4111-8111-111111111111";
const SCREENPLAY_ID = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-10-14T10:00:00.000Z";

interface QueryCall {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

function createIntegrationDatabase(options: {
  initialProduction?: Production | null;
  initialScreenplay?: Screenplay | null;
  initialRevisions?: ScreenplayRevision[];
  simulateSaveFailure?: boolean;
}) {
  const calls: QueryCall[] = [];
  let currentProduction = options.initialProduction ?? null;
  let currentScreenplay = options.initialScreenplay ?? null;
  const revisions: ScreenplayRevision[] = [...(options.initialRevisions ?? [])];

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
        order() {
          return builder;
        },
        async single() {
          calls.push({ table, operation, payload, filters });

          if (table === "screenplays") {
            if (options.simulateSaveFailure) {
              return { data: null, error: { message: "connection to database failed during write" } };
            }
            if (operation === "insert") {
              const body = payload as Record<string, unknown>;
              currentScreenplay = {
                id: (body.id as string) ?? SCREENPLAY_ID,
                productionId: body.production_id as string,
                title: body.title as string,
                content: body.content as string,
                source: (body.source as Screenplay["source"]) ?? "internal",
                sourceFileName: (body.source_file_name as string) ?? null,
                version: (body.version as number) ?? 1,
                status: (body.status as Screenplay["status"]) ?? "draft",
                createdAt: NOW,
                updatedAt: NOW,
              };
              return {
                data: {
                  id: currentScreenplay.id,
                  production_id: currentScreenplay.productionId,
                  title: currentScreenplay.title,
                  content: currentScreenplay.content,
                  source: currentScreenplay.source,
                  source_file_name: currentScreenplay.sourceFileName,
                  version: currentScreenplay.version,
                  status: currentScreenplay.status,
                  created_at: currentScreenplay.createdAt,
                  updated_at: currentScreenplay.updatedAt,
                },
                error: null,
              };
            }
            if (operation === "update") {
              const body = payload as Record<string, unknown>;
              if (!currentScreenplay) {
                return { data: null, error: { message: "screenplay not found" } };
              }
              currentScreenplay = {
                ...currentScreenplay,
                title: (body.title as string) ?? currentScreenplay.title,
                content: (body.content as string) ?? currentScreenplay.content,
                version: (body.version as number) ?? currentScreenplay.version,
                status: (body.status as Screenplay["status"]) ?? currentScreenplay.status,
                updatedAt: NOW,
              };
              return {
                data: {
                  id: currentScreenplay.id,
                  production_id: currentScreenplay.productionId,
                  title: currentScreenplay.title,
                  content: currentScreenplay.content,
                  source: currentScreenplay.source,
                  source_file_name: currentScreenplay.sourceFileName,
                  version: currentScreenplay.version,
                  status: currentScreenplay.status,
                  created_at: currentScreenplay.createdAt,
                  updated_at: currentScreenplay.updatedAt,
                },
                error: null,
              };
            }
          }

          if (table === "screenplay_revisions") {
            if (operation === "insert") {
              const body = payload as Record<string, unknown>;
              const rev: ScreenplayRevision = {
                id: `rev-${revisions.length + 1}`,
                screenplayId: body.screenplay_id as string,
                version: body.version as number,
                title: body.title as string,
                content: body.content as string,
                reason: body.reason as string,
                createdAt: NOW,
              };
              revisions.push(rev);
              return {
                data: {
                  id: rev.id,
                  screenplay_id: rev.screenplayId,
                  version: rev.version,
                  title: rev.title,
                  content: rev.content,
                  reason: rev.reason,
                  created_at: rev.createdAt,
                },
                error: null,
              };
            }
            if (operation === "select") {
              const idFilter = filters.find(([col]) => col === "id");
              const rev = revisions.find((r) => r.id === idFilter?.[1]);
              if (!rev) {
                return { data: null, error: null };
              }
              return {
                data: {
                  id: rev.id,
                  screenplay_id: rev.screenplayId,
                  version: rev.version,
                  title: rev.title,
                  content: rev.content,
                  reason: rev.reason,
                  created_at: rev.createdAt,
                },
                error: null,
              };
            }
          }

          if (table === "productions") {
            if (operation === "insert") {
              const body = payload as Record<string, unknown>;
              currentProduction = {
                id: PRODUCTION_ID,
                owner_id: body.owner_id as string,
                created_by: body.created_by as string,
                title: body.title as string,
                slug: body.slug as string,
                language: "English",
                aspect_ratio: "16:9",
                target_duration_seconds: 0,
                status: "concept",
                visibility: "private",
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
              return { data: currentProduction, error: null };
            }
            if (operation === "update") {
              const body = payload as Record<string, unknown>;
              if (!currentProduction) return { data: null, error: { message: "production not found" } };
              currentProduction = { ...currentProduction, ...body, updated_at: NOW };
              return { data: currentProduction, error: null };
            }
          }

          return { data: null, error: null };
        },
        async maybeSingle() {
          calls.push({ table, operation, payload, filters });
          if (table === "screenplays") {
            if (!currentScreenplay) return { data: null, error: null };
            const prodFilter = filters.find(([col]) => col === "production_id");
            if (prodFilter && prodFilter[1] !== currentScreenplay.productionId) {
              return { data: null, error: null };
            }
            return {
              data: {
                id: currentScreenplay.id,
                production_id: currentScreenplay.productionId,
                title: currentScreenplay.title,
                content: currentScreenplay.content,
                source: currentScreenplay.source,
                source_file_name: currentScreenplay.sourceFileName,
                version: currentScreenplay.version,
                status: currentScreenplay.status,
                created_at: currentScreenplay.createdAt,
                updated_at: currentScreenplay.updatedAt,
              },
              error: null,
            };
          }
          if (table === "productions") {
            if (!currentProduction) return { data: null, error: null };
            const idFilter = filters.find(([col]) => col === "id");
            if (idFilter && idFilter[1] !== currentProduction.id) {
              return { data: null, error: null };
            }
            return { data: currentProduction, error: null };
          }
          return { data: null, error: null };
        },
        then(resolve: (val: unknown) => void) {
          calls.push({ table, operation, payload, filters });
          if (table === "screenplay_revisions") {
            const list = [...revisions]
              .sort((a, b) => b.version - a.version)
              .map((r) => ({
                id: r.id,
                screenplay_id: r.screenplayId,
                version: r.version,
                title: r.title,
                content: r.content,
                reason: r.reason,
                created_at: r.createdAt,
              }));
            resolve({ data: list, error: null });
          } else {
            resolve({ data: [], error: null });
          }
        },
      };

      return builder;
    },
  };

  return {
    client,
    calls,
    getProduction: () => currentProduction,
    getScreenplay: () => currentScreenplay,
    getRevisions: () => revisions,
  };
}

test("Authentication, Production Access & Screenplay Persistence Integration", async (t) => {
  await t.test("Task 1: End-to-end authentication and claims verification", async () => {
    // 1. Valid verified session extracts owner identity
    const authenticated = await getAuthenticatedUser(async () => ({
      data: { claims: { sub: OWNER_ID, exp: Math.floor(Date.now() / 1000) + 3600 } },
      error: null,
    }));
    assert.deepEqual(authenticated, { id: OWNER_ID });

    // 2. Expired session is strictly rejected
    const expired = await getAuthenticatedUser(async () => ({
      data: { claims: null },
      error: new Error("JWT expired"),
    }));
    assert.equal(expired, null, "Expired session must fail closed");

    // 3. Missing claims or malformed subject fails closed
    const missingClaims = await getAuthenticatedUser(async () => ({
      data: { claims: null },
      error: null,
    }));
    assert.equal(missingClaims, null, "Missing claims must fail closed");

    const malformedSubject = await getAuthenticatedUser(async () => ({
      data: { claims: { sub: 12345 } },
      error: null,
    }));
    assert.equal(malformedSubject, null, "Non-string subject must fail closed");
  });

  await t.test("Task 2: Production ownership verification and cross-user isolation", async () => {
    const existingProduction: Production = {
      id: PRODUCTION_ID,
      owner_id: OWNER_ID,
      created_by: OWNER_ID,
      title: "The King's Standard",
      slug: "the-kings-standard-abc123",
      language: "English",
      aspect_ratio: "16:9",
      target_duration_seconds: 120,
      status: "concept",
      visibility: "private",
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

    const lookup = async (id: string) => (id === PRODUCTION_ID ? existingProduction : null);

    // 1. Owner can access their production
    const ownerAccess = await getOwnedProduction(PRODUCTION_ID, OWNER_ID, lookup);
    assert.ok(ownerAccess);
    assert.equal(ownerAccess.id, PRODUCTION_ID);
    assert.equal(ownerAccess.owner_id, OWNER_ID);

    // 2. Foreign user cannot access another user's production (returns null / 404 trigger)
    const foreignAccess = await getOwnedProduction(PRODUCTION_ID, FOREIGN_USER_ID, lookup);
    assert.equal(foreignAccess, null, "Foreign user must never access another creator's production");

    // 3. Nonexistent production returns null
    const notFoundAccess = await getOwnedProduction(
      "33333333-3333-4333-8333-333333333333",
      OWNER_ID,
      lookup,
    );
    assert.equal(notFoundAccess, null);

    // 4. Malformed non-UUID production ID fails closed immediately without database query
    let queried = false;
    const malformedAccess = await getOwnedProduction("not-a-valid-uuid", OWNER_ID, async () => {
      queried = true;
      return null;
    });
    assert.equal(malformedAccess, null);
    assert.equal(queried, false, "Lookup should not run for invalid UUIDs");

    // 5. Update strip-down: verify repository strips attempted ownership transfer
    const db = createIntegrationDatabase({ initialProduction: existingProduction });
    const repo = new ProductionRepository(db.client as never);
    await repo.update(PRODUCTION_ID, {
      title: "Legitimate Title",
      owner_id: FOREIGN_USER_ID,
      created_by: FOREIGN_USER_ID,
    } as unknown as Partial<Production>);

    const updateCall = db.calls.find((c) => c.table === "productions" && c.operation === "update");
    assert.ok(updateCall);
    const payload = updateCall.payload as Record<string, unknown>;
    assert.equal(payload.owner_id, undefined, "owner_id must be stripped from updates");
    assert.equal(payload.created_by, undefined, "created_by must be stripped from updates");
    assert.equal(payload.title, "Legitimate Title");
  });

  await t.test("Task 3: Screenplay persistence, reload survival and revision ledger", async () => {
    const db = createIntegrationDatabase({});
    const repo = new ScreenplayRepository(db.client as never);

    // Step 1: Initial save creates screenplay with version 1 and an initial revision snapshot
    const initialSaved = await repo.save(PRODUCTION_ID, {
      title: "Kingdom Chronicles: The Beginning",
      content: "EXT. WILDERNESS - DAY\n\nA lone prophet stands on the mountain ridge.",
      reason: "initial-draft",
    });

    assert.equal(initialSaved.version, 1);
    assert.equal(initialSaved.title, "Kingdom Chronicles: The Beginning");

    const initialRevisionCall = db.calls.find(
      (c) => c.table === "screenplay_revisions" && c.operation === "insert",
    );
    assert.ok(initialRevisionCall, "Initial revision must be written to ledger");
    assert.equal((initialRevisionCall.payload as Record<string, unknown>).version, 1);
    assert.equal((initialRevisionCall.payload as Record<string, unknown>).reason, "initial-draft");

    // Step 2: Second save increments to version 2 and adds immutable revision record
    const secondSaved = await repo.save(PRODUCTION_ID, {
      title: "Kingdom Chronicles: The Beginning - Polished",
      content: "EXT. WILDERNESS - DAY\n\nA lone prophet stands on the mountain ridge.\n\nPROPHET\nPrepare the way.",
      reason: "dialogue-polish",
    });

    assert.equal(secondSaved.version, 2);
    assert.equal(secondSaved.title, "Kingdom Chronicles: The Beginning - Polished");
    assert.equal(db.getRevisions().length, 2);
    assert.equal(db.getRevisions()[1].version, 2);
    assert.equal(db.getRevisions()[1].reason, "dialogue-polish");

    // Step 3: Reload simulation — retrieving by productionId returns current version 2
    const reloaded = await repo.getByProductionId(PRODUCTION_ID);
    assert.ok(reloaded);
    assert.equal(reloaded.version, 2);
    assert.equal(reloaded.title, "Kingdom Chronicles: The Beginning - Polished");
    assert.ok(reloaded.content.includes("Prepare the way."));

    // Step 4: Revision ledger history returns all revisions in descending order
    const revisionsList = await repo.getRevisions(reloaded.id);
    assert.equal(revisionsList.length, 2);
    assert.equal(revisionsList[0].version, 2);
    assert.equal(revisionsList[1].version, 1);

    // Step 5: Restoring a previous revision does NOT delete history — creates version 3 with restored content
    const restored = await repo.restoreRevision(PRODUCTION_ID, revisionsList[1].id);
    assert.equal(restored.version, 3);
    assert.equal(restored.content, revisionsList[1].content);
    assert.equal(db.getRevisions().length, 3);
    assert.equal(db.getRevisions()[2].version, 3);
    assert.equal(db.getRevisions()[2].reason, "restored-from-version-1");

    // Step 6: Nonexistent revision restore rejects with descriptive error
    await assert.rejects(
      async () => repo.restoreRevision(PRODUCTION_ID, "nonexistent-rev-uuid"),
      { message: "Revision not found." },
      "Restoring nonexistent revision must fail with 'Revision not found.'",
    );

    // Step 7: Failed save propagation — database errors are never hidden
    const failingDb = createIntegrationDatabase({ simulateSaveFailure: true });
    const failingRepo = new ScreenplayRepository(failingDb.client as never);
    await assert.rejects(
      async () =>
        failingRepo.save(PRODUCTION_ID, {
          title: "Failed Save",
          content: "EXT. NOWHERE - NIGHT",
        }),
      { message: /connection to database failed during write/ },
      "Database failures must be propagated accurately to callers",
    );
  });
});
