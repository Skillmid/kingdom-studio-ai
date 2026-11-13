import Link from "next/link";

export default function ProductionNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Production unavailable</p>
      <h1 className="text-2xl font-semibold text-white">Unable to load production</h1>
      <p className="max-w-xl text-sm leading-6 text-zinc-300">
        The requested production could not be found.
      </p>
      <Link
        href="/studio/productions"
        className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800"
      >
        Back to productions
      </Link>
    </main>
  );
}
