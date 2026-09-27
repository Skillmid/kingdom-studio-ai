"use client";

export function DirectorNotesView({ productionId }: { productionId: string }) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-black text-white">Direction Notes</h1>
      <p className="text-sm text-zinc-400">Grounded notes for production {productionId}. Unknowns stay unknown.</p>
    </div>
  );
}
