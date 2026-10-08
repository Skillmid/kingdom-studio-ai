import type { Production } from "../types/production";

import ProductionHero from "./ProductionHero";
import ProductionCreativeDNA from "./ProductionCreativeDNA";
import NextSteps from "./NextSteps";

interface ProductionOverviewProps {
  production: Production;
  onUpdate?: (updates: Partial<Production>) => Promise<Production>;
}

export default function ProductionOverview({
  production,
  onUpdate,
}: ProductionOverviewProps) {
  return (
    <div className="space-y-10">
      <ProductionHero production={production} />

      <ProductionCreativeDNA
        production={production}
        onUpdate={onUpdate}
      />

      <NextSteps productionId={production.id} />
    </div>
  );
}
