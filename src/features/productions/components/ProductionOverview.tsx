import type { Production } from "../types/production";

import ProductionHero from "./ProductionHero";
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

      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8 lg:p-10">

        <p className="text-sm uppercase tracking-[0.3em] text-yellow-500">
          Creative foundation
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Set the direction
        </h2>

        <p className="mt-6 text-lg leading-8 text-zinc-400">
          Clarify the purpose, audience, and intended impact of this production
          in its Story Bible as you develop the screenplay and production plan.
        </p>

      </section>

      <NextSteps productionId={production.id} />

    </div>
  );
}
