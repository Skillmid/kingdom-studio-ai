"use client";

import { useRouter } from "next/navigation";

import { useProductions } from "@/features/productions/hooks/use-productions";

export default function RecentProductions() {
  const router = useRouter();

  const {
    productions,
    loading,
  } = useProductions();

  return (
    <section className="mt-10">

      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-semibold">
          Your Productions
        </h2>

        <button className="text-sm text-yellow-500 hover:underline">
          View All
        </button>

      </div>

      {loading ? (

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-16 text-center">

          Loading productions...

        </div>

      ) : productions.length === 0 ? (

        <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-16 text-center">

          <h3 className="text-2xl font-semibold">
            No productions yet
          </h3>

          <p className="mt-4 text-zinc-400">
            Create your first Kingdom production.
          </p>

        </div>

      ) : (

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {productions.map((production) => (

            <button
              key={production.id}
              onClick={() =>
                router.push(
                  `/studio/productions/${production.id}`
                )
              }
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-yellow-500 hover:bg-zinc-800"
            >

              <p className="text-sm uppercase tracking-widest text-yellow-500">
                {production.status}
              </p>

              <h3 className="mt-4 text-2xl font-semibold">
                {production.title}
              </h3>

              <p className="mt-4 text-sm text-zinc-400">
                Updated{" "}
                {new Date(
                  production.updated_at
                ).toLocaleDateString()}
              </p>

            </button>

          ))}

        </div>

      )}

    </section>
  );
}