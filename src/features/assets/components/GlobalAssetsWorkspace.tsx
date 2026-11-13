"use client";

import Link from "next/link";

import { useProductions } from "@/features/productions/hooks/use-productions";
import { productionAssetDestinations } from "../services/production-asset-links";

export default function GlobalAssetsWorkspace() {
  const { productions, loading, error } = useProductions();
  const destinations = productionAssetDestinations(productions);

  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-semibold">Choose a production</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Assets belong to a production so their screenplay, character, and scene provenance stays attached. Open a production to manage its reference media and generation jobs.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          Unable to load productions. Check your connection and try again.
        </p>
      ) : null}

      {loading ? (
        <p role="status" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-300">
          Loading productions…
        </p>
      ) : destinations.length ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {destinations.map((destination) => (
            <li key={destination.id}>
              <Link
                href={destination.href}
                className="block h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-yellow-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
              >
                <h3 className="text-lg font-semibold text-white">{destination.title}</h3>
                <span className="mt-4 inline-flex text-sm font-medium text-yellow-400">Manage production assets →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : !error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-8">
          <p className="text-zinc-300">Create a production to start organizing its assets.</p>
          <Link href="/studio/productions" className="mt-4 inline-flex rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black">
            Go to productions
          </Link>
        </div>
      ) : null}
    </section>
  );
}
