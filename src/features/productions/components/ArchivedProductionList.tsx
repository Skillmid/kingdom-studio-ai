"use client";

import { useProductions } from "../hooks/use-productions";

export default function ArchivedProductionList() {
  const {
    archivedProductions,
    loading,
    restoreProduction,
    deleteForever,
  } = useProductions();

  if (loading) {
    return (
      <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-16 text-center">
        Loading archived productions...
      </div>
    );
  }

  if (archivedProductions.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-20 text-center">

        <h2 className="text-3xl font-bold">
          No Archived Productions
        </h2>

        <p className="mt-4 text-zinc-400">
          Archived productions will appear here.
        </p>

      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      {archivedProductions.map(
        (production) => (

          <div
            key={production.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-500"
          >

            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
              Archived
            </p>

            <h3 className="mt-3 text-2xl font-semibold">
              {production.title}
            </h3>

            <p className="mt-4 text-sm text-zinc-400">
              Archived on{" "}
              {production.deleted_at
                ? new Date(
                    production.deleted_at
                  ).toLocaleDateString()
                : "-"}
            </p>

            <div className="mt-8 flex gap-3">

              <button
                onClick={() =>
                  restoreProduction(
                    production.id
                  )
                }
                className="rounded-xl border border-zinc-700 px-5 py-2 transition hover:border-yellow-500"
              >
                Restore
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this production permanently?\n\nThis action cannot be undone."
                    )
                  ) {
                    deleteForever(
                      production.id
                    );
                  }
                }}
                className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-500"
              >
                Delete Forever
              </button>

            </div>

          </div>

        )
      )}

    </div>
  );
}