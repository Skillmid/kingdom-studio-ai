"use client";

import type {
  ScreenplayRevision,
} from "../types/screenplay";

interface ScriptRevisionHistoryProps {
  revisions: ScreenplayRevision[];

  currentVersion?: number;

  restoring: boolean;

  onRestore: (
    revisionId: string
  ) => Promise<void>;
}

export default function ScriptRevisionHistory({
  revisions,
  currentVersion,
  restoring,
  onRestore,
}: ScriptRevisionHistoryProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
          History
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Screenplay Revisions
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          Every saved version is
          preserved. Restoring an older
          version creates a new revision
          instead of deleting history.
        </p>
      </div>

      {revisions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-500">
          No saved revisions yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {revisions.map(
            (revision) => {
              const isCurrent =
                revision.version ===
                currentVersion;

              return (
                <div
                  key={revision.id}
                  className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">
                        Version{" "}
                        {
                          revision.version
                        }
                      </p>

                      {isCurrent && (
                        <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-zinc-500">
                      {
                        revision.reason
                      }
                    </p>

                    <p className="mt-2 text-xs text-zinc-600">
                      {new Date(
                        revision.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={restoring}
                      onClick={() =>
                        void onRestore(
                          revision.id
                        )
                      }
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm transition hover:border-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {restoring
                        ? "Restoring..."
                        : "Restore"}
                    </button>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

    </section>
  );
}