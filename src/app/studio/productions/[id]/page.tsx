"use client";

import ProductionOverview from "@/features/productions/components/ProductionOverview";
import { useProductionContext } from "@/features/productions/context/ProductionContext";

export default function ProductionPage() {
  // The production layout (ProductionWorkspace) has already loaded this production and only
  // renders this page once it is available, so reuse it instead of querying it a second time.
  const {
    production,
    loading,
    updateProduction,
  } = useProductionContext();

  if (loading) {
    return (
      <div className="p-10">
        Loading production...
      </div>
    );
  }

  if (!production) {
    return (
      <div className="m-10 rounded-3xl border border-red-900 bg-red-950/20 p-8">
        <h2 className="text-2xl font-bold text-red-400">
          Unable to load production
        </h2>

        <p className="mt-4 text-zinc-400">
          The requested production could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <ProductionOverview
        production={production}
        onUpdate={updateProduction}
      />
    </div>
  );
}
