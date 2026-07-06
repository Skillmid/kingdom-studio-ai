"use client";

import Link from "next/link";

interface ProductionHeaderProps {
  productionTitle?: string;
  productionStatus?: string;
}

export default function ProductionHeader({
  productionTitle = "Loading...",
  productionStatus = "Draft",
}: ProductionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">

      <div className="flex h-20 items-center justify-between px-10">

        <div className="flex items-center gap-8">

          <Link
            href="/studio"
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm transition hover:border-yellow-500 hover:text-yellow-500"
          >
            ← Studio
          </Link>

          <div>

            <p className="text-xs uppercase tracking-[0.35em] text-yellow-500">
              Kingdom Studio AI
            </p>

            <div className="mt-2 flex items-center gap-3">

              <h1 className="text-3xl font-bold">
                {productionTitle}
              </h1>

              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                {productionStatus}
              </span>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <button
            className="rounded-xl border border-zinc-700 px-4 py-2 transition hover:border-yellow-500"
          >
            Share
          </button>

          <button
            className="rounded-xl border border-zinc-700 px-4 py-2 transition hover:border-yellow-500"
          >
            Export
          </button>

          <button
            className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-black transition hover:bg-yellow-400"
          >
            Settings
          </button>

        </div>

      </div>

    </header>
  );
}