import type { Production } from "../types/production";

import ProductionHero from "./ProductionHero";
import ProductionStats from "./ProductionStats";
import RecentActivity from "./RecentActivity";
import NextSteps from "./NextSteps";

interface ProductionOverviewProps {
  production: Production;
}

export default function ProductionOverview({
  production,
}: ProductionOverviewProps) {
  return (
    <div className="space-y-10">

      <ProductionHero
        production={production}
      />

      <ProductionStats />

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Kingdom Vision
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Build with Purpose
        </h2>

        <p className="mt-6 text-lg leading-8 text-zinc-400">
          Every Kingdom production begins by seeking God's direction.
          Define the mission, biblical foundation, audience,
          scripture, purpose, and desired transformation before
          writing your screenplay.
        </p>

      </section>

      <div className="grid gap-8 xl:grid-cols-2">

        <RecentActivity />

        <NextSteps />

      </div>

    </div>
  );
}