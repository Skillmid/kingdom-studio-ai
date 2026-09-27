"use client";

export function AssetsView({ productionId }: { productionId: string }) {
  return (
    <div className="space-y-4 p-6 md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Production · Assets</p>
      <h1 className="text-3xl font-black text-white">Assets</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">
        Production {productionId} can plan reusable references from characters, locations, shots and panels. Planners
        never invent file URLs. Queue generation separately so failures stay recoverable.
      </p>
    </div>
  );
}
