"use client";

export function DirectorNotesView({ productionId }: { productionId: string }) {
  return (
    <div className="space-y-4 p-6 md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-yellow-500">Production · AI Director</p>
      <h1 className="text-3xl font-black text-white">Director Notes</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">
        Direction for production {productionId} is planned from persisted scenes, shots and storyboard panels. Unsupported
        choices stay uncertain. Approved notes are not overwritten.
      </p>
    </div>
  );
}
