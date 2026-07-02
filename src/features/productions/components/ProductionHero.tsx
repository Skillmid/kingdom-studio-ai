import type { Production } from "../types/production";

interface ProductionHeroProps {
  production: Production;
}

export default function ProductionHero({
  production,
}: ProductionHeroProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

      <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
        Production
      </p>

      <h1 className="mt-3 text-5xl font-bold">
        {production.title}
      </h1>

      <div className="mt-6 flex items-center gap-4">

        <span className="rounded-full bg-yellow-500 px-5 py-2 text-sm font-semibold text-black capitalize">
          {production.status}
        </span>

        <span className="text-zinc-400">
          Updated{" "}
          {new Date(
            production.updated_at
          ).toLocaleDateString()}
        </span>

      </div>

      <p className="mt-8 max-w-4xl text-lg leading-8 text-zinc-400">
        Every Kingdom production begins with purpose.
        Build stories that glorify Christ, inspire people,
        and communicate biblical truth through cinematic excellence.
      </p>

    </section>
  );
}