"use client";

export default function AILoading() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">

      <div className="flex items-center gap-4">

        <div className="h-5 w-5 animate-pulse rounded-full bg-yellow-500" />

        <div>

          <h3 className="text-lg font-semibold">
            AI is thinking...
          </h3>

          <p className="mt-1 text-zinc-400">
            Generating high-quality content for your production.
          </p>

        </div>

      </div>

    </div>
  );
}