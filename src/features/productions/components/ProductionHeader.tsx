"use client";

import Link from "next/link";

interface ProductionHeaderProps {
  productionId: string;
  productionTitle?: string;
  productionStatus?: string;
}

export default function ProductionHeader({
  productionId,
  productionTitle = "Loading...",
  productionStatus = "Draft",
}: ProductionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:h-20 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-0">

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 lg:gap-8">

          <Link
            href="/studio"
            className="shrink-0 rounded-xl border border-zinc-800 px-3 py-2 text-sm transition hover:border-yellow-500 hover:text-yellow-500 sm:px-4"
          >
            ← Studio
          </Link>

          <div className="min-w-0 flex-1">

            <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-500 sm:text-xs sm:tracking-[0.35em]">
              Kingdom Studio AI
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-2 sm:gap-3">

              <h1 className="break-words text-xl font-bold sm:text-2xl lg:text-3xl">
                {productionTitle}
              </h1>

              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                {productionStatus}
              </span>

            </div>

          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">

          <button
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm transition hover:border-yellow-500 sm:px-4"
          >
            Share
          </button>

          <Link
            href={`/studio/productions/${productionId}/export`}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm transition hover:border-yellow-500 sm:px-4"
          >
            Export
          </Link>

          <button
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 sm:px-5"
          >
            Settings
          </button>

        </div>

      </div>

    </header>
  );
}
