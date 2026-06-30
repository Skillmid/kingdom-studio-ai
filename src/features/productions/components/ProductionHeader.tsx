export default function ProductionHeader() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-10">

      <div>

        <p className="text-sm uppercase tracking-[0.25em] text-yellow-500">
          Kingdom Studio AI
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Production Workspace
        </h1>

      </div>

      <div>

        <button className="rounded-xl bg-yellow-500 px-5 py-2 font-semibold text-black">
          Production Settings
        </button>

      </div>

    </header>
  );
}