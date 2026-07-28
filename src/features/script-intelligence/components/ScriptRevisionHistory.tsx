"use client";

import type {
  ScreenplayRevision,
} from "../types/screenplay";

interface ScriptRevisionHistoryProps {
  revisions: ScreenplayRevision[];
}

export default function ScriptRevisionHistory({
  revisions,
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
          Every saved version of the
          screenplay is preserved.
        </p>
      </div>

      {revisions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-500">
          No saved revisions yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {revisions.map(
            (revision) => (
              <div
                key={revision.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div>
                  <p className="font-semibold">
                    Version{" "}
                    {revision.version}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {revision.reason}
                  </p>
                </div>

                <div className="text-right text-sm text-zinc-500">
                  {new Date(
                    revision.createdAt
                  ).toLocaleString()}
                </div>
              </div>
            )
          )}
        </div>
      )}

    </section>
  );
}