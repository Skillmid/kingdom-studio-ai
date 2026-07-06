"use client";

import { useEffect, useState } from "react";

import { productionRepository } from "../repositories/production.repository";
import type { Production } from "../types/production";

export default function ArchivedProductions() {
  const [productions, setProductions] =
    useState<Production[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  async function load() {
    setLoading(true);

    try {
      const result =
        await productionRepository.getArchived();

      setProductions(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(
    id: string
  ) {
    setWorkingId(id);

    try {
      await productionRepository.restore(id);

      await load();
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteForever(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "This production will be permanently deleted.\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(id);

    try {
      await productionRepository.deleteForever(
        id
      );

      await load();
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        Loading archived productions...
      </div>
    );
  }

  if (productions.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-20 text-center">

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
    <div className="mt-10 space-y-6">

      {productions.map(
        (production) => (

          <div
            key={production.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8"
          >

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-semibold">
                  {production.title}
                </h2>

                <p className="mt-2 text-zinc-400">
                  Archived{" "}
                  {production.deleted_at
                    ? new Date(
                        production.deleted_at
                      ).toLocaleDateString()
                    : ""}
                </p>

              </div>

              <div className="flex gap-3">

                <button
                  disabled={
                    workingId ===
                    production.id
                  }
                  onClick={() =>
                    restore(
                      production.id
                    )
                  }
                  className="rounded-xl border border-zinc-700 px-5 py-2 transition hover:border-yellow-500 disabled:opacity-50"
                >
                  Restore
                </button>

                <button
                  disabled={
                    workingId ===
                    production.id
                  }
                  onClick={() =>
                    deleteForever(
                      production.id
                    )
                  }
                  className="rounded-xl bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  Delete Forever
                </button>

              </div>

            </div>

          </div>

        )
      )}

    </div>
  );
}